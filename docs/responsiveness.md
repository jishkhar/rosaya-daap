# Storefront responsiveness audit — 27 October 2026

Checked the running storefront in Chromium with desktop and Pixel 7 browser contexts. Widths: 320, 360, 390, 640, 768, 820, 1024, 1280 and 1440 CSS pixels. Short-screen overlays were also checked at 320 × 568.

## Findings fixed

| Area | Observed problem | Change |
| --- | --- | --- |
| Populated bag | Product content forced a roughly 468px-wide layout on narrow phones. | Allow grid tracks and product text to shrink, use smaller mobile images, and wrap quantity/price controls. |
| Heritage header | Small-phone actions crowded the logo; 320px produced horizontal overflow. | Compact spacing and branding on small screens, with truncation available for longer store names. |
| Delivery picker | Popup started outside the screen (for example, x = −72px at 320px). | Anchor the mobile popup across the header with 16px side margins. |
| Sticky content | Checkout used a 24px top offset; product, listing and cart panels assumed a fixed header height. | Derive offsets from the active theme's header height, including Rosaya's 145px header. Size the filter scroll area to the remaining viewport. |

## Coverage

- Live catalogue: homepage, shop, collections, search and a populated product detail page.
- Authentication and information pages: login, registration, password recovery, about, shipping help and privacy.
- Synthetic customer data: populated bag, account overview, membership/profile, address editor, expanded order history and cancellation dialog.
- Menu, search, filter sheet, cart drawer and delivery popup: screen bounds, accessible controls, Escape dismissal and scroll-lock release where applicable.
- Authenticated checkout, saved address, offers, loyalty input and payment dialog: checked in an isolated copy of the app with synthetic backend responses. Real backend writes were blocked. Both Heritage and Rosaya checkout layouts stayed within the tested widths; payment fit 320 × 568.
- Alternate Rosaya theme: checked in the isolated app without changing the shop's published theme. Homepage, listing, login, bag, product and checkout were inspected.

The browser regression suite is `e2e/responsive-layout.spec.ts`, together with `e2e/responsive-overlays.spec.ts`. It uses browser fixtures for customer and basket data and does not register shoppers or place orders. Run against a configured, running storefront/backend:

```bash
E2E_BASE_URL=http://rosaya.localhost:3001 \
PLAYWRIGHT_CHROMIUM=/usr/bin/chromium \
npx playwright test e2e/responsive-layout.spec.ts e2e/responsive-overlays.spec.ts
```

The existing real-stack checkout test also now checks summary bounds at 320, 390, 768, 1024 and 1440px. That purchase-flow test was not executed during this audit; checkout layout was inspected with the isolated fixture instead.

Validation passed: 24 responsive browser tests, 42 unit tests, TypeScript checking, ESLint on changed files and Prettier. Coverage is Chromium browser emulation, not physical-device or Safari/WebKit validation.
