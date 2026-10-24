# Senorita — Test Plan

**App:** Senorita Women's Fashion Store  
**Admin credentials:** `admin@senorita.com` / `admin123`  
**Base URL (dev):** http://localhost:5000  
**API URL:** http://localhost:8080

---

## Part 1 — Manual Test Cases

---

### 1. Homepage

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| M01 | Hero banner loads | Open `/` | At least one banner image is visible in the hero section |
| M02 | Featured products display | Scroll to featured section | Product cards appear with image, name, and price in ₹ |
| M03 | Categories grid renders | Scroll to categories section | Category images and labels are displayed |
| M04 | Instagram link is correct | Click Instagram icon in footer | Opens `https://www.instagram.com/senoritastore_karnal` in a new tab |
| M05 | Scroll to top on navigate | Visit any page, scroll down, click nav link | Page instantly jumps to top with no flash of footer |

---

### 2. Shop & Product Listing

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| M06 | All products shown | Visit `/shop` | All active products are listed |
| M07 | Search by keyword | Type "dress" in search box | Only products matching "dress" appear |
| M08 | Sort by price low-high | Select "Price: Low to High" | Products reorder with cheapest first |
| M09 | Sort by price high-low | Select "Price: High to Low" | Products reorder with most expensive first |
| M10 | Filter by category | Click a category (e.g., Tops) | Only products in that category appear |
| M11 | Sale price shows correctly | Open a product on sale | Both original and sale price are displayed; sale price is lower |
| M12 | Category page loads | Visit `/category/tops` | Page title "Tops" with products and category description shown |

---

### 3. Product Detail Page

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| M13 | Image gallery works | Open a product | Main image shown; clicking thumbnails changes the main image |
| M14 | Size/colour variant selection | Select different size | Size changes, stock updates accordingly |
| M15 | Out of stock variant | Select an out-of-stock size | "Out of stock" label shown; Add to Cart disabled |
| M16 | Add to cart | Select size, click "Add to Cart" | Cart count in navbar increases by 1 |
| M17 | Approved reviews show | Scroll to reviews | Only approved reviews are listed with star rating and name |
| M18 | Guest review form submit | Fill name, email, rating, comment → submit | Success message shown; review pending approval |
| M19 | Review rating required | Submit review without selecting stars | Validation error shown |
| M20 | Breadcrumb navigation | Click category in breadcrumb | Returns to correct category page |

---

### 4. Cart

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| M21 | Cart drawer opens | Click cart icon in navbar | Slide-out drawer shows current items |
| M22 | Quantity increment | Click + in cart | Quantity increases, subtotal updates |
| M23 | Quantity decrement to 1 | Click – when quantity is 1 | Quantity stays at 1 (cannot go below) |
| M24 | Remove item | Click × on cart item | Item removed, cart total updates |
| M25 | Cart persists across pages | Add item, navigate away, return | Same items still in cart |
| M26 | Empty cart message | Open cart with no items | "Your cart is empty" message displayed |

---

### 5. Checkout

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| M27 | Checkout requires items | Visit `/checkout` with empty cart | Redirected or shown message to add items |
| M28 | Shipping form validation | Leave required fields empty, submit | Validation errors shown for Name, Address, Pincode, Phone |
| M29 | Pincode must be 6 digits | Enter "123", submit | Error: pincode must be 6 digits |
| M30 | Valid coupon code applies | Enter a valid coupon code, click Apply | Discount shown, total reduced |
| M31 | Invalid coupon code | Enter "FAKECOUPON", click Apply | Error: "Invalid or inactive coupon" |
| M32 | COD payment option | Select "Cash on Delivery", place order | Order placed, redirected to success page |
| M33 | Razorpay payment option | Select "Pay Online" | Razorpay modal opens |
| M34 | Order success page | Complete checkout | Shows order confirmation with order number |

---

### 6. User Authentication

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| M35 | Register new account | Visit `/register`, fill all fields | Account created, logged in, redirected to home |
| M36 | Register duplicate email | Register with existing email | Error: "Email already registered" |
| M37 | Login with correct credentials | Visit `/login`, enter valid credentials | Logged in, redirected |
| M38 | Login with wrong password | Enter wrong password | Error: invalid credentials |
| M39 | Login with unknown email | Enter non-existent email | Error: invalid credentials |
| M40 | Account page loads | Visit `/account` while logged in | Profile info and order history displayed |
| M41 | Protected route redirect | Visit `/account` while logged out | Redirected to `/login` |
| M42 | Logout works | Click logout | Session cleared, redirected to home |

---

### 7. Admin Panel — General

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| M43 | Admin login works | Login as `admin@senorita.com` / `admin123` | Redirected to admin dashboard |
| M44 | Non-admin cannot access admin | Login as regular user, visit `/admin` | Redirected or 403 error shown |
| M45 | Admin dashboard stats | Visit `/admin/dashboard` | Shows Total Orders, Revenue, Low Stock, Recent Orders |

---

### 8. Admin Panel — Products

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| M46 | Product list loads | Visit `/admin/products` | All products listed with name, price, stock |
| M47 | Search product by name | Type product name in search | Matching products filtered |
| M48 | Create new product | Click "Add Product", fill form, save | Product appears in list and on shop page |
| M49 | Edit product price | Click edit, change price, save | New price shown on product detail page |
| M50 | Upload product image | Click + in image gallery → select photo | Popup modal appears; fill title/alt; click "Add to Gallery"; image shows up |
| M51 | Add multiple images | Upload first image, click "Add more" | Same popup appears; second image added to gallery |
| M52 | Reorder images | Hover image in gallery, click ◀ or ▶ | Image moves position; first image marked "MAIN" |
| M53 | Delete product image | Hover image, click × | Image removed from gallery |
| M54 | AI description generate | Enter product name, click "Generate with AI" | Description field populated with generated text |
| M55 | Toggle product active | Toggle "Active" switch | Product hidden/shown on shop page |
| M56 | Delete product | Click delete, confirm | Product removed from list and shop |

---

### 9. Admin Panel — Categories

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| M57 | Categories list | Visit `/admin/categories` | All 11 categories shown |
| M58 | Upload category image | Click edit on category, upload photo to "Category Image" field | Photo uploads and previews |
| M59 | Create new category | Click "Add Category", fill name, save | Category appears in list and on homepage |
| M60 | Add product to category | Open category, click "Add Article" | Product form opens with ImageGallery |
| M61 | Similar products picker | Open category edit, add similar product | Product appears in similar products list |
| M62 | Delete category | Click delete, confirm | Category removed |

---

### 10. Admin Panel — Orders

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| M63 | Orders list loads | Visit `/admin/orders` | All orders with status, amount, date listed |
| M64 | Filter orders by status | Select "Pending" from filter | Only pending orders shown |
| M65 | Update order status | Click order, change status to "Shipped" | Status updated, email sent to customer |
| M66 | Add tracking number | Enter tracking number, save | Tracking number saved and visible |

---

### 11. Admin Panel — Reviews

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| M67 | Pending reviews shown | Visit `/admin/reviews` | Pending reviews tab shows new submissions |
| M68 | Approve review | Click "Approve" on a review | Review status → approved; appears on product page |
| M69 | Reject review | Click "Reject" on a review | Review status → rejected; not shown on product page |
| M70 | Edit review | Click edit, change comment, save | Updated text shown |
| M71 | Delete review | Click delete, confirm | Review permanently removed |

---

### 12. Admin Panel — Coupons & Banners

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| M72 | Create percentage coupon | Create coupon with 10% discount, save | Coupon usable at checkout |
| M73 | Create fixed-amount coupon | Create coupon with ₹100 off, save | ₹100 deducted at checkout |
| M74 | Coupon expiry enforced | Create coupon with past expiry date | Error: coupon expired when applied at checkout |
| M75 | Banner create | Create a hero banner with image and link | Banner appears on homepage |
| M76 | Banner deactivate | Toggle banner inactive | Banner no longer shows on homepage |

---

### 13. Static Pages

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| M77 | About page loads | Visit `/about` | Brand story content displayed |
| M78 | FAQ page loads | Visit `/faq` | FAQ items visible; Instagram link correct |
| M79 | Contact form | Visit `/contact`, fill and submit | Success message shown |
| M80 | Size guide loads | Visit `/size-guide` | Size chart table displayed |
| M81 | Shipping & Returns loads | Visit `/shipping-returns` | Policy text displayed |
| M82 | Store Locator loads | Visit `/store-locator` | Karnal store address and map shown |

---

## Part 2 — Automated Tests (Vitest + Supertest)

Located at: `artifacts/api-server/src/__tests__/api.test.ts`

Run with:
```bash
pnpm --filter @workspace/api-server run test
```

### Test Coverage

| Suite | Tests | What It Covers |
|-------|-------|----------------|
| Health | 1 | `GET /api/healthz` returns 200 |
| Products | 7 | List, search, sort, featured filter, slug lookup, 404, auth guards |
| Categories | 5 | List, slug lookup, 404, auth guards |
| Auth | 7 | Admin login, wrong password, unknown email, missing fields, `/me` with token |
| Reviews | 4 | List approved, guest submit, missing fields, invalid rating |
| Admin Routes | 5 | Stats, orders, customers — 401 without auth, 200 with admin token |
| Coupons | 4 | Invalid code 404, missing code, list without auth, list with admin token |
| Orders | 3 | 401 without auth, 200 with token, 404 for unknown order ID |
| Banners | 3 | List all, filter by position, 401 on create |

**Total automated tests: 39**

---

## Edge Cases to Watch

| Scenario | Risk | Status |
|----------|------|--------|
| Image over 20MB | Upload rejected with clear error message | Handled — 413 response |
| Duplicate product slug | DB unique constraint prevents save | Handled |
| Coupon used beyond limit | Usage count enforced | Should verify in code |
| Order placed with out-of-stock item | Race condition risk | Manual verification needed |
| XSS in review comment | Input not sanitised at DB level | Low risk — not rendered as HTML |
| Guest review flood | No rate limiting | Consider adding rate limit |
