/**
 * ============================================================
 *  MANUAL TEST: Upload / Create a Product
 * ============================================================
 *
 *  HOW TO RUN THIS FILE ALONE:
 *
 *    pnpm --filter @workspace/api-server vitest run src/__tests__/upload-product.test.ts
 *
 *  To run in watch mode (re-runs on every save):
 *
 *    pnpm --filter @workspace/api-server vitest src/__tests__/upload-product.test.ts
 *
 *  To run ALL tests:
 *
 *    pnpm --filter @workspace/api-server run test
 *
 * ============================================================
 */

import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import app from "../app.js";

// ─── Real category IDs from the live database ────────────────────────────────
// These are the actual UUIDs in Supabase. Update if categories change.
const CATEGORY = {
  TOPS:    "ee7344b0-0ba2-4a3b-b6b1-06d0f1c10105",
  DRESSES: "1eb8678e-4699-4e71-933b-22a9e7f9de1c",
  COORDS:  "9a7189c1-49a3-47e0-9bc8-9341b600690d",
};

// ─── Shared state across tests ────────────────────────────────────────────────
let adminToken = "";
let createdProductIds: string[] = [];

// ─── Helper: log in as admin once ────────────────────────────────────────────
async function getAdminToken(): Promise<string> {
  if (adminToken) return adminToken;
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@senorita.com", password: "admin123" });
  adminToken = res.body.token;
  return adminToken;
}

// ─── Cleanup: remove every product created in these tests ────────────────────
afterAll(async () => {
  const token = await getAdminToken();
  for (const id of createdProductIds) {
    await request(app)
      .delete(`/api/products/${id}`)
      .set("Authorization", `Bearer ${token}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Upload Product: authentication guards", () => {

  it("POST /api/products without a token → 401 Unauthorized", async () => {
    const res = await request(app)
      .post("/api/products")
      .send({ name: "Unauthorized Product", price: 999 });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  it("POST /api/products with a customer (non-admin) token → 403 Forbidden", async () => {
    // Register a throwaway customer
    const regRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Regular Customer",
        email: `cust_${Date.now()}@example.com`,
        password: "Password123!",
      });
    const customerToken = regRes.body.token;

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ name: "Sneaky Product", price: 499 });

    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Upload Product: minimal (required fields only)", () => {

  it("creates a product with only the required fields (name + price)", async () => {
    const token = await getAdminToken();

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name:  "Minimal Test Kurti",
        slug:  `minimal-kurti-${Date.now()}`,
        price: 599,
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name:  "Minimal Test Kurti",
      price: 599,
    });
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("slug");
    expect(res.body.isActive).toBe(true);  // default active
    expect(res.body.stock).toBe(0);         // default stock

    createdProductIds.push(res.body.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Upload Product: full product with all fields", () => {

  it("creates a complete product with category, sale price, badge, images, tags", async () => {
    const token = await getAdminToken();

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name:        "Floral Wrap Dress",
        slug:        `floral-wrap-dress-${Date.now()}`,
        description: "A beautiful floral wrap dress perfect for summer outings. Light fabric with vibrant print.",
        price:       1799,
        salePrice:   1299,
        stock:       25,
        categoryId:  CATEGORY.DRESSES,
        isFeatured:  true,
        isActive:    true,
        badge:       "New Arrival",
        images: [
          "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=600",
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600",
        ],
        tags: ["floral", "dress", "summer", "wrap"],
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name:       "Floral Wrap Dress",
      price:      1799,
      salePrice:  1299,
      stock:      25,
      categoryId: CATEGORY.DRESSES,
      isFeatured: true,
      isActive:   true,
      badge:      "New Arrival",
    });
    expect(res.body.images).toHaveLength(2);
    expect(res.body.tags).toContain("summer");

    createdProductIds.push(res.body.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Upload Product: with size and colour variants", () => {

  it("creates a product and attaches size variants", async () => {
    const token = await getAdminToken();

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name:        "Solid Crop Top",
        slug:        `solid-crop-top-${Date.now()}`,
        description: "Everyday essential crop top in soft cotton.",
        price:       499,
        stock:       0,          // stock managed per-variant
        categoryId:  CATEGORY.TOPS,
        isFeatured:  false,
        isActive:    true,
        images: [
          "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=600",
        ],
        tags: ["crop", "top", "casual"],
        variants: [
          { type: "size", value: "S",  stock: 10, priceModifier: 0 },
          { type: "size", value: "M",  stock: 15, priceModifier: 0 },
          { type: "size", value: "L",  stock: 8,  priceModifier: 0 },
          { type: "size", value: "XL", stock: 5,  priceModifier: 0 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Solid Crop Top");

    createdProductIds.push(res.body.id);

    // Verify variants were saved by fetching the product by slug
    const detail = await request(app).get(`/api/products/${res.body.slug}`);
    expect(detail.status).toBe(200);
    expect(detail.body.variants).toHaveLength(4);
    expect(detail.body.variants.map((v: any) => v.value)).toContain("M");
  });

  it("creates a product and attaches colour variants", async () => {
    const token = await getAdminToken();

    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name:        "Palazzos - Multi Colour",
        slug:        `palazzos-multi-${Date.now()}`,
        description: "Wide-leg palazzos available in three vibrant colours.",
        price:       799,
        salePrice:   649,
        stock:       0,
        categoryId:  CATEGORY.COORDS,
        isFeatured:  false,
        isActive:    true,
        badge:       "Sale",
        images: [],
        tags: ["palazzo", "bottom", "sale"],
        variants: [
          { type: "color", value: "Red",   stock: 12, priceModifier: 0 },
          { type: "color", value: "Green", stock: 8,  priceModifier: 0 },
          { type: "color", value: "Black", stock: 20, priceModifier: 0 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.salePrice).toBe(649);
    expect(res.body.badge).toBe("Sale");

    createdProductIds.push(res.body.id);

    const detail = await request(app).get(`/api/products/${res.body.slug}`);
    expect(detail.body.variants).toHaveLength(3);
    expect(detail.body.variants.map((v: any) => v.value)).toContain("Black");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Upload Product: update an existing product", () => {

  it("updates price, sale price, and marks as featured", async () => {
    const token = await getAdminToken();

    // First create it
    const create = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name:     "Update Test Product",
        slug:     `update-test-${Date.now()}`,
        price:    999,
        isActive: true,
      });
    expect(create.status).toBe(200);
    const id = create.body.id;
    createdProductIds.push(id);

    // Now update it
    const update = await request(app)
      .put(`/api/products/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ price: 1199, salePrice: 899, isFeatured: true, badge: "Bestseller" });

    expect(update.status).toBe(200);
    expect(update.body.price).toBe(1199);
    expect(update.body.salePrice).toBe(899);
    expect(update.body.isFeatured).toBe(true);
    expect(update.body.badge).toBe("Bestseller");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Upload Product: duplicate slug is rejected", () => {

  it("two products with the same slug → second one returns an error", async () => {
    const token = await getAdminToken();
    const slug = `duplicate-slug-test-${Date.now()}`;

    const first = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "First Product", slug, price: 499 });

    expect(first.status).toBe(200);
    createdProductIds.push(first.body.id);

    const second = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Second Product", slug, price: 599 });

    // DB unique constraint on slug → should fail
    expect([400, 409, 500]).toContain(second.status);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Upload Product: delete a product", () => {

  it("deletes a product and confirms it is gone", async () => {
    const token = await getAdminToken();

    const create = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "To Be Deleted", slug: `delete-me-${Date.now()}`, price: 299 });

    expect(create.status).toBe(200);
    const { id, slug } = create.body;

    const del = await request(app)
      .delete(`/api/products/${id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(200);
    expect(del.body).toHaveProperty("success", true);

    const fetch = await request(app).get(`/api/products/${slug}`);
    expect(fetch.status).toBe(404);
  });

  it("DELETE /api/products/:id without auth → 401", async () => {
    const res = await request(app).delete("/api/products/some-fake-id");
    expect(res.status).toBe(401);
  });
});
