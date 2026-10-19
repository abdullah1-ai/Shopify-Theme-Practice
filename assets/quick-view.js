/**
 * Quick View Modal Component for Shopify Horizon Theme
 * Features:
 * - Section Rendering API (?section_id=quick-view)
 * - In-memory Map() HTML caching
 * - Full variant matching with Array.prototype.find()
 * - URL and history state management with cleanup
 * - AbortController cleanup for zero memory leaks or duplicate submissions
 * - Direct Horizon Cart Drawer integration (/cart/add.js) with NO toast
 */

if (!customElements.get('quick-view-modal')) {
  class QuickViewModal extends HTMLElement {
    constructor() {
      super();
      this.htmlCache = new Map();
      this.abortController = null;
      this.activeProductHandle = null;

      this.modalOverlay = this.querySelector('[data-quick-view-close]');
      this.modalContent = this.querySelector('.quick-view-modal__content');
      this.modalBody = this.querySelector('#QuickViewModalContent');
    }

    connectedCallback() {
      // Event delegation for opening quick view from anywhere across the store
      document.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-quick-view-trigger]');
        if (trigger) {
          event.preventDefault();
          const handle = trigger.dataset.productHandle;
          if (handle) {
            this.open(handle);
          }
        }
      });

      // Browser back/forward navigation support
      window.addEventListener('popstate', () => {
        const url = new URL(window.location.href);
        if (!url.searchParams.has('quick_view') && this.classList.contains('is-open')) {
          this.close(false);
        }
      });
    }

    async open(handle) {
      if (!handle) return;
      this.activeProductHandle = handle;

      // Abort previous open session listeners if any
      if (this.abortController) {
        this.abortController.abort();
      }
      this.abortController = new AbortController();
      const { signal } = this.abortController;

      // Show modal & disable background scrolling
      this.classList.add('is-open');
      this.setAttribute('aria-hidden', 'false');
      document.body.classList.add('overflow-hidden');

      // Update URL search parameters
      const url = new URL(window.location.href);
      url.searchParams.set('quick_view', handle);
      history.pushState({ quick_view: handle }, '', url.toString());

      // Bind close buttons and overlay click
      this.querySelectorAll('[data-quick-view-close]').forEach((btn) => {
        btn.addEventListener('click', () => this.close(), { signal });
      });

      // Escape key to close
      window.addEventListener(
        'keydown',
        (evt) => {
          if (evt.key === 'Escape') {
            this.close();
          }
        },
        { signal }
      );

      // Check in-memory Map() cache
      if (this.htmlCache.has(handle)) {
        this.renderContent(this.htmlCache.get(handle), signal);
        return;
      }

      // Show loading spinner while fetching
      this.modalBody.innerHTML = `
        <div class="quick-view-modal__loading-state">
          <div class="quick-view-modal__spinner" aria-label="Loading product details"></div>
        </div>
      `;

      try {
        const sectionUrl = `/products/${encodeURIComponent(handle)}?section_id=quick-view`;
        const response = await fetch(sectionUrl);
        if (!response.ok) {
          throw new Error(`Failed to load Quick View for ${handle}: ${response.status}`);
        }

        const htmlText = await response.text();
        const parsed = new DOMParser().parseFromString(htmlText, 'text/html');
        const sectionEl = parsed.querySelector('.shopify-section') || parsed.querySelector('.quick-view');
        const content = sectionEl ? sectionEl.innerHTML : parsed.body.innerHTML;

        this.htmlCache.set(handle, content);
        this.renderContent(content, signal);
      } catch (error) {
        console.error('QuickViewModal fetch error:', error);
        this.modalBody.innerHTML = `
          <div class="quick-view" style="padding: 2rem; text-align: center;">
            <p>Could not load product details. Please try again or visit the product page directly.</p>
          </div>
        `;
      }
    }

    renderContent(html, signal) {
      this.modalBody.innerHTML = html;
      this.initProductLogic(signal);
    }

    initProductLogic(signal) {
      const variantsDataEl = this.querySelector('[data-product-variants]');
      const formattedPricesEl = this.querySelector('[data-product-formatted-prices]');

      let variants = [];
      let formattedPrices = {};

      if (variantsDataEl) {
        try {
          variants = JSON.parse(variantsDataEl.textContent);
        } catch (e) {
          console.error('Failed to parse variants JSON', e);
        }
      }

      if (formattedPricesEl) {
        try {
          formattedPrices = JSON.parse(formattedPricesEl.textContent);
        } catch (e) {
          console.error('Failed to parse formatted prices JSON', e);
        }
      }

      const form = this.querySelector('[data-quick-view-form]');
      const hiddenVariantIdInput = this.querySelector('[data-selected-variant-id]');
      const submitBtn = this.querySelector('[data-quick-view-submit]');
      const submitText = this.querySelector('[data-submit-text]');
      const regularPriceEl = this.querySelector('[data-regular-price]');
      const comparePriceEl = this.querySelector('[data-compare-price]');
      const detailsLink = this.querySelector('[data-view-details-link]');
      const optionFieldsets = this.querySelectorAll('.quick-view__option');

      // Variant Selector Change Handler
      const handleOptionChange = () => {
        const selectedOptionValues = Array.from(optionFieldsets).map((fieldset) => {
          const checkedInput = fieldset.querySelector('input:checked') || fieldset.querySelector('select');
          const value = checkedInput ? checkedInput.value : '';
          const valueDisplay = fieldset.querySelector('[data-option-value-display]');
          if (valueDisplay) valueDisplay.textContent = value;
          return value;
        });

        // Match variant using Array.prototype.find
        const matchedVariant = variants.find((variant) => {
          return variant.options.every((optValue, index) => optValue === selectedOptionValues[index]);
        });

        if (matchedVariant) {
          // 1. Update hidden variant input
          if (hiddenVariantIdInput) {
            hiddenVariantIdInput.value = matchedVariant.id;
          }

          // 2. Update Prices
          const priceInfo = formattedPrices[matchedVariant.id];
          if (priceInfo) {
            if (regularPriceEl) regularPriceEl.textContent = priceInfo.price;
            if (comparePriceEl) {
              if (priceInfo.compare_at_price) {
                comparePriceEl.textContent = priceInfo.compare_at_price;
                comparePriceEl.classList.remove('hidden');
              } else {
                comparePriceEl.classList.add('hidden');
              }
            }
          }

          // 3. Update Active Image
          const mediaId = matchedVariant.featured_media ? matchedVariant.featured_media.id : (matchedVariant.featured_image ? matchedVariant.featured_image.id : null);
          if (mediaId) {
            this.setActiveMedia(mediaId);
          }

          // 4. Update Button State
          if (matchedVariant.available) {
            if (submitBtn) submitBtn.disabled = false;
            if (submitText) submitText.textContent = window.variantStrings?.addToCart || 'Add to cart';
          } else {
            if (submitBtn) submitBtn.disabled = true;
            if (submitText) submitText.textContent = window.variantStrings?.soldOut || 'Sold out';
          }

          // 5. Update "View Full Details" link
          if (detailsLink) {
            const detailUrl = new URL(detailsLink.dataset.baseUrl || detailsLink.href, window.location.origin);
            detailUrl.searchParams.set('variant', matchedVariant.id);
            detailsLink.href = detailUrl.pathname + detailUrl.search;
          }

          // 6. Update URL query params
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set('variant', matchedVariant.id);
          history.replaceState({ quick_view: this.activeProductHandle, variant: matchedVariant.id }, '', currentUrl.toString());
        } else {
          // Unavailable combination
          if (submitBtn) submitBtn.disabled = true;
          if (submitText) submitText.textContent = window.variantStrings?.unavailable || 'Unavailable';
        }
      };

      // Attach variant change listener
      optionFieldsets.forEach((fieldset) => {
        fieldset.addEventListener('change', handleOptionChange, { signal });
      });

      // Thumbnail Click Handler
      this.querySelectorAll('[data-thumbnail-media-id]').forEach((thumbBtn) => {
        thumbBtn.addEventListener(
          'click',
          () => {
            const mediaId = thumbBtn.dataset.thumbnailMediaId;
            if (mediaId) this.setActiveMedia(mediaId);
          },
          { signal }
        );
      });

      // Quantity Plus/Minus Controls
      const quantityInput = this.querySelector('[data-quantity-input]');
      this.querySelectorAll('[data-quantity-action]').forEach((btn) => {
        btn.addEventListener(
          'click',
          () => {
            if (!quantityInput) return;
            let currentVal = parseInt(quantityInput.value, 10) || 1;
            const action = btn.dataset.quantityAction;
            if (action === 'increase') {
              quantityInput.value = currentVal + 1;
            } else if (action === 'decrease' && currentVal > 1) {
              quantityInput.value = currentVal - 1;
            }
          },
          { signal }
        );
      });

      // Form Submission (Add to Cart via AJAX)
      if (form) {
        form.addEventListener(
          'submit',
          async (evt) => {
            evt.preventDefault();
            await this.handleAddToCart(form, submitBtn);
          },
          { signal }
        );
      }
    }

    setActiveMedia(mediaId) {
      // Main media item switch
      const mediaItems = this.querySelectorAll('.quick-view__media-item');
      let targetMedia = this.querySelector(`.quick-view__media-item[data-media-id="${mediaId}"]`);

      if (targetMedia) {
        mediaItems.forEach((item) => item.classList.remove('is-active'));
        targetMedia.classList.add('is-active');
      }

      // Thumbnail active state switch
      const thumbnails = this.querySelectorAll('.quick-view__thumbnail');
      let targetThumb = this.querySelector(`.quick-view__thumbnail[data-thumbnail-media-id="${mediaId}"]`);

      if (targetThumb) {
        thumbnails.forEach((thumb) => thumb.classList.remove('is-active'));
        targetThumb.classList.add('is-active');
      }
    }

    async handleAddToCart(form, submitBtn) {
      const spinner = form.querySelector('[data-submit-spinner]');
      const submitText = form.querySelector('[data-submit-text]');

      if (submitBtn) submitBtn.setAttribute('aria-busy', 'true');
      if (spinner) spinner.classList.remove('hidden');
      if (submitText) submitText.classList.add('hidden');

      try {
        const cartDrawer = document.querySelector('cart-drawer');
        const sectionsToRender =
          cartDrawer && typeof cartDrawer.getSectionsToRender === 'function'
            ? cartDrawer.getSectionsToRender().map((s) => s.id)
            : ['cart-drawer', 'cart-icon-bubble'];

        const formData = new FormData(form);
        formData.append('sections', sectionsToRender.join(','));
        formData.append('sections_url', window.location.pathname);

        const response = await fetch(window.routes?.cart_add_url || '/cart/add.js', {
          method: 'POST',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: formData,
        });

        const parsedState = await response.json();

        if (!response.ok) {
          throw new Error(parsedState.description || parsedState.message || 'Cart add failed');
        }

        // 1. Close Quick View modal and clean up listeners & URL
        this.close();

        // 2. Open Horizon Cart Drawer with updated state (NO TOAST)
        if (cartDrawer) {
          if (typeof cartDrawer.renderContents === 'function') {
            cartDrawer.renderContents(parsedState);
          } else {
            // Safe fallback if renderContents signature is not standard
            if (parsedState.sections && parsedState.sections['cart-drawer']) {
              const drawerHtml = new DOMParser().parseFromString(parsedState.sections['cart-drawer'], 'text/html');
              const inner = document.querySelector('#CartDrawer');
              const newInner = drawerHtml.querySelector('#CartDrawer');
              if (inner && newInner) inner.innerHTML = newInner.innerHTML;
            }
            if (typeof cartDrawer.open === 'function') {
              cartDrawer.open();
            }
          }
        }
      } catch (err) {
        console.error('Quick View Add to Cart error:', err);
        alert(err.message || 'Error adding product to cart.');
      } finally {
        if (submitBtn) submitBtn.removeAttribute('aria-busy');
        if (spinner) spinner.classList.add('hidden');
        if (submitText) submitText.classList.remove('hidden');
      }
    }

    close(cleanupUrl = true) {
      this.classList.remove('is-open');
      this.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('overflow-hidden');

      // Abort all listeners attached for this modal session
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }

      // Clean up URL search parameters
      if (cleanupUrl) {
        const url = new URL(window.location.href);
        if (url.searchParams.has('quick_view') || url.searchParams.has('variant')) {
          url.searchParams.delete('quick_view');
          url.searchParams.delete('variant');
          const cleanPath = url.pathname + (url.search ? url.search : '') + url.hash;
          history.replaceState({}, '', cleanPath);
        }
      }

      this.activeProductHandle = null;
    }
  }

  customElements.define('quick-view-modal', QuickViewModal);
}
