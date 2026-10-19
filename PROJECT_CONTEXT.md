# PROJECT CONTEXT

## 1. Theme Info

- **Name:** Generated Data Theme
- **Version:** 1.0.0
- **Author:** Shopify
- Source: `config/settings_schema.json` (theme_info block, lines 3-8)

---

## 2. Folder Structure

```
shopify-theme/
├── assets/        (90 files) — JS, CSS, images
├── config/        (2 files)  — settings_schema.json, settings_data.json
├── layout/        — theme.liquid, password.liquid
├── locales/       (52 files) — en.default.json + 25 languages
├── sections/      (64 files) — main-* sections, custom practice sections
├── snippets/      (61 files) — icon-*, card-*, product-*, price, etc.
└── templates/     (15 files) — JSON templates + gift_card.liquid
```

---

## 3. Templates → Main Sections

| Template          | Main Section(s)                                          |
| ----------------- | -------------------------------------------------------- |
| `product.json`    | `main-product`, `related-products`                       |
| `collection.json` | `main-collection-banner`, `main-collection-product-grid` |
| `cart.json`       | `main-cart-items`, `main-cart-footer`                    |
| `index.json`      | `image-banner` (+ others via section blocks)             |

Source: `templates/*.json`

---

## 4. Key Sections & Snippets

**Sections:**
| File | Purpose |
|---|---|
| `sections/main-product.liquid` | Product detail page — media, variants, buy buttons |
| `sections/main-cart-items.liquid` | Cart page line items, quantity, remove |
| `sections/main-cart-footer.liquid` | Cart totals, checkout button |
| `sections/main-collection-product-grid.liquid` | Collection grid with filtering/sorting |
| `sections/main-collection-banner.liquid` | Collection header/banner |
| `sections/header.liquid` | Site header, nav, search, cart icon |
| `sections/footer.liquid` | Footer links, social icons, newsletter |
| `sections/featured-product.liquid` | Featured product section for homepage |

**Snippets:**
| File | Purpose |
|---|---|
| `snippets/card-product.liquid` | Product card used in grids and collections |
| `snippets/price.liquid` | Price display with compare-at logic |
| `snippets/cart-drawer.liquid` | Slide-out cart drawer markup |
| `snippets/buy-buttons.liquid` | ATC + dynamic checkout buttons |
| `snippets/product-media-gallery.liquid` | Product image gallery |
| `snippets/facets.liquid` | Filter sidebar/drawer for collections |

---

## 5. JS Pattern

- **Custom Elements** extensively used — all interactive components are `customElements.define(...)`.
- Base classes defined in `assets/global.js`:
  - `HTMLElement` — direct base for most (QuantityInput, MenuDrawer, ModalDialog, DeferredMedia, SliderComponent, VariantSelects)
  - `MenuDrawer` → `HeaderDrawer`
  - `SliderComponent` → `SlideshowComponent`
  - `VariantSelects` → `VariantRadios`
  - `DetailsDisclosure` → `HeaderMenu`, `ShareButton`
  - `SearchForm` → `PredictiveSearch`, `MainSearch`
  - `ModalDialog` → `ProductModal`, `QuickAddModal`
  - `CartItems` → `CartDrawerItems`
- Global state via inline `<script>` in `layout/theme.liquid` (lines 271-298): `window.routes`, `window.cartStrings`, `window.variantStrings`.
- JS loaded with `defer` attribute; `assets/pubsub.js` provides a pub/sub event bus.

Source: `assets/global.js`, `assets/cart.js`, `assets/cart-drawer.js`, `layout/theme.liquid`

---

## 6. CSS Approach

- **Primary:** `assets/base.css` loaded globally via `stylesheet_tag` in `layout/theme.liquid` (line 221).
- **Component CSS:** Per-component files (`component-price.css`, `component-card.css`, etc.) loaded by individual sections/snippets.
- **Custom addition:** `assets/abdullah-global.css` loaded in `layout/theme.liquid` (line 246).
- **No `{% stylesheet %}` tag** used — all CSS is external asset files.
- **CSS Variables / Design Tokens** in `assets/base.css`:
  - `--color-foreground`, `--color-background`, `--gradient-background`
  - `--color-base-text`, `--color-base-background-1/2`, `--color-base-accent-1/2`
  - `--color-link`, `--alpha-link`
  - Rating display: `--rating`, `--rating-max`, `--rating-decimal`

---

## 7. Metafields in Use

| Namespace.Key              | File                                                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `reviews.rating`           | `snippets/card-product.liquid`, `sections/main-product.liquid`, `sections/featured-product.liquid`          |
| `reviews.rating_count`     | `snippets/card-product.liquid`, `sections/main-product.liquid`, `sections/featured-product.liquid`          |
| `custom.material`          | `sections/main-product.liquid`, `sections/product-met-Info.liquid`, `sections/variant-info-practice.liquid` |
| `custom.care_instruction`  | `sections/product-met-Info.liquid`                                                                          |
| `custom.care_instructions` | `sections/variant-info-practice.liquid`                                                                     |
| `custom.warranty`          | `sections/product-met-Info.liquid`, `sections/variant-info-practice.liquid`                                 |

---

## 8. Naming Conventions

- **Section/Snippet files:** `kebab-case` (e.g., `main-product.liquid`, `card-product.liquid`)
- **Icon snippets:** `icon-{name}.liquid` pattern
- **CSS files:** `component-{name}.css` for UI, `section-{name}.css` for section-specific
- **JS custom element tags:** `kebab-case` matching HTML tag (e.g., `cart-drawer`, `product-form`)
- **JS class names:** `PascalCase` matching element (e.g., `CartDrawer`, `ProductForm`)
- **CSS classes:** BEM-style (`card__heading`, `card__media`, `product-form__buttons`)

---

## 9. Notes

- **Practice/custom sections exist** alongside production code: `abdullah-product-grid.liquid`, `cart-api-practice-custom.liquid`, `featured-product-custom-section.liquid`, `product-met-Info.liquid`, `variant-info-practice.liquid` — appear to be learning files.
- **`abdullah-global.css`** is loaded _after_ `</head>` closing tag (line 246 in `theme.liquid`) — likely a bug from custom addition.
- **Metafield key inconsistency:** `custom.care_instruction` (singular) in `product-met-Info.liquid` vs `custom.care_instructions` (plural) in `variant-info-practice.liquid`.
- **Duplicate `cart-drawer`:** `sections/cart-drawer.liquid` is a 29-byte stub; real implementation is `snippets/cart-drawer.liquid` (22KB) rendered by `theme.liquid`.
- **No `blocks/` directory** — block definitions are inline within section `{% schema %}` tags.
