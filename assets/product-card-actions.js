/**
 * product-card-actions.js
 *
 * Custom element: <product-item>
 * Responsibilities:
 *   1. Hover image swap (primary ↔ secondary) — JS fallback for non-CSS-hover devices
 *   2. Cleanup via AbortController (disconnectedCallback)
 *
 * Pattern: class extends HTMLElement + customElements.define (matches theme convention)
 */

class ProductItem extends HTMLElement {
  constructor() {
    super();
    /** @type {AbortController} — used to remove all listeners on disconnect */
    this._abortController = new AbortController();
  }

  connectedCallback() {
    const signal = this._abortController.signal;

    const primaryImg = this.querySelector('.product-item__primary-image');
    const secondaryImg = this.querySelector('.product-item__secondary-image');

    // Only register JS swap when a secondary image exists
    // CSS already handles hover via @media (hover: hover)
    // JS handles programmatic focus / keyboard access
    if (!primaryImg || !secondaryImg) return;

    this.addEventListener(
      'mouseenter',
      () => {
        primaryImg.style.opacity = '0';
        secondaryImg.style.opacity = '1';
      },
      { signal }
    );

    this.addEventListener(
      'mouseleave',
      () => {
        primaryImg.style.opacity = '';
        secondaryImg.style.opacity = '';
      },
      { signal }
    );

    // Keyboard / focus accessibility — show secondary on focus-within
    this.addEventListener(
      'focusin',
      () => {
        primaryImg.style.opacity = '0';
        secondaryImg.style.opacity = '1';
      },
      { signal }
    );

    this.addEventListener(
      'focusout',
      () => {
        primaryImg.style.opacity = '';
        secondaryImg.style.opacity = '';
      },
      { signal }
    );
  }

  disconnectedCallback() {
    // Single call removes all listeners registered with this signal
    this._abortController.abort();
  }
}

if (!customElements.get('product-item')) {
  customElements.define('product-item', ProductItem);
}
