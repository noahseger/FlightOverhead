import { AircraftImageService } from '../../data/services/AircraftImageService';
import { NotificationService } from '../../data/services/NotificationService';
import { SettingsRepository } from '../../data/repositories/SettingsRepository';
import { FlightDetectionManager } from './FlightDetectionManager';
import { NotificationManager } from './NotificationManager';
import { AircraftImageManager } from './AircraftImageManager';
import { Logger } from '../../core/utils';
import { PermissionManager } from '../../core/utils';

/**
 * Factory class that sets up the rich notification system
 * This connects the FlightDetectionManager, NotificationManager, and AircraftImageManager
 */
export class RichNotificationFactory {
  private static logger = new Logger('RichNotificationFactory');
  
  /**
   * Initialize the rich notification system
   * @returns Promise resolving when initialization is complete
   */
  public static async initializeRichNotifications(
    flightDetectionManager: FlightDetectionManager,
    settingsRepository: SettingsRepository,
    permissionManager: PermissionManager
  ): Promise<void> {
    try {
      // 1. Create and initialize the notification service
      const notificationService = NotificationService.getInstance(permissionManager);
      await notificationService.setupNotifications();
      
      // 2. Create and initialize the aircraft image service
      const aircraftImageService = AircraftImageService.getInstance();
      
      // 3. Create and initialize the aircraft image manager
      const aircraftImageManager = AircraftImageManager.getInstance(aircraftImageService);
      await aircraftImageManager.initialize();
      
      // 4. Create and initialize the notification manager
      const notificationManager = NotificationManager.getInstance(
        notificationService, 
        settingsRepository,
        aircraftImageManager
      );
      await notificationManager.initialize();
      
      // 5. Connect the notification manager to the flight detection manager
      flightDetectionManager.setNotificationManager(notificationManager);
      
      this.logger.info('Rich notification system initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize rich notification system', { error });
      throw new Error(`Failed to initialize rich notification system: ${error}`);
    }
  }
  
  /**
   * Create a predefined set of aircraft image types to prefetch
   * @returns Array of common aircraft types
   */
  public static getCommonAircraftTypesToPrefetch(): string[] {
    return [
      'B737', 'B738', 'B739', // Boeing 737 family
      'B747', 'B748', // Boeing 747 family
      'B777', 'B787', // Boeing widebodies
      'A319', 'A320', 'A321', // Airbus A320 family
      'A350', 'A380', // Airbus widebodies
      'E170', 'E190', // Embraer regional jets
      'CRJ2', 'CRJ7', 'CRJ9', // Bombardier CRJ regional jets
      'DH8', // Dash 8 turboprop
      'C172', // Cessna 172 (common small aircraft)
    ];
  }
}