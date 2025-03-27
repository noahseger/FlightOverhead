import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '../StorageService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
}));

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    storageService = new StorageService();
  });

  describe('storeData', () => {
    it('should store data successfully', async () => {
      const testKey = 'testKey';
      const testData = { id: 1, name: 'Test' };

      await storageService.storeData(testKey, testData);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        testKey,
        JSON.stringify(testData)
      );
    });

    it('should throw error when storage fails', async () => {
      const testKey = 'testKey';
      const testData = { id: 1, name: 'Test' };

      // Mock implementation to throw error
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      await expect(storageService.storeData(testKey, testData))
        .rejects
        .toThrow('Failed to store data for key: testKey');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        testKey,
        JSON.stringify(testData)
      );
    });
  });

  describe('getData', () => {
    it('should retrieve data successfully', async () => {
      const testKey = 'testKey';
      const testData = { id: 1, name: 'Test' };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(testData));

      const result = await storageService.getData(testKey);

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(testKey);
      expect(result).toEqual(testData);
    });

    it('should return null when data does not exist', async () => {
      const testKey = 'testKey';

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await storageService.getData(testKey);

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(testKey);
      expect(result).toBeNull();
    });

    it('should throw error when retrieval fails', async () => {
      const testKey = 'testKey';

      // Mock implementation to throw error
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Retrieval error'));

      await expect(storageService.getData(testKey))
        .rejects
        .toThrow('Failed to retrieve data for key: testKey');

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(testKey);
    });
  });

  describe('removeData', () => {
    it('should remove data successfully', async () => {
      const testKey = 'testKey';

      await storageService.removeData(testKey);

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(testKey);
    });

    it('should throw error when removal fails', async () => {
      const testKey = 'testKey';

      // Mock implementation to throw error
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error('Removal error'));

      await expect(storageService.removeData(testKey))
        .rejects
        .toThrow('Failed to remove data for key: testKey');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(testKey);
    });
  });

  describe('getAllKeys', () => {
    it('should get all keys successfully', async () => {
      const testKeys = ['key1', 'key2', 'key3'];

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValueOnce(testKeys);

      const result = await storageService.getAllKeys();

      expect(AsyncStorage.getAllKeys).toHaveBeenCalled();
      expect(result).toEqual(testKeys);
    });

    it('should throw error when getting keys fails', async () => {
      // Mock implementation to throw error
      (AsyncStorage.getAllKeys as jest.Mock).mockRejectedValueOnce(new Error('Get keys error'));

      await expect(storageService.getAllKeys())
        .rejects
        .toThrow('Failed to get all keys from storage');

      expect(AsyncStorage.getAllKeys).toHaveBeenCalled();
    });
  });
});
