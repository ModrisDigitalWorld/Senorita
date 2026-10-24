import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, cartItemsTable, couponsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { optionalAuth, type AuthRequest } from "../middlewares/auth.js";
import Stripe from "stripe";
import { sendOrderConfirmation } from "../lib/email.js";

const router = Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

router.post("/checkout/create-session", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { items, shippingAddress, couponCode } = req.body;
    if (!items?.length || !shippingAddress) {
      res.status(400).json({ error: "Items and shipping address required" });
      return;
    }

    const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);
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

    const stripe = getStripe();
    const origin = process.env.FRONTEND_URL || "http://localhost:22690";

    if (stripe) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: items.map((item: { name: string; image?: string; price: number; quantity: number }) => ({
          price_data: {
            currency: "inr",
            product_data: { name: item.name, images: item.image ? [item.image] : [] },
            unit_amount: item.price * 100,
          },
          quantity: item.quantity,
        })),
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/cart`,
        metadata: { userId: req.user!.id, couponCode: couponCode || "" },
      });

      const [order] = await db.insert(ordersTable).values({
        userId: req.user?.id ?? null,
        subtotal,
        discount,
        shippingCost,
        total,
        stripeSessionId: session.id,
        shippingAddress,
        couponCode: couponCode || null,
      }).returning();

      await db.insert(orderItemsTable).values(items.map((item: { productId: string; name: string; image?: string; price: number; quantity: number; variantInfo?: unknown }) => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.name,
        productImage: item.image || null,
        quantity: item.quantity,
        price: item.price,
        variantInfo: item.variantInfo || null,
      })));

      if (coupon) {
        await db.update(couponsTable).set({ usedCount: coupon.usedCount + 1 }).where(eq(couponsTable.id, coupon.id));
      }

      res.json({ url: session.url, orderId: order.id });
    } else {
      const [order] = await db.insert(ordersTable).values({
        userId: req.user?.id ?? null,
        subtotal, discount, shippingCost, total,
        paymentStatus: "pending",
        status: "confirmed",
        shippingAddress,
        couponCode: couponCode || null,
      }).returning();

      await db.insert(orderItemsTable).values(items.map((item: { productId: string; name: string; image?: string; price: number; quantity: number; variantInfo?: unknown }) => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.name,
        productImage: item.image || null,
        quantity: item.quantity,
        price: item.price,
        variantInfo: item.variantInfo || null,
      })));

      if (req.user?.id) {
        await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, req.user.id));
      }
      if (coupon) {
        await db.update(couponsTable).set({ usedCount: coupon.usedCount + 1 }).where(eq(couponsTable.id, coupon.id));
      }

      // Send confirmation email
      try {
        const emailAddr = shippingAddress?.email || (req.user?.id ? (await db.select({ email: usersTable.email, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1))[0] : null);
        if (emailAddr?.email || shippingAddress?.email) {
          await sendOrderConfirmation({
            to: emailAddr?.email || shippingAddress.email,
            name: shippingAddress?.name || emailAddr?.name || "Customer",
            orderId: order.id,
            items: items.map((i: any) => ({ name: i.name, quantity: i.quantity, price: i.price })),
            total,
            address: shippingAddress,
            paymentMethod: "cod",
          });
        }
      } catch (emailErr) {
        console.warn("Confirmation email failed:", emailErr);
      }

      res.json({ url: null, orderId: order.id, success: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Checkout failed" });
  }
});

router.post("/webhooks/stripe", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) { res.json({ received: true }); return; }

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = webhookSecret
      ? stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
      : req.body;

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await db.update(ordersTable)
        .set({ paymentStatus: "paid", status: "confirmed", updatedAt: new Date() })
        .where(eq(ordersTable.stripeSessionId, session.id));

      const [order] = await db.select().from(ordersTable).where(eq(ordersTable.stripeSessionId, session.id)).limit(1);
      if (order?.userId) {
        await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, order.userId));
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Webhook error" });
  }
});

export default router;
