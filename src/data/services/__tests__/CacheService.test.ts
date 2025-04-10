import { CacheService } from '../CacheService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn()
}));

describe('CacheService', () => {
  let cacheService: CacheService;
  const KEY_PREFIX = '@FlightOverhead_Cache_';
  const CACHE_KEYS = '@FlightOverhead_CacheKeys';

  beforeEach(() => {
    jest.clearAllMocks();
    cacheService = CacheService.getInstance();
  });

  describe('cacheData', () => {
    it('should store data with expiration time', async () => {
      // Arrange
      const key = 'test_key';
      const data = { test: 'data' };
      const expiryMs = 60000;
      const mockDate = new Date(2023, 1, 1);
      jest.spyOn(global.Date, 'now').mockImplementation(() => mockDate.getTime());
      
      // Mock the getCacheKeys method
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(['existing_key']));
      
      // Act
      await cacheService.cacheData(key, data, expiryMs);
      
      // Assert
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `${KEY_PREFIX}${key}`,
        expect.stringContaining('"data":{"test":"data"}')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        CACHE_KEYS,
        JSON.stringify(['existing_key', key])
      );
    });
    
    it('should not duplicate keys in registry', async () => {
      // Arrange
      const key = 'existing_key';
      const data = { test: 'data' };
      const expiryMs = 60000;
      
      // Mock the getCacheKeys method
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(['existing_key']));
      
      // Act
      await cacheService.cacheData(key, data, expiryMs);
      
      // Assert
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `${KEY_PREFIX}${key}`,
        expect.any(String)
      );
      // The keys array should remain unchanged
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        CACHE_KEYS,
        JSON.stringify(['existing_key'])
      );
    });
  });

  describe('getCachedData', () => {
    it('should return cached data if not expired', async () => {
      // Arrange
      const key = 'test_key';
      const data = { test: 'data' };
      const now = Date.now();
      const entry = {
        data,
        timestamp: now - 30000, // 30 seconds ago
        expiryMs: 60000 // 60 seconds
      };
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(entry));
      
      // Act
      const result = await cacheService.getCachedData(key);
      
      // Assert
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(`${KEY_PREFIX}${key}`);
      expect(result).toEqual(data);
    });
    
    it('should return null if data is expired', async () => {
      // Arrange
      const key = 'test_key';
      const data = { test: 'data' };
      const now = Date.now();
      const entry = {
        data,
        timestamp: now - 70000, // 70 seconds ago
        expiryMs: 60000 // 60 seconds
      };
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(entry));
      
      // Mock the getCacheKeys for removeItem
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(['test_key']));
      
      // Act
      const result = await cacheService.getCachedData(key);
      
      // Assert
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(`${KEY_PREFIX}${key}`);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(`${KEY_PREFIX}${key}`);
      expect(result).toBeNull();
    });
    
    it('should return null if no cached data exists', async () => {
      // Arrange
      const key = 'test_key';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      
      // Act
      const result = await cacheService.getCachedData(key);
      
      // Assert
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(`${KEY_PREFIX}${key}`);
      expect(result).toBeNull();
    });
  });

  describe('isCacheValid', () => {
    it('should return true if cache is valid', async () => {
      // Arrange
      const key = 'test_key';
      const now = Date.now();
      const entry = {
        data: {},
        timestamp: now - 30000, // 30 seconds ago
        expiryMs: 60000 // 60 seconds
      };
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(entry));
      
      // Act
      const result = await cacheService.isCacheValid(key);
      
      // Assert
      expect(result).toBe(true);
    });
    
    it('should return false if cache is expired', async () => {
      // Arrange
      const key = 'test_key';
      const now = Date.now();
      const entry = {
        data: {},
        timestamp: now - 70000, // 70 seconds ago
        expiryMs: 60000 // 60 seconds
      };
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(entry));
      
      // Act
      const result = await cacheService.isCacheValid(key);
      
      // Assert
      expect(result).toBe(false);
    });
    
    it('should return false if no cached data exists', async () => {
      // Arrange
      const key = 'test_key';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      
      // Act
      const result = await cacheService.isCacheValid(key);
      
      // Assert
      expect(result).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached items', async () => {
      // Arrange
      const keys = ['key1', 'key2', 'key3'];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(keys));
      
      // Act
      await cacheService.clearCache();
      
      // Assert
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        `${KEY_PREFIX}key1`,
        `${KEY_PREFIX}key2`,
        `${KEY_PREFIX}key3`
      ]);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(CACHE_KEYS, JSON.stringify([]));
    });
    
    it('should do nothing if cache is empty', async () => {
      // Arrange
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify([]));
      
      // Act
      await cacheService.clearCache();
      
      // Assert
      expect(AsyncStorage.multiRemove).not.toHaveBeenCalled();
      expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(CACHE_KEYS, expect.any(String));
    });
  });

  describe('getCacheSize', () => {
    it('should return the number of cached items', async () => {
      // Arrange
      const keys = ['key1', 'key2', 'key3'];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(keys));
      
      // Act
      const result = await cacheService.getCacheSize();
      
      // Assert
      expect(result).toBe(3);
    });
    
    it('should return 0 if cache is empty', async () => {
      // Arrange
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      
      // Act
      const result = await cacheService.getCacheSize();
      
      // Assert
      expect(result).toBe(0);
    });
  });

  describe('removeCacheItem', () => {
    it('should remove a specific cache item', async () => {
      // Arrange
      const key = 'test_key';
      const keys = ['key1', 'test_key', 'key3'];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(keys));
      
      // Act
      await cacheService.removeCacheItem(key);
      
      // Assert
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(`${KEY_PREFIX}${key}`);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        CACHE_KEYS,
        JSON.stringify(['key1', 'key3'])
      );
    });
  });
});