# MarineKart E-Commerce

Full-stack rebuild inspired by [MarineKart](https://darkred-goldfinch-226921.hostingersite.com/) — responsive storefront + admin API, with **Login to View Price** B2B pricing.

## How it works (simple)

```
Browser (React/Vite)  →  API calls via services/  →  Express backend  →  MongoDB Atlas
```

1. **Guest** browses products/categories — **prices are hidden** (`Login to View Price`).
2. **Customer / Dealer** registers or logs in → JWT stored → prices appear (dealers can get a `priceMultiplier` discount).
3. **Cart / Wishlist / Checkout / Orders** require login.
4. **Admin** (`role: admin`) uses `/admin` for dashboard, products, categories, customers, orders.
5. Every API hit is timed and written to `backend/logs/api-YYYY-MM-DD.log` so you can spot slow routes.

## Theme colors (from reference site)

| Token | Hex | Use |
|-------|-----|-----|
| Navy | `#1a4b8c` | Header nav, footer, headings |
| Cyan | `#78c6d4` | Buttons, accents, badges |
| Body | `#f9f9f9` | Page background |

## Project structure

```
MarineCraft/
├── backend/
│   ├── .env                 # secrets + FRONTEND_URL for CORS
│   ├── logs/                # API timing logs
│   ├── uploads/
│   └── src/
│       ├── config/          # env, db
│       ├── middleware/      # cors, auth, apiLogger, errors
│       ├── models/          # User, Product, Category, Order, ...
│       ├── controllers/
│       ├── routes/
│       ├── seeders/
│       ├── utils/
│       ├── app.js
│       └── server.js
└── frontend/
    ├── .env                 # VITE_API_BASE_URL
    └── src/
        ├── api/
        │   ├── endpoints.js # "API_NAME": "/path" map — use only this
        │   └── client.js    # axios + auth header
        ├── services/        # auth.service, product.service, ...
        ├── constants/       # API_BASE_URL
        ├── components/      # layout, home, product, common
        ├── hooks/
        ├── context/
        ├── pages/
        └── utils/
```

### Frontend API rule

Never hardcode URLs in components. Always:

```js
import { API } from '../api/endpoints';
import apiClient from '../api/client';
// or use services/*
import { productService } from '../services/product.service';
```

Base URL lives in `frontend/.env` → `VITE_API_BASE_URL=http://localhost:5000/api`.

### Backend CORS

`backend/.env` → `FRONTEND_URL=http://localhost:5173` — only that origin is allowed.

## Setup

### 1. MongoDB Atlas

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a DB user + Network Access (allow your IP or `0.0.0.0/0` for dev).
3. Copy connection string into `backend/.env` as `MONGODB_URI`.

### 2. Install & configure

```bash
cd MarineCraft
npm run install:all

# edit backend/.env — set MONGODB_URI, JWT_SECRET, FRONTEND_URL
# edit frontend/.env — set VITE_API_BASE_URL if needed
```

### 3. Seed demo data

```bash
npm run seed
```

Creates admin, customer, dealer, categories, products, banners, CMS pages.

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@marinekart.com | Admin@12345 |
| Customer | customer@marinekart.com | Customer@123 |
| Dealer (15% off) | dealer@marinekart.com | Dealer@123 |

### 4. Run

```bash
# terminal 1
npm run dev:backend

# terminal 2
npm run dev:frontend
```

- Storefront: http://localhost:5173  
- API health: http://localhost:5000/api/health  
- Admin: http://localhost:5173/admin (login as admin)

## Feature map (built vs next)

### Built now

- Homepage (hero, feature bar, Best Sellers / Featured / New Arrivals, category grid)
- Header / footer matching MarineKart layout
- Multi-level categories + product catalogue + product detail
- Search, cart, wishlist, checkout, order history
- Register / Login / My Account
- **Login to View Price** + customer-specific `priceMultiplier`
- CMS pages: About, FAQ, Privacy, Delivery, Contact form
- Admin dashboard overview + product/category/customer lists
- API request timing logs in `backend/logs/`

### Ready to extend next (APIs/models already prepared)

- Product image upload / gallery UI
- Coupon apply UI, promo banner CMS UI
- Blog listing layouts (sidebar / full width)
- Payment gateway integration (UPI/card)
- Full admin CRUD forms (add/edit product UI)
- Low-stock email alerts & richer reports

## Key business rule: Login to View Price

Backend `Product.toPublicJSON(user)`:

- No user → `price: null`, `priceVisible: false`
- Logged-in → list/sale price × `user.priceMultiplier`

Frontend product cards show **Login to View Price** until authenticated.
