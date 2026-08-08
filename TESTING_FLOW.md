# MarineKart — How to Test (Step by Step)

Follow this order. Do **not** skip STEP 0 / STEP 1.

---

## STEP 0 — Put dummy data in the database (fixes "No products found")

Your DB is empty until you seed it once. Run this **yourself** in a terminal:

```bash
cd backend
npm run seed
```

Wait until you see:

```
Seed complete.
Products inserted: ...
```

and the demo login emails printed.

**What gets created**

| Data | Approx. |
|------|---------|
| Users | Admin + Customer + Dealer |
| Categories | 6 main + many subcategories |
| Products | ~25+ items (steering, SS fittings, electrical, etc.) |
| Banners | Home hero + side banners |
| Pages | About, Contact, FAQ, Privacy, Delivery |
| Coupons | `MARINE10`, `FLAT500` |

⚠️ Seed **clears** users/products/categories/banners/pages/coupons and inserts fresh demo data.

If seed fails with MongoDB error → check `backend/.env` has a real `MONGODB_URI`, and Atlas Network Access allows your IP.

---

## STEP 1 — Start backend + frontend (you run these)

Open **2 terminals**. Do not wait for me to start them.

**Terminal 1 — Backend**
```bash
cd backend
npm run dev
```
Wait for: `MongoDB connected` and API listening on port **5000**.

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
```
Open: **http://localhost:5173**

Quick check: **http://localhost:5000/api/health** should say API is running.

---

## Demo logins (from seed)

| Who | Login page | Email | Password |
|-----|------------|-------|----------|
| Customer | `/login` | `customer@marinekart.com` | `Customer@123` |
| Dealer | `/dealer-login` | `dealer@marinekart.com` | `Dealer@123` |
| Admin | `/admin-login` | `admin@marinekart.com` | `Admin@12345` (or `.env` value) |

Do **not** use one login for all roles — each portal is separate and protected.

---

## FLOW A — Guest browse (no login) — do this first

**Goal:** Site loads; prices stay hidden.

1. Open http://localhost:5173 (logout if logged in)
2. Homepage should show products (not "No products found")
3. Cards say **Login to View Price** (no ₹)
4. Open any product → still no price
5. Open a category from grid / All Categories
6. Search `steering` → results appear

**Pass:** products visible, prices hidden.

---

## FLOW B — Customer login → prices appear

1. Click **Login**
2. `customer@marinekart.com` / `Customer@123`
3. Go Home → cards show **₹ prices**
4. Open a product → price + qty + Add to Cart

**Pass:** prices only after login.

---

## FLOW C — Cart → Checkout → Order

1. Stay as customer
2. Product page → Qty 2 → **Add to Cart**
3. Open **Cart** → change qty → subtotal updates
4. **Proceed to Checkout**
5. Fill billing address
6. Payment = COD → **Place Order**
7. **My Account** → order history shows new order

**Pass:** order number + status `pending` + total.

---

## FLOW D — Wishlist

1. Logged in as customer
2. Add product to wishlist (heart)
3. Open Wish List → product listed

---

## FLOW E — Dealer cheaper price

1. Logout
2. Login `dealer@marinekart.com` / `Dealer@123`
3. Open same product as customer
4. Price should be ~15% lower

---

## FLOW F — CMS pages

Visit: About Us, Contact Us (submit form), FAQ, Privacy, Delivery Information.

---

## FLOW G — Admin

1. Open **http://localhost:5173/admin-login** (not the customer login)
2. Login: `admin@marinekart.com` / `Admin@12345`
3. You land on `/admin` dashboard with charts + stats
4. Sidebar: collapse/expand with header menu icon
5. Products → Add / Edit / Delete / Bulk Upload (columns use client names, not “slug”)
6. Categories → Add / Edit / Delete
7. Orders → filters, sort, 10 per page
8. Customers → edit account type / discount
9. Logout → toast confirmation → back to admin login

Trying `/admin` without login redirects to `/admin-login`.

---

## FLOW G2 — Dealer portal

1. Open **http://localhost:5173/dealer-login**
2. Login: `dealer@marinekart.com` / `Dealer@123`
3. Dashboard → Catalog (dealer prices) → My Orders → Account
4. Logout toast → dealer login

Trying `/dealer` without login redirects to `/dealer-login`.

---

## FLOW H — New register

1. Logout → Register with your email
2. Prices visible → place a small order

---

## Suggested order (checklist)

| # | What | Account |
|---|------|---------|
| 0 | `cd backend` → `npm run seed` | — |
| 1 | Start backend + frontend yourself | — |
| 2 | Guest browse (no prices) | Guest |
| 3 | Login & see prices | Customer |
| 4 | Cart → Checkout → Order | Customer |
| 5 | Wishlist | Customer |
| 6 | Compare price | Dealer |
| 7 | CMS + Contact | Anyone |
| 8 | Admin dashboard | Admin |
| 9 | New registration | New user |

---

## If something breaks

| Problem | Fix |
|---------|-----|
| **No products found. Run backend seed.** | Run STEP 0: `cd backend` then `npm run seed` |
| Frontend empty / API errors | Backend not running on port 5000 |
| MongoDB connection error | Fix `MONGODB_URI` + Atlas IP allowlist |
| CORS error | `FRONTEND_URL=http://localhost:5173` in `backend/.env` |
| Prices still hidden after login | Hard refresh; check Local Storage `mk_token` |
| Need fresh dummy data | Run seed again (STEP 0) |
