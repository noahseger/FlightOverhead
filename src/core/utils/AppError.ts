/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppError';

    // This is needed to make instanceof work correctly in TypeScript
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends AppError {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Connection error
 */
export class ConnectionError extends NetworkError {
  constructor(message: string = 'Cannot connect to the network') {
    super(message);
    this.name = 'ConnectionError';
    Object.setPrototypeOf(this, ConnectionError.prototype);
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends NetworkError {
  constructor(message: string = 'Operation timed out') {
    super(message);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Server error
 */
export class ServerError extends NetworkError {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ServerError';
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Storage-related errors
 */
export class StorageError extends AppError {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
    Object.setPrototypeOf(this, StorageError.prototype);
  }
}

/**
 * Location-related errors
 */
export class LocationError extends AppError {
  constructor(message: string) {
    super(message);
    this.name = 'LocationError';
    Object.setPrototypeOf(this, LocationError.prototype);
  }
}

/**
 * Permission-related errors
 */
export class PermissionError extends AppError {
  permission: string;

  constructor(message: string, permission: string) {
    super(message);
    this.name = 'PermissionError';
    this.permission = permission;
    Object.setPrototypeOf(this, PermissionError.prototype);
  }
}
