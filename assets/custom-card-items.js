class FeaturedProducts extends HTMLElement {
    constructor() {
        super();
        
    }

    connectedCallback(){
        console.log("featured-products connected")
    }

    disconnectedCallback(){
        console.log("featured-products disconnected")
    }
}

customElements.define('featured-products',FeaturedProducts);