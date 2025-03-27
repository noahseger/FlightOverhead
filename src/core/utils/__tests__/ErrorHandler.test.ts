import { ErrorHandler } from '../ErrorHandler';
import { Logger } from '../Logger';
import {
  AppError,
  NetworkError,
  ConnectionError,
  TimeoutError,
  ServerError,
  StorageError,
  LocationError,
  PermissionError,
} from '../AppError';

// Mock the Logger
jest.mock('../Logger', () => {
  return {
    LogLevel: {
      DEBUG: 0,
      INFO: 1,
      WARNING: 2,
      ERROR: 3,
    },
    Logger: jest.fn().mockImplementation(() => {
      return {
        error: jest.fn(),
      };
    }),
  };
});

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Create a fresh mocked instance for each test
    mockLogger = {
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    errorHandler = new ErrorHandler(mockLogger);
  });

  describe('formatErrorMessage', () => {
    it('should format AppError message', () => {
      const error = new AppError('Something went wrong');
      const message = errorHandler.formatErrorMessage(error);
      expect(message).toBe('Application error: Something went wrong');
    });

    it('should format NetworkError message', () => {
      const error = new NetworkError('Network issue');
      const message = errorHandler.formatErrorMessage(error);
      expect(message).toBe('Network error: Network issue');
    });

    it('should format ConnectionError message', () => {
      const error = new ConnectionError();
      const message = errorHandler.formatErrorMessage(error);
      expect(message).toBe('Connection error: Cannot connect to the network. Please check your internet connection.');
    });

    it('should format TimeoutError message', () => {
      const error = new TimeoutError();
      const message = errorHandler.formatErrorMessage(error);
      expect(message).toBe('Timeout error: Operation timed out. The operation took too long to complete.');
    });

    it('should format ServerError message with status code', () => {
      const error = new ServerError('Internal server error', 500);
      const message = errorHandler.formatErrorMessage(error);
      expect(message).toBe('Server error (500): Internal server error');
    });

    it('should format StorageError message', () => {
      const error = new StorageError('Failed to save data');
      const message = errorHandler.formatErrorMessage(error);
      expect(message).toBe('Storage error: Failed to save data');
    });

    it('should format LocationError message', () => {
      const error = new LocationError('Could not get location');
      const message = errorHandler.formatErrorMessage(error);
      expect(message).toBe('Location error: Could not get location');
    });

    it('should format PermissionError message', () => {
      const error = new PermissionError('Location permission denied', 'location');
      const message = errorHandler.formatErrorMessage(error);
      expect(message).toBe('Permission denied for location: Location permission denied');
    });

    it('should format unknown error message', () => {
      const error = new Error('Unknown error');
      const message = errorHandler.formatErrorMessage(error);
      expect(message).toBe('Unexpected error: Unknown error');
    });
  });

  describe('logError', () => {
    it('should log error with context', () => {
      const error = new AppError('Test error');
      error.stack = 'Error stack trace';

      errorHandler.logError(error, { userId: '123' });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Application error: Test error',
        expect.objectContaining({
          errorType: 'AppError',
          errorStack: 'Error stack trace',
          userId: '123',
        })
      );
    });

    it('should log error without context', () => {
      const error = new AppError('Test error');
      error.stack = 'Error stack trace';

      errorHandler.logError(error);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Application error: Test error',
        expect.objectContaining({
          errorType: 'AppError',
          errorStack: 'Error stack trace',
        })
      );
    });
  });

  describe('handleError', () => {
    it('should provide message and recovery action for ConnectionError', () => {
      const error = new ConnectionError();
      const result = errorHandler.handleError(error);

      expect(result.message).toBe('Connection error: Cannot connect to the network. Please check your internet connection.');
      expect(result.recoveryAction).toBe('Check your internet connection and try again');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should provide message and recovery action for TimeoutError', () => {
      const error = new TimeoutError();
      const result = errorHandler.handleError(error);

      expect(result.message).toBe('Timeout error: Operation timed out. The operation took too long to complete.');
      expect(result.recoveryAction).toBe('Try again later when the connection is more stable');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should provide message and recovery action for ServerError (5xx)', () => {
      const error = new ServerError('Server error', 503);
      const result = errorHandler.handleError(error);

      expect(result.message).toBe('Server error (503): Server error');
      expect(result.recoveryAction).toBe('Try again later when the server issue is resolved');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should provide message and recovery action for ServerError (4xx)', () => {
      const error = new ServerError('Bad request', 400);
      const result = errorHandler.handleError(error);

      expect(result.message).toBe('Server error (400): Bad request');
      expect(result.recoveryAction).toBe('Check your request parameters and try again');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should provide message and recovery action for StorageError', () => {
      const error = new StorageError('Storage failure');
      const result = errorHandler.handleError(error);

      expect(result.message).toBe('Storage error: Storage failure');
      expect(result.recoveryAction).toBe('Restart the app or clear app data if the problem persists');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should provide message and recovery action for LocationError', () => {
      const error = new LocationError('Location unavailable');
      const result = errorHandler.handleError(error);

      expect(result.message).toBe('Location error: Location unavailable');
      expect(result.recoveryAction).toBe('Make sure location services are enabled in your device settings');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should provide message and recovery action for PermissionError', () => {
      const error = new PermissionError('Permission denied', 'camera');
      const result = errorHandler.handleError(error);

      expect(result.message).toBe('Permission denied for camera: Permission denied');
      expect(result.recoveryAction).toBe('Go to app settings and grant the required permissions');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should provide generic message and recovery action for unknown errors', () => {
      const error = new Error('Something went wrong');
      const result = errorHandler.handleError(error);

      expect(result.message).toBe('Unexpected error: Something went wrong');
      expect(result.recoveryAction).toBe('Restart the app or contact support if the problem persists');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('createAppError', () => {
    it('should return the original AppError', () => {
      const originalError = new AppError('Original error');
      const result = errorHandler.createAppError(originalError);

      expect(result).toBe(originalError);
      expect(result instanceof AppError).toBe(true);
    });

    it('should convert Error to AppError', () => {
      const error = new Error('Standard error');
      const result = errorHandler.createAppError(error);

      expect(result instanceof AppError).toBe(true);
      expect(result.message).toBe('Standard error');
    });

    it('should convert string to AppError', () => {
      const result = errorHandler.createAppError('Error message');

      expect(result instanceof AppError).toBe(true);
      expect(result.message).toBe('Error message');
    });

    it('should handle unknown error types', () => {
      const result = errorHandler.createAppError(null);

      expect(result instanceof AppError).toBe(true);
      expect(result.message).toBe('An unknown error occurred');
    });
  });
});
