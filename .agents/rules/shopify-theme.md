---
trigger: always_on
---

# Shopify theme rules (this project)

## Investigate first

- Identify the page type (product/cart/collection/etc.) and inspect the relevant template (templates/\*.json) and the section/snippet it references BEFORE creating anything new.
- Prefer editing an existing section or reusing an existing snippet. Create a new section only if the requirement and theme architecture justify it.
- Sections are for merchant-configurable blocks with schema; snippets are for reusable render logic.
- Files named abdullah-_, _-practice*, *-custom\* are learning files. Do not copy their patterns.

## Liquid

- Use `!= blank` for existence checks (e.g. {% if block.settings.icon_image != blank %}).
- Check each metafield independently; never hide several fields behind one condition.
- Render metafields by type. Never output empty headings or empty wrappers.
- Use suitable filters (image_url + image_tag, t, escape, strip_html where needed). Avoid heavy logic in loops.
- Expose merchant options through schema settings with correct types, labels and defaults.

## JavaScript

- JS goes in a separate file in assets/, loaded with <script src="{{ 'file.js' | asset_url }}" defer>. No large inline JS.
- Follow the theme's pattern: custom elements (class extends HTMLElement + customElements.define).
- Use event delegation on the parent for child elements.
- Every addEventListener needs a cleanup path (disconnectedCallback / removeEventListener / AbortController).
- Put repeated logic in functions/methods.
- For URL changes: new URL(...), searchParams.set, history.pushState, and delete temporary params afterwards.
- When changing an image dynamically, update src and also update or remove srcset so the browser doesn't keep the old image.

## CSS

- Separate CSS file in assets/ per section/component, loaded with {{ 'file.css' | asset_url | stylesheet_tag }}.
- Scope every selector to the component's wrapper class. Liquid does NOT work inside assets/\*.css, so section-specific values go through inline CSS variables on the wrapper in the section file.
- Mobile-first media queries. Card layouts: grid-template-columns: repeat(auto-fill, minmax(Xpx, 1fr)).
- box-sizing: border-box; no arbitrary margin/padding; use the theme's existing CSS variables.

## Performance / SEO

- loading="lazy" for below-the-fold images, never for the LCP image. Always set width/height.
- Responsive images with srcset/sizes.
- Do not break canonical URL, title/meta or existing structured data.

## Quality gate (before saying "done")

1. Liquid implementation matches requirements
2. Acceptance test cases (give me a list, I will run them)
3. Responsive + regression (existing product/cart behavior)
4. shopify theme check clean for changed files; browser console has no errors
5. Git: review diff, stage only intended files, clean commit message
