import { Router } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, cartItemsTable, couponsTable, usersTable, productVariantsTable, productsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { optionalAuth, type AuthRequest } from "../middlewares/auth.js";
import { sendOrderConfirmation } from "../lib/email.js";

const router = Router();

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// Create a Razorpay order and a pending DB order
router.post("/razorpay/create-order", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { items, shippingAddress, couponCode } = req.body;
    if (!items?.length || !shippingAddress) {
      res.status(400).json({ error: "Items and shipping address required" });
      return;
    }

    const razorpay = getRazorpay();
    if (!razorpay) {
      res.status(503).json({ error: "Razorpay not configured" });
      return;
    }

    const subtotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
      0
    );
    let discount = 0;
    let coupon = null;

    if (couponCode) {
      const [c] = await db.select().from(couponsTable).where(eq(couponsTable.code, couponCode.toUpperCase())).limit(1);
      if (c && c.isActive) {
        coupon = c;
        if (c.type === "percentage") discount = Math.round(subtotal * c.value / 100);
        else if (c.type === "fixed") discount = c.value;
      }
    }

    const shippingCost = subtotal >= 999 ? 0 : 99;
    const total = Math.max(0, subtotal - discount + shippingCost);

    // Create Razorpay order (amount in paise)
    const rzpOrder = await razorpay.orders.create({
      amount: total * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    // Save pending order in DB
    const [order] = await db.insert(ordersTable).values({
      userId: req.user?.id ?? null,
      subtotal,
      discount,
      shippingCost,
      total,
      razorpayOrderId: rzpOrder.id,
      paymentMethod: "online",
      paymentStatus: "pending",
      status: "pending",
      shippingAddress,
      couponCode: couponCode || null,
    }).returning();

    await db.insert(orderItemsTable).values(
      items.map((item: { productId: string; name: string; image?: string; price: number; quantity: number; variantInfo?: unknown }) => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.name,
        productImage: item.image || null,
        quantity: item.quantity,
        price: item.price,
        variantInfo: item.variantInfo || null,
      }))
    );

    if (coupon) {
      await db.update(couponsTable).set({ usedCount: coupon.usedCount + 1 }).where(eq(couponsTable.id, coupon.id));
    }

    res.json({
      orderId: order.id,
      razorpayOrderId: rzpOrder.id,
      amount: total * 100,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Razorpay create-order error:", err);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

// Verify payment signature and mark order as paid
router.post("/razorpay/verify-payment", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      res.status(503).json({ error: "Razorpay not configured" });
      return;
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      res.status(400).json({ error: "Invalid payment signature" });
      return;
    }

    // Mark order as paid
    await db.update(ordersTable)
      .set({ paymentStatus: "paid", status: "confirmed", updatedAt: new Date() })
      .where(eq(ordersTable.id, orderId));

    // Decrement stock for ordered items
    const orderItems = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));
    for (const item of orderItems) {
      // Decrement main product stock
      await db.update(productsTable)
        .set({ stock: sql`GREATEST(stock - ${item.quantity}, 0)` })
        .where(eq(productsTable.id, item.productId));

      // Decrement variant stock if a variant was selected
      const varInfo = item.variantInfo as any;
      if (varInfo?.size) {
        await db.update(productVariantsTable)
          .set({ stock: sql`GREATEST(stock - ${item.quantity}, 0)` })
          .where(and(
            eq(productVariantsTable.productId, item.productId),
            eq(productVariantsTable.type, "size"),
            eq(productVariantsTable.value, varInfo.size),
          ));
      }
      if (varInfo?.color) {
        await db.update(productVariantsTable)
          .set({ stock: sql`GREATEST(stock - ${item.quantity}, 0)` })
          .where(and(
            eq(productVariantsTable.productId, item.productId),
            eq(productVariantsTable.type, "color"),
            eq(productVariantsTable.value, varInfo.color),
          ));
      }
    }

    // Clear cart
    if (req.user?.id) {
      await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, req.user.id));
    }

    // Send confirmation email
    try {
      const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
      const items = orderItems;
      const shippingAddress = order?.shippingAddress as any;
      const emailTo = shippingAddress?.email || (
        req.user?.id
          ? (await db.select({ email: usersTable.email, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1))[0]?.email
          : null
      );
      if (emailTo && order) {
        await sendOrderConfirmation({
          to: emailTo,
          name: shippingAddress?.name || "Customer",
          orderId: order.id,
          items: items.map(i => ({ name: i.productName, quantity: i.quantity, price: i.price })),
          total: order.total,
          address: shippingAddress,
          paymentMethod: "online",
        });
      }
    } catch (emailErr) {
      console.warn("Confirmation email failed:", emailErr);
    }

    res.json({ success: true, orderId });
  } catch (err) {
    console.error("Razorpay verify-payment error:", err);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

export default router;
