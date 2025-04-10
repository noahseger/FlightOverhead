import {
  PERMISSIONS,
  RESULTS,
  check,
  request,
  openSettings,
  Permission,
  PermissionStatus,
} from 'react-native-permissions';
import { Platform, Linking } from 'react-native';
import { Logger } from './Logger';
import { ErrorHandler } from './ErrorHandler';
import { AppError } from './AppError';

export class PermissionError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(`PermissionError: ${message}`, originalError);
    this.name = 'PermissionError';
  }
}

export interface IPermissionManager {
  checkLocationPermission(): Promise<boolean>;
  requestLocationPermission(): Promise<boolean>;
  checkBackgroundLocationPermission(): Promise<boolean>;
  requestBackgroundLocationPermission(): Promise<boolean>;
  checkNotificationPermission(): Promise<boolean>;
  requestNotificationPermission(): Promise<boolean>;
  areAllRequiredPermissionsGranted(): Promise<boolean>;
  openAppSettings(): Promise<boolean>;
}

export class PermissionManager implements IPermissionManager {
  private static instance: PermissionManager;
  private logger = new Logger('PermissionManager');
  private errorHandler = new ErrorHandler();

  private constructor() {}

  public static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  public async checkLocationPermission(): Promise<boolean> {
    try {
      const permission = this.getLocationPermission();
      const result = await check(permission);
      
      const granted = result === RESULTS.GRANTED;
      this.logger.info(`Location permission check: ${result} (granted: ${granted})`);
      
      return granted;
    } catch (error) {
      this.logger.error('Error checking location permission', { error });
      this.errorHandler.handleError(
        new PermissionError('Failed to check location permission', error as Error)
      );
      return false;
    }
  }

  public async requestLocationPermission(): Promise<boolean> {
    try {
      const permission = this.getLocationPermission();
      const result = await request(permission);
      
      const granted = result === RESULTS.GRANTED;
      this.logger.info(`Location permission request: ${result} (granted: ${granted})`);
      
      return granted;
    } catch (error) {
      this.logger.error('Error requesting location permission', { error });
      this.errorHandler.handleError(
        new PermissionError('Failed to request location permission', error as Error)
      );
      return false;
    }
  }

  public async checkBackgroundLocationPermission(): Promise<boolean> {
    try {
      // iOS doesn't have a separate background location permission
      if (Platform.OS === 'ios') {
        const permission = PERMISSIONS.IOS.LOCATION_ALWAYS;
        const result = await check(permission);
        
        const granted = result === RESULTS.GRANTED;
        this.logger.info(`Background location permission check (iOS): ${result} (granted: ${granted})`);
        
        return granted;
      }
      
      // Android requires a separate background location permission
      if (Platform.OS === 'android') {
        const permission = PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION;
        const result = await check(permission);
        
        const granted = result === RESULTS.GRANTED;
        this.logger.info(`Background location permission check (Android): ${result} (granted: ${granted})`);
        
        return granted;
      }
      
      return false;
    } catch (error) {
      this.logger.error('Error checking background location permission', { error });
      this.errorHandler.handleError(
        new PermissionError('Failed to check background location permission', error as Error)
      );
      return false;
    }
  }

  public async requestBackgroundLocationPermission(): Promise<boolean> {
    try {
      // iOS doesn't have a separate background location permission
      if (Platform.OS === 'ios') {
        const permission = PERMISSIONS.IOS.LOCATION_ALWAYS;
        const result = await request(permission);
        
        const granted = result === RESULTS.GRANTED;
        this.logger.info(`Background location permission request (iOS): ${result} (granted: ${granted})`);
        
        return granted;
      }
      
      // Android requires a separate background location permission
      if (Platform.OS === 'android') {
        // On Android, we need to check if the foreground permission is granted first
        const foregroundGranted = await this.checkLocationPermission();
        if (!foregroundGranted) {
          this.logger.warn('Cannot request background location without foreground location permission');
          return false;
        }
        
        const permission = PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION;
        const result = await request(permission);
        
        const granted = result === RESULTS.GRANTED;
        this.logger.info(`Background location permission request (Android): ${result} (granted: ${granted})`);
        
        return granted;
      }
      
      return false;
    } catch (error) {
      this.logger.error('Error requesting background location permission', { error });
      this.errorHandler.handleError(
        new PermissionError('Failed to request background location permission', error as Error)
      );
      return false;
    }
  }

  public async checkNotificationPermission(): Promise<boolean> {
    try {
      const permission = this.getNotificationPermission();
      
      // iOS < 12 doesn't require notification permission
      if (!permission) {
        return true;
      }
      
      const result = await check(permission);
      
      const granted = result === RESULTS.GRANTED;
      this.logger.info(`Notification permission check: ${result} (granted: ${granted})`);
      
      return granted;
    } catch (error) {
      this.logger.error('Error checking notification permission', { error });
      this.errorHandler.handleError(
        new PermissionError('Failed to check notification permission', error as Error)
      );
      return false;
    }
  }

  public async requestNotificationPermission(): Promise<boolean> {
    try {
      const permission = this.getNotificationPermission();
      
      // iOS < 12 doesn't require notification permission
      if (!permission) {
        return true;
      }
      
      const result = await request(permission);
      
      const granted = result === RESULTS.GRANTED;
      this.logger.info(`Notification permission request: ${result} (granted: ${granted})`);
      
      return granted;
    } catch (error) {
      this.logger.error('Error requesting notification permission', { error });
      this.errorHandler.handleError(
        new PermissionError('Failed to request notification permission', error as Error)
      );
      return false;
    }
  }

  public async areAllRequiredPermissionsGranted(): Promise<boolean> {
    try {
      // Check location permission (required)
      const locationGranted = await this.checkLocationPermission();
      if (!locationGranted) {
        this.logger.warn('Location permission not granted');
        return false;
      }
      
      // Check background location permission (required)
      const backgroundLocationGranted = await this.checkBackgroundLocationPermission();
      if (!backgroundLocationGranted) {
        this.logger.warn('Background location permission not granted');
        return false;
      }
      
      // Check notification permission (required)
      const notificationGranted = await this.checkNotificationPermission();
      if (!notificationGranted) {
        this.logger.warn('Notification permission not granted');
        return false;
      }
      
      this.logger.info('All required permissions granted');
      return true;
    } catch (error) {
      this.logger.error('Error checking all required permissions', { error });
      this.errorHandler.handleError(
        new PermissionError('Failed to check all required permissions', error as Error)
      );
      return false;
    }
  }

  public async openAppSettings(): Promise<boolean> {
    try {
      await openSettings();
      return true;
    } catch (error) {
      this.logger.error('Error opening app settings', { error });
      
      // Fallback to generic Linking API if openSettings fails
      try {
        if (Platform.OS === 'ios') {
          await Linking.openURL('app-settings:');
        } else {
          await Linking.openSettings();
        }
        return true;
      } catch (fallbackError) {
        this.logger.error('Fallback to open app settings also failed', { error: fallbackError });
        this.errorHandler.handleError(
          new PermissionError('Failed to open app settings', error as Error)
        );
        return false;
      }
    }
  }

  private getLocationPermission(): Permission {
    if (Platform.OS === 'ios') {
      return PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
    } else {
      return PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
    }
  }

  private getNotificationPermission(): Permission | null {
    if (Platform.OS === 'ios') {
      return PERMISSIONS.IOS.NOTIFICATIONS;
    } else if (Platform.OS === 'android') {
      // On Android 13+ (API level 33+) this is required
      // For older versions, no runtime permission is needed
      if (Platform.Version >= 33) {
        return PERMISSIONS.ANDROID.POST_NOTIFICATIONS;
      }
      return null;
    }
    return null;
  }
}