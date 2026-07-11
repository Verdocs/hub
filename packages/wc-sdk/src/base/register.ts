/**
 * Define a custom element, safely. No-ops outside a browser (SSR frameworks
 * may import our modules on the server; the components themselves are
 * client-only) and warns-then-skips when the tag is already defined, because
 * customElements.define throws on redefinition and duplicate bundles are a
 * real hazard for self-registering libraries.
 */
export const register = (tag: string, ctor: CustomElementConstructor) => {
  if (typeof window === 'undefined' || typeof customElements === 'undefined') {
    return;
  }

  if (customElements.get(tag)) {
    console.warn(`[@verdocs/wc-sdk] <${tag}> is already defined, skipping registration. Check for duplicate bundles.`);
    return;
  }

  customElements.define(tag, ctor);
};
