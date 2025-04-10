import { Platform } from 'react-native';
import { AppError, ErrorHandler, Logger } from '../../core/utils';
import RNFS from 'react-native-fs';

export class AircraftImageError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(`AircraftImageError: ${message}`, originalError);
    this.name = 'AircraftImageError';
  }
}

export interface IAircraftImageService {
  getImageForAircraftType(aircraftType: string): Promise<string | null>;
  prefetchImagesForTypes(aircraftTypes: string[]): Promise<void>;
  clearImageCache(): Promise<void>;
}

/**
 * Service that manages aircraft images for rich notifications and UI display
 */
export class AircraftImageService implements IAircraftImageService {
  private static instance: AircraftImageService;
  private logger = new Logger('AircraftImageService');
  private errorHandler = new ErrorHandler();
  private imageCacheDir: string;
  private memoryCache: Map<string, string> = new Map();
  private isPrefetching = false;
  
  // Base URL for fetching aircraft images
  private readonly baseImageUrl = 'https://aircraft-images.example.com';
  
  // Mapping of generic aircraft types to image IDs
  private readonly aircraftTypeMap: Record<string, string> = {
    // Commercial jets
    'B737': 'boeing-737',
    'B738': 'boeing-737-800',
    'B739': 'boeing-737-900',
    'B747': 'boeing-747',
    'B748': 'boeing-747-8',
    'B757': 'boeing-757',
    'B767': 'boeing-767',
    'B777': 'boeing-777',
    'B787': 'boeing-787',
    'A319': 'airbus-a319',
    'A320': 'airbus-a320',
    'A321': 'airbus-a321',
    'A330': 'airbus-a330',
    'A340': 'airbus-a340',
    'A350': 'airbus-a350',
    'A380': 'airbus-a380',
    
    // Regional jets
    'CRJ': 'bombardier-crj',
    'CRJ2': 'bombardier-crj-200',
    'CRJ7': 'bombardier-crj-700',
    'CRJ9': 'bombardier-crj-900',
    'E170': 'embraer-e170',
    'E175': 'embraer-e175',
    'E190': 'embraer-e190',
    'E195': 'embraer-e195',
    
    // Turboprops
    'DH8': 'bombardier-dash-8',
    'AT72': 'atr-72',
    'AT76': 'atr-72-600',
    'AT75': 'atr-72-500',
    
    // Private jets
    'C172': 'cessna-172',
    'C152': 'cessna-152',
    'C208': 'cessna-caravan',
    'PC12': 'pilatus-pc12',
    
    // Fallback generic types
    'BOEING': 'boeing-generic',
    'AIRBUS': 'airbus-generic',
    'PRIVATE': 'private-generic',
    'HELICOPTER': 'helicopter-generic',
    'MILITARY': 'military-generic',
  };
  
  private constructor() {
    // Determine cache directory based on platform
    if (Platform.OS === 'ios') {
      this.imageCacheDir = `${RNFS.CachesDirectoryPath}/aircraft-images`;
    } else {
      this.imageCacheDir = `${RNFS.CachesDirectoryPath}/aircraft-images`;
    }
    
    // Ensure cache directory exists
    this.initializeCache();
  }
  
  public static getInstance(): AircraftImageService {
    if (!AircraftImageService.instance) {
      AircraftImageService.instance = new AircraftImageService();
    }
    return AircraftImageService.instance;
  }
  
  /**
   * Get image path for a given aircraft type
   * @param aircraftType The aircraft type identifier
   * @returns Promise resolving to local image path or null if not found
   */
  public async getImageForAircraftType(aircraftType: string): Promise<string | null> {
    try {
      // Check memory cache first
      if (this.memoryCache.has(aircraftType)) {
        return this.memoryCache.get(aircraftType) || null;
      }
      
      // Try to find the best matching image in our map
      const imageId = this.getImageIdForAircraftType(aircraftType);
      if (!imageId) {
        return null; // No matching aircraft type
      }
      
      // Check if image exists in filesystem cache
      const localPath = `${this.imageCacheDir}/${imageId}.jpg`;
      const exists = await RNFS.exists(localPath);
      
      if (exists) {
        // Image is already cached, return path
        this.memoryCache.set(aircraftType, localPath);
        return localPath;
      }
      
      // Not cached, need to download
      await this.downloadImage(imageId, localPath);
      
      // Add to memory cache
      this.memoryCache.set(aircraftType, localPath);
      return localPath;
    } catch (error) {
      this.logger.error('Error getting aircraft image', { error, aircraftType });
      this.errorHandler.handleError(
        new AircraftImageError(`Failed to get image for aircraft type: ${aircraftType}`, error as Error)
      );
      return null;
    }
  }
  
  /**
   * Prefetch images for multiple aircraft types
   * @param aircraftTypes Array of aircraft type identifiers
   */
  public async prefetchImagesForTypes(aircraftTypes: string[]): Promise<void> {
    if (this.isPrefetching || aircraftTypes.length === 0) {
      return;
    }
    
    this.isPrefetching = true;
    
    try {
      const uniqueTypes = [...new Set(aircraftTypes)];
      this.logger.info(`Prefetching ${uniqueTypes.length} aircraft images`);
      
      const prefetchPromises = uniqueTypes.map(async (type) => {
        try {
          await this.getImageForAircraftType(type);
        } catch (e) {
          // Silently catch individual prefetch errors
          this.logger.warn(`Failed to prefetch image for type: ${type}`);
        }
      });
      
      await Promise.all(prefetchPromises);
      this.logger.info('Aircraft image prefetching complete');
    } catch (error) {
      this.logger.error('Error prefetching aircraft images', { error });
      this.errorHandler.handleError(
        new AircraftImageError('Failed to prefetch aircraft images', error as Error)
      );
    } finally {
      this.isPrefetching = false;
    }
  }
  
  /**
   * Clear all cached aircraft images
   */
  public async clearImageCache(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear();
      
      // Clear file cache
      await RNFS.unlink(this.imageCacheDir)
        .catch(() => {}); // Ignore if directory doesn't exist
        
      // Recreate cache directory
      await this.initializeCache();
      
      this.logger.info('Aircraft image cache cleared');
    } catch (error) {
      this.logger.error('Error clearing aircraft image cache', { error });
      this.errorHandler.handleError(
        new AircraftImageError('Failed to clear aircraft image cache', error as Error)
      );
    }
  }
  
  /**
   * Initialize the image cache directory
   */
  private async initializeCache(): Promise<void> {
    try {
      const dirExists = await RNFS.exists(this.imageCacheDir);
      if (!dirExists) {
        await RNFS.mkdir(this.imageCacheDir);
        this.logger.debug(`Created aircraft image cache directory: ${this.imageCacheDir}`);
      }
    } catch (error) {
      this.logger.error('Error initializing aircraft image cache', { error });
      this.errorHandler.handleError(
        new AircraftImageError('Failed to initialize image cache', error as Error)
      );
    }
  }
  
  /**
   * Get the image ID for a specific aircraft type
   * @param aircraftType The aircraft type identifier
   * @returns The image ID or null if not found
   */
  private getImageIdForAircraftType(aircraftType: string): string | null {
    if (!aircraftType || aircraftType === 'Unknown') {
      return null;
    }
    
    // Normalize the aircraft type to uppercase for matching
    const normalizedType = aircraftType.toUpperCase();
    
    // Exact match in our map
    if (this.aircraftTypeMap[aircraftType]) {
      return this.aircraftTypeMap[aircraftType];
    }
    
    // Try to find a partial match (e.g., B737-800 should match B737)
    for (const [key, imageId] of Object.entries(this.aircraftTypeMap)) {
      // Check if the type starts with the key pattern
      if (normalizedType.startsWith(key.toUpperCase())) {
        return imageId;
      }
    }
    
    // Generic fallback based on manufacturer
    if (normalizedType.startsWith('B') || normalizedType.includes('BOEING')) {
      return this.aircraftTypeMap['BOEING'];
    } else if (normalizedType.startsWith('A') || normalizedType.includes('AIRBUS')) {
      return this.aircraftTypeMap['AIRBUS'];
    } else if (normalizedType.includes('HELICOPTER') || normalizedType.startsWith('R22') || normalizedType.startsWith('R44')) {
      return this.aircraftTypeMap['HELICOPTER'];
    } else if (normalizedType.includes('MILITARY') || normalizedType.startsWith('F') || normalizedType.includes('FIGHTER')) {
      return this.aircraftTypeMap['MILITARY'];
    }
    
    // Use private aircraft fallback for all other cases
    return this.aircraftTypeMap['PRIVATE'];
  }
  
  /**
   * Download an aircraft image
   * @param imageId The image identifier
   * @param localPath The local path to save the image to
   */
  private async downloadImage(imageId: string, localPath: string): Promise<void> {
    try {
      const imageUrl = `${this.baseImageUrl}/${imageId}.jpg`;
      
      // For now, we'll mock the download with a timeout
      // In a real app, this would use RNFS.downloadFile
      this.logger.debug(`Downloading aircraft image: ${imageUrl} to ${localPath}`);
      
      // Mock download - in real implementation, this would be:
      // await RNFS.downloadFile({
      //   fromUrl: imageUrl,
      //   toFile: localPath,
      //   progressDivider: 10,
      // }).promise;
      
      // Instead, we'll copy a local default image to simulate a download
      // Use a bundled default image as a placeholder
      const bundledImagePath = Platform.OS === 'android' 
        ? 'asset:/default_aircraft.jpg'
        : RNFS.MainBundlePath + '/default_aircraft.jpg';
      
      // In a real app, this would download from the URL
      // For now, we'll just copy a bundled image to simulate the download
      await RNFS.copyFile(bundledImagePath, localPath);
      
      this.logger.debug(`Aircraft image downloaded to: ${localPath}`);
    } catch (error) {
      this.logger.error(`Error downloading aircraft image: ${imageId}`, { error });
      throw new AircraftImageError(`Failed to download aircraft image: ${imageId}`, error as Error);
    }
  }
}