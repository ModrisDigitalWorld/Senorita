// import { Router } from "express";
// import { db } from "@workspace/db";
// import { cartItemsTable, productsTable, productVariantsTable, wishlistItemsTable } from "@workspace/db";
// import { eq, and } from "drizzle-orm";
// import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";

// const router = Router();

// router.get("/cart", authMiddleware, async (req: AuthRequest, res) => {
//   try {
//     const items = await db.select({
//       id: cartItemsTable.id, quantity: cartItemsTable.quantity,
//       productId: cartItemsTable.productId, variantId: cartItemsTable.variantId,
//       productName: productsTable.name, productSlug: productsTable.slug,
//       productPrice: productsTable.price, productSalePrice: productsTable.salePrice,
//       productImages: productsTable.images, productStock: productsTable.stock,
//     })
//     .from(cartItemsTable)
//     .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
//     .where(eq(cartItemsTable.userId, req.user!.id));
//     res.json(items);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch cart" });
//   }
// });

// router.post("/cart", authMiddleware, async (req: AuthRequest, res) => {
//   try {
//     const { productId, variantId, quantity = 1 } = req.body;
//     const existing = await db.select().from(cartItemsTable)
//       .where(and(eq(cartItemsTable.userId, req.user!.id), eq(cartItemsTable.productId, productId)))
//       .limit(1);
//     if (existing.length > 0) {
//       const [item] = await db.update(cartItemsTable)
//         .set({ quantity: existing[0].quantity + quantity })
//         .where(eq(cartItemsTable.id, existing[0].id))
//         .returning();
//       res.json(item);
//     } else {
//       const [item] = await db.insert(cartItemsTable)
//         .values({ userId: req.user!.id, productId, variantId: variantId || null, quantity })
//         .returning();
//       res.json(item);
//     }
//   } catch (err) {
//     res.status(500).json({ error: "Failed to add to cart" });
//   }
// });

// // router.put("/cart/:id", authMiddleware, async (req: AuthRequest, res) => {
// //   try {
// //     const { quantity } = req.body;
// //     if (quantity <= 0) {
// //       await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, req.params.id), eq(cartItemsTable.userId, req.user!.id)));
// //       res.json({ deleted: true });
// //     } else {
// //       const [item] = await db.update(cartItemsTable)
// //         .set({ quantity })
// //         .where(and(eq(cartItemsTable.id, req.params.id), eq(cartItemsTable.userId, req.user!.id)))
// //         .returning();
// //       res.json(item);
// //     }
// //   } catch (err) {
// //     res.status(500).json({ error: "Failed to update cart" });
// //   }
// // });

// // router.delete("/cart/:id", authMiddleware, async (req: AuthRequest, res) => {
// //   await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, req.params.id), eq(cartItemsTable.userId, req.user!.id)));
// //   res.json({ success: true });
// // });

// router.put("/cart/:id", authMiddleware, async (req: AuthRequest, res) => {
//   try {
//     const id = String(req.params.id);
//     const userId = String(req.user!.id);
//     const { quantity } = req.body;
    
//     if (quantity <= 0) {
//       await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, id), eq(cartItemsTable.userId, userId)));
//       res.json({ deleted: true });
//     } else {
//       const [item] = await db.update(cartItemsTable)
//         .set({ quantity })
//         .where(and(eq(cartItemsTable.id, id), eq(cartItemsTable.userId, userId)))
//         .returning();
//       res.json(item);
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to update cart" });
//   }
// });

// router.delete("/cart/:id", authMiddleware, async (req: AuthRequest, res) => {
//   try {
//     const id = String(req.params.id);
//     const userId = String(req.user!.id);
//     await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, id), eq(cartItemsTable.userId, userId)));
//     res.json({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to delete from cart" });
//   }
// });

// router.delete("/cart", authMiddleware, async (req: AuthRequest, res) => {
//   await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, req.user!.id));
//   res.json({ success: true });
// });

// router.get("/wishlist", authMiddleware, async (req: AuthRequest, res) => {
//   try {
//     const items = await db.select({
//       id: wishlistItemsTable.id, productId: wishlistItemsTable.productId,
//       productName: productsTable.name, productSlug: productsTable.slug,
//       productPrice: productsTable.price, productSalePrice: productsTable.salePrice,
//       productImages: productsTable.images, productBadge: productsTable.badge,
//     })
//     .from(wishlistItemsTable)
//     .innerJoin(productsTable, eq(wishlistItemsTable.productId, productsTable.id))
//     .where(eq(wishlistItemsTable.userId, req.user!.id));
//     res.json(items);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch wishlist" });
//   }
// });

// router.post("/wishlist", authMiddleware, async (req: AuthRequest, res) => {
//   try {
//     const { productId } = req.body;
//     const existing = await db.select().from(wishlistItemsTable)
//       .where(and(eq(wishlistItemsTable.userId, req.user!.id), eq(wishlistItemsTable.productId, productId)))
//       .limit(1);
//     if (existing.length > 0) {
//       await db.delete(wishlistItemsTable).where(eq(wishlistItemsTable.id, existing[0].id));
//       res.json({ wishlisted: false });
//     } else {
//       await db.insert(wishlistItemsTable).values({ userId: req.user!.id, productId });
//       res.json({ wishlisted: true });
//     }
//   } catch (err) {
//     res.status(500).json({ error: "Failed to toggle wishlist" });
//   }
// });

// export default router;






import { Router } from "express";
import { db } from "@workspace/db";
import { cartItemsTable, productsTable, productVariantsTable, wishlistItemsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/cart", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = String(req.user!.id);
    const items = await db.select({
      id: cartItemsTable.id, quantity: cartItemsTable.quantity,
      productId: cartItemsTable.productId, variantId: cartItemsTable.variantId,
      productName: productsTable.name, productSlug: productsTable.slug,
      productPrice: productsTable.price, productSalePrice: productsTable.salePrice,
      productImages: productsTable.images, productStock: productsTable.stock,
    })
    .from(cartItemsTable)
    .innerJoin(productsTable, sql`${cartItemsTable.productId} = ${productsTable.id}`)
    .where(eq(cartItemsTable.userId, userId));
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

router.post("/cart", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = String(req.user!.id);
    const { productId, variantId, quantity = 1 } = req.body;
    const safeProductId = String(productId);
    
    const existing = await db.select().from(cartItemsTable)
      .where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, safeProductId)))
      .limit(1);
      
    if (existing.length > 0) {
      const [item] = await db.update(cartItemsTable)
        .set({ quantity: existing[0].quantity + quantity })
        .where(eq(cartItemsTable.id, existing[0].id))
        .returning();
      res.json(item);
    } else {
      const [item] = await db.insert(cartItemsTable)
        .values({ userId, productId: safeProductId, variantId: variantId ? String(variantId) : null, quantity })
        .returning();
      res.json(item);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

router.put("/cart/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    const userId = String(req.user!.id);
    const { quantity } = req.body;
    
    if (quantity <= 0) {
      await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, id), eq(cartItemsTable.userId, userId)));
      res.json({ deleted: true });
    } else {
      const [item] = await db.update(cartItemsTable)
        .set({ quantity })
        .where(and(eq(cartItemsTable.id, id), eq(cartItemsTable.userId, userId)))
        .returning();
      res.json(item);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update cart" });
  }
});

router.delete("/cart/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    const userId = String(req.user!.id);
    await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, id), eq(cartItemsTable.userId, userId)));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete from cart" });
  }
});

router.delete("/cart", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = String(req.user!.id);
    await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to clear cart" });
  }
});

router.get("/wishlist", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = String(req.user!.id);
    const items = await db.select({
      id: wishlistItemsTable.id, productId: wishlistItemsTable.productId,
      productName: productsTable.name, productSlug: productsTable.slug,
      productPrice: productsTable.price, productSalePrice: productsTable.salePrice,
      productImages: productsTable.images, productBadge: productsTable.badge,
    })
    .from(wishlistItemsTable)
    .innerJoin(productsTable, sql`${wishlistItemsTable.productId} = ${productsTable.id}`)
    .where(eq(wishlistItemsTable.userId, userId));
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
});

router.post("/wishlist", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = String(req.user!.id);
    const { productId } = req.body;
    const safeProductId = String(productId);
    
    const existing = await db.select().from(wishlistItemsTable)
      .where(and(eq(wishlistItemsTable.userId, userId), eq(wishlistItemsTable.productId, safeProductId)))
      .limit(1);
      
    if (existing.length > 0) {
      await db.delete(wishlistItemsTable).where(eq(wishlistItemsTable.id, existing[0].id));
      res.json({ wishlisted: false });
    } else {
      await db.insert(wishlistItemsTable).values({ userId, productId: safeProductId });
      res.json({ wishlisted: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to toggle wishlist" });
  }
});

export default router;