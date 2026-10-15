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

## Availability and production configuration

Vercel needs `STORE_API_BASE` set to the deployed ERP's public HTTPS origin and a valid `STORE_CHANNEL_KEY` for the Online channel. A localhost address or the placeholders in `.env.vercel` cannot reach the ERP from Vercel. Set `SITE_URL` to the storefront's public origin and `MEDIA_BASE_URL` to the public image bucket origin. These variables must be configured on the production deployment; local environment files do not establish the deployed settings.

Backend reads have a 10-second deadline, including response-body loading. Writes have a 30-second deadline and are never automatically retried. The homepage keeps its navigation and category links available when catalogue requests fail and offers a full-page retry; unavailable category counts are omitted rather than shown as zero. Other pages use the existing error boundary, and API callers receive a structured timeout error. Timeout logs include only the method and path, without credentials or query strings.

Run `npm test` for backend timeout and response regression checks. When investigating a live loading problem, check Vercel function logs and the ERP's health and catalogue endpoints as well as the homepage: a streamed HTTP 200 alone does not prove the page finished rendering.

## ERP collections

Saved ERP collections appear on `/collections`, in the homepage’s curated collections section, and through the Collections navigation link. Each has a stable `/c/collection-<uuid>` page showing its cover, description and matching products. Renaming a collection keeps its link working. Collection metadata and product pages read live ERP data rather than a build-time list; refreshing after an ERP save reflects changes without redeploying the storefront.

Manual selections, their ordering, automatic conditions and exclusions all apply. Multiple selected variants of one design appear as one storefront product. Only active, published products are shown; adding drafts to a collection does not publish them. Counts, fallback images and filters use this same public selection. The storefront’s server-only Online channel key determines which business it reads.

Deploy the updated backend before the storefront. The database must already have migrations through `0053` (collection covers and conditions); this connection needs no additional migration.
