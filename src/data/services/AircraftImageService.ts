import { Platform } from 'react-native';
import { AppError, ErrorHandler, Logger, DevToast } from '../../core/utils';
import RNFS from 'react-native-fs';
import { AircraftTypeDatabase, AircraftType, AircraftCategory } from './AircraftTypeDatabase';

export class AircraftImageError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(`AircraftImageError: ${message}`, originalError);
    this.name = 'AircraftImageError';
  }
}

export interface ImageSource {
  id: string;
  name: string;
  baseUrl: string;
  getImageUrl(imageId: string): string;
  isAvailable(): boolean;
}

export interface IAircraftImageService {
  getImageForAircraftType(aircraftType: string): Promise<string | null>;
  getImageForAircraftTypeWithInfo(aircraftType: string): Promise<{path: string | null, info: AircraftType | null}>;
  prefetchImagesForTypes(aircraftTypes: string[]): Promise<void>;
  clearImageCache(): Promise<void>;
  registerImageSource(source: ImageSource): void;
}

/**
 * Primary aircraft image source
 */
export class PrimaryImageSource implements ImageSource {
  public id = 'primary';
  public name = 'Primary Aircraft Database';
  public baseUrl = 'https://aircraft-images.example.com/images';
  
  public getImageUrl(imageId: string): string {
    return `${this.baseUrl}/${imageId}.jpg`;
  }
  
  public isAvailable(): boolean {
    // In a real app, we might check connectivity or API status
    return true;
  }
}

/**
 * Fallback aircraft image source
 */
export class FallbackImageSource implements ImageSource {
  public id = 'fallback';
  public name = 'Fallback Images';
  public baseUrl = 'https://fallback-aircraft-images.example.com';
  
  public getImageUrl(imageId: string): string {
    return `${this.baseUrl}/aircraft/${imageId}.jpg`;
  }
  
  public isAvailable(): boolean {
    // In a real app, we might check connectivity or API status
    return true;
  }
}

/**
 * Public domain aircraft image source (for testing, would be real in production)
 */
export class PublicDomainImageSource implements ImageSource {
  public id = 'public-domain';
  public name = 'Public Domain Aircraft Images';
  public baseUrl = 'https://pixabay.com/api';
  
  public getImageUrl(imageId: string): string {
    // This would be a real API endpoint in production
    return `${this.baseUrl}/?key=dummy&q=${encodeURIComponent(imageId.replace(/-/g, ' '))}&image_type=photo`;
  }
  
  public isAvailable(): boolean {
    // In a real app, we might check connectivity or API status
    return true;
  }
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
  private aircraftTypeDatabase: AircraftTypeDatabase;
  
  // Image sources in priority order
  private imageSources: ImageSource[] = [];
  
  
  private constructor() {
    // Determine cache directory based on platform
    if (Platform.OS === 'ios') {
      this.imageCacheDir = `${RNFS.CachesDirectoryPath}/aircraft-images`;
    } else {
      this.imageCacheDir = `${RNFS.CachesDirectoryPath}/aircraft-images`;
    }
    
    // Get aircraft type database instance
    this.aircraftTypeDatabase = AircraftTypeDatabase.getInstance();
    
    // Register default image sources
    this.registerImageSource(new PrimaryImageSource());
    this.registerImageSource(new FallbackImageSource());
    this.registerImageSource(new PublicDomainImageSource());
    
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
   * Register a new image source
   * @param source The image source to register
   */
  public registerImageSource(source: ImageSource): void {
    // Check if source already exists
    const existing = this.imageSources.findIndex(s => s.id === source.id);
    if (existing >= 0) {
      // Replace existing source
      this.imageSources[existing] = source;
      this.logger.debug(`Updated image source: ${source.name} (${source.id})`);
    } else {
      // Add new source
      this.imageSources.push(source);
      this.logger.debug(`Registered new image source: ${source.name} (${source.id})`);
    }
  }
  
  /**
   * Get image path for a given aircraft type
   * @param aircraftType The aircraft type identifier
   * @returns Promise resolving to local image path or null if not found
   */
  public async getImageForAircraftType(aircraftType: string): Promise<string | null> {
    try {
      const result = await this.getImageForAircraftTypeWithInfo(aircraftType);
      return result.path;
    } catch (error) {
      this.logger.error('Error getting aircraft image', { error, aircraftType });
      this.errorHandler.handleError(
        new AircraftImageError(`Failed to get image for aircraft type: ${aircraftType}`, error as Error)
      );
      return null;
    }
  }
  
  /**
   * Get image path for a given aircraft type with detailed aircraft info
   * @param aircraftType The aircraft type identifier
   * @returns Promise resolving to local image path and aircraft info, or null if not found
   */
  public async getImageForAircraftTypeWithInfo(aircraftType: string): Promise<{path: string | null, info: AircraftType | null}> {
    try {
      // Check memory cache first
      if (this.memoryCache.has(aircraftType)) {
        const cachedPath = this.memoryCache.get(aircraftType) || null;
        const aircraftInfo = this.lookupAircraftTypeInfo(aircraftType);
        return { path: cachedPath, info: aircraftInfo };
      }
      
      // Lookup aircraft type information
      const aircraftInfo = this.lookupAircraftTypeInfo(aircraftType);
      
      if (!aircraftInfo) {
        // No info found, return null
        return { path: null, info: null };
      }
      
      // Get image IDs from aircraft info
      const imageIds = aircraftInfo.imageIds;
      
      if (!imageIds || imageIds.length === 0) {
        // No image IDs available
        return { path: null, info: aircraftInfo };
      }
      
      // Try each image ID in order
      for (const imageId of imageIds) {
        try {
          // Check if image exists in filesystem cache
          const localPath = `${this.imageCacheDir}/${imageId}.jpg`;
          const exists = await RNFS.exists(localPath);
          
          if (exists) {
            // Image is already cached, return path
            this.memoryCache.set(aircraftType, localPath);
            return { path: localPath, info: aircraftInfo };
          }
          
          // Not cached, try to download from each source
          const downloadResult = await this.downloadImageFromSources(imageId, localPath);
          
          if (downloadResult) {
            // Add to memory cache
            this.memoryCache.set(aircraftType, localPath);
            return { path: localPath, info: aircraftInfo };
          }
        } catch (imageError) {
          // Log and continue to next image ID
          this.logger.warn(`Failed to download image ${imageId} for ${aircraftType}`, { error: imageError });
        }
      }
      
      // No images were found or downloaded
      // Return a fallback image based on category if available
      if (aircraftInfo.category) {
        const fallbackType = this.aircraftTypeDatabase.getDefaultType(aircraftInfo.category);
        if (fallbackType && fallbackType.imageIds.length > 0) {
          const fallbackImageId = fallbackType.imageIds[0];
          const fallbackPath = `${this.imageCacheDir}/${fallbackImageId}.jpg`;
          
          try {
            const exists = await RNFS.exists(fallbackPath);
            
            if (exists) {
              this.memoryCache.set(aircraftType, fallbackPath);
              return { path: fallbackPath, info: aircraftInfo };
            }
            
            const fallbackResult = await this.downloadImageFromSources(fallbackImageId, fallbackPath);
            
            if (fallbackResult) {
              this.memoryCache.set(aircraftType, fallbackPath);
              return { path: fallbackPath, info: aircraftInfo };
            }
          } catch (fallbackError) {
            this.logger.warn(`Failed to use fallback image for ${aircraftType}`, { error: fallbackError });
          }
        }
      }
      
      // Nothing worked, return null for path but still return aircraft info
      return { path: null, info: aircraftInfo };
    } catch (error) {
      this.logger.error('Error getting aircraft image with info', { error, aircraftType });
      this.errorHandler.handleError(
        new AircraftImageError(`Failed to get image for aircraft type: ${aircraftType}`, error as Error)
      );
      return { path: null, info: null };
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
      
      // Show toast in development mode
      if (__DEV__) {
        DevToast.show(`Prefetching ${uniqueTypes.length} aircraft images...`);
      }
      
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
      
      // Show completion toast in development mode
      if (__DEV__) {
        DevToast.show(`Prefetched ${uniqueTypes.length} aircraft images`);
      }
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
   * Look up aircraft type information from the database
   * @param aircraftType The aircraft type identifier
   * @returns Aircraft type information or null if not found
   */
  private lookupAircraftTypeInfo(aircraftType: string): AircraftType | null {
    if (!aircraftType || aircraftType === 'Unknown') {
      return null;
    }
    
    // Try lookup by ICAO code
    let aircraftInfo = this.aircraftTypeDatabase.lookupByIcaoCode(aircraftType);
    
    // If not found, try lookup by model name
    if (!aircraftInfo) {
      aircraftInfo = this.aircraftTypeDatabase.lookupByModelName(aircraftType);
    }
    
    // If still not found, try similar lookup
    if (!aircraftInfo) {
      aircraftInfo = this.aircraftTypeDatabase.lookupSimilar(aircraftType);
    }
    
    return aircraftInfo;
  }
  
  /**
   * Download an image from all available sources
   * @param imageId The image identifier
   * @param localPath The local path to save the image to
   * @returns True if download was successful, false otherwise
   */
  private async downloadImageFromSources(imageId: string, localPath: string): Promise<boolean> {
    // Try each image source in order
    for (const source of this.imageSources) {
      // Skip unavailable sources
      if (!source.isAvailable()) {
        continue;
      }
      
      try {
        const imageUrl = source.getImageUrl(imageId);
        
        // Log the download attempt
        this.logger.debug(`Downloading aircraft image from ${source.name}: ${imageUrl} to ${localPath}`);
        
        // For development, show toast
        if (__DEV__) {
          DevToast.show(`Downloading image from ${source.name}...`);
        }
        
        // In a real app, this would be:
        // const result = await RNFS.downloadFile({
        //   fromUrl: imageUrl,
        //   toFile: localPath,
        //   progressDivider: 10,
        // }).promise;
        // 
        // if (result.statusCode === 200) {
        //   this.logger.debug(`Aircraft image downloaded from ${source.name} to: ${localPath}`);
        //   return true;
        // }
        
        // Mock download for now
        // Use a bundled default image as a placeholder
        const bundledImagePath = Platform.OS === 'android' 
          ? 'asset:/default_aircraft.jpg'
          : RNFS.MainBundlePath + '/default_aircraft.jpg';
        
        // In a real app, this would download from the URL
        // For now, we'll just copy a bundled image to simulate the download
        await RNFS.copyFile(bundledImagePath, localPath);
        
        this.logger.debug(`Aircraft image downloaded from ${source.name} to: ${localPath}`);
        return true;
      } catch (error) {
        this.logger.warn(`Failed to download image from ${source.name}`, { error, imageId });
        // Continue to next source
      }
    }
    
    // All sources failed
    return false;
  }
}