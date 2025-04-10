import { LocationService, LocationError } from '../LocationService';
import { SettingsRepository } from '../../repositories';
import Geolocation from '@react-native-community/geolocation';

// Mock dependencies
jest.mock('@react-native-community/geolocation');
jest.mock('../../repositories');

describe('LocationService', () => {
  let locationService: LocationService;
  let settingsRepository: jest.Mocked<SettingsRepository>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock for settings repository
    settingsRepository = {
      saveSettings: jest.fn(),
      getSettings: jest.fn().mockResolvedValue({
        detectionRadiusKm: 5.0,
        lastKnownLocation: { latitude: 37.7749, longitude: -122.4194 },
      }),
      updateDetectionRadius: jest.fn(),
      updateLastKnownLocation: jest.fn(),
    } as unknown as jest.Mocked<SettingsRepository>;

    // Set up Geolocation mock
    (Geolocation.setRNConfiguration as jest.Mock).mockImplementation(() => {});
    (Geolocation.requestAuthorization as jest.Mock).mockImplementation((success) => {
      success();
    });
    (Geolocation.getCurrentPosition as jest.Mock).mockImplementation((success) => {
      success({
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          altitude: 0,
          accuracy: 5,
          altitudeAccuracy: 5,
          heading: 0,
          speed: 0,
        },
        timestamp: Date.now(),
      });
    });
    (Geolocation.watchPosition as jest.Mock).mockReturnValue(123);
    (Geolocation.clearWatch as jest.Mock).mockImplementation(() => {});

    // Create location service
    locationService = new LocationService(settingsRepository);
  });

  describe('requestPermissions', () => {
    it('should return true when permissions are granted', async () => {
      const result = await locationService.requestPermissions();
      expect(result).toBe(true);
      expect(Geolocation.requestAuthorization).toHaveBeenCalled();
    });

    it('should return false when permissions are denied', async () => {
      (Geolocation.requestAuthorization as jest.Mock).mockImplementation((success, error) => {
        error(new Error('Permission denied'));
      });
      
      const result = await locationService.requestPermissions();
      
      expect(result).toBe(false);
      expect(Geolocation.requestAuthorization).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (Geolocation.requestAuthorization as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      const result = await locationService.requestPermissions();
      
      expect(result).toBe(false);
    });
  });

  describe('getCurrentLocation', () => {
    it('should return the current location', async () => {
      const location = await locationService.getCurrentLocation();
      
      expect(location).toEqual({
        latitude: 37.7749,
        longitude: -122.4194,
      });
      expect(Geolocation.getCurrentPosition).toHaveBeenCalled();
      expect(settingsRepository.updateLastKnownLocation).toHaveBeenCalledWith({
        latitude: 37.7749,
        longitude: -122.4194,
      });
    });

    it('should throw a LocationError when geolocation fails', async () => {
      (Geolocation.getCurrentPosition as jest.Mock).mockImplementation((success, error) => {
        error({ code: 1, message: 'Location permission denied' });
      });
      
      await expect(locationService.getCurrentLocation()).rejects.toThrow(LocationError);
    });
  });

  describe('startLocationUpdates', () => {
    it('should start watching position and call the callback with location updates', () => {
      const mockCallback = jest.fn();
      locationService.startLocationUpdates(mockCallback);
      
      // Simulate a location update
      const successCallback = (Geolocation.watchPosition as jest.Mock).mock.calls[0][0];
      successCallback({
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
      });
      
      expect(Geolocation.watchPosition).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith({
        latitude: 37.7749,
        longitude: -122.4194,
      });
      expect(settingsRepository.updateLastKnownLocation).toHaveBeenCalledWith({
        latitude: 37.7749,
        longitude: -122.4194,
      });
    });

    it('should stop previous updates if already watching', () => {
      const mockCallback = jest.fn();
      
      // Start updates once
      locationService.startLocationUpdates(mockCallback);
      
      // Then start updates again
      locationService.startLocationUpdates(mockCallback);
      
      expect(Geolocation.clearWatch).toHaveBeenCalledWith(123);
    });
  });

  describe('stopLocationUpdates', () => {
    it('should stop watching position', () => {
      const mockCallback = jest.fn();
      
      // Start updates
      locationService.startLocationUpdates(mockCallback);
      
      // Then stop updates
      locationService.stopLocationUpdates();
      
      expect(Geolocation.clearWatch).toHaveBeenCalledWith(123);
    });

    it('should do nothing if not watching', () => {
      locationService.stopLocationUpdates();
      expect(Geolocation.clearWatch).not.toHaveBeenCalled();
    });
  });

  describe('getLastKnownLocation', () => {
    it('should return the last known location from settings', async () => {
      const location = await locationService.getLastKnownLocation();
      
      expect(location).toEqual({
        latitude: 37.7749,
        longitude: -122.4194,
      });
      expect(settingsRepository.getSettings).toHaveBeenCalled();
    });

    it('should return null when there is no last known location', async () => {
      settingsRepository.getSettings.mockResolvedValue({
        detectionRadiusKm: 5.0,
        lastKnownLocation: null,
      });
      
      const location = await locationService.getLastKnownLocation();
      
      expect(location).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      settingsRepository.getSettings.mockRejectedValue(new Error('Settings error'));
      
      const location = await locationService.getLastKnownLocation();
      
      expect(location).toBeNull();
    });
  });
});