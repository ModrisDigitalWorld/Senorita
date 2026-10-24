import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable, productsTable, usersTable } from "@workspace/db";
import bcrypt from "bcryptjs";

const router = Router();

router.post("/seed", async (_req, res) => {
  try {
    const cats = await db.insert(categoriesTable).values([
      { name: "Tops", slug: "tops", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=600&auto=format&fit=crop", order: 1 },
      { name: "Dresses", slug: "dresses", image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=600&auto=format&fit=crop", order: 2 },
      { name: "Co-ords", slug: "co-ords", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop", order: 3 },
      { name: "Bottoms", slug: "bottoms", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=600&auto=format&fit=crop", order: 4 },
      { name: "Accessories", slug: "accessories", image: "https://images.unsplash.com/photo-1470309864661-68328b2cd0a5?q=80&w=600&auto=format&fit=crop", order: 5 },
      { name: "Summer Collection", slug: "summer-collection", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop", description: "Light, breezy styles for the sunny season.", order: 6 },
      { name: "Best Sellers", slug: "best-sellers", image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=600&auto=format&fit=crop", description: "Our most loved styles, tried and trusted.", order: 7 },
      { name: "New Arrivals", slug: "new-arrivals", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop", description: "Fresh drops — be the first to shop.", order: 8 },
      { name: "Winter Collection", slug: "winter-collection", image: "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=600&auto=format&fit=crop", description: "Cozy, layered looks for cooler days.", order: 9 },
      { name: "Premium Collection", slug: "premium-collection", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop", description: "Elevated fabrics and finishes for those who demand the best.", order: 10 },
      { name: "Party Wear", slug: "party-wear", image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=600&auto=format&fit=crop", description: "Dance-floor ready outfits that steal the show.", order: 11 },
      { name: "Plus Size", slug: "plus-size", image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=600&auto=format&fit=crop", description: "Stylish looks in extended sizes for every body.", order: 12 },
      { name: "Ethnic Wear", slug: "ethnic-wear", image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=600&auto=format&fit=crop", description: "Celebrate heritage with kurtas, dupattas and more.", order: 13 },
    ]).onConflictDoNothing().returning();

    const [topsCat] = await db.select().from(categoriesTable).limit(1);

    const products = [
      { name: "Velvet Hour Dress", slug: "velvet-hour-dress", price: 2499, salePrice: 3999, images: ["https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=800&auto=format&fit=crop"], badge: "Hot 🔥", stock: 25, isFeatured: true, description: "A luxurious velvet dress perfect for evening occasions. Features a flattering silhouette with elegant draping.", tags: ["velvet", "evening", "party"] },
      { name: "Chrome Dreams Co-ord", slug: "chrome-dreams-coord", price: 3299, images: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop"], badge: "Selling Fast", stock: 12, isFeatured: true, description: "A futuristic co-ord set with metallic accents. Turn heads wherever you go.", tags: ["co-ord", "metallic", "trendy"] },
      { name: "Midnight Slip", slug: "midnight-slip", price: 1899, images: ["https://images.unsplash.com/photo-1566206091558-7f218b696731?q=80&w=800&auto=format&fit=crop"], stock: 30, isFeatured: true, description: "A sleek and sensual slip dress in midnight hues. Perfect for date nights.", tags: ["slip", "satin", "evening"] },
      { name: "Hot Take Top", slug: "hot-take-top", price: 1299, images: ["https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=800&auto=format&fit=crop"], badge: "Only 3 Left!", stock: 3, description: "A bold, eye-catching top that makes a statement. Pair with jeans or a skirt.", tags: ["top", "bold", "casual"] },
      { name: "Toxic Lace Set", slug: "toxic-lace-set", price: 2799, images: ["https://images.unsplash.com/photo-1548549557-dbe9946621da?q=80&w=800&auto=format&fit=crop"], badge: "Limited Drop", stock: 8, isFeatured: true, description: "An intricate lace co-ord set with delicate detailing. Feminine and fierce.", tags: ["lace", "co-ord", "feminine"] },
      { name: "Neon Rush Mini", slug: "neon-rush-mini", price: 1599, images: ["https://images.unsplash.com/photo-1505022610485-0249ba5b3675?q=80&w=800&auto=format&fit=crop"], stock: 18, description: "A vibrant neon mini skirt to amplify your energy. Stay bold, stay bright.", tags: ["neon", "mini", "skirt"] },
      { name: "Golden Hour Blazer", slug: "golden-hour-blazer", price: 3499, images: ["https://images.unsplash.com/photo-1521577352947-9bb58764b69a?q=80&w=800&auto=format&fit=crop"], stock: 15, isFeatured: true, description: "A golden-toned blazer that transitions from office to evening effortlessly.", tags: ["blazer", "formal", "golden"] },
      { name: "Sugar Rush Dress", slug: "sugar-rush-dress", price: 2199, images: ["https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=800&auto=format&fit=crop"], stock: 22, description: "Sweet and playful dress with candy-inspired prints. Embrace your inner child.", tags: ["playful", "printed", "casual"] },
      { name: "Devil's Advocate Pants", slug: "devils-advocate-pants", price: 1799, images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop"], badge: "Restocked", stock: 20, description: "Sharp, tailored pants that command attention. Business up top, party on the floor.", tags: ["pants", "tailored", "formal"] },
      { name: "Electric Feel Top", slug: "electric-feel-top", price: 1099, images: ["https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop"], stock: 35, description: "A charged-up top that sparks conversation. Lightweight, breathable, electric.", tags: ["top", "casual", "summer"] },
    ];

    await db.insert(productsTable).values(products.map(p => ({ ...p, isActive: true }))).onConflictDoNothing();

    const adminHash = await bcrypt.hash("admin123", 12);
    await db.insert(usersTable).values({ name: "Admin", email: "admin@senorita.com", passwordHash: adminHash, role: "admin" }).onConflictDoNothing();

    res.json({ message: "Seeded successfully!", categories: cats.length, products: products.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Seed failed", detail: String(err) });
  }
});

export default router;
