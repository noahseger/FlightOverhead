import { LocationManager } from '../LocationManager';
import { ILocationService, LocationService, LocationError } from '../../../data/services/LocationService';
import { SettingsRepository } from '../../../data/repositories';

// Mock the dependencies
jest.mock('../../../data/services/LocationService');
jest.mock('../../../data/repositories');

describe('LocationManager', () => {
  let locationManager: LocationManager;
  let locationService: jest.Mocked<ILocationService>;
  let settingsRepository: jest.Mocked<SettingsRepository>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset singleton instance
    // @ts-ignore: accessing private static property for testing
    LocationManager.instance = undefined;

    // Set up the mocks
    locationService = {
      requestPermissions: jest.fn().mockResolvedValue(true),
      getCurrentLocation: jest.fn().mockResolvedValue({ latitude: 37.7749, longitude: -122.4194 }),
      startLocationUpdates: jest.fn(),
      stopLocationUpdates: jest.fn(),
      getLastKnownLocation: jest.fn().mockResolvedValue({ latitude: 37.7749, longitude: -122.4194 }),
    } as unknown as jest.Mocked<ILocationService>;

    (LocationService as jest.Mock).mockImplementation(() => locationService);

    settingsRepository = {
      saveSettings: jest.fn(),
      getSettings: jest.fn().mockResolvedValue({
        detectionRadiusKm: 5.0,
        lastKnownLocation: { latitude: 37.7749, longitude: -122.4194 },
      }),
      updateDetectionRadius: jest.fn(),
      updateLastKnownLocation: jest.fn(),
    } as unknown as jest.Mocked<SettingsRepository>;

    // Initialize the LocationManager
    locationManager = LocationManager.getInstance(settingsRepository);
  });

  describe('getInstance', () => {
    it('should create a new instance with settings repository', () => {
      expect(locationManager).toBeInstanceOf(LocationManager);
      expect(LocationService).toHaveBeenCalledWith(settingsRepository);
    });

    it('should return the existing instance when called again', () => {
      const secondInstance = LocationManager.getInstance();
      expect(secondInstance).toBe(locationManager);
    });

    it('should throw an error if not initialized with settings repository', () => {
      // Reset the instance
      // @ts-ignore: accessing private static property for testing
      LocationManager.instance = undefined;
      
      expect(() => LocationManager.getInstance()).toThrow('SettingsRepository is required for first initialization');
    });
  });

  describe('requestLocationPermissions', () => {
    it('should request permissions from the location service', async () => {
      const result = await locationManager.requestLocationPermissions();
      
      expect(result).toBe(true);
      expect(locationService.requestPermissions).toHaveBeenCalled();
    });

    it('should handle permission failures', async () => {
      locationService.requestPermissions.mockResolvedValue(false);
      
      const result = await locationManager.requestLocationPermissions();
      
      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      locationService.requestPermissions.mockRejectedValue(new Error('Permission error'));
      
      const result = await locationManager.requestLocationPermissions();
      
      expect(result).toBe(false);
    });
  });

  describe('getCurrentLocation', () => {
    it('should get the current location from the service', async () => {
      const location = await locationManager.getCurrentLocation();
      
      expect(location).toEqual({ latitude: 37.7749, longitude: -122.4194 });
      expect(locationService.getCurrentLocation).toHaveBeenCalled();
    });

    it('should throw an error when the service fails', async () => {
      locationService.getCurrentLocation.mockRejectedValue(new LocationError('Failed to get location'));
      
      await expect(locationManager.getCurrentLocation()).rejects.toThrow(LocationError);
    });
  });

  describe('getLastKnownLocation', () => {
    it('should get the last known location from the service', async () => {
      const location = await locationManager.getLastKnownLocation();
      
      expect(location).toEqual({ latitude: 37.7749, longitude: -122.4194 });
      expect(locationService.getLastKnownLocation).toHaveBeenCalled();
    });

    it('should return null when no location is available', async () => {
      locationService.getLastKnownLocation.mockResolvedValue(null);
      
      const location = await locationManager.getLastKnownLocation();
      
      expect(location).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      locationService.getLastKnownLocation.mockRejectedValue(new Error('Service error'));
      
      const location = await locationManager.getLastKnownLocation();
      
      expect(location).toBeNull();
    });
  });

  describe('location callbacks', () => {
    it('should register callbacks and start updates if not already updating', () => {
      const callback = jest.fn();
      locationManager.registerLocationCallback(callback);
      
      expect(locationService.startLocationUpdates).toHaveBeenCalled();
    });

    it('should not restart updates when registering multiple callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      locationManager.registerLocationCallback(callback1);
      locationService.startLocationUpdates.mockClear();
      
      locationManager.registerLocationCallback(callback2);
      
      expect(locationService.startLocationUpdates).not.toHaveBeenCalled();
    });

    it('should unregister callbacks and stop updates when the last callback is removed', () => {
      const callback = jest.fn();
      
      locationManager.registerLocationCallback(callback);
      locationManager.unregisterLocationCallback(callback);
      
      expect(locationService.stopLocationUpdates).toHaveBeenCalled();
    });

    it('should not stop updates when there are still active callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      locationManager.registerLocationCallback(callback1);
      locationManager.registerLocationCallback(callback2);
      
      locationManager.unregisterLocationCallback(callback1);
      
      expect(locationService.stopLocationUpdates).not.toHaveBeenCalled();
    });
  });

  describe('startLocationUpdates', () => {
    it('should start location updates through the service', () => {
      locationManager.startLocationUpdates();
      
      expect(locationService.startLocationUpdates).toHaveBeenCalled();
    });

    it('should not start updates if already updating', () => {
      // Start updates once
      locationManager.startLocationUpdates();
      locationService.startLocationUpdates.mockClear();
      
      // Try to start updates again
      locationManager.startLocationUpdates();
      
      expect(locationService.startLocationUpdates).not.toHaveBeenCalled();
    });
  });

  describe('stopLocationUpdates', () => {
    it('should stop location updates through the service', () => {
      // Set up the state as if updates are active
      locationManager.startLocationUpdates();
      locationService.stopLocationUpdates.mockClear();
      
      locationManager.stopLocationUpdates();
      
      expect(locationService.stopLocationUpdates).toHaveBeenCalled();
    });

    it('should not stop updates if not currently updating', () => {
      locationManager.stopLocationUpdates();
      
      expect(locationService.stopLocationUpdates).not.toHaveBeenCalled();
    });
  });
});