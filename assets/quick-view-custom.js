class QuickViewCustom extends HTMLElement {
  constructor() {
    super();


  }

  connectedCallback() {
    console.log('connected quick view');
  }

  disconnectedCallback() {
    console.log('disconnected quick view');
  }
}

customElements.define('quick-view-custom', QuickViewCustom);