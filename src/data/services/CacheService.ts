import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppError, ErrorHandler, Logger } from '../../core/utils';

export class CacheError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(`CacheError: ${message}`, originalError);
    this.name = 'CacheError';
  }
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiryMs: number;
}

export interface ICacheService {
  cacheData<T>(key: string, data: T, expiryMs: number): Promise<void>;
  getCachedData<T>(key: string): Promise<T | null>;
  isCacheValid(key: string): Promise<boolean>;
  clearCache(): Promise<void>;
  getCacheSize(): Promise<number>;
  removeCacheItem(key: string): Promise<void>;
}

/**
 * Service to handle caching of data to reduce API calls and provide offline functionality
 */
export class CacheService implements ICacheService {
  private static instance: CacheService;
  private logger = new Logger('CacheService');
  private errorHandler = new ErrorHandler();
  private readonly KEY_PREFIX = '@FlightOverhead_Cache_';
  private readonly CACHE_KEYS = '@FlightOverhead_CacheKeys';

  private constructor() {}

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Store data in cache with expiration time
   * @param key The cache key
   * @param data The data to cache
   * @param expiryMs Time in milliseconds until cache expires
   */
  public async cacheData<T>(key: string, data: T, expiryMs: number): Promise<void> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiryMs
      };

      // Store the cache entry
      await AsyncStorage.setItem(prefixedKey, JSON.stringify(entry));
      
      // Add key to cache keys set if not already present
      await this.addKeyToRegistry(key);
      
      this.logger.debug(`Cached data for key: ${key}`, { expiryMs });
    } catch (error) {
      this.logger.error('Error caching data', { error, key });
      this.errorHandler.handleError(
        new CacheError(`Failed to cache data for key: ${key}`, error as Error)
      );
    }
  }

  /**
   * Get cached data if it exists and is not expired
   * @param key The cache key
   * @returns The cached data or null if not found or expired
   */
  public async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const data = await AsyncStorage.getItem(prefixedKey);
      
      if (!data) {
        return null;
      }
      
      const entry = JSON.parse(data) as CacheEntry<T>;
      const now = Date.now();
      
      // Check if cache entry is expired
      if (now - entry.timestamp > entry.expiryMs) {
        this.logger.debug(`Cache expired for key: ${key}`);
        await this.removeCacheItem(key);
        return null;
      }
      
      this.logger.debug(`Retrieved cached data for key: ${key}`);
      return entry.data;
    } catch (error) {
      this.logger.error('Error retrieving cached data', { error, key });
      this.errorHandler.handleError(
        new CacheError(`Failed to retrieve cached data for key: ${key}`, error as Error)
      );
      return null;
    }
  }

  /**
   * Check if cache entry is valid (exists and not expired)
   * @param key The cache key
   * @returns True if cache is valid, false otherwise
   */
  public async isCacheValid(key: string): Promise<boolean> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const data = await AsyncStorage.getItem(prefixedKey);
      
      if (!data) {
        return false;
      }
      
      const entry = JSON.parse(data) as CacheEntry<any>;
      const now = Date.now();
      
      return now - entry.timestamp <= entry.expiryMs;
    } catch (error) {
      this.logger.error('Error checking cache validity', { error, key });
      this.errorHandler.handleError(
        new CacheError(`Failed to check cache validity for key: ${key}`, error as Error)
      );
      return false;
    }
  }

  /**
   * Clear all cached data
   */
  public async clearCache(): Promise<void> {
    try {
      // Get all cache keys
      const keys = await this.getCacheKeys();
      
      if (keys.length === 0) {
        return;
      }
      
      // Remove all cache entries
      const prefixedKeys = keys.map(key => this.getPrefixedKey(key));
      await AsyncStorage.multiRemove(prefixedKeys);
      
      // Clear the keys registry
      await AsyncStorage.setItem(this.CACHE_KEYS, JSON.stringify([]));
      
      this.logger.info(`Cleared cache with ${keys.length} entries`);
    } catch (error) {
      this.logger.error('Error clearing cache', { error });
      this.errorHandler.handleError(
        new CacheError('Failed to clear cache', error as Error)
      );
    }
  }

  /**
   * Get the number of cached items
   * @returns The number of cached items
   */
  public async getCacheSize(): Promise<number> {
    try {
      const keys = await this.getCacheKeys();
      return keys.length;
    } catch (error) {
      this.logger.error('Error getting cache size', { error });
      this.errorHandler.handleError(
        new CacheError('Failed to get cache size', error as Error)
      );
      return 0;
    }
  }

  /**
   * Remove a specific cache item
   * @param key The cache key to remove
   */
  public async removeCacheItem(key: string): Promise<void> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      await AsyncStorage.removeItem(prefixedKey);
      
      // Remove key from registry
      await this.removeKeyFromRegistry(key);
      
      this.logger.debug(`Removed cache item: ${key}`);
    } catch (error) {
      this.logger.error('Error removing cache item', { error, key });
      this.errorHandler.handleError(
        new CacheError(`Failed to remove cache item: ${key}`, error as Error)
      );
    }
  }

  /**
   * Get the full list of cache keys
   * @returns Array of cache keys (without prefix)
   */
  private async getCacheKeys(): Promise<string[]> {
    try {
      const keysData = await AsyncStorage.getItem(this.CACHE_KEYS);
      return keysData ? JSON.parse(keysData) : [];
    } catch (error) {
      this.logger.error('Error getting cache keys', { error });
      return [];
    }
  }

  /**
   * Add a key to the cache keys registry
   * @param key The cache key to add
   */
  private async addKeyToRegistry(key: string): Promise<void> {
    try {
      const keys = await this.getCacheKeys();
      
      if (!keys.includes(key)) {
        keys.push(key);
        await AsyncStorage.setItem(this.CACHE_KEYS, JSON.stringify(keys));
      }
    } catch (error) {
      this.logger.error('Error adding key to registry', { error, key });
    }
  }

  /**
   * Remove a key from the cache keys registry
   * @param key The cache key to remove
   */
  private async removeKeyFromRegistry(key: string): Promise<void> {
    try {
      const keys = await this.getCacheKeys();
      const filtered = keys.filter(k => k !== key);
      
      await AsyncStorage.setItem(this.CACHE_KEYS, JSON.stringify(filtered));
    } catch (error) {
      this.logger.error('Error removing key from registry', { error, key });
    }
  }

  /**
   * Get a key with the cache prefix
   * @param key The original key
   * @returns The key with cache prefix
   */
  private getPrefixedKey(key: string): string {
    return `${this.KEY_PREFIX}${key}`;
  }
}