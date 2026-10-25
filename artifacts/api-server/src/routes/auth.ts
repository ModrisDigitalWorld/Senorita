import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable, addressesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, JWT_SECRET, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email and password are required" });
      return;
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(usersTable).values({
      name,
      email: email.toLowerCase(),
      passwordHash,
      phone: phone || null,
    }).returning();
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/auth/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, phone: usersTable.phone, createdAt: usersTable.createdAt }).from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.put("/auth/profile", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, phone } = req.body;
    const [user] = await db.update(usersTable).set({ name, phone, updatedAt: new Date() }).where(eq(usersTable.id, req.user!.id)).returning({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, phone: usersTable.phone });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.get("/auth/addresses", authMiddleware, async (req: AuthRequest, res) => {
  const addresses = await db.select().from(addressesTable).where(eq(addressesTable.userId, req.user!.id));
  res.json(addresses);
});

router.post("/auth/addresses", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, phone, line1, line2, city, state, pincode, isDefault } = req.body;
    if (isDefault) {
      await db.update(addressesTable).set({ isDefault: false }).where(eq(addressesTable.userId, req.user!.id));
    }
    const [address] = await db.insert(addressesTable).values({ userId: req.user!.id, name, phone, line1, line2, city, state, pincode, isDefault: isDefault || false }).returning();
    res.json(address);
  } catch (err) {
    res.status(500).json({ error: "Failed to add address" });
  }
});

// router.delete("/auth/addresses/:id", authMiddleware, async (req: AuthRequest, res) => {
//   await db.delete(addressesTable).where(eq(addressesTable.id, req.params.id));
//   res.json({ success: true });
// });

router.delete("/auth/addresses/:id", authMiddleware, async (req: AuthRequest, res) => {
  const addressId = req.params.id as string;
  await db.delete(addressesTable).where(eq(addressesTable.id, addressId));
  res.json({ success: true });
});

export default router;
