import { Flight } from '../models';
import { NotificationService } from '../../data/services/NotificationService';
import { SettingsRepository } from '../../data/repositories';
import { AppError, ErrorHandler, Logger } from '../../core/utils';
import { AircraftImageManager } from './AircraftImageManager';

export class NotificationManagerError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(`NotificationManagerError: ${message}`, originalError);
    this.name = 'NotificationManagerError';
  }
}

export interface INotificationManager {
  notifyFlightDetected(flight: Flight): Promise<boolean>;
  notifyFlightsDetected(flights: Flight[]): Promise<Flight[]>;
  clearAllNotifications(): Promise<void>;
  initialize(): Promise<void>;
}

/**
 * Manager class that coordinates flight notifications
 */
export class NotificationManager implements INotificationManager {
  private static instance: NotificationManager;
  private logger = new Logger('NotificationManager');
  private errorHandler = new ErrorHandler();
  private notificationService: NotificationService;
  private settingsRepository: SettingsRepository;
  private aircraftImageManager?: AircraftImageManager;
  private lastNotificationTime: number = 0;
  private notificationsEnabled = true;
  private throttleIntervalMs = 30 * 1000; // 30 seconds minimum between notifications
  private maxNotificationsPerBatch = 3; // Maximum notifications to show at once
  private useRichNotifications = true; // Flag to enable/disable rich notifications
  
  private constructor(
    notificationService: NotificationService,
    settingsRepository: SettingsRepository,
    aircraftImageManager?: AircraftImageManager
  ) {
    this.notificationService = notificationService;
    this.settingsRepository = settingsRepository;
    this.aircraftImageManager = aircraftImageManager;
  }
  
  public static getInstance(
    notificationService?: NotificationService,
    settingsRepository?: SettingsRepository,
    aircraftImageManager?: AircraftImageManager
  ): NotificationManager {
    if (!NotificationManager.instance) {
      if (!notificationService || !settingsRepository) {
        throw new Error('NotificationService and SettingsRepository are required for first initialization');
      }
      NotificationManager.instance = new NotificationManager(
        notificationService,
        settingsRepository,
        aircraftImageManager
      );
    }
    return NotificationManager.instance;
  }
  
  /**
   * Set the aircraft image manager for rich notifications
   * @param aircraftImageManager The aircraft image manager instance
   */
  public setAircraftImageManager(aircraftImageManager: AircraftImageManager): void {
    this.aircraftImageManager = aircraftImageManager;
    this.logger.info('Aircraft image manager set for rich notifications');
  }
  
  /**
   * Initialize the notification manager
   */
  public async initialize(): Promise<void> {
    try {
      // Request notification permissions
      const permissionsGranted = await this.notificationService.requestPermissions();
      
      if (!permissionsGranted) {
        this.logger.warn('Notification permissions not granted, notifications will be disabled');
        this.notificationsEnabled = false;
        return;
      }
      
      // Set up the notification service
      await this.notificationService.setupNotifications();
      
      // TODO: Load notification settings from SettingsRepository
      // when we implement the settings UI
      
      this.logger.info('Notification manager initialized');
    } catch (error) {
      this.logger.error('Error initializing notification manager', { error });
      this.errorHandler.handleError(
        new NotificationManagerError('Failed to initialize notification manager', error as Error)
      );
    }
  }
  
  /**
   * Notify the user about a detected flight
   * @param flight The detected flight
   * @returns Promise resolving to true if notification was sent
   */
  public async notifyFlightDetected(flight: Flight): Promise<boolean> {
    if (!this.notificationsEnabled) {
      this.logger.debug('Notifications are disabled, skipping notification');
      return false;
    }
    
    // Check if we should throttle
    if (!this.shouldSendNotification()) {
      this.logger.debug('Throttling notification due to recent notification');
      return false;
    }
    
    try {
      // Try to get an aircraft image if rich notifications are enabled
      let imagePath: string | null = null;
      if (this.useRichNotifications && this.aircraftImageManager) {
        try {
          imagePath = await this.aircraftImageManager.getImageForFlight(flight);
          if (imagePath) {
            this.logger.debug('Retrieved aircraft image for notification', { 
              flightId: flight.id, 
              aircraftType: flight.aircraftType 
            });
          }
        } catch (imageError) {
          // Log but don't prevent notification
          this.logger.warn('Failed to get aircraft image for notification', { 
            error: imageError, 
            flightId: flight.id 
          });
        }
      }
      
      // Send the notification with or without image
      await this.notificationService.showFlightNotification(flight, imagePath);
      
      // Update last notification time
      this.lastNotificationTime = Date.now();
      
      return true;
    } catch (error) {
      this.logger.error('Error sending flight notification', { error, flightId: flight.id });
      this.errorHandler.handleError(
        new NotificationManagerError('Failed to send flight notification', error as Error)
      );
      return false;
    }
  }
  
  /**
   * Notify about multiple detected flights with throttling
   * @param flights Array of detected flights
   * @returns Promise resolving to array of flights that were notified
   */
  public async notifyFlightsDetected(flights: Flight[]): Promise<Flight[]> {
    if (!this.notificationsEnabled || flights.length === 0) {
      return [];
    }
    
    // Check if we should throttle
    if (!this.shouldSendNotification()) {
      this.logger.debug('Throttling notifications due to recent notification');
      return [];
    }
    
    try {
      // Sort flights by altitude (lower first, as they're more visible)
      const sortedFlights = [...flights].sort((a, b) => a.altitude - b.altitude);
      
      // Limit to max notifications per batch
      const flightsToNotify = sortedFlights.slice(0, this.maxNotificationsPerBatch);
      const notifiedFlights: Flight[] = [];
      
      // Prefetch aircraft images if we have an image manager
      if (this.useRichNotifications && this.aircraftImageManager) {
        try {
          await this.aircraftImageManager.prefetchImagesForFlights(flightsToNotify);
        } catch (prefetchError) {
          // Log but continue with notifications
          this.logger.warn('Failed to prefetch aircraft images', { error: prefetchError });
        }
      }
      
      // Send notifications for each flight
      for (const flight of flightsToNotify) {
        try {
          // Try to get an aircraft image if rich notifications are enabled
          let imagePath: string | null = null;
          if (this.useRichNotifications && this.aircraftImageManager) {
            try {
              imagePath = await this.aircraftImageManager.getImageForFlight(flight);
            } catch (imageError) {
              // Log but don't prevent notification
              this.logger.warn('Failed to get aircraft image for batch notification', { 
                error: imageError, 
                flightId: flight.id 
              });
            }
          }
          
          // Send the notification with or without image
          await this.notificationService.showFlightNotification(flight, imagePath);
          notifiedFlights.push(flight);
        } catch (error) {
          this.logger.error('Error notifying about flight', { error, flightId: flight.id });
        }
      }
      
      // Update last notification time if any notifications were sent
      if (notifiedFlights.length > 0) {
        this.lastNotificationTime = Date.now();
      }
      
      this.logger.info(`Notified about ${notifiedFlights.length} flights`);
      return notifiedFlights;
    } catch (error) {
      this.logger.error('Error notifying about flights', { error });
      this.errorHandler.handleError(
        new NotificationManagerError('Failed to notify about flights', error as Error)
      );
      return [];
    }
  }
  
  /**
   * Clear all active notifications
   */
  public async clearAllNotifications(): Promise<void> {
    try {
      await this.notificationService.cancelAllNotifications();
      this.logger.info('Cleared all notifications');
    } catch (error) {
      this.logger.error('Error clearing all notifications', { error });
      this.errorHandler.handleError(
        new NotificationManagerError('Failed to clear all notifications', error as Error)
      );
    }
  }
  
  /**
   * Check if we should send a notification based on throttling rules
   * @returns True if notification should be sent
   */
  private shouldSendNotification(): boolean {
    const now = Date.now();
    const timeSinceLastNotification = now - this.lastNotificationTime;
    
    return timeSinceLastNotification >= this.throttleIntervalMs;
  }
}