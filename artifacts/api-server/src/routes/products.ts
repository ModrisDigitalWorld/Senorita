import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, productVariantsTable, categoriesTable } from "@workspace/db";
import { eq, desc, asc, ilike, and, or } from "drizzle-orm";
import { authMiddleware, adminOnly, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/products", async (req, res) => {
  try {
    const { category, search, sort, featured, limit = "40", offset = "0" } = req.query as Record<string, string>;
    let query = db.select({
      id: productsTable.id, name: productsTable.name, slug: productsTable.slug,
      price: productsTable.price, salePrice: productsTable.salePrice,
      stock: productsTable.stock, images: productsTable.images, badge: productsTable.badge,
      isFeatured: productsTable.isFeatured, isActive: productsTable.isActive,
      categoryId: productsTable.categoryId, createdAt: productsTable.createdAt,
      tags: productsTable.tags, description: productsTable.description,
    }).from(productsTable);

    const conditions = [eq(productsTable.isActive, true)];
    if (category) conditions.push(eq(productsTable.categoryId, category));
    if (featured === "true") conditions.push(eq(productsTable.isFeatured, true));
    if (search) conditions.push(or(ilike(productsTable.name, `%${search}%`), ilike(productsTable.description, `%${search}%`))!);

    const results = await query
      .where(and(...conditions))
      .orderBy(
        sort === "price_asc" ? asc(productsTable.price) :
        sort === "price_desc" ? desc(productsTable.price) :
        desc(productsTable.createdAt)
      )
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/products/:slug", async (req, res) => {
  try {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.slug, req.params.slug)).limit(1);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }
    const variants = await db.select().from(productVariantsTable).where(eq(productVariantsTable.productId, product.id));
    res.json({ ...product, variants });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.post("/products", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const { variants, ...productData } = req.body;
    const baseSlug = productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    // Check for existing slug and make it unique automatically
    let slug = baseSlug;
    const existing = await db.select({ slug: productsTable.slug }).from(productsTable).where(eq(productsTable.slug, slug)).limit(1);
    if (existing.length > 0) {
      slug = `${baseSlug}-${Date.now()}`;
    }

    const [product] = await db.insert(productsTable).values({ ...productData, slug }).returning();
    if (variants?.length) {
      await db.insert(productVariantsTable).values(variants.map((v: { type: string; value: string; stock?: number; priceModifier?: number }) => ({ ...v, productId: product.id })));
    }
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// router.put("/products/:id", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
//   try {
//     const { variants, ...productData } = req.body;
//     const [product] = await db.update(productsTable).set({ ...productData, updatedAt: new Date() }).where(eq(productsTable.id, req.params.id)).returning();
//     if (variants !== undefined) {
//       await db.delete(productVariantsTable).where(eq(productVariantsTable.productId, req.params.id));
//       if (variants.length) {
//         await db.insert(productVariantsTable).values(variants.map((v: { type: string; value: string; stock?: number; priceModifier?: number }) => ({ ...v, productId: req.params.id })));
//       }
//     }
//     res.json(product);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to update product" });
//   }
// });

router.put("/products/:id", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id); // Explicitly ensure it's a single string
    const { variants, ...productData } = req.body;
    
    const [product] = await db.update(productsTable)
      .set({ ...productData, updatedAt: new Date() })
      .where(eq(productsTable.id, id))
      .returning();
      
    if (variants !== undefined) {
      await db.delete(productVariantsTable).where(eq(productVariantsTable.productId, id));
      if (variants.length) {
        await db.insert(productVariantsTable).values(
          variants.map((v: { type: string; value: string; stock?: number; priceModifier?: number }) => ({ 
            ...v, 
            productId: id 
          }))
        );
      }
    }
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update product" });
  }
});
// router.patch("/products/:id/stock", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
//   try {
//     const { stock, variants } = req.body;
//     if (stock !== undefined) {
//       await db.update(productsTable).set({ stock, updatedAt: new Date() }).where(eq(productsTable.id, req.params.id));
//     }
//     if (variants?.length) {
//       for (const v of variants as { id: string; stock: number }[]) {
//         await db.update(productVariantsTable).set({ stock: v.stock }).where(eq(productVariantsTable.id, v.id));
//       }
//     }
//     res.json({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to update stock" });
//   }
// });

router.patch("/products/:id/stock", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id); // Convert Express route param to a single string
    const { stock, variants } = req.body;
    
    if (stock !== undefined) {
      await db.update(productsTable)
        .set({ stock, updatedAt: new Date() })
        .where(eq(productsTable.id, id));
    }
    
    if (variants?.length) {
      for (const v of variants as { id: string; stock: number }[]) {
        const variantId = String(v.id); // Ensure variant ID is also a string
        await db.update(productVariantsTable)
          .set({ stock: v.stock })
          .where(eq(productVariantsTable.id, variantId));
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update stock" });
  }
});

router.get("/admin/stock", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const products = await db.select().from(productsTable).orderBy(asc(productsTable.name));
    const variants = await db.select().from(productVariantsTable);
    const variantMap: Record<string, typeof variants> = {};
    for (const v of variants) {
      if (!variantMap[v.productId]) variantMap[v.productId] = [];
      variantMap[v.productId].push(v);
    }
    res.json(products.map(p => ({ ...p, variants: variantMap[p.id] || [] })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stock data" });
  }
});

// router.delete("/products/:id", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
//   await db.delete(productsTable).where(eq(productsTable.id, req.params.id));
//   res.json({ success: true });
// });

router.delete("/products/:id", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
