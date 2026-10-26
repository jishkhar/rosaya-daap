# Rosaya

The Rosaya layout follows https://rosaya.in/: centered logo on a dark header, full-width slideshow, circular categories, occasion cards, tan craft tiles, service promises, promotion banner, collection cards, marquee and dark footer. Responsive CSS and section markup are independent of where the content is stored.

Like Heritage, the theme ships neutral text and empty identity fields. A business's name, logo and email fill empty identity fields. Slideshow slides load in-stock products from the chosen collection, or newest products when none is chosen. A custom banner uploaded through the editor overrides that product photo.

Category, occasion, craft and collection-card sections default to **Live catalogue (automatic)**: categories, occasion values, craft values and custom Collections respectively. Adding, renaming or removing catalogue entries changes the next rendered page. The editable maximum tile count controls how many are shown. Choose **Selected collections** to curate specific collections and their order.

Tile names, cover pictures and destinations always come from the live ERP catalogue. Old saved image/title/link overrides are deliberately ignored, so they cannot freeze the reference photos in place. Manage collection covers in Collections and product images in Products; section styling remains Rosaya's. Missing collections are skipped, and missing images use the shared placeholder. Rosaya requests fresh catalogue/cover data; Heritage's existing cache settings are retained.

The header follows **Collections → Show in header**, including header order and dropdown selections, just like Heritage. The theme editor controls the menu's maximum collection count and search visibility, rather than storing a separate fixed menu. Footer columns can show live store collections; explicit non-collection links remain editable.

No shop-specific photography or branding is bundled with the reusable theme. `public/payment-icons/` contains reusable payment UI icons; `public/theme-previews/rosaya.jpg` is the Discover thumbnail.

## Rosaya reference content and migration

The backend's `db/seed/rosaya_storefront.json` contains Rosaya's reference content; `db/seed/rosaya_assets.json` records the fixed original public asset URLs. These are tenant seed data, separate from the theme defaults.

Before deploying this change to an environment with the original Rosaya theme installed, run from `backend/` with that environment's database and R2 configuration:

```bash
PYTHONPATH=. .venv/bin/python -m db.seed.rosaya_storefront --tenant-code rosaya
```

The command backs up the old row to a private file in `/tmp`, uploads the reference media into that tenant's R2 namespace, replaces legacy bundled image paths in draft and published snapshots separately, and adds collection selections for old tiles. It retains existing section copy, ordering and active-theme state. Tile metadata is now always resolved from the catalogue rather than stored artwork overrides. Missing collection selections become named, empty ERP collections with reference covers; it never invents product membership or overwrites existing collection covers. Fill these selections using the portal's Collections editor.

A fresh seed installs Rosaya as a draft. It does not publish or switch the shop. Re-running the migration leaves already converted settings unchanged. Legacy reference media can be downloaded from the fixed manifest when not present locally; regular storefront rendering never downloads seed artwork from its original source.

For other businesses, install Rosaya normally from **Channels → Online Store → Discover themes**, choose collections, upload any custom banners, save to preview, then publish. Newsletter signup uses the configured signup URL or the existing explicit email-request fallback; the ERP has no mailing-list subscription endpoint.
