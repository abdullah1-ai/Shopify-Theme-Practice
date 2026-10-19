if (!customElements.get('featured-custom-products')) {
    class FeaturedCustomProducts extends HTMLElement {
        constructor() {
            super();
        }

        connectedCallback() {
            console.log("featured custom products connected");
            this.controller = new AbortController();

            this.addEventListener('click', this.handleClick.bind(this), {
                signal: this.controller.signal
            });

        
        }

        handleClick(event) {
            const quickViewBtn = event.target.closest('.quick-view-btn');
            const addToCartBtn = event.target.closest('.add-to-cart-btn');

            if (quickViewBtn) {
                const handle = quickViewBtn.dataset.handle;
                const variantId = quickViewBtn.dataset.variantId;
                if (!handle) return;

                this.handleQuickView(handle, variantId);

            } else if (addToCartBtn) {
                const variantId = addToCartBtn.dataset.variantId;
                this.handleAddToCart(variantId);
            }
        }

        handleQuickView(handle, variantId) {
            const container = this.querySelector('#quick-view-container') || document.body;
            const url = `${window.Shopify.routes.root}products/${handle}?sections=quick-view-custom`;

            fetch(url)
                .then((res) => {
                    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                    return res.json();
                })
                .then((data) => {
                    // 1. Fetched HTML container me insert karna
                    container.innerHTML = data['quick-view-custom'];

                    // 2. Popup element dhoondna
                    const popup = container.querySelector('.quick-view-custom');
                    if (!popup) return;

                    // 3. Class add kar ke popup SHOW karna
 popup.classList.add('is-active');
                    // 4. Quick view form submission
                    const form = popup.querySelector('.quick-view-custom__form');
                    if (form) {
                        form.addEventListener('submit', (event) => {
                            event.preventDefault();
                            const quantityInput = form.querySelector('[name="quantity"]');
                            const quantity = quantityInput ? parseInt(quantityInput.value, 10) || 1 : 1;

                            console.log('value of variant id from custom quick view', variantId, 'quantity:', quantity);
                            popup.classList.remove('is-active');
                            container.innerHTML = "";
                            this.handleAddToCart(variantId, quantity);
                        });
                    }

                    // 5. Plus / Minus & Close button handle karna
                    popup.addEventListener('click', (e) => {
                        const plusBtn = e.target.closest('.quantity_btn[name="plus"]');
                        const minusBtn = e.target.closest('.quantity_btn[name="minus"]');
                        const quantityInput = popup.querySelector('.quantity_input');

                        if (quantityInput) {
                            let currentVal = parseInt(quantityInput.value, 10) || 1;
                            if (plusBtn) {
                                quantityInput.value = currentVal + 1;
                            } else if (minusBtn && currentVal > 1) {
                                quantityInput.value = currentVal - 1;
                            }
                        }

                        if (e.target.closest('[data-quick-view-close]')) {
                            popup.classList.toggle('is-active');
                            document.body.classList.toggle('overflow-hidden');
                            container.innerHTML = "";
                        }
                    });
                })
                .catch((error) => {
                    console.error('Error fetching quick view:', error);
                });
        }

        handleAddToCart(variantId, quantity = 1) {
            console.log('attribute value', variantId, 'quantity', quantity);
            let formData = {
                'items': [{
                    'id': variantId,
                    'quantity': quantity
                }],
                sections:'cart-icon-bubble,cart-drawer'
            }; 

            fetch(window.Shopify.routes.root + 'cart/add.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Item successfully added:', data);

                    const parser = new DOMParser();

                    // 1. Update Cart Icon Bubble in Header
                    if (data.sections && data.sections['cart-icon-bubble']) {
                        const bubbleCartIcon = document.querySelector('#cart-icon-bubble');
                        if (bubbleCartIcon) {
                            const iconDoc = parser.parseFromString(data.sections['cart-icon-bubble'], 'text/html');
                            const newBubble = iconDoc.querySelector('#shopify-section-cart-icon-bubble') || iconDoc.querySelector('.shopify-section') || iconDoc.body;
                            if (newBubble) bubbleCartIcon.innerHTML = newBubble.innerHTML;
                        }
                    }

                    // 2. Update Cart Drawer Section & Open
                    if (data.sections && data.sections['cart-drawer']) {
                        const cartDrawer = document.querySelector('cart-drawer');
                        if (cartDrawer) {
                            const drawerDoc = parser.parseFromString(data.sections['cart-drawer'], 'text/html');
                            const newDrawerInner = drawerDoc.querySelector('#CartDrawer');
                            const currentCartDrawerInner = cartDrawer.querySelector('#CartDrawer');

                            if (currentCartDrawerInner && newDrawerInner) {
                                currentCartDrawerInner.innerHTML = newDrawerInner.innerHTML;
                            }

                            cartDrawer.classList.remove('is-empty');

                            const overlay = cartDrawer.querySelector('#CartDrawer-Overlay');
                            if (overlay) {
                                overlay.addEventListener('click', cartDrawer.close.bind(cartDrawer));
                            }

                            // Open the drawer
                            if (typeof cartDrawer.open === 'function') {
                                cartDrawer.open();
                            } else {
                                cartDrawer.classList.add('animate', 'active');
                                document.body.classList.add('overflow-hidden');
                            }
                        }
                    }
                })

                .catch((error) => {
                    console.error('Error:', error);
                });
        }

        disconnectedCallback() {
            console.log("featured custom products disconnected");
            if (this.controller) {
                this.controller.abort();
            }
        }
    }

    customElements.define('featured-custom-products', FeaturedCustomProducts);
}
