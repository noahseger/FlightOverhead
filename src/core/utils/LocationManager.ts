import { Logger } from './Logger';
import { ErrorHandler } from './ErrorHandler';
import { ILocationService, LocationError, LocationService } from '../../data/services/LocationService';
import { SettingsRepository } from '../../data/repositories';

type LocationCoordinates = {
  latitude: number;
  longitude: number;
};

type LocationUpdateCallback = (location: LocationCoordinates) => void;

export class LocationManager {
  private static instance: LocationManager;
  private locationService: ILocationService;
  private logger = new Logger('LocationManager');
  private errorHandler = new ErrorHandler();
  private callbacks: LocationUpdateCallback[] = [];
  private isUpdating = false;

  private constructor(locationService: ILocationService) {
    this.locationService = locationService;
  }

  public static getInstance(settingsRepository?: SettingsRepository): LocationManager {
    if (!LocationManager.instance) {
      if (!settingsRepository) {
        throw new Error('SettingsRepository is required for first initialization');
      }
      const locationService = new LocationService(settingsRepository);
      LocationManager.instance = new LocationManager(locationService);
    }
    return LocationManager.instance;
  }

  public async requestLocationPermissions(): Promise<boolean> {
    try {
      return await this.locationService.requestPermissions();
    } catch (error) {
      this.logger.error('Failed to request location permissions', { error });
      this.errorHandler.handleError(
        new LocationError('LocationManager could not request permissions', error as Error)
      );
      return false;
    }
  }

  public async getCurrentLocation(): Promise<LocationCoordinates> {
    try {
      return await this.locationService.getCurrentLocation();
    } catch (error) {
      this.logger.error('Failed to get current location in manager', { error });
      throw new LocationError('LocationManager could not get current location', error as Error);
    }
  }

  public async getLastKnownLocation(): Promise<LocationCoordinates | null> {
    try {
      return await this.locationService.getLastKnownLocation();
    } catch (error) {
      this.logger.error('Failed to get last known location in manager', { error });
      this.errorHandler.handleError(
        new LocationError('LocationManager could not get last known location', error as Error)
      );
      return null;
    }
  }

  public registerLocationCallback(callback: LocationUpdateCallback): void {
    this.callbacks.push(callback);
    
    if (this.callbacks.length > 0 && !this.isUpdating) {
      this.startLocationUpdates();
    }
  }

  public unregisterLocationCallback(callback: LocationUpdateCallback): void {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
    
    if (this.callbacks.length === 0 && this.isUpdating) {
      this.stopLocationUpdates();
    }
  }

  public startLocationUpdates(): void {
    if (this.isUpdating) return;
    
    try {
      this.locationService.startLocationUpdates(this.handleLocationUpdate.bind(this));
      this.isUpdating = true;
      this.logger.info('Started location updates in manager');
    } catch (error) {
      this.logger.error('Failed to start location updates in manager', { error });
      this.errorHandler.handleError(
        new LocationError('LocationManager could not start updates', error as Error)
      );
    }
  }

  public stopLocationUpdates(): void {
    if (!this.isUpdating) return;
    
    try {
      this.locationService.stopLocationUpdates();
      this.isUpdating = false;
      this.logger.info('Stopped location updates in manager');
    } catch (error) {
      this.logger.error('Failed to stop location updates in manager', { error });
      this.errorHandler.handleError(
        new LocationError('LocationManager could not stop updates', error as Error)
      );
    }
  }

  private handleLocationUpdate(location: LocationCoordinates): void {
    try {
      // Call all registered callbacks with the new location
      this.logger.debug('Received location update, notifying callbacks', { 
        latitude: location.latitude.toFixed(6),
        longitude: location.longitude.toFixed(6),
        callbackCount: this.callbacks.length
      });
      
      this.callbacks.forEach(callback => {
        try {
          callback(location);
        } catch (error) {
          this.logger.error('Error in location update callback', { error });
        }
      });
    } catch (error) {
      this.logger.error('Error handling location update', { error });
      this.errorHandler.handleError(
        new LocationError('LocationManager failed to process location update', error as Error)
      );
    }
  }
}
