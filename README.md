# Rosaya Storefront

Customer-facing Online-channel storefront (Next.js 16, React 19, Tailwind 4). Independent of `../frontend` (staff portal). All data comes from the ERP backend's `/api/v1/store/*` API; the browser only talks to this app's `/api/*` routes, which add the channel key (server-side only) and keep the customer session in an httpOnly cookie.

## Run it (local, against a local Postgres)

```bash
# 1. database + backend (from ../backend)
docker compose -f ../docker-compose.dev-db.yml up -d
export DATABASE_URL=postgresql://postgres:postgres@localhost:5434/rosaya_dev   # createdb rosaya_dev first
uv run alembic upgrade head
uv run python -m scripts.seed_rosaya --write-env ../storefront/.env.local        # tenant + login + 102 products + coupons + channel key
STORE_MOCK_PAYMENTS=1 uv run uvicorn main:app --port 8000                        # mock gateway: development only

# 2. storefront
npm install
npm run dev            # http://localhost:3001   (STORE_API_BASE in .env.local must point at the backend)
npm run test:e2e       # Playwright, desktop + mobile; PLAYWRIGHT_CHROMIUM=/usr/bin/chromium to use a system browser
```

Seeded login (ERP staff portal): workspace `rosaya`, `rosaya@gmail.com` / `Rosaya@12345` — change it. Coupons: `ROSAYA10`, `FESTIVE500`, `FREESHIP`.

## What is real
Catalogue, search, filters, facets, stock, serviceability, server-priced basket, coupons (`discounts` table), checkout → ERP order (stock reserved, GST, accounting), COD, online payment (Razorpay hosted link + webhook when the tenant has credentials; a mock page in development), customer accounts (email + password, reset by email, addresses, order history, reorder), sitemap/robots/JSON-LD.

## Known limits
- Shipping is free: the ERP order model has no delivery-fee line that the books/GST invoice understand.
- Password-reset emails need `RESEND_API_KEY` + `EMAIL_FROM`; otherwise the link is written to the backend log.
- Razorpay: set the tenant's credentials with `PUT /api/v1/tenant/payment-providers/razorpay`; the return URL is `STOREFRONT_URL` on the backend.

Product detail pages include verified-order reviews with a five-star rating and written comment. Buyers can review immediately after placing an order; reviews also appear in ERP Feedback. See [Product reviews](../docs/PRODUCT_REVIEWS.md).
