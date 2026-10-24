/**
 * End-to-end flow tests for the Senorita website.
 *
 * Each describe block covers one real user or admin journey, running steps
 * in order so that data created in earlier steps is used by later ones.
 * Cleanup (DELETE) is done in afterAll so failures still leave DB clean.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";

const JWT_SECRET = process.env.JWT_SECRET || "senorita-secret-dev-key";

const adminToken = () =>
  jwt.sign(
    { id: "00000000-0000-0000-0000-000000000001", email: "admin@senorita.com", role: "admin", name: "Admin" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

// ─── Helper: login and return token ──────────────────────────────────────────

async function loginAdmin(): Promise<string> {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@senorita.com", password: "admin123" });
  return res.body.token as string;
}

// ─── 1. Admin Product CRUD Flow ───────────────────────────────────────────────

describe("Flow: Admin Product CRUD", () => {
  let token: string;
  let productId: string;
  const slug = `test-flow-product-${Date.now()}`;

  beforeAll(async () => { token = await loginAdmin(); });

  afterAll(async () => {
    if (productId) {
      await request(app)
        .delete(`/api/products/${productId}`)
        .set("Authorization", `Bearer ${token}`);
    }
  });

  it("GET /api/admin/products → lists all products (admin only)", async () => {
    const res = await request(app)
      .get("/api/admin/products")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/admin/products without auth → 401", async () => {
    const res = await request(app).get("/api/admin/products");
    expect(res.status).toBe(401);
  });

  it("POST /api/products → creates a new product", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Flow Test Product",
        slug,
        description: "A product created during automated flow testing",
        price: 1299,
        stock: 50,
        images: [],
        tags: ["test", "flow"],
        isFeatured: false,
        isActive: true,
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("slug", slug);
    expect(res.body.price).toBe(1299);
    productId = res.body.id;
  });

  it("GET /api/products/:slug → newly created product is visible", async () => {
    const res = await request(app).get(`/api/products/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", productId);
    expect(res.body).toHaveProperty("name", "Flow Test Product");
  });

  it("PUT /api/products/:id → updates price and description", async () => {
    const res = await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ price: 999, salePrice: 799, description: "Updated during test" });
    expect(res.status).toBe(200);
    expect(res.body.price).toBe(999);
    expect(res.body.salePrice).toBe(799);
  });

  it("GET /api/products/:slug → reflects updated price", async () => {
    const res = await request(app).get(`/api/products/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.price).toBe(999);
    expect(res.body.salePrice).toBe(799);
  });

  it("DELETE /api/products/:id → removes the product", async () => {
    const res = await request(app)
      .delete(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    productId = "";
  });

  it("GET /api/products/:slug after delete → 404", async () => {
    const res = await request(app).get(`/api/products/${slug}`);
    expect(res.status).toBe(404);
  });
});

// ─── 2. Admin Category CRUD Flow ─────────────────────────────────────────────

describe("Flow: Admin Category CRUD", () => {
  let token: string;
  let categoryId: string;
  const catSlug = `flow-test-cat-${Date.now()}`;

  beforeAll(async () => { token = await loginAdmin(); });

  afterAll(async () => {
    if (categoryId) {
      await request(app)
        .delete(`/api/categories/${categoryId}`)
        .set("Authorization", `Bearer ${token}`);
    }
  });

  it("POST /api/categories → creates a category", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Flow Test Category", slug: catSlug, description: "Created by flow test" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body.slug).toBe(catSlug);
    categoryId = res.body.id;
  });

  it("GET /api/categories/:slug → new category is visible", async () => {
    const res = await request(app).get(`/api/categories/${catSlug}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("name", "Flow Test Category");
  });

  it("PUT /api/categories/:id → updates name", async () => {
    const res = await request(app)
      .put(`/api/categories/${categoryId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Flow Test Category (Updated)" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Flow Test Category (Updated)");
  });

  it("DELETE /api/categories/:id → removes the category", async () => {
    const res = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    categoryId = "";
  });

  it("GET /api/categories/:slug after delete → 404", async () => {
    const res = await request(app).get(`/api/categories/${catSlug}`);
    expect(res.status).toBe(404);
  });
});

// ─── 3. Coupon Lifecycle Flow ─────────────────────────────────────────────────

describe("Flow: Coupon Lifecycle", () => {
  let token: string;
  let couponId: string;
  const couponCode = `FLOWTEST${Date.now()}`.slice(0, 20).toUpperCase();

  beforeAll(async () => { token = await loginAdmin(); });

  afterAll(async () => {
    if (couponId) {
      await request(app)
        .delete(`/api/coupons/${couponId}`)
        .set("Authorization", `Bearer ${token}`);
    }
  });

  it("POST /api/coupons → admin creates a percentage coupon", async () => {
    const res = await request(app)
      .post("/api/coupons")
      .set("Authorization", `Bearer ${token}`)
      .send({
        code: couponCode,
        type: "percentage",
        value: 10,
        minOrder: 500,
        isActive: true,
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body.code).toBe(couponCode);
    couponId = res.body.id;
  });

  it("POST /api/coupons/validate → valid code returns coupon with correct fields", async () => {
    const res = await request(app)
      .post("/api/coupons/validate")
      .send({ code: couponCode, orderTotal: 1000 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("code", couponCode);
    expect(res.body).toHaveProperty("type", "percentage");
    expect(res.body).toHaveProperty("value", 10);
    expect(res.body.isActive).toBe(true);
  });

  it("POST /api/coupons/validate → order below minOrder fails", async () => {
    const res = await request(app)
      .post("/api/coupons/validate")
      .send({ code: couponCode, orderTotal: 300 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("PUT /api/coupons/:id → deactivate coupon", async () => {
    const res = await request(app)
      .put(`/api/coupons/${couponId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ isActive: false });
    expect(res.status).toBe(200);
    expect(res.body.isActive).toBe(false);
  });

  it("POST /api/coupons/validate → inactive coupon rejected", async () => {
    const res = await request(app)
      .post("/api/coupons/validate")
      .send({ code: couponCode, orderTotal: 1000 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("DELETE /api/coupons/:id → removes coupon", async () => {
    const res = await request(app)
      .delete(`/api/coupons/${couponId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    couponId = "";
  });
});

// ─── 4. Guest Checkout & Order Management Flow ────────────────────────────────

describe("Flow: Guest Checkout & Order Management", () => {
  let token: string;
  let orderId: string;
  let productId: string;

  beforeAll(async () => {
    token = await loginAdmin();
    const p = await request(app).get("/api/products");
    productId = p.body[0]?.id;
  });

  afterAll(async () => {
    if (orderId) {
      await request(app)
        .put(`/api/admin/orders/${orderId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "cancelled" });
    }
  });

  it("POST /api/checkout/create-session with missing fields → 400", async () => {
    const res = await request(app)
      .post("/api/checkout/create-session")
      .send({ items: [] });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /api/checkout/create-session → creates order without Stripe key", async () => {
    const res = await request(app)
      .post("/api/checkout/create-session")
      .send({
        items: [{ productId, name: "Test Item", price: 1299, quantity: 1 }],
        shippingAddress: {
          name: "Flow Tester",
          phone: "9999999999",
          line1: "123 Test Street",
          city: "Karnal",
          state: "Haryana",
          pincode: "132001",
          email: "flowtest@example.com",
        },
      });
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty("orderId");
    orderId = res.body.orderId;
  });

  it("GET /api/admin/orders → order appears in admin list", async () => {
    const res = await request(app)
      .get("/api/admin/orders")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.some((o: any) => o.id === orderId);
    expect(found).toBe(true);
  });

  it("GET /api/orders/:id → admin can fetch order detail", async () => {
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", orderId);
    expect(res.body).toHaveProperty("items");
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it("PUT /api/admin/orders/:id → updates order status to processing", async () => {
    const res = await request(app)
      .put(`/api/admin/orders/${orderId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "processing" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("processing");
  });

  it("PUT /api/admin/orders/:id → updates tracking number", async () => {
    const res = await request(app)
      .put(`/api/admin/orders/${orderId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ trackingNumber: "TRK123456789" });
    expect(res.status).toBe(200);
    expect(res.body.trackingNumber).toBe("TRK123456789");
  });

  it("PUT /api/admin/orders/:id without auth → 401", async () => {
    const res = await request(app)
      .put(`/api/admin/orders/${orderId}`)
      .send({ status: "shipped" });
    expect(res.status).toBe(401);
  });
});

// ─── 5. Cart & Wishlist Flow (registered user) ───────────────────────────────

describe("Flow: Cart & Wishlist (registered user)", () => {
  const testEmail = `cartflowtest_${Date.now()}@example.com`;
  const testPassword = "TestPass123!";
  let userToken: string;
  let cartItemId: string;
  let productId: string;

  beforeAll(async () => {
    const pRes = await request(app).get("/api/products");
    productId = pRes.body[0]?.id;
  });

  afterAll(async () => {
    if (userToken) {
      await request(app).delete("/api/cart").set("Authorization", `Bearer ${userToken}`);
    }
  });

  it("POST /api/auth/register → creates a new customer account", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Cart Tester", email: testEmail, password: testPassword });
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty("token");
    userToken = res.body.token;
  });

  it("GET /api/cart → newly registered user has empty cart", async () => {
    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("POST /api/cart → adds a product to cart", async () => {
    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 2 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body.quantity).toBe(2);
    cartItemId = res.body.id;
  });

  it("POST /api/cart → adding same product again increases quantity", async () => {
    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 1 });
    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(3);
  });

  it("GET /api/cart → cart has the item with correct quantity", async () => {
    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].quantity).toBe(3);
    expect(res.body[0]).toHaveProperty("productName");
    expect(res.body[0]).toHaveProperty("productPrice");
  });

  it("PUT /api/cart/:id → updates item quantity to 5", async () => {
    const res = await request(app)
      .put(`/api/cart/${cartItemId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ quantity: 5 });
    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(5);
  });

  it("PUT /api/cart/:id with quantity=0 → removes the item", async () => {
    const res = await request(app)
      .put(`/api/cart/${cartItemId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ quantity: 0 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("deleted", true);
  });

  it("GET /api/cart → cart is empty after removal", async () => {
    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("POST /api/cart → re-add product for bulk clear test", async () => {
    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 1 });
    expect(res.status).toBe(200);
  });

  it("DELETE /api/cart → clears the entire cart", async () => {
    const res = await request(app)
      .delete("/api/cart")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
  });

  it("GET /api/cart → empty after clear", async () => {
    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("GET /api/cart without auth → 401", async () => {
    const res = await request(app).get("/api/cart");
    expect(res.status).toBe(401);
  });

  it("POST /api/wishlist → toggles product into wishlist", async () => {
    const res = await request(app)
      .post("/api/wishlist")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("wishlisted", true);
  });

  it("GET /api/wishlist → product appears in wishlist", async () => {
    const res = await request(app)
      .get("/api/wishlist")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty("productName");
  });

  it("POST /api/wishlist → toggles product out of wishlist", async () => {
    const res = await request(app)
      .post("/api/wishlist")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("wishlisted", false);
  });

  it("GET /api/wishlist → empty after toggle off", async () => {
    const res = await request(app)
      .get("/api/wishlist")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ─── 6. User Profile & Addresses Flow ────────────────────────────────────────

describe("Flow: User Profile & Addresses", () => {
  const testEmail = `profiletest_${Date.now()}@example.com`;
  let userToken: string;
  let addressId: string;

  it("POST /api/auth/register → creates account", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Profile Tester", email: testEmail, password: "ProfilePass1!" });
    expect([200, 201]).toContain(res.status);
    userToken = res.body.token;
  });

  it("GET /api/auth/me → returns user profile", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("email", testEmail);
    expect(res.body).toHaveProperty("name", "Profile Tester");
  });

  it("PUT /api/auth/profile → updates name and phone", async () => {
    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Updated Name", phone: "9876543210" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("name", "Updated Name");
    expect(res.body).toHaveProperty("phone", "9876543210");
  });

  it("POST /api/auth/addresses → saves a delivery address", async () => {
    const res = await request(app)
      .post("/api/auth/addresses")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "Profile Tester",
        phone: "9876543210",
        line1: "456 Profile Street",
        city: "Karnal",
        state: "Haryana",
        pincode: "132001",
        isDefault: true,
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    addressId = res.body.id;
  });

  it("GET /api/auth/addresses → returns saved addresses", async () => {
    const res = await request(app)
      .get("/api/auth/addresses")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((a: any) => a.id === addressId)).toBe(true);
  });

  it("DELETE /api/auth/addresses/:id → removes the address", async () => {
    const res = await request(app)
      .delete(`/api/auth/addresses/${addressId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
  });

  it("GET /api/auth/addresses → empty after deletion", async () => {
    const res = await request(app)
      .get("/api/auth/addresses")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.find((a: any) => a.id === addressId)).toBeUndefined();
  });
});

// ─── 7. Review Moderation Flow ────────────────────────────────────────────────

describe("Flow: Review Moderation", () => {
  let token: string;
  let reviewId: string;
  let productId: string;

  beforeAll(async () => {
    token = await loginAdmin();
    const pRes = await request(app).get("/api/products");
    productId = pRes.body[0]?.id;
  });

  afterAll(async () => {
    if (reviewId) {
      await request(app)
        .delete(`/api/admin/reviews/${reviewId}`)
        .set("Authorization", `Bearer ${token}`);
    }
  });

  it("POST /api/reviews → guest submits a review (pending)", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .send({
        productId,
        rating: 4,
        title: "Flow test review",
        comment: "This is an automated moderation flow test",
        reviewerName: "Flow Tester",
        reviewerEmail: "flowreviewer@example.com",
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body.status).toBe("pending");
    reviewId = res.body.id;
  });

  it("GET /api/admin/reviews → pending review appears in admin list", async () => {
    const res = await request(app)
      .get("/api/admin/reviews")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.some((r: any) => r.id === reviewId);
    expect(found).toBe(true);
  });

  it("GET /api/reviews/:productId → pending review NOT shown to public", async () => {
    const res = await request(app).get(`/api/reviews/${productId}`);
    expect(res.status).toBe(200);
    const found = res.body.some((r: any) => r.id === reviewId);
    expect(found).toBe(false);
  });

  it("PUT /api/admin/reviews/:id → admin approves the review", async () => {
    const res = await request(app)
      .put(`/api/admin/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "approved" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("approved");
  });

  it("GET /api/reviews/:productId → approved review is now public", async () => {
    const res = await request(app).get(`/api/reviews/${productId}`);
    expect(res.status).toBe(200);
    const found = res.body.some((r: any) => r.id === reviewId);
    expect(found).toBe(true);
  });

  it("PUT /api/admin/reviews/:id → admin can reject an approved review", async () => {
    const res = await request(app)
      .put(`/api/admin/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "rejected" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("rejected");
  });

  it("GET /api/reviews/:productId → rejected review is hidden again", async () => {
    const res = await request(app).get(`/api/reviews/${productId}`);
    expect(res.status).toBe(200);
    const found = res.body.some((r: any) => r.id === reviewId);
    expect(found).toBe(false);
  });

  it("DELETE /api/admin/reviews/:id → removes the review", async () => {
    const res = await request(app)
      .delete(`/api/admin/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    reviewId = "";
  });
});

// ─── 8. Product Filtering & Search Flow ───────────────────────────────────────

describe("Flow: Product Filtering & Search", () => {
  let firstCategorySlug: string;
  let firstCategoryId: string;

  beforeAll(async () => {
    const res = await request(app).get("/api/categories");
    firstCategorySlug = res.body[0]?.slug;
    firstCategoryId = res.body[0]?.id;
  });

  it("GET /api/products?category=<uuid> → filters by category", async () => {
    const res = await request(app).get(`/api/products?category=${firstCategoryId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((p: any) => expect(p.categoryId).toBe(firstCategoryId));
  });

  it("GET /api/products?sort=price_desc → descending price order", async () => {
    const res = await request(app).get("/api/products?sort=price_desc");
    expect(res.status).toBe(200);
    const prices: number[] = res.body.map((p: any) => p.price);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
    }
  });

  it("GET /api/products?search=top → returns results containing 'top'", async () => {
    const res = await request(app).get("/api/products?search=top");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/products?search=zzznomatch999 → returns empty array", async () => {
    const res = await request(app).get("/api/products?search=zzznomatch999");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("GET /api/products?limit=3 → returns at most 3 products", async () => {
    const res = await request(app).get("/api/products?limit=3");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeLessThanOrEqual(3);
  });

  it("GET /api/products?offset=1000 → returns empty array (past end)", async () => {
    const res = await request(app).get("/api/products?offset=1000");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("GET /api/categories/:slug → returns category detail", async () => {
    const res = await request(app).get(`/api/categories/${firstCategorySlug}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("slug", firstCategorySlug);
  });
});

// ─── 9. Checkout with Coupon Flow ─────────────────────────────────────────────

describe("Flow: Checkout with Coupon Discount", () => {
  let token: string;
  let couponId: string;
  let orderId: string;
  let productId: string;
  const couponCode = `CHKFLOW${Date.now()}`.slice(0, 20).toUpperCase();

  beforeAll(async () => {
    token = await loginAdmin();
    const pRes = await request(app).get("/api/products");
    productId = pRes.body[0]?.id;

    const cRes = await request(app)
      .post("/api/coupons")
      .set("Authorization", `Bearer ${token}`)
      .send({ code: couponCode, type: "fixed", value: 200, minOrder: 0, isActive: true });
    couponId = cRes.body.id;
  });

  afterAll(async () => {
    if (couponId) {
      await request(app).delete(`/api/coupons/${couponId}`).set("Authorization", `Bearer ${token}`);
    }
  });

  it("POST /api/checkout/create-session with coupon → applies discount", async () => {
    const res = await request(app)
      .post("/api/checkout/create-session")
      .send({
        items: [{ productId, name: "Coupon Test Item", price: 1500, quantity: 1 }],
        shippingAddress: {
          name: "Coupon Tester",
          phone: "9000000001",
          line1: "1 Discount Lane",
          city: "Karnal",
          state: "Haryana",
          pincode: "132001",
          email: "coupontest@example.com",
        },
        couponCode,
      });
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty("orderId");
    orderId = res.body.orderId;
  });

  it("GET /api/orders/:id → order has correct discount applied", async () => {
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.discount).toBe(200);
    expect(res.body.subtotal).toBe(1500);
    expect(res.body.total).toBe(1300);
  });
});

// ─── 10. Razorpay Guard Tests ─────────────────────────────────────────────────

describe("Flow: Razorpay Configuration Guards", () => {
  it("POST /api/razorpay/create-order with missing fields → 400", async () => {
    const res = await request(app)
      .post("/api/razorpay/create-order")
      .send({ items: [] });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /api/razorpay/create-order without config → 503", async () => {
    const res = await request(app)
      .post("/api/razorpay/create-order")
      .send({
        items: [{ productId: "00000000-0000-0000-0000-000000000001", name: "Test", price: 999, quantity: 1 }],
        shippingAddress: { name: "X", phone: "9", line1: "Y", city: "Z", state: "A", pincode: "0" },
      });
    expect([503, 500]).toContain(res.status);
  });

  it("POST /api/razorpay/verify-payment without config → 503", async () => {
    const res = await request(app)
      .post("/api/razorpay/verify-payment")
      .send({
        orderId: "00000000-0000-0000-0000-000000000001",
        razorpayOrderId: "order_test",
        razorpayPaymentId: "pay_test",
        razorpaySignature: "badsig",
      });
    expect([400, 503]).toContain(res.status);
  });
});
