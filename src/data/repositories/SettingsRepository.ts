import { AppSettings, Location } from '../../domain/models';
import { StorageService } from '../services/StorageService';

const SETTINGS_STORAGE_KEY = 'app_settings';
const DEFAULT_DETECTION_RADIUS_KM = 5.0;

/**
 * Repository for managing application settings
 */
export class SettingsRepository {
  private storageService: StorageService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  /**
   * Save app settings
   * @param settings AppSettings object
   */
  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await this.storageService.storeData(SETTINGS_STORAGE_KEY, settings);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw new Error('Failed to save app settings');
    }
  }

  /**
   * Get app settings
   * @returns AppSettings object
   */
  async getSettings(): Promise<AppSettings> {
    try {
      const settings = await this.storageService.getData<AppSettings>(SETTINGS_STORAGE_KEY);

      if (settings) {
        return settings;
      }

      // Return default settings if none are found
      const defaultSettings: AppSettings = {
        detectionRadiusKm: DEFAULT_DETECTION_RADIUS_KM,
        lastKnownLocation: null,
      };

      // Save default settings for future use
      await this.saveSettings(defaultSettings);

      return defaultSettings;
    } catch (error) {
      console.error('Error getting settings:', error);
      throw new Error('Failed to get app settings');
    }
  }

  /**
   * Update detection radius
   * @param radiusKm New radius in kilometers
   */
  async updateDetectionRadius(radiusKm: number): Promise<void> {
    try {
      const settings = await this.getSettings();
      const updatedSettings: AppSettings = {
        ...settings,
        detectionRadiusKm: radiusKm,
      };
      await this.saveSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating detection radius:', error);
      throw new Error('Failed to update detection radius');
    }
  }

  /**
   * Update last known location
   * @param location Location object
   */
  async updateLastKnownLocation(location: Location): Promise<void> {
    try {
      const settings = await this.getSettings();
      const updatedSettings: AppSettings = {
        ...settings,
        lastKnownLocation: location,
      };
      await this.saveSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating last known location:', error);
      throw new Error('Failed to update last known location');
    }
  }
}
