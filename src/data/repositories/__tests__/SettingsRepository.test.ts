import { SettingsRepository } from '../SettingsRepository';
import { StorageService } from '../../services/StorageService';
import { AppSettings, Location } from '../../../domain/models';

// Mock StorageService
jest.mock('../../services/StorageService');

describe('SettingsRepository', () => {
  let settingsRepository: SettingsRepository;
  let mockStorageService: jest.Mocked<StorageService>;

  const mockLocation: Location = {
    latitude: 40.7128,
    longitude: -74.0060,
  };

  const mockSettings: AppSettings = {
    detectionRadiusKm: 10.0,
    lastKnownLocation: mockLocation,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a fresh mocked instance for each test
    mockStorageService = {
      storeData: jest.fn(),
      getData: jest.fn(),
      removeData: jest.fn(),
      getAllKeys: jest.fn(),
    } as unknown as jest.Mocked<StorageService>;

    settingsRepository = new SettingsRepository(mockStorageService);
  });

  describe('saveSettings', () => {
    it('should save settings to storage', async () => {
      await settingsRepository.saveSettings(mockSettings);

      expect(mockStorageService.storeData).toHaveBeenCalledWith('app_settings', mockSettings);
    });

    it('should throw error when storage fails', async () => {
      mockStorageService.storeData.mockRejectedValueOnce(new Error('Storage error'));

      await expect(settingsRepository.saveSettings(mockSettings))
        .rejects
        .toThrow('Failed to save app settings');

      expect(mockStorageService.storeData).toHaveBeenCalledWith('app_settings', mockSettings);
    });
  });

  describe('getSettings', () => {
    it('should return settings from storage', async () => {
      mockStorageService.getData.mockResolvedValueOnce(mockSettings);

      const result = await settingsRepository.getSettings();

      expect(mockStorageService.getData).toHaveBeenCalledWith('app_settings');
      expect(result).toEqual(mockSettings);
    });

    it('should return default settings when none exist', async () => {
      mockStorageService.getData.mockResolvedValueOnce(null);

      const result = await settingsRepository.getSettings();

      expect(mockStorageService.getData).toHaveBeenCalledWith('app_settings');
      expect(mockStorageService.storeData).toHaveBeenCalledWith('app_settings', {
        detectionRadiusKm: 5.0,
        lastKnownLocation: null,
      });
      expect(result).toEqual({
        detectionRadiusKm: 5.0,
        lastKnownLocation: null,
      });
    });

    it('should throw error when retrieval fails', async () => {
      mockStorageService.getData.mockRejectedValueOnce(new Error('Retrieval error'));

      await expect(settingsRepository.getSettings())
        .rejects
        .toThrow('Failed to get app settings');

      expect(mockStorageService.getData).toHaveBeenCalledWith('app_settings');
    });
  });

  describe('updateDetectionRadius', () => {
    it('should update detection radius', async () => {
      mockStorageService.getData.mockResolvedValueOnce(mockSettings);

      const newRadius = 15.0;
      await settingsRepository.updateDetectionRadius(newRadius);

      expect(mockStorageService.getData).toHaveBeenCalledWith('app_settings');
      expect(mockStorageService.storeData).toHaveBeenCalledWith('app_settings', {
        ...mockSettings,
        detectionRadiusKm: newRadius,
      });
    });
  });

  describe('updateLastKnownLocation', () => {
    it('should update last known location', async () => {
      mockStorageService.getData.mockResolvedValueOnce(mockSettings);

      const newLocation: Location = {
        latitude: 34.0522,
        longitude: -118.2437,
      };
      await settingsRepository.updateLastKnownLocation(newLocation);

      expect(mockStorageService.getData).toHaveBeenCalledWith('app_settings');
      expect(mockStorageService.storeData).toHaveBeenCalledWith('app_settings', {
        ...mockSettings,
        lastKnownLocation: newLocation,
      });
    });
  });
});
