import { AppError, BackgroundTaskManager, ErrorHandler, Logger, LocationManager } from '../../core/utils';
import { SettingsRepository } from '../../data/repositories/SettingsRepository';
import { FlightApiRepository } from '../../data/repositories/FlightApiRepository';
import { FlightRepository } from '../../data/repositories/FlightRepository';
import { FlightDetector } from './FlightDetector';
import { NotificationManager } from './NotificationManager';
import { Flight } from '../models';

export class FlightDetectionError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(`FlightDetectionError: ${message}`, originalError);
    this.name = 'FlightDetectionError';
  }
}

export interface IFlightDetectionManager {
  startBackgroundDetection(): Promise<boolean>;
  stopBackgroundDetection(): Promise<void>;
  performDetection(): Promise<Flight[]>;
  isDetectionActive(): boolean;
}

/**
 * Manager class that coordinates flight detection activities
 */
export class FlightDetectionManager implements IFlightDetectionManager {
  private static instance: FlightDetectionManager;
  private logger = new Logger('FlightDetectionManager');
  private errorHandler = new ErrorHandler();
  private flightDetector: FlightDetector;
  private backgroundTaskManager: BackgroundTaskManager;
  private locationManager: LocationManager;
  private settingsRepository: SettingsRepository;
  private flightRepository: FlightRepository;
  private notificationManager?: NotificationManager;
  private detectionActive = false;

  private constructor(
    flightDetector: FlightDetector,
    backgroundTaskManager: BackgroundTaskManager,
    locationManager: LocationManager,
    settingsRepository: SettingsRepository,
    flightRepository: FlightRepository,
    notificationManager?: NotificationManager
  ) {
    this.flightDetector = flightDetector;
    this.backgroundTaskManager = backgroundTaskManager;
    this.locationManager = locationManager;
    this.settingsRepository = settingsRepository;
    this.flightRepository = flightRepository;
    this.notificationManager = notificationManager;
  }

  public static getInstance(
    flightApiRepository?: FlightApiRepository,
    settingsRepository?: SettingsRepository,
    flightRepository?: FlightRepository,
    notificationManager?: NotificationManager
  ): FlightDetectionManager {
    if (!FlightDetectionManager.instance) {
      if (!flightApiRepository || !settingsRepository || !flightRepository) {
        throw new Error('Required repositories must be provided for first initialization');
      }

      const flightDetector = new FlightDetector(flightApiRepository);
      const backgroundTaskManager = BackgroundTaskManager.getInstance();
      const locationManager = LocationManager.getInstance(settingsRepository);

      FlightDetectionManager.instance = new FlightDetectionManager(
        flightDetector,
        backgroundTaskManager,
        locationManager,
        settingsRepository,
        flightRepository,
        notificationManager
      );
      
      // Register the detection task
      FlightDetectionManager.instance.registerDetectionTask();
    }
    
    return FlightDetectionManager.instance;
  }

  /**
   * Set the notification manager
   * @param manager The notification manager instance
   */
  public setNotificationManager(manager: NotificationManager): void {
    this.notificationManager = manager;
    this.logger.info('Notification manager set');
  }

  /**
   * Start background flight detection
   * @returns Promise resolving to true if successful
   */
  public async startBackgroundDetection(): Promise<boolean> {
    try {
      // Schedule the background task
      const success = await this.backgroundTaskManager.scheduleFlightCheck();
      
      if (success) {
        this.detectionActive = true;
        this.logger.info('Started background flight detection');
      } else {
        this.logger.warn('Failed to start background flight detection');
      }
      
      return success;
    } catch (error) {
      this.logger.error('Error starting background detection', { error });
      this.errorHandler.handleError(
        new FlightDetectionError('Failed to start background detection', error as Error)
      );
      return false;
    }
  }

  /**
   * Stop background flight detection
   */
  public async stopBackgroundDetection(): Promise<void> {
    try {
      await this.backgroundTaskManager.cancelFlightCheck();
      this.detectionActive = false;
      this.logger.info('Stopped background flight detection');
    } catch (error) {
      this.logger.error('Error stopping background detection', { error });
      this.errorHandler.handleError(
        new FlightDetectionError('Failed to stop background detection', error as Error)
      );
    }
  }

  /**
   * Perform a single flight detection operation
   * @returns Detected flights
   */
  public async performDetection(): Promise<Flight[]> {
    try {
      // Get current location
      const location = await this.getLocation();
      if (!location) {
        this.logger.warn('Cannot perform detection: location not available');
        return [];
      }
      
      // Get detection radius from settings
      const settings = await this.settingsRepository.getSettings();
      const radiusKm = settings.detectionRadiusKm;
      
      // Detect flights
      const detectedFlights = await this.flightDetector.detectOverheadFlights(
        location,
        radiusKm
      );
      
      // Save detected flights to history
      if (detectedFlights.length > 0) {
        await this.flightRepository.saveFlights(detectedFlights);
        
        // Send notifications for newly detected flights if notification manager is available
        if (this.notificationManager) {
          await this.notificationManager.notifyFlightsDetected(detectedFlights);
        }
      }
      
      return detectedFlights;
    } catch (error) {
      this.logger.error('Error performing flight detection', { error });
      this.errorHandler.handleError(
        new FlightDetectionError('Failed to perform flight detection', error as Error)
      );
      return [];
    }
  }

  /**
   * Check if flight detection is currently active
   * @returns True if detection is active
   */
  public isDetectionActive(): boolean {
    return this.detectionActive;
  }

  /**
   * Register the detection task with the background task manager
   */
  private registerDetectionTask(): void {
    this.backgroundTaskManager.registerTask('com.flightoverhead.flightcheck', async () => {
      this.logger.info('Executing background flight detection task');
      
      try {
        // Perform detection
        const detectedFlights = await this.performDetection();
        
        this.logger.info(`Background detection found ${detectedFlights.length} flights`);
        
        return Promise.resolve();
      } catch (error) {
        this.logger.error('Error in background flight detection task', { error });
        return Promise.resolve();
      }
    });
  }

  /**
   * Get the current location, or last known location if current is not available
   * @returns Location coordinates or null if not available
   */
  private async getLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      // Try to get current location
      return await this.locationManager.getCurrentLocation();
    } catch (error) {
      this.logger.warn('Failed to get current location, trying last known location', { error });
      
      // Fall back to last known location
      return await this.locationManager.getLastKnownLocation();
    }
  }
}