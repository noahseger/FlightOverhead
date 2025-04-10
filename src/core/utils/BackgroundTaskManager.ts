import BackgroundFetch, { BackgroundFetchStatus } from 'react-native-background-fetch';
import { Platform } from 'react-native';
import { Logger } from './Logger';
import { ErrorHandler } from './ErrorHandler';
import { AppError } from './AppError';

export class BackgroundError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(`BackgroundError: ${message}`, originalError);
    this.name = 'BackgroundError';
  }
}

export interface IBackgroundTaskManager {
  scheduleLocationUpdates(intervalMinutes: number): Promise<boolean>;
  cancelLocationUpdates(): Promise<void>;
  scheduleFlightCheck(): Promise<boolean>;
  isBackgroundTaskEnabled(): Promise<boolean>;
}

export type BackgroundTask = () => Promise<void>;

// Helper function to load BackgroundFetch module only when needed
// This helps prevent early initialization issues with Hermes
const getBackgroundFetchModule = () => {
  try {
    return require('react-native-background-fetch');
  } catch (error) {
    console.error('Failed to load BackgroundFetch module', error);
    return null;
  }
};

export class BackgroundTaskManager implements IBackgroundTaskManager {
  private static instance: BackgroundTaskManager;
  private logger = new Logger('BackgroundTaskManager');
  private errorHandler = new ErrorHandler();
  private initialized = false;
  private locationTaskId = 'com.flightoverhead.location';
  private flightCheckTaskId = 'com.flightoverhead.flightcheck';
  private tasks: Map<string, BackgroundTask> = new Map();

  private constructor() {}

  public static getInstance(): BackgroundTaskManager {
    if (!BackgroundTaskManager.instance) {
      BackgroundTaskManager.instance = new BackgroundTaskManager();
    }
    return BackgroundTaskManager.instance;
  }

  private getBackgroundFetch() {
    return getBackgroundFetchModule();
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const BackgroundFetch = this.getBackgroundFetch();
      if (!BackgroundFetch) {
        throw new Error('BackgroundFetch module not available');
      }

      // Configure the library
      const status = await BackgroundFetch.configure(
        {
          minimumFetchInterval: 15, // minutes (minimum is 15 minutes)
          stopOnTerminate: false,
          startOnBoot: true,
          enableHeadless: true,
          requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE, // Default
          requiresBatteryNotLow: false,
          requiresCharging: false,
          requiresDeviceIdle: false,
          requiresStorageNotLow: false,
        },
        async (taskId) => {
          this.logger.info(`Background task executed: ${taskId}`);
          // Retrieve the task function from the map and execute it
          const task = this.tasks.get(taskId);
          if (task) {
            try {
              await task();
              this.logger.info(`Task ${taskId} completed successfully`);
            } catch (error) {
              this.logger.error(`Task ${taskId} failed`, { error });
              this.errorHandler.handleError(
                new BackgroundError(`Task ${taskId} execution failed`, error as Error)
              );
            }
          } else {
            this.logger.warn(`No task found for ID: ${taskId}`);
          }
          // IMPORTANT: You must signal completion of your task
          BackgroundFetch.finish(taskId);
        },
        (taskId) => {
          // Task timeout handling
          this.logger.warn(`Background task timed out: ${taskId}`);
          const BackgroundFetch = this.getBackgroundFetch();
          if (BackgroundFetch) {
            BackgroundFetch.finish(taskId);
          }
        }
      );

      this.initialized = true;
      this.logger.info(`Background fetch initialized with status: ${this.getStatusName(status)}`);

      return;
    } catch (error) {
      this.logger.error('Failed to initialize background fetch', { error });
      this.errorHandler.handleError(
        new BackgroundError('Failed to initialize background fetch', error as Error)
      );
      throw error;
    }
  }

  public async scheduleLocationUpdates(intervalMinutes: number): Promise<boolean> {
    try {
      await this.initialize();

      const BackgroundFetch = this.getBackgroundFetch();
      if (!BackgroundFetch) {
        return false;
      }

      // Ensure intervalMinutes is at least 15 (minimum allowed by iOS)
      const safeInterval = Math.max(15, intervalMinutes);

      // Register the task
      const status = await BackgroundFetch.scheduleTask({
        taskId: this.locationTaskId,
        delay: 0, // Execute immediately after registration
        periodic: true,
        forceAlarmManager: Platform.OS === 'android', // Use AlarmManager for more precise scheduling on Android
        enableHeadless: true,
        stopOnTerminate: false,
        startOnBoot: true,
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE,
        requiresBatteryNotLow: false,
        requiresCharging: false,
        requiresDeviceIdle: false,
        requiresStorageNotLow: false,
      });

      this.logger.info(`Location updates scheduled with interval: ${safeInterval} minutes, status: ${this.getStatusName(status)}`);
      return status === BackgroundFetch.STATUS_AVAILABLE;
    } catch (error) {
      this.logger.error('Failed to schedule location updates', { error });
      this.errorHandler.handleError(
        new BackgroundError('Failed to schedule location updates', error as Error)
      );
      return false;
    }
  }

  public async cancelLocationUpdates(): Promise<void> {
    try {
      if (!this.initialized) {
        this.logger.info('No need to cancel location updates - background fetch not initialized');
        return;
      }

      const BackgroundFetch = this.getBackgroundFetch();
      if (!BackgroundFetch) {
        return;
      }

      await BackgroundFetch.stop(this.locationTaskId);
      this.logger.info('Location updates canceled');
    } catch (error) {
      this.logger.error('Failed to cancel location updates', { error });
      this.errorHandler.handleError(
        new BackgroundError('Failed to cancel location updates', error as Error)
      );
    }
  }

  public async scheduleFlightCheck(): Promise<boolean> {
    try {
      await this.initialize();

      const BackgroundFetch = this.getBackgroundFetch();
      if (!BackgroundFetch) {
        return false;
      }

      // Register the task
      const status = await BackgroundFetch.scheduleTask({
        taskId: this.flightCheckTaskId,
        delay: 0, // Execute immediately after registration
        periodic: true,
        forceAlarmManager: Platform.OS === 'android',
        enableHeadless: true,
        stopOnTerminate: false,
        startOnBoot: true,
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY, // Requires network for flight API
        requiresBatteryNotLow: false,
        requiresCharging: false,
        requiresDeviceIdle: false,
        requiresStorageNotLow: false,
      });

      this.logger.info(`Flight check scheduled, status: ${this.getStatusName(status)}`);
      return status === BackgroundFetch.STATUS_AVAILABLE;
    } catch (error) {
      this.logger.error('Failed to schedule flight check', { error });
      this.errorHandler.handleError(
        new BackgroundError('Failed to schedule flight check', error as Error)
      );
      return false;
    }
  }

  public async isBackgroundTaskEnabled(): Promise<boolean> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const BackgroundFetch = this.getBackgroundFetch();
      if (!BackgroundFetch) {
        return false;
      }

      const status = await BackgroundFetch.status();
      return status === BackgroundFetch.STATUS_AVAILABLE;
    } catch (error) {
      this.logger.error('Failed to check background task status', { error });
      this.errorHandler.handleError(
        new BackgroundError('Failed to check background task status', error as Error)
      );
      return false;
    }
  }

  public registerTask(taskId: string, task: BackgroundTask): void {
    this.tasks.set(taskId, task);
    this.logger.info(`Task registered: ${taskId}`);
  }

  private getStatusName(status: BackgroundFetchStatus): string {
    const BackgroundFetch = this.getBackgroundFetch();
    if (!BackgroundFetch) {
      return `UNKNOWN (${status})`;
    }
    
    switch (status) {
      case BackgroundFetch.STATUS_AVAILABLE:
        return 'AVAILABLE';
      case BackgroundFetch.STATUS_DENIED:
        return 'DENIED';
      case BackgroundFetch.STATUS_RESTRICTED:
        return 'RESTRICTED';
      default:
        return `UNKNOWN (${status})`;
    }
  }
}