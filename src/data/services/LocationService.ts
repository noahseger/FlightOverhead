import Geolocation, { GeoPosition, GeoError } from '@react-native-community/geolocation';
import { AppError, ErrorHandler, Logger } from '../../core/utils';
import { SettingsRepository } from '../repositories';

type LocationCoordinates = {
  latitude: number;
  longitude: number;
};

type LocationCallback = (location: LocationCoordinates) => void;

export interface ILocationService {
  requestPermissions(): Promise<boolean>;
  getCurrentLocation(): Promise<LocationCoordinates>;
  startLocationUpdates(callback: LocationCallback): void;
  stopLocationUpdates(): void;
  getLastKnownLocation(): Promise<LocationCoordinates | null>;
}

export class LocationError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(`LocationError: ${message}`, originalError);
    this.name = 'LocationError';
  }
}

export class LocationService implements ILocationService {
  private logger = new Logger('LocationService');
  private errorHandler = new ErrorHandler();
  private watchId: number | null = null;
  private settingsRepository: SettingsRepository;
  private isConfigured = false;

  constructor(settingsRepository: SettingsRepository) {
    this.settingsRepository = settingsRepository;
  }
  
  // Configure geolocation lazily instead of in the constructor
  private configureGeolocation(): void {
    if (this.isConfigured) return;
    
    try {
      Geolocation.setRNConfiguration({
        skipPermissionRequests: false,
        authorizationLevel: 'whenInUse',
        locationProvider: 'auto',
      });
      this.isConfigured = true;
    } catch (error) {
      this.logger.error('Failed to configure geolocation', { error });
      // Continue without throwing to allow app to run with degraded functionality
    }
  }

  async requestPermissions(): Promise<boolean> {
    this.configureGeolocation();
    
    try {
      return new Promise<boolean>((resolve) => {
        Geolocation.requestAuthorization(
          () => {
            this.logger.info('Location permissions granted');
            resolve(true);
          },
          (error) => {
            this.logger.error('Location permission denied', { error });
            resolve(false);
          }
        );
      });
    } catch (error) {
      this.logger.error('Error requesting location permissions', { error });
      this.errorHandler.handleError(
        new LocationError('Failed to request location permissions', error as Error)
      );
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationCoordinates> {
    this.configureGeolocation();
    
    try {
      return new Promise<LocationCoordinates>((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position: GeoPosition) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            
            // Save last known location
            this.saveLastKnownLocation(location);
            
            resolve(location);
          },
          (error: GeoError) => {
            this.logger.error('Error getting current location', { error });
            reject(new LocationError(`Failed to get current location: ${error.message}`));
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      });
    } catch (error) {
      this.logger.error('Unexpected error getting current location', { error });
      throw new LocationError('Failed to get current location', error as Error);
    }
  }

  startLocationUpdates(callback: LocationCallback): void {
    this.configureGeolocation();
    
    if (this.watchId !== null) {
      this.stopLocationUpdates();
    }

    try {
      this.watchId = Geolocation.watchPosition(
        (position: GeoPosition) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          
          // Save last known location
          this.saveLastKnownLocation(location);
          
          callback(location);
        },
        (error: GeoError) => {
          this.logger.error('Error watching location updates', { error });
          this.errorHandler.handleError(
            new LocationError(`Location update error: ${error.message}`)
          );
        },
        { 
          enableHighAccuracy: true, 
          distanceFilter: 100, // minimum distance (meters) between location updates
          interval: 5000, // minimum time (milliseconds) between location updates
          fastestInterval: 2000 // fastest rate at which app can handle updates
        }
      );

      this.logger.info('Started location updates', { watchId: this.watchId });
    } catch (error) {
      this.logger.error('Failed to start location updates', { error });
      this.errorHandler.handleError(
        new LocationError('Failed to start location updates', error as Error)
      );
    }
  }

  stopLocationUpdates(): void {
    if (this.watchId !== null) {
      try {
        Geolocation.clearWatch(this.watchId);
        this.watchId = null;
        this.logger.info('Stopped location updates');
      } catch (error) {
        this.logger.error('Error stopping location updates', { error });
        this.errorHandler.handleError(
          new LocationError('Failed to stop location updates', error as Error)
        );
      }
    }
  }

  async getLastKnownLocation(): Promise<LocationCoordinates | null> {
    try {
      const settings = await this.settingsRepository.getSettings();
      return settings.lastKnownLocation;
    } catch (error) {
      this.logger.error('Error getting last known location', { error });
      this.errorHandler.handleError(
        new LocationError('Failed to get last known location', error as Error)
      );
      return null;
    }
  }

  private async saveLastKnownLocation(location: LocationCoordinates): Promise<void> {
    try {
      await this.settingsRepository.updateLastKnownLocation(location);
    } catch (error) {
      this.logger.error('Error saving last known location', { error });
      this.errorHandler.handleError(
        new LocationError('Failed to save last known location', error as Error)
      );
    }
  }
}