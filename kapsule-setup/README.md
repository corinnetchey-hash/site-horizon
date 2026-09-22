# Kapsule on Horizon — setup

This theme is Shopify's **Horizon** (v4.2.0) with the Kapsule design built on top of it as native
Shopify sections, snippets and templates. Horizon's own sections are still in the theme and can be
added from the theme editor at any time.

Shopify ignores this `kapsule-setup/` folder when it loads the theme. It only holds the store
setup notes and the product-data helper.

## What was added

| Area | Files |
| --- | --- |
| Design tokens, components, responsive rules | `assets/kapsule.css` |
| Cart drawer, quick add, search, diagnostic quiz, product page, booking | `assets/kapsule.js` |
| Logos | `assets/kapsule-wordmark.png`, `assets/kapsule-wordmark-footer.png`, `assets/kapsule-monogram.png` |
| Bilingual copy (FR + EN, hand-written) | `kapsule` namespace in `locales/fr.json` and `locales/en.default.json` |
| Header / footer | `sections/kapsule-header.liquid`, `sections/kapsule-footer.liquid` (wired in the header/footer groups) |
| Homepage | `kapsule-hero`, `kapsule-band`, `kapsule-concerns`, `kapsule-products`, `kapsule-houses`, `kapsule-feature`, `kapsule-ugc`, `kapsule-newsletter` |
| Boutique | `kapsule-collection` (sidebar filters, sort pills, 2-column mobile grid) |
| Product page | `kapsule-product` (gallery, variant pills, sticky add-to-cart bar), `kapsule-product-details` (La maison, actives, bundle, recommendations) |
| Institut / Pop-up / Notre vision | `kapsule-banner`, `kapsule-quote`, `kapsule-cards`, `kapsule-treatments`, `kapsule-tiles`, `kapsule-edits`, `kapsule-visit`, `kapsule-vision-intro`, `kapsule-editorial`, `kapsule-b2b` |
| Templates | `index`, `collection`, `product`, `page.institut`, `page.popup`, `page.vision` |
| Theme settings | **Theme settings › Kapsule**: free-shipping threshold (49 €), diagnostic on/off, diagnostic product pool |

### How copy works

All text settings in the Kapsule sections can be left blank. When a field is blank, the section
shows the authored copy from `locales/fr.json` or `locales/en.default.json`, picked by the
storefront language. Each section's **Default copy key** setting says which copy to use (for
example `home.hero` → `kapsule.home.hero.*`).

- Type into a field in the theme editor to override the copy for that section.
- Use Translate & Adapt for the other language, as usual.
- To change the default wording everywhere, go to **Online Store › Themes › … › Edit default
  theme content** and search for `kapsule`.

## Store setup checklist

1. **Languages**: under **Settings › Languages**, publish French and English. The FR / EN switch in
   the header appears once both languages are published.
2. **Product data**: see the next section. Vendor, type and `besoin-*` tags drive every filter.
3. **Search & Discovery app › Filters**: add **Product type**, **Vendor**, **Tag** and **Price**.
   - Product type powers *Catégories*.
   - Vendor powers *Marques*.
   - Tags starting with `besoin-` power *Besoins*. Other tags are hidden.
   - Price powers *Prix*. The price bands (30 € / 55 €) are set in the Boutique section.
4. **Pages**: create these pages and assign each one its template:
   - `institut` → `page.institut`
   - `pop-up` → `page.popup`
   - `notre-vision` → `page.vision`
   - `contact`, if it doesn't already exist → `page.contact`
5. **Navigation** (optional): if `main-menu` has no links, the header falls back to Accueil ·
   Boutique · Institut · Pop-up · Notre vision.
   - If you build the menu yourself, keep the same five entries.
   - Footer columns fall back to the Services / Informations / Suivez-nous links from the design.
     Pick a menu on a column to override its links.
6. **Bundle discount**: *Complétez votre routine* shows −10 % on the product plus up to two
   products from the same house.
   - Checkout only applies this after you create an automatic discount in **Discounts**, for
     example "Buy 3 from the same vendor, get 10 %" using per-house collections.
   - Or set the displayed discount to 0 in the *Kapsule product details* section.
7. **Product metafields**:
   - *Les actifs* reads `custom.ingredients`, which already exists in the export.
   - *Texture & application* reads `custom.texture`. Add this metafield definition to author it per
     product.
   - Both panels show neutral default copy when their metafield is empty.

## Product data (Vendor / Type / concerns)

In the current export, every product's Vendor is "Kapsule", which means nothing to shoppers. The
real house is only in the title, so the product data needs fixing.

`product-mapping.csv` lists the 33 active products shown in the design. For each one it gives:

- the house (Vendor)
- the Boutique category (Type)
- the skin concern tags
- clean French and English names

Build the import file from a fresh export:

```sh
python3 kapsule-setup/prepare_products.py products_export.csv > products_import.csv
# optional: also drop the " - Urang" style suffix from titles (handles/URLs are unchanged)
python3 kapsule-setup/prepare_products.py products_export.csv --clean-titles > products_import.csv
```

Then import it under **Products › Import** with *Overwrite products with matching handles* ticked.

The English product names in the mapping file are for Translate & Adapt. Shopify's product CSV
does not carry translations.

## Open items (from the design handoff)

- **House logos**: the *Maisons* row lists vendor names. Add a *House* block per brand with its logo
  once the client supplies them. The row keeps the same single-line layout.
- **Reviews**: removed on the client's instruction. Don't add placeholder social proof.
- **Photography**: the Instagram grid and the photos on Institut, Pop-up and Notre vision are
  tinted placeholders. Each tile has an image picker.
