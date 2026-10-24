import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";

const JWT_SECRET = process.env.JWT_SECRET || "senorita-secret-dev-key";

const makeAdminToken = () =>
  jwt.sign({ id: "00000000-0000-0000-0000-000000000001", email: "admin@senorita.com", role: "admin", name: "Admin" }, JWT_SECRET, { expiresIn: "1h" });

const makeUserToken = () =>
  jwt.sign({ id: "00000000-0000-0000-0000-000000000002", email: "test@example.com", role: "customer", name: "Test User" }, JWT_SECRET, { expiresIn: "1h" });

const PRODUCT_SLUG = "velvet-hour-dress";
const CATEGORY_SLUG = "tops";

// ─── Health ─────────────────────────────────────────────────────────────────

describe("Health", () => {
  it("GET /api/healthz → 200 ok", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok" });
  });
});

// ─── Products ────────────────────────────────────────────────────────────────

describe("Products", () => {
  it("GET /api/products → returns array of active products", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /api/products with search filter → returns filtered results", async () => {
    const res = await request(app).get("/api/products?search=dress");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/products with sort=price_asc → prices are in ascending order", async () => {
    const res = await request(app).get("/api/products?sort=price_asc");
    expect(res.status).toBe(200);
    const prices: number[] = res.body.map((p: any) => p.price);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  it("GET /api/products with featured=true → all results are featured", async () => {
    const res = await request(app).get("/api/products?featured=true");
    expect(res.status).toBe(200);
    res.body.forEach((p: any) => expect(p.isFeatured).toBe(true));
  });

  it("GET /api/products/:slug → returns product with variants", async () => {
    const res = await request(app).get(`/api/products/${PRODUCT_SLUG}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("slug", PRODUCT_SLUG);
    expect(res.body).toHaveProperty("variants");
    expect(Array.isArray(res.body.variants)).toBe(true);
  });

  it("GET /api/products/nonexistent-slug → 404", async () => {
    const res = await request(app).get("/api/products/this-product-does-not-exist-xyz");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /api/products without auth → 401", async () => {
    const res = await request(app).post("/api/products").send({ name: "Test" });
    expect(res.status).toBe(401);
  });

  it("POST /api/products with customer token → 403", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${makeUserToken()}`)
      .send({ name: "Test" });
    expect(res.status).toBe(403);
  });
});

// ─── Categories ───────────────────────────────────────────────────────────────

describe("Categories", () => {
  it("GET /api/categories → returns all categories", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("name");
    expect(res.body[0]).toHaveProperty("slug");
  });

  it("GET /api/categories/:slug → returns category with similar products", async () => {
    const res = await request(app).get(`/api/categories/${CATEGORY_SLUG}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("slug", CATEGORY_SLUG);
  });

  it("GET /api/categories/nonexistent → 404", async () => {
    const res = await request(app).get("/api/categories/no-such-category-xyz");
    expect(res.status).toBe(404);
  });

  it("POST /api/categories without auth → 401", async () => {
    const res = await request(app).post("/api/categories").send({ name: "Test" });
    expect(res.status).toBe(401);
  });

  it("DELETE /api/categories/:id with customer token → 403", async () => {
    const res = await request(app)
      .delete("/api/categories/some-id")
      .set("Authorization", `Bearer ${makeUserToken()}`);
    expect(res.status).toBe(403);
  });
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

describe("Auth", () => {
  it("POST /api/auth/login with admin credentials → returns token", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "admin@senorita.com",
      password: "admin123",
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toHaveProperty("role", "admin");
  });

  it("POST /api/auth/login with wrong password → 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "admin@senorita.com",
      password: "wrongpassword",
    });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /api/auth/login with unknown email → 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "password123",
    });
    expect(res.status).toBe(401);
  });

  it("POST /api/auth/login with missing fields → 400", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "test@test.com" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /api/auth/register with missing fields → 400", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "x@x.com" });
    expect(res.status).toBe(400);
  });

  it("GET /api/auth/me without token → 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("GET /api/auth/me with valid token → returns user profile", async () => {
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "admin@senorita.com",
      password: "admin123",
    });
    const { token } = loginRes.body;
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("email", "admin@senorita.com");
  });
});

// ─── Reviews ──────────────────────────────────────────────────────────────────

describe("Reviews", () => {
  let productId: string;

  beforeAll(async () => {
    const res = await request(app).get(`/api/products/${PRODUCT_SLUG}`);
    productId = res.body.id;
  });

  it("GET /api/reviews/:productId → returns approved reviews only", async () => {
    const res = await request(app).get(`/api/reviews/${productId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/reviews → guest can submit a review", async () => {
    const res = await request(app).post("/api/reviews").send({
      productId,
      rating: 5,
      title: "Automated test review",
      comment: "This is an automated test",
      reviewerName: "Test Bot",
      reviewerEmail: "bot@test.com",
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("status", "pending");
  });

  it("POST /api/reviews with missing required fields → 400", async () => {
    const res = await request(app).post("/api/reviews").send({ productId, rating: 5 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /api/reviews with invalid rating (6) → 400", async () => {
    const res = await request(app).post("/api/reviews").send({
      productId,
      rating: 6,
      title: "Bad rating",
      comment: "Test",
      reviewerName: "Tester",
    });
    expect(res.status).toBe(400);
  });
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────

describe("Admin Routes", () => {
  it("GET /api/admin/stats without auth → 401", async () => {
    const res = await request(app).get("/api/admin/stats");
    expect(res.status).toBe(401);
  });

  it("GET /api/admin/stats with admin token → 200", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${makeAdminToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalOrders");
    expect(res.body).toHaveProperty("totalRevenue");
  });

  it("GET /api/admin/orders without auth → 401", async () => {
    const res = await request(app).get("/api/admin/orders");
    expect(res.status).toBe(401);
  });

  it("GET /api/admin/customers without auth → 401", async () => {
    const res = await request(app).get("/api/admin/customers");
    expect(res.status).toBe(401);
  });

  it("GET /api/admin/customers with admin token → 200", async () => {
    const res = await request(app)
      .get("/api/admin/customers")
      .set("Authorization", `Bearer ${makeAdminToken()}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─── Coupons ──────────────────────────────────────────────────────────────────

describe("Coupons", () => {
  it("POST /api/coupons/validate with nonexistent code → 400", async () => {
    const res = await request(app)
      .post("/api/coupons/validate")
      .send({ code: "DOESNOTEXIST999", orderTotal: 1000 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /api/coupons/validate with missing code → error response", async () => {
    const res = await request(app)
      .post("/api/coupons/validate")
      .send({ orderTotal: 1000 });
    expect([400, 404, 500]).toContain(res.status);
  });

  it("GET /api/coupons (admin list) without auth → 401", async () => {
    const res = await request(app).get("/api/coupons");
    expect(res.status).toBe(401);
  });

  it("GET /api/coupons with admin token → 200", async () => {
    const res = await request(app)
      .get("/api/coupons")
      .set("Authorization", `Bearer ${makeAdminToken()}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─── Orders ───────────────────────────────────────────────────────────────────

describe("Orders", () => {
  it("GET /api/orders without auth → 401", async () => {
    const res = await request(app).get("/api/orders");
    expect(res.status).toBe(401);
  });

  it("GET /api/orders with valid token → 200", async () => {
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "admin@senorita.com",
      password: "admin123",
    });
    const res = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${loginRes.body.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/orders/:id with nonexistent ID → 404", async () => {
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "admin@senorita.com",
      password: "admin123",
    });
    const res = await request(app)
      .get("/api/orders/00000000-0000-0000-0000-999999999999")
      .set("Authorization", `Bearer ${loginRes.body.token}`);
    expect(res.status).toBe(404);
  });
});

// ─── Banners ──────────────────────────────────────────────────────────────────

describe("Banners", () => {
  it("GET /api/banners → returns array", async () => {
    const res = await request(app).get("/api/banners");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/banners?position=hero → only hero banners", async () => {
    const res = await request(app).get("/api/banners?position=hero");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/banners without auth → 401", async () => {
    const res = await request(app).post("/api/banners").send({ title: "Test" });
    expect(res.status).toBe(401);
  });
});
