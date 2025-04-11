/**
 * This file contains polyfills and workarounds for Hermes engine compatibility issues.
 * It should be imported before any other module in the app's entry point.
 */

// Store original Object.defineProperty
const originalDefineProperty = Object.defineProperty;

// Override Object.defineProperty to handle non-configurable properties more gracefully
Object.defineProperty = function customDefineProperty(obj: any, prop: string, descriptor: PropertyDescriptor): any {
  try {
    return originalDefineProperty(obj, prop, descriptor);
  } catch (error: any) {
    // If error is about non-configurable property, log it and continue
    if (error instanceof TypeError && error.message.includes('not configurable')) {
      console.warn(`[HermesPolyfill] Attempted to redefine non-configurable property: ${prop}`, error);
      // Return the object without modifying it rather than throwing
      return obj;
    }
    // For other errors, rethrow
    throw error;
  }
};

// Fix for Error.stack getter in Hermes
// This addresses the "Error.stack getter called with an invalid receiver" issue
if (Error.prototype && typeof Error.prototype.stack === 'undefined') {
  Object.defineProperty(Error.prototype, 'stack', {
    configurable: true,
    enumerable: false,
    get: function() {
      try {
        // Return a fallback string with error name and message
        return `${this.name || 'Error'}: ${this.message || ''}`;
      } catch (e) {
        console.warn('[HermesPolyfill] Error accessing stack property', e);
        return '';
      }
    }
  });
  
  console.info('[HermesPolyfill] Added Error.stack getter polyfill');
}

// Export dummy object to force import of this file
export const hermesPolyfill = {
  applied: true
};