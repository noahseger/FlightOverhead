/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = 'AppError';

    // This is needed to make instanceof work correctly in TypeScript
    Object.setPrototypeOf(this, AppError.prototype);
    
    // Safely capture original error stack if provided
    if (originalError) {
      try {
        const originalStack = originalError.stack;
        if (originalStack) {
          // Append original error stack to this error's stack if possible
          if (this.stack) {
            this.stack = `${this.stack}\nCaused by: ${originalStack}`;
          }
        }
      } catch (e) {
        // Silently handle any issues with stack access
      }
    }
  }
  
  /**
   * Safely get the stack trace
   * @returns The stack trace or a fallback message
   */
  public safeGetStack(): string {
    try {
      return this.stack || `${this.name}: ${this.message}`;
    } catch (e) {
      return `${this.name}: ${this.message} (stack unavailable)`;
    }
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, originalError);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Connection error
 */
export class ConnectionError extends NetworkError {
  constructor(message: string = 'Cannot connect to the network', originalError?: Error) {
    super(message, originalError);
    this.name = 'ConnectionError';
    Object.setPrototypeOf(this, ConnectionError.prototype);
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends NetworkError {
  constructor(message: string = 'Operation timed out', originalError?: Error) {
    super(message, originalError);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Server error
 */
export class ServerError extends NetworkError {
  statusCode: number;

  constructor(message: string, statusCode: number, originalError?: Error) {
    super(message, originalError);
    this.name = 'ServerError';
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Storage-related errors
 */
export class StorageError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, originalError);
    this.name = 'StorageError';
    Object.setPrototypeOf(this, StorageError.prototype);
  }
}

/**
 * Location-related errors
 */
export class LocationError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, originalError);
    this.name = 'LocationError';
    Object.setPrototypeOf(this, LocationError.prototype);
  }
}

/**
 * Permission-related errors
 */
export class PermissionError extends AppError {
  permission: string;

  constructor(message: string, permission: string, originalError?: Error) {
    super(message, originalError);
    this.name = 'PermissionError';
    this.permission = permission;
    Object.setPrototypeOf(this, PermissionError.prototype);
  }
}
