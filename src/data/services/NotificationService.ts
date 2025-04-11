import { Notifications, Notification, NotificationCompletion, NotificationAction } from 'react-native-notifications';
import { Platform } from 'react-native';
import { Flight } from '../../domain/models';
import { 
  AppError, 
  ErrorHandler, 
  Logger, 
  PermissionManager, 
  DeepLinkHandler, 
  DeepLinkType 
} from '../../core/utils';

export class NotificationError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(`NotificationError: ${message}`, originalError);
    this.name = 'NotificationError';
  }
}

export enum NotificationActionType {
  VIEW_DETAILS = 'view_details',
  SHOW_HISTORY = 'show_history',
  DISMISS = 'dismiss'
}

export interface INotificationService {
  requestPermissions(): Promise<boolean>;
  showFlightNotification(flight: Flight, imagePath?: string | null): Promise<string>;
  cancelNotification(id: string): Promise<void>;
  cancelAllNotifications(): Promise<void>;
  setupNotifications(): Promise<void>;
  handleNotificationAction(action: NotificationAction): Promise<boolean>;
}

export class NotificationService implements INotificationService {
  private static instance: NotificationService;
  private logger = new Logger('NotificationService');
  private errorHandler = new ErrorHandler();
  private permissionManager: PermissionManager;
  private deepLinkHandler: DeepLinkHandler;
  private initialized = false;
  private sentNotifications: Set<string> = new Set();
  
  private constructor(permissionManager: PermissionManager) {
    this.permissionManager = permissionManager;
    this.deepLinkHandler = DeepLinkHandler.getInstance();
  }
  
  public static getInstance(permissionManager?: PermissionManager): NotificationService {
    if (!NotificationService.instance) {
      if (!permissionManager) {
        throw new Error('PermissionManager is required for first initialization');
      }
      NotificationService.instance = new NotificationService(permissionManager);
    }
    return NotificationService.instance;
  }
  
  /**
   * Request notification permissions from the user
   * @returns Promise resolving to true if permissions granted
   */
  public async requestPermissions(): Promise<boolean> {
    try {
      return await this.permissionManager.requestNotificationPermission();
    } catch (error) {
      this.logger.error('Error requesting notification permissions', { error });
      this.errorHandler.handleError(
        new NotificationError('Failed to request notification permissions', error as Error)
      );
      return false;
    }
  }
  
  /**
   * Set up notification listeners and channels
   */
  public async setupNotifications(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Register notification events
      Notifications.events().registerNotificationReceivedForeground(
        (notification: Notification, completion: (response: NotificationCompletion) => void) => {
          this.logger.info('Notification received in foreground', { notification });
          // Complete the notification
          completion({ alert: true, sound: true, badge: true });
        }
      );
      
      Notifications.events().registerNotificationOpened(
        (notification: Notification, completion: () => void) => {
          this.logger.info('Notification opened', { notification });
          
          // Navigate to flight details when notification is tapped
          if (notification.payload?.data?.flightId) {
            this.handleNotificationTap(notification).catch(error => {
              this.logger.error('Error handling notification tap', { error });
            });
          }
          
          completion();
        }
      );
      
      // Register for notification actions (buttons)
      Notifications.events().registerNotificationActionReceived(
        (action: NotificationAction) => {
          this.logger.info('Notification action received', { 
            action: action.identifier,
            notification: action.notification
          });
          
          this.handleNotificationAction(action).catch(error => {
            this.logger.error('Error handling notification action', { error });
          });
        }
      );
      
      if (Platform.OS === 'android') {
        // Create notification channels for Android
        Notifications.setNotificationChannel({
          channelId: 'flight-overhead-channel',
          name: 'Flight Alerts',
          description: 'Notifications for aircraft flying overhead',
          importance: 4, // HIGH
          enableLights: true,
          enableVibration: true,
          lightColor: '#0000FF',
          soundFile: 'default',
          showBadge: true, // Show badge count
        });
        
        this.logger.info('Created Android notification channel: flight-overhead-channel');
      }
      
      this.initialized = true;
      this.logger.info('Notification service initialized');
    } catch (error) {
      this.logger.error('Error setting up notifications', { error });
      this.errorHandler.handleError(
        new NotificationError('Failed to set up notifications', error as Error)
      );
    }
  }
  
  /**
   * Handle notification tap by navigating to flight details
   * @param notification The notification that was tapped
   * @returns Promise resolving to true if handled successfully
   */
  private async handleNotificationTap(notification: Notification): Promise<boolean> {
    try {
      const flightId = notification.payload?.data?.flightId;
      
      if (!flightId) {
        this.logger.warn('Notification tap missing flight ID', { notification });
        return false;
      }
      
      // Use DeepLinkHandler to navigate to flight details
      return await this.deepLinkHandler.navigateToScreen({
        type: DeepLinkType.FLIGHT_DETAILS,
        params: { flightId }
      });
    } catch (error) {
      this.logger.error('Error handling notification tap', { error });
      this.errorHandler.handleError(
        new NotificationError('Failed to handle notification tap', error as Error)
      );
      return false;
    }
  }
  
  /**
   * Show a notification for a detected flight
   * @param flight The flight to show a notification for
   * @param imagePath Optional path to aircraft image for rich notification
   * @returns Promise resolving to the notification ID
   */
  public async showFlightNotification(flight: Flight, imagePath?: string | null): Promise<string> {
    try {
      await this.setupNotifications();
      
      // Check if we've already sent a notification for this flight
      if (this.sentNotifications.has(flight.id)) {
        this.logger.debug('Skipping duplicate notification for flight', { id: flight.id });
        return flight.id;
      }
      
      // Calculate notification duration based on aircraft speed and altitude
      // Higher/faster aircraft will have notifications displayed longer
      // Default is 60 seconds
      const durationMs = this.calculateNotificationDuration(flight);
      
      // Format the notification content
      const title = this.formatNotificationTitle(flight);
      const body = this.formatNotificationBody(flight);
      
      // Create notification object
      const notification: any = {
        identifier: flight.id,
        title,
        body,
        sound: 'default',
        badge: 1,
        data: { flightId: flight.id },
        android: {
          channelId: 'flight-overhead-channel',
          autoCancel: true,
          ongoing: false,
          smallIcon: 'ic_notification', // References drawable/ic_notification.xml
        },
        ios: {
          threadId: 'flight-notifications',
        },
      };
      
      // Add notification actions (buttons)
      notification.actions = [
        {
          identifier: NotificationActionType.VIEW_DETAILS,
          title: 'View Details',
          authenticationRequired: false,
          textInput: false,
          foreground: true,
        },
        {
          identifier: NotificationActionType.SHOW_HISTORY,
          title: 'Flight History',
          authenticationRequired: false,
          textInput: false,
          foreground: true,
        },
        {
          identifier: NotificationActionType.DISMISS,
          title: 'Dismiss',
          authenticationRequired: false,
          textInput: false,
          foreground: false,
          destructive: true,
        },
      ];
      
      // Add aircraft image if available and platform is supported
      if (imagePath) {
        this.logger.debug('Adding image to notification', { flightId: flight.id, imagePath });
        
        if (Platform.OS === 'android') {
          // For Android, set the large icon and big picture style
          notification.android.largeIcon = imagePath;
          notification.android.bigPictureStyle = {
            picture: imagePath,
            largeIcon: imagePath,
            contentTitle: title,
            summaryText: body,
          };
        } else if (Platform.OS === 'ios') {
          // For iOS, set the attachment
          notification.ios.attachments = [
            {
              identifier: `aircraft-image-${flight.id}`,
              url: imagePath,
              options: {
                typeHint: 'jpg',
              },
            },
          ];
          
          // Setup action category for iOS
          notification.ios.category = 'flight_notification';
        } else {
          // For unsupported platforms, log a warning but continue without the image
          this.logger.warn('Rich notifications with images not supported on this platform');
        }
      }
      
      // Post the notification
      await Notifications.postLocalNotification(notification);
      
      // Add to sent notifications set
      this.sentNotifications.add(flight.id);
      
      // Schedule removal from sent notifications after duration
      setTimeout(() => {
        this.sentNotifications.delete(flight.id);
      }, durationMs);
      
      this.logger.info('Notification sent for flight', { 
        id: flight.id, 
        hasImage: Boolean(imagePath),
        platform: Platform.OS
      });
      return flight.id;
    } catch (error) {
      this.logger.error('Error showing notification for flight', { error, flight });
      this.errorHandler.handleError(
        new NotificationError('Failed to show flight notification', error as Error)
      );
      throw new NotificationError('Failed to show flight notification', error as Error);
    }
  }
  
  /**
   * Handle notification action button presses
   * @param action The notification action that was triggered
   * @returns Promise resolving to true if handled successfully
   */
  public async handleNotificationAction(action: NotificationAction): Promise<boolean> {
    try {
      const notification = action.notification;
      const flightId = notification.payload?.data?.flightId;
      
      if (!flightId) {
        this.logger.warn('Notification action missing flight ID', { action });
        return false;
      }
      
      // Handle different action types
      switch (action.identifier) {
        case NotificationActionType.VIEW_DETAILS:
          // Navigate to flight details screen
          return await this.deepLinkHandler.navigateToScreen({
            type: DeepLinkType.FLIGHT_DETAILS,
            params: { flightId }
          });
          
        case NotificationActionType.SHOW_HISTORY:
          // Navigate to flight history screen
          return await this.deepLinkHandler.navigateToScreen({
            type: DeepLinkType.FLIGHT_HISTORY,
            params: {}
          });
          
        case NotificationActionType.DISMISS:
          // Just dismiss the notification (already handled by the system)
          this.logger.debug('Notification dismissed', { flightId });
          return true;
          
        default:
          this.logger.warn('Unknown notification action', { actionId: action.identifier });
          return false;
      }
    } catch (error) {
      this.logger.error('Error handling notification action', { error, action });
      this.errorHandler.handleError(
        new NotificationError('Failed to handle notification action', error as Error)
      );
      return false;
    }
  }
  
  /**
   * Cancel a specific notification
   * @param id The notification ID to cancel
   */
  public async cancelNotification(id: string): Promise<void> {
    try {
      await Notifications.cancelLocalNotification(id);
      this.sentNotifications.delete(id);
      this.logger.info('Cancelled notification', { id });
    } catch (error) {
      this.logger.error('Error cancelling notification', { error, id });
      this.errorHandler.handleError(
        new NotificationError(`Failed to cancel notification: ${id}`, error as Error)
      );
    }
  }
  
  /**
   * Cancel all pending notifications
   */
  public async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllLocalNotifications();
      this.sentNotifications.clear();
      this.logger.info('Cancelled all notifications');
    } catch (error) {
      this.logger.error('Error cancelling all notifications', { error });
      this.errorHandler.handleError(
        new NotificationError('Failed to cancel all notifications', error as Error)
      );
    }
  }
  
  /**
   * Format the notification title
   * @param flight The flight details
   * @returns Formatted title string
   */
  private formatNotificationTitle(flight: Flight): string {
    if (flight.flightNumber && flight.flightNumber !== 'Unknown') {
      return `Flight ${flight.flightNumber} Overhead`;
    }
    return 'Aircraft Overhead';
  }
  
  /**
   * Format the notification body with flight details
   * @param flight The flight details
   * @returns Formatted body string
   */
  private formatNotificationBody(flight: Flight): string {
    let body = '';
    
    // Add aircraft type if available
    if (flight.aircraftType && flight.aircraftType !== 'Unknown') {
      body += `${flight.aircraftType} `;
    }
    
    // Add altitude
    body += `at ${flight.altitude.toLocaleString()} feet`;
    
    // Add speed and heading
    body += `, traveling ${flight.speed} knots`;
    
    // Add origin/destination if available
    if (flight.origin !== 'Unknown' && flight.destination !== 'Unknown') {
      body += ` from ${flight.origin} to ${flight.destination}`;
    } else if (flight.originCity !== 'Unknown') {
      body += ` from ${flight.originCity}`;
    }
    
    return body;
  }
  
  /**
   * Calculate how long the notification should remain active
   * @param flight The flight details
   * @returns Duration in milliseconds
   */
  private calculateNotificationDuration(flight: Flight): number {
    // Base duration: 60 seconds
    let durationMs = 60 * 1000;
    
    // Adjust based on altitude (higher = longer duration)
    // For every 10,000 feet, add 30 seconds (up to 3 minutes extra)
    const altitudeFactor = Math.min(3, flight.altitude / 10000);
    durationMs += altitudeFactor * 30 * 1000;
    
    return durationMs;
  }
}