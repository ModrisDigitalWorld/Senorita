import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, productsTable, usersTable, orderItemsTable, couponsTable } from "@workspace/db";
import { eq, desc, count, sum, gte, and, inArray } from "drizzle-orm";
import { authMiddleware, adminOnly, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/admin/stats", authMiddleware, adminOnly, async (_req, res) => {
  try {
    const [totalRevenue] = await db.select({ value: sum(ordersTable.total) })
      .from(ordersTable).where(eq(ordersTable.paymentStatus, "paid"));

    const [totalOrders] = await db.select({ value: count() }).from(ordersTable);
    const [totalProducts] = await db.select({ value: count() }).from(productsTable);
    const [totalCustomers] = await db.select({ value: count() }).from(usersTable)
      .where(eq(usersTable.role, "customer"));

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentOrders = await db.select({
      id: ordersTable.id, total: ordersTable.total,
      status: ordersTable.status, createdAt: ordersTable.createdAt,
      shippingAddress: ordersTable.shippingAddress,
    })
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt))
    .limit(10);

    const salesByDay = await db.select({
      date: ordersTable.createdAt,
      total: ordersTable.total,
    })
    .from(ordersTable)
    .where(and(eq(ordersTable.paymentStatus, "paid"), gte(ordersTable.createdAt, thirtyDaysAgo)))
    .orderBy(ordersTable.createdAt);

    const lowStockProducts = await db.select({ id: productsTable.id, name: productsTable.name, stock: productsTable.stock, images: productsTable.images })
      .from(productsTable)
      .where(and(eq(productsTable.isActive, true), gte(productsTable.stock, 0)))
      .orderBy(productsTable.stock)
      .limit(5);

    res.json({
      totalRevenue: totalRevenue?.value || 0,
      totalOrders: totalOrders?.value || 0,
      totalProducts: totalProducts?.value || 0,
      totalCustomers: totalCustomers?.value || 0,
      recentOrders,
      salesByDay: salesByDay.map(s => ({
        date: s.date.toISOString().split("T")[0],
        amount: s.total,
      })),
      lowStockProducts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/admin/customers", authMiddleware, adminOnly, async (_req, res) => {
  try {
    const customers = await db.select({
      id: usersTable.id, name: usersTable.name, email: usersTable.email,
      phone: usersTable.phone, createdAt: usersTable.createdAt,
    }).from(usersTable).where(eq(usersTable.role, "customer")).orderBy(desc(usersTable.createdAt));
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

router.get("/admin/products", authMiddleware, adminOnly, async (_req, res) => {
  try {
    const products = await db.select({
      id: productsTable.id, name: productsTable.name, slug: productsTable.slug,
      price: productsTable.price, salePrice: productsTable.salePrice,
      stock: productsTable.stock, images: productsTable.images, badge: productsTable.badge,
      isFeatured: productsTable.isFeatured, isActive: productsTable.isActive,
      categoryId: productsTable.categoryId, createdAt: productsTable.createdAt,
    }).from(productsTable).orderBy(desc(productsTable.createdAt));
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.post("/admin/products/bulk-category", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const { productIds, categoryId } = req.body as { productIds: string[]; categoryId: string | null };
    if (!Array.isArray(productIds) || productIds.length === 0) {
      res.status(400).json({ error: "productIds must be a non-empty array" }); return;
    }
    await db.update(productsTable).set({ categoryId: categoryId ?? null, updatedAt: new Date() }).where(inArray(productsTable.id, productIds));
    res.json({ updated: productIds.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to bulk update category" });
  }
});

router.get("/coupons", authMiddleware, adminOnly, async (_req, res) => {
  const coupons = await db.select().from(couponsTable).orderBy(desc(couponsTable.createdAt));
  res.json(coupons);
});

router.post("/coupons", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const [coupon] = await db.insert(couponsTable).values({
      ...req.body,
      code: req.body.code.toUpperCase(),
    }).returning();
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ error: "Failed to create coupon" });
  }
});

// router.put("/coupons/:id", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
//   try {
//     const [coupon] = await db.update(couponsTable).set(req.body).where(eq(couponsTable.id, req.params.id)).returning();
//     res.json(coupon);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to update coupon" });
//   }
// });

// router.delete("/coupons/:id", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
//   await db.delete(couponsTable).where(eq(couponsTable.id, req.params.id));
//   res.json({ success: true });
// });


router.put("/coupons/:id", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const couponId = req.params.id as string;
    const [coupon] = await db.update(couponsTable).set(req.body).where(eq(couponsTable.id, couponId)).returning();
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ error: "Failed to update coupon" });
  }
});

router.delete("/coupons/:id", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  const couponId = req.params.id as string;
  await db.delete(couponsTable).where(eq(couponsTable.id, couponId));
  res.json({ success: true });
});

router.post("/coupons/validate", async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, code.toUpperCase())).limit(1);
    if (!coupon || !coupon.isActive) { res.status(400).json({ error: "Invalid or inactive coupon" }); return; }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) { res.status(400).json({ error: "Coupon expired" }); return; }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) { res.status(400).json({ error: "Coupon usage limit reached" }); return; }
    if (orderTotal < coupon.minOrder) { res.status(400).json({ error: `Minimum order of ₹${coupon.minOrder} required` }); return; }
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ error: "Failed to validate coupon" });
  }
});

export default router;
