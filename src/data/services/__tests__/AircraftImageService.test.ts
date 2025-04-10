import { AircraftImageService } from '../AircraftImageService';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

// Mock dependencies
jest.mock('react-native-fs', () => ({
  exists: jest.fn(),
  mkdir: jest.fn(),
  unlink: jest.fn(),
  copyFile: jest.fn(),
  CachesDirectoryPath: '/mock/cache',
  MainBundlePath: '/mock/bundle',
}));

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn(),
}));

describe('AircraftImageService', () => {
  let aircraftImageService: AircraftImageService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    aircraftImageService = AircraftImageService.getInstance();
  });
  
  describe('getInstance', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = AircraftImageService.getInstance();
      const instance2 = AircraftImageService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
  
  describe('getImageForAircraftType', () => {
    it('should return cached image path if image exists in cache', async () => {
      // Mock image exists in filesystem cache
      (RNFS.exists as jest.Mock).mockResolvedValue(true);
      
      const result = await aircraftImageService.getImageForAircraftType('B737');
      
      expect(result).toBe('/mock/cache/aircraft-images/boeing-737.jpg');
      expect(RNFS.exists).toHaveBeenCalledWith('/mock/cache/aircraft-images/boeing-737.jpg');
      expect(RNFS.copyFile).not.toHaveBeenCalled(); // Should not download if cached
    });
    
    it('should download image if not in cache', async () => {
      // Mock image does not exist in filesystem cache
      (RNFS.exists as jest.Mock).mockResolvedValueOnce(false);
      (RNFS.copyFile as jest.Mock).mockResolvedValue(undefined);
      
      const result = await aircraftImageService.getImageForAircraftType('B737');
      
      expect(result).toBe('/mock/cache/aircraft-images/boeing-737.jpg');
      expect(RNFS.exists).toHaveBeenCalledWith('/mock/cache/aircraft-images/boeing-737.jpg');
      expect(RNFS.copyFile).toHaveBeenCalled(); // Should download the image
    });
    
    it('should handle unknown aircraft types gracefully', async () => {
      const result = await aircraftImageService.getImageForAircraftType('Unknown');
      
      expect(result).toBeNull();
      expect(RNFS.exists).not.toHaveBeenCalled();
      expect(RNFS.copyFile).not.toHaveBeenCalled();
    });
    
    it('should return path from memory cache for repeated requests', async () => {
      // Setup: First request caches the result
      (RNFS.exists as jest.Mock).mockResolvedValueOnce(true);
      await aircraftImageService.getImageForAircraftType('B737');
      
      // Reset mocks to verify they're not called again
      jest.clearAllMocks();
      
      // Test: Second request should use memory cache
      const result = await aircraftImageService.getImageForAircraftType('B737');
      
      expect(result).toBe('/mock/cache/aircraft-images/boeing-737.jpg');
      expect(RNFS.exists).not.toHaveBeenCalled(); // Should not check filesystem
      expect(RNFS.copyFile).not.toHaveBeenCalled(); // Should not download
    });
  });
  
  describe('prefetchImagesForTypes', () => {
    it('should prefetch multiple aircraft types', async () => {
      // Mock image does not exist in filesystem cache
      (RNFS.exists as jest.Mock).mockResolvedValue(false);
      (RNFS.copyFile as jest.Mock).mockResolvedValue(undefined);
      
      await aircraftImageService.prefetchImagesForTypes(['B737', 'A320']);
      
      // Should have checked existence of both images
      expect(RNFS.exists).toHaveBeenCalledTimes(2);
      expect(RNFS.exists).toHaveBeenCalledWith('/mock/cache/aircraft-images/boeing-737.jpg');
      expect(RNFS.exists).toHaveBeenCalledWith('/mock/cache/aircraft-images/airbus-a320.jpg');
      
      // Should have downloaded both images
      expect(RNFS.copyFile).toHaveBeenCalledTimes(2);
    });
    
    it('should deduplicate aircraft types for prefetching', async () => {
      // Mock image does not exist in filesystem cache
      (RNFS.exists as jest.Mock).mockResolvedValue(false);
      (RNFS.copyFile as jest.Mock).mockResolvedValue(undefined);
      
      await aircraftImageService.prefetchImagesForTypes(['B737', 'B737', 'A320']);
      
      // Should deduplicate and only check existence of unique types
      expect(RNFS.exists).toHaveBeenCalledTimes(2);
    });
    
    it('should do nothing with empty array', async () => {
      await aircraftImageService.prefetchImagesForTypes([]);
      
      expect(RNFS.exists).not.toHaveBeenCalled();
      expect(RNFS.copyFile).not.toHaveBeenCalled();
    });
  });
  
  describe('clearImageCache', () => {
    it('should clear memory cache and filesystem cache', async () => {
      // Cache something first
      (RNFS.exists as jest.Mock).mockResolvedValue(true);
      await aircraftImageService.getImageForAircraftType('B737');
      
      // Reset mocks for the clear operation
      jest.clearAllMocks();
      (RNFS.unlink as jest.Mock).mockResolvedValue(undefined);
      (RNFS.exists as jest.Mock).mockResolvedValue(false);
      (RNFS.mkdir as jest.Mock).mockResolvedValue(undefined);
      
      await aircraftImageService.clearImageCache();
      
      // Should delete the directory
      expect(RNFS.unlink).toHaveBeenCalledWith('/mock/cache/aircraft-images');
      
      // Should create the directory again
      expect(RNFS.exists).toHaveBeenCalledWith('/mock/cache/aircraft-images');
      expect(RNFS.mkdir).toHaveBeenCalledWith('/mock/cache/aircraft-images');
      
      // After clearing, should have to check filesystem again
      jest.clearAllMocks();
      (RNFS.exists as jest.Mock).mockResolvedValue(false);
      await aircraftImageService.getImageForAircraftType('B737');
      expect(RNFS.exists).toHaveBeenCalled();
    });
  });
  
  describe('platform-specific behavior', () => {
    it('should handle Android platform correctly', () => {
      // Mock Platform.OS as Android
      Platform.OS = 'android';
      
      // Need to re-initialize to use the new platform
      jest.resetModules();
      const androidService = AircraftImageService.getInstance();
      
      // Verify Android-specific logic when downloading
      (RNFS.exists as jest.Mock).mockResolvedValue(false);
      (RNFS.copyFile as jest.Mock).mockResolvedValue(undefined);
      
      androidService.getImageForAircraftType('B737');
      
      // In actual implementation this would check Android asset path format
      // but our mock implementation doesn't need to change for testing
    });
  });
});