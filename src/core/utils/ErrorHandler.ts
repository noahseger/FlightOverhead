import {
  AppError,
  NetworkError,
  ConnectionError,
  TimeoutError,
  ServerError,
  StorageError,
  LocationError,
  PermissionError,
} from './AppError';
import { Logger } from './Logger';

/**
 * ErrorHandler provides methods for handling different types of errors
 */
export class ErrorHandler {
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger('ErrorHandler');
  }

  /**
   * Format error message based on error type
   * @param error Error object
   * @returns Formatted error message
   */
  public formatErrorMessage(error: Error): string {
    if (error instanceof ServerError) {
      return `Server error (${error.statusCode}): ${error.message}`;
    } else if (error instanceof ConnectionError) {
      return `Connection error: ${error.message}. Please check your internet connection.`;
    } else if (error instanceof TimeoutError) {
      return `Timeout error: ${error.message}. The operation took too long to complete.`;
    } else if (error instanceof NetworkError) {
      return `Network error: ${error.message}`;
    } else if (error instanceof StorageError) {
      return `Storage error: ${error.message}`;
    } else if (error instanceof LocationError) {
      return `Location error: ${error.message}`;
    } else if (error instanceof PermissionError) {
      return `Permission denied for ${error.permission}: ${error.message}`;
    } else if (error instanceof AppError) {
      return `Application error: ${error.message}`;
    } else {
      return `Unexpected error: ${error.message}`;
    }
  }

  /**
   * Log error with context
   * @param error Error object
   * @param context Additional context for the error
   */
  public logError(error: Error, context?: Record<string, any>): void {
    const errorType = error.constructor.name;
    const formattedMessage = this.formatErrorMessage(error);
    
    // Safely get stack trace - might be undefined in Hermes
    let errorStack: string | undefined;
    try {
      errorStack = error.stack;
    } catch (e) {
      errorStack = `<stack trace unavailable: ${e}>`;
    }

    this.logger.error(formattedMessage, {
      errorType,
      errorStack,
      ...context,
    });
  }

  /**
   * Handle error with appropriate actions based on error type
   * @param error Error object
   * @returns Object with error information and suggested recovery action
   */
  public handleError(error: Error): { message: string; recoveryAction?: string } {
    this.logError(error);

    if (error instanceof ConnectionError) {
      return {
        message: this.formatErrorMessage(error),
        recoveryAction: 'Check your internet connection and try again',
      };
    } else if (error instanceof TimeoutError) {
      return {
        message: this.formatErrorMessage(error),
        recoveryAction: 'Try again later when the connection is more stable',
      };
    } else if (error instanceof ServerError) {
      const recovery = error.statusCode >= 500
        ? 'Try again later when the server issue is resolved'
        : 'Check your request parameters and try again';

      return {
        message: this.formatErrorMessage(error),
        recoveryAction: recovery,
      };
    } else if (error instanceof StorageError) {
      return {
        message: this.formatErrorMessage(error),
        recoveryAction: 'Restart the app or clear app data if the problem persists',
      };
    } else if (error instanceof LocationError) {
      return {
        message: this.formatErrorMessage(error),
        recoveryAction: 'Make sure location services are enabled in your device settings',
      };
    } else if (error instanceof PermissionError) {
      return {
        message: this.formatErrorMessage(error),
        recoveryAction: 'Go to app settings and grant the required permissions',
      };
    } else {
      return {
        message: this.formatErrorMessage(error),
        recoveryAction: 'Restart the app or contact support if the problem persists',
      };
    }
  }

  /**
   * Create an error instance from an unknown error
   * @param error Unknown error object
   * @returns AppError instance
   */
  public createAppError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError(error.message);
    }

    if (typeof error === 'string') {
      return new AppError(error);
    }

    return new AppError('An unknown error occurred');
  }
}
