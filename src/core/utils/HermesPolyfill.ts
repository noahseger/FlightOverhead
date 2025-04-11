/**
 * This file contains polyfills and workarounds for Hermes engine compatibility issues.
 * It should be imported before any other module in the app's entry point.
 */

// Save a reference to native console methods before any potential modifications
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

// Store original Object.defineProperty
const originalDefineProperty = Object.defineProperty;

// Override Object.defineProperty to handle non-configurable properties more gracefully
Object.defineProperty = function customDefineProperty(obj: any, prop: string, descriptor: PropertyDescriptor): any {
  try {
    return originalDefineProperty(obj, prop, descriptor);
  } catch (error: any) {
    // If error is about non-configurable property, log it and continue
    if (error instanceof TypeError && error.message.includes('not configurable')) {
      originalConsoleWarn(`[HermesPolyfill] Attempted to redefine non-configurable property: ${prop}`);
      // Return the object without modifying it rather than throwing
      return obj;
    }
    // For other errors, rethrow
    throw error;
  }
};

// Complete replacement for Error.stack in Hermes
// The problem is that Hermes doesn't properly implement the Error.stack getter
try {
  // Check if we're running in Hermes
  const isHermes = typeof HermesInternal !== 'undefined';
  if (isHermes) {
    originalConsoleLog('[HermesPolyfill] Hermes detected, applying Error.stack polyfill');
    
    // Create a Map to store stack traces for Error objects
    const errorStacks = new Map<Error, string>();
    
    // Override Error constructor
    const OriginalError = Error;
    // @ts-ignore - we need to override the Error constructor
    Error = function CustomError(message?: string) {
      const error = new OriginalError(message);
      // Generate a stack-like string
      const stack = `${error.name || 'Error'}: ${error.message || ''}\n    at <unknown>`;
      // Store it in our Map
      errorStacks.set(error, stack);
      return error;
    };
    
    // Copy all properties from OriginalError to our CustomError
    Error.prototype = OriginalError.prototype;
    Error.prototype.constructor = Error;
    
    // Override other Error static properties
    Object.getOwnPropertyNames(OriginalError).forEach(prop => {
      if (prop !== 'prototype' && prop !== 'length' && prop !== 'name') {
        // @ts-ignore - we need to copy all properties
        Error[prop] = OriginalError[prop];
      }
    });
    
    // Define a safe stack getter on Error.prototype
    Object.defineProperty(Error.prototype, 'stack', {
      configurable: true,
      enumerable: false,
      get: function() {
        try {
          // Return our stored stack if available
          const customStack = errorStacks.get(this);
          if (customStack) {
            return customStack;
          }
          
          // Fallback to a basic representation
          return `${this.name || 'Error'}: ${this.message || ''}\n    at <unknown>`;
        } catch (e) {
          originalConsoleWarn('[HermesPolyfill] Error accessing stack property');
          return ''; // Return empty string rather than throwing
        }
      },
      // Make the property settable so it can be modified
      set: function(value) {
        try {
          errorStacks.set(this, value);
        } catch (e) {
          originalConsoleWarn('[HermesPolyfill] Error setting stack property');
        }
      }
    });
    
    originalConsoleLog('[HermesPolyfill] Error.stack polyfill applied');
  }
} catch (e) {
  originalConsoleError('[HermesPolyfill] Failed to apply Error.stack polyfill', e);
}

// Export dummy object to force import of this file
export const hermesPolyfill = {
  applied: true
};