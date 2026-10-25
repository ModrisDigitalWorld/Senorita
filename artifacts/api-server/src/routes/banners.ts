import { Router } from "express";
import { db } from "@workspace/db";
import { bannersTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { authMiddleware, adminOnly, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/banners", async (req, res) => {
  try {
    const { position } = req.query as Record<string, string>;
    let query = db.select().from(bannersTable);
    const results = await db.select().from(bannersTable)
      .where(position ? eq(bannersTable.position, position) : undefined)
      .orderBy(asc(bannersTable.sortOrder));
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch banners" });
  }
});

router.post("/banners", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const { title, subtitle, image, link, buttonText, position, sortOrder, isActive } = req.body;
    if (!title || !image) {
      res.status(400).json({ error: "Title and image are required" });
      return;
    }
    const [banner] = await db.insert(bannersTable).values({
      title, subtitle: subtitle || null, image, link: link || null,
      buttonText: buttonText || null, position: position || "hero",
      sortOrder: sortOrder ?? 0, isActive: isActive ?? true,
    }).returning();
    res.status(201).json(banner);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create banner" });
  }
});

// router.put("/banners/:id", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
//   try {
//     const { id } = req.params;
//     const { title, subtitle, image, link, buttonText, position, sortOrder, isActive } = req.body;
//     const [banner] = await db.update(bannersTable).set({
//       title, subtitle: subtitle || null, image, link: link || null,
//       buttonText: buttonText || null, position: position || "hero",
//       sortOrder: sortOrder ?? 0, isActive: isActive ?? true,
//       updatedAt: new Date(),
//     }).where(eq(bannersTable.id, id)).returning();
//     if (!banner) { res.status(404).json({ error: "Banner not found" }); return; }
//     res.json(banner);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to update banner" });
//   }
// });

// router.delete("/banners/:id", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
//   try {
//     const { id } = req.params;
//     await db.delete(bannersTable).where(eq(bannersTable.id, id));
//     res.json({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to delete banner" });
//   }
// });


router.put("/banners/:id", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { title, subtitle, image, link, buttonText, position, sortOrder, isActive } = req.body;
    const [banner] = await db.update(bannersTable).set({
      title, subtitle: subtitle || null, image, link: link || null,
      buttonText: buttonText || null, position: position || "hero",
      sortOrder: sortOrder ?? 0, isActive: isActive ?? true,
      updatedAt: new Date(),
    }).where(eq(bannersTable.id, id)).returning();
    if (!banner) { res.status(404).json({ error: "Banner not found" }); return; }
    res.json(banner);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update banner" });
  }
});

router.delete("/banners/:id", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    await db.delete(bannersTable).where(eq(bannersTable.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete banner" });
  }
});

export default router;
