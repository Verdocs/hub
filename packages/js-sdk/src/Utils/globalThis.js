// This file provides a polyfill for managing globals in both NodeJS and browser environments. This is
// an anti-pattern we'd hoped to avoid, but we have several projects dependending on one common library
// (this js-sdk) and we want that library to provide a common endpoint to all callers (so authentication
// tokens only need to be tracked in one place). The trouble is, one of those libraries is based on
// StencilJS and is compiling its modules into Web Components. Because of how module resolution works,
// when those Components load js-sdk they get a separate instance. Without messy options like having to
// pass raw data from the caller to each Component, or pass around references to a common Endpoint, they
// have no way to access authenticated sessions unless we make the Endpoint a true global.
//
// @credit https://github.com/medikoo/es5-ext/blob/master/global.js
// @credit https://mathiasbynens.be/notes/globalthis

var naiveFallback = function () {
  if (typeof self === 'object' && self) return self;
  if (typeof window === 'object' && window) return window;
  throw new Error('Unable to resolve global `this`');
};

module.exports = (function () {
  if (this) return this;

  // Unexpected strict mode (may happen if e.g. bundled into ESM module)

  // Fallback to standard globalThis if available
  if (typeof globalThis === 'object' && globalThis) return globalThis;

  // Thanks @mathiasbynens -> https://mathiasbynens.be/notes/globalthis
  // In all ES5+ engines global object inherits from Object.prototype
  // (if you approached one that doesn't please report)
  try {
    Object.defineProperty(Object.prototype, '__global__', {
      get: function () {
        return this;
      },
      configurable: true,
    });
  } catch (error) {
    // Unfortunate case of updates to Object.prototype being restricted
    // via preventExtensions, seal or freeze
    return naiveFallback();
  }
  try {
    // Safari case (window.__global__ works, but __global__ does not)
    if (!__global__) return naiveFallback();
    return __global__;
  } finally {
    delete Object.prototype.__global__;
  }
})();
