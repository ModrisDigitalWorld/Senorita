import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable, usersTable, productsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { authMiddleware, adminOnly, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/reviews/:productId", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: reviewsTable.id,
        rating: reviewsTable.rating,
        title: reviewsTable.title,
        comment: reviewsTable.comment,
        createdAt: reviewsTable.createdAt,
        reviewerName: reviewsTable.reviewerName,
        userId: reviewsTable.userId,
        userName: usersTable.name,
      })
      .from(reviewsTable)
      .leftJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
      .where(
        sql`${reviewsTable.productId} = ${req.params.productId} AND ${reviewsTable.status} = 'approved'`
      )
      .orderBy(desc(reviewsTable.createdAt));

    const reviews = rows.map(r => ({
      ...r,
      userName: r.userName || r.reviewerName || "Anonymous",
    }));

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

router.post("/reviews", async (req, res) => {
  try {
    const { productId, rating, title, comment, reviewerName, reviewerEmail } = req.body;
    if (!productId || !rating || !comment || !reviewerName) {
      res.status(400).json({ error: "Name, rating and comment are required" });
      return;
    }
    if (rating < 1 || rating > 5) {
      res.status(400).json({ error: "Rating must be 1–5" });
      return;
    }
    const [review] = await db
      .insert(reviewsTable)
      .values({ productId, rating, title: title || null, comment, reviewerName, reviewerEmail: reviewerEmail || null, status: "pending" })
      .returning();
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: "Failed to submit review" });
  }
});

router.get("/admin/reviews", authMiddleware, adminOnly, async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: reviewsTable.id,
        rating: reviewsTable.rating,
        title: reviewsTable.title,
        comment: reviewsTable.comment,
        status: reviewsTable.status,
        createdAt: reviewsTable.createdAt,
        productId: reviewsTable.productId,
        reviewerName: reviewsTable.reviewerName,
        reviewerEmail: reviewsTable.reviewerEmail,
        userId: reviewsTable.userId,
        userName: usersTable.name,
        productName: productsTable.name,
      })
      .from(reviewsTable)
      .leftJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
      .leftJoin(productsTable, eq(reviewsTable.productId, productsTable.id))
      .orderBy(desc(reviewsTable.createdAt));

    const reviews = rows.map(r => ({
      ...r,
      userName: r.userName || r.reviewerName || "Anonymous",
    }));

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

router.put("/admin/reviews/:id", authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  try {
    const { status, rating, title, comment } = req.body;
    const update: Record<string, unknown> = {};
    if (status !== undefined) update.status = status;
    if (rating !== undefined) update.rating = rating;
    if (title !== undefined) update.title = title;
    if (comment !== undefined) update.comment = comment;
    const [review] = await db
      .update(reviewsTable)
      .set(update)
      .where(eq(reviewsTable.id, req.params.id))
      .returning();
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: "Failed to update review" });
  }
});

router.delete("/admin/reviews/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    await db.delete(reviewsTable).where(eq(reviewsTable.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete review" });
  }
});

export default router;
