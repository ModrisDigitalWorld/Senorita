import { Router } from "express";
import { db } from "@workspace/db";
import { variantOptionsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { authMiddleware, adminOnly, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/variant-options", async (req, res) => {
  try {
    const { type } = req.query as { type?: string };
    const query = db.select().from(variantOptionsTable).orderBy(asc(variantOptionsTable.sortOrder), asc(variantOptionsTable.createdAt));
    const rows = type
      ? await db.select().from(variantOptionsTable).where(eq(variantOptionsTable.type, type)).orderBy(asc(variantOptionsTable.sortOrder), asc(variantOptionsTable.createdAt))
      : await query;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch variant options" });
  }
});

router.post("/variant-options", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const { type, value, hex, sortOrder } = req.body;
    if (!type || !value) { res.status(400).json({ error: "type and value are required" }); return; }
    if (type !== "size" && type !== "color") { res.status(400).json({ error: "type must be 'size' or 'color'" }); return; }
    const [row] = await db.insert(variantOptionsTable).values({
      type, value: value.trim(), hex: hex || null, sortOrder: sortOrder ?? 0,
    }).returning();
    res.json(row);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to create variant option" });
  }
});

// router.put("/variant-options/:id", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
//   try {
//     const { value, hex, sortOrder } = req.body;
//     const updates: Record<string, any> = {};
//     if (value !== undefined) updates.value = value.trim();
//     if (hex !== undefined) updates.hex = hex;
//     if (sortOrder !== undefined) updates.sortOrder = sortOrder;
//     const [row] = await db.update(variantOptionsTable).set(updates).where(eq(variantOptionsTable.id, req.params.id)).returning();
//     if (!row) { res.status(404).json({ error: "Not found" }); return; }
//     res.json(row);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to update variant option" });
//   }
// });

// router.delete("/variant-options/:id", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
//   try {
//     await db.delete(variantOptionsTable).where(eq(variantOptionsTable.id, req.params.id));
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: "Failed to delete variant option" });
//   }
// });


router.put("/variant-options/:id", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    const { value, hex, sortOrder } = req.body;
    const updates: Record<string, any> = {};
    if (value !== undefined) updates.value = value.trim();
    if (hex !== undefined) updates.hex = hex;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;
    
    const [row] = await db.update(variantOptionsTable)
      .set(updates)
      .where(eq(variantOptionsTable.id, id))
      .returning();
      
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update variant option" });
  }
});

router.delete("/variant-options/:id", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    await db.delete(variantOptionsTable).where(eq(variantOptionsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete variant option" });
  }
});

export default router;
