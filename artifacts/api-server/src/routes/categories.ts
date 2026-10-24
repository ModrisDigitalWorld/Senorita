import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable, productsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { authMiddleware, adminOnly, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/categories", async (_req, res) => {
  try {
    const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.order);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.get("/categories/:slug", async (req, res) => {
  try {
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, req.params.slug)).limit(1);
    if (!cat) { res.status(404).json({ error: "Category not found" }); return; }
    const ids = cat.similarProductIds ?? [];
    let similarProducts: any[] = [];
    if (ids.length > 0) {
      similarProducts = await db.select({
        id: productsTable.id, name: productsTable.name, slug: productsTable.slug,
        price: productsTable.price, salePrice: productsTable.salePrice,
        images: productsTable.images, badge: productsTable.badge,
        stock: productsTable.stock, categoryId: productsTable.categoryId,
      }).from(productsTable).where(inArray(productsTable.id, ids));
      similarProducts.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    }
    res.json({ ...cat, similarProducts });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch category" });
  }
});

router.post("/categories", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const { name, slug, image, description, order, parentId, similarProductIds } = req.body;
    if (!name) { res.status(400).json({ error: "Name is required" }); return; }
    const finalSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const [cat] = await db.insert(categoriesTable).values({
      name, slug: finalSlug, image, description,
      order: order || 0, parentId: parentId || null,
      similarProductIds: similarProductIds ?? [],
    }).returning();
    res.json(cat);
  } catch (err) {
    res.status(500).json({ error: "Failed to create category" });
  }
});

router.put("/categories/:id", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const { similarProductIds, ...rest } = req.body;
    const updateData: any = { ...rest };
    if (similarProductIds !== undefined) updateData.similarProductIds = similarProductIds;
    const [cat] = await db.update(categoriesTable).set(updateData).where(eq(categoriesTable.id, req.params.id)).returning();
    res.json(cat);
  } catch (err) {
    res.status(500).json({ error: "Failed to update category" });
  }
});

router.delete("/categories/:id", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  await db.delete(categoriesTable).where(eq(categoriesTable.id, req.params.id));
  res.json({ success: true });
});

export default router;
