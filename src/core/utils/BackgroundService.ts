import { LocationManager } from './LocationManager';
import { BackgroundTaskManager, BackgroundTask } from './BackgroundTaskManager';
import { Logger } from './Logger';
import { ErrorHandler } from './ErrorHandler';
import { AppError } from './AppError';
import { SettingsRepository } from '../../data/repositories';

export class BackgroundServiceError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(`BackgroundServiceError: ${message}`, originalError);
    this.name = 'BackgroundServiceError';
  }
}

export interface IBackgroundService {
  startBackgroundLocationUpdates(): Promise<boolean>;
  stopBackgroundLocationUpdates(): Promise<void>;
  startBackgroundFlightCheck(): Promise<boolean>;
  isBackgroundServiceEnabled(): Promise<boolean>;
}

export class BackgroundService implements IBackgroundService {
  private static instance: BackgroundService;
  private logger = new Logger('BackgroundService');
  private errorHandler = new ErrorHandler();
  private backgroundTaskManager: BackgroundTaskManager;
  private locationManager: LocationManager;
  private settingsRepository: SettingsRepository;

  private constructor(
    backgroundTaskManager: BackgroundTaskManager,
    locationManager: LocationManager,
    settingsRepository: SettingsRepository
  ) {
    this.backgroundTaskManager = backgroundTaskManager;
    this.locationManager = locationManager;
    this.settingsRepository = settingsRepository;
    this.setupBackgroundTasks();
  }

  public static getInstance(settingsRepository?: SettingsRepository): BackgroundService {
    if (!BackgroundService.instance) {
      if (!settingsRepository) {
        throw new Error('SettingsRepository is required for first initialization');
      }
      const backgroundTaskManager = BackgroundTaskManager.getInstance();
      const locationManager = LocationManager.getInstance(settingsRepository);
      BackgroundService.instance = new BackgroundService(backgroundTaskManager, locationManager, settingsRepository);
    }
    return BackgroundService.instance;
  }

  public async startBackgroundLocationUpdates(): Promise<boolean> {
    try {
      // Register the task if not already registered
      this.setupLocationTask();
      
      // Schedule with a 15-minute interval (minimum allowed by iOS)
      const success = await this.backgroundTaskManager.scheduleLocationUpdates(15);
      
      if (success) {
        this.logger.info('Background location updates started successfully');
      } else {
        this.logger.warn('Failed to start background location updates');
      }
      
      return success;
    } catch (error) {
      this.logger.error('Error starting background location updates', { error });
      this.errorHandler.handleError(
        new BackgroundServiceError('Failed to start background location updates', error as Error)
      );
      return false;
    }
  }

  public async stopBackgroundLocationUpdates(): Promise<void> {
    try {
      await this.backgroundTaskManager.cancelLocationUpdates();
      this.logger.info('Background location updates stopped');
    } catch (error) {
      this.logger.error('Error stopping background location updates', { error });
      this.errorHandler.handleError(
        new BackgroundServiceError('Failed to stop background location updates', error as Error)
      );
    }
  }

  public async startBackgroundFlightCheck(): Promise<boolean> {
    try {
      // Register the task if not already registered
      this.setupFlightCheckTask();
      
      const success = await this.backgroundTaskManager.scheduleFlightCheck();
      
      if (success) {
        this.logger.info('Background flight check started successfully');
      } else {
        this.logger.warn('Failed to start background flight check');
      }
      
      return success;
    } catch (error) {
      this.logger.error('Error starting background flight check', { error });
      this.errorHandler.handleError(
        new BackgroundServiceError('Failed to start background flight check', error as Error)
      );
      return false;
    }
  }

  public async isBackgroundServiceEnabled(): Promise<boolean> {
    try {
      return await this.backgroundTaskManager.isBackgroundTaskEnabled();
    } catch (error) {
      this.logger.error('Error checking background service status', { error });
      this.errorHandler.handleError(
        new BackgroundServiceError('Failed to check background service status', error as Error)
      );
      return false;
    }
  }

  private setupBackgroundTasks(): void {
    this.setupLocationTask();
    this.setupFlightCheckTask();
  }

  private setupLocationTask(): void {
    const locationTask: BackgroundTask = async () => {
      try {
        this.logger.info('Executing background location task');
        
        // Get current location
        const location = await this.locationManager.getCurrentLocation();
        
        // Update last known location in settings
        await this.settingsRepository.updateLastKnownLocation(location);
        
        this.logger.info('Background location update completed successfully', {
          latitude: location.latitude.toFixed(6),
          longitude: location.longitude.toFixed(6)
        });
      } catch (error) {
        this.logger.error('Background location task failed', { error });
        throw new BackgroundServiceError('Background location task execution failed', error as Error);
      }
    };
    
    this.backgroundTaskManager.registerTask('com.flightoverhead.location', locationTask);
  }

  private setupFlightCheckTask(): void {
    // This will be implemented in Phase 3 when we add flight API integration
    const flightCheckTask: BackgroundTask = async () => {
      try {
        this.logger.info('Executing background flight check task');
        
        // In Phase 3, we'll implement:
        // 1. Get current location
        // 2. Query flight API for nearby aircraft
        // 3. Detect overhead flights
        // 4. Send notifications
        
        this.logger.info('Background flight check completed (placeholder)');
      } catch (error) {
        this.logger.error('Background flight check task failed', { error });
        throw new BackgroundServiceError('Background flight check task execution failed', error as Error);
      }
    };
    
    this.backgroundTaskManager.registerTask('com.flightoverhead.flightcheck', flightCheckTask);
  }
}