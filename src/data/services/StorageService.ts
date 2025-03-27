import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * StorageService provides methods for storing and retrieving data from AsyncStorage
 */
export class StorageService {
  /**
   * Store data in AsyncStorage
   * @param key The key to store the data under
   * @param value The value to store
   */
  async storeData<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error storing data:', error);
      throw new Error(`Failed to store data for key: ${key}`);
    }
  }

  /**
   * Retrieve data from AsyncStorage
   * @param key The key to retrieve data for
   * @returns The data if found, null otherwise
   */
  async getData<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) as T : null;
    } catch (error) {
      console.error('Error retrieving data:', error);
      throw new Error(`Failed to retrieve data for key: ${key}`);
    }
  }

  /**
   * Remove data from AsyncStorage
   * @param key The key to remove
   */
  async removeData(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data:', error);
      throw new Error(`Failed to remove data for key: ${key}`);
    }
  }

  /**
   * Get all keys stored in AsyncStorage
   * @returns Array of keys
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      throw new Error('Failed to get all keys from storage');
    }
  }
}
