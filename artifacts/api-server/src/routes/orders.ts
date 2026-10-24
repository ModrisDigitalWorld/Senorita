import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, usersTable, productsTable } from "@workspace/db";
import { eq, desc, and, count, sum } from "drizzle-orm";
import { authMiddleware, adminOnly, type AuthRequest } from "../middlewares/auth.js";
import { sendOrderStatusUpdate } from "../lib/email.js";

const router = Router();

router.get("/orders", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const orders = await db.select().from(ordersTable)
      .where(eq(ordersTable.userId, req.user!.id))
      .orderBy(desc(ordersTable.createdAt));
    const ordersWithItems = await Promise.all(orders.map(async (o) => {
      const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, o.id));
      return { ...o, items };
    }));
    res.json(ordersWithItems);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get("/orders/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, req.params.id)).limit(1);
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    if (order.userId !== req.user!.id && req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden" }); return;
    }
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

router.get("/admin/orders", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const { status, limit = "50", offset = "0" } = req.query as Record<string, string>;
    let query = db.select({
      id: ordersTable.id, userId: ordersTable.userId, status: ordersTable.status,
      paymentStatus: ordersTable.paymentStatus, total: ordersTable.total,
      createdAt: ordersTable.createdAt, trackingNumber: ordersTable.trackingNumber,
      shippingAddress: ordersTable.shippingAddress,
      userName: usersTable.name, userEmail: usersTable.email,
    })
    .from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id));

    const results = status
      ? await query.where(eq(ordersTable.status, status as any)).orderBy(desc(ordersTable.createdAt)).limit(parseInt(limit)).offset(parseInt(offset))
      : await query.orderBy(desc(ordersTable.createdAt)).limit(parseInt(limit)).offset(parseInt(offset));

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.put("/admin/orders/:id", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const { status, trackingNumber, notes, sendEmail } = req.body;
    const [order] = await db.update(ordersTable)
      .set({ status, trackingNumber, notes, updatedAt: new Date() })
      .where(eq(ordersTable.id, req.params.id))
      .returning();

    if (sendEmail !== false && status) {
      try {
        const [fullOrder] = await db.select({
          id: ordersTable.id, shippingAddress: ordersTable.shippingAddress,
          userName: usersTable.name, userEmail: usersTable.email,
        })
        .from(ordersTable)
        .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
        .where(eq(ordersTable.id, req.params.id))
        .limit(1);

        const email = (fullOrder?.userEmail) || (order.shippingAddress as any)?.email;
        const name = (fullOrder?.userName) || (order.shippingAddress as any)?.name || "Customer";
        if (email) {
          await sendOrderStatusUpdate({ to: email, name, orderId: order.id, status, trackingNumber });
        }
      } catch (emailErr) {
        console.warn("Email send failed:", emailErr);
      }
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to update order" });
  }
});

export default router;
