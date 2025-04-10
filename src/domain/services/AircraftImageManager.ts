import { AircraftImageService } from '../../data/services/AircraftImageService';
import { AppError, ErrorHandler, Logger } from '../../core/utils';
import { Flight } from '../models';

export class AircraftImageManagerError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(`AircraftImageManagerError: ${message}`, originalError);
    this.name = 'AircraftImageManagerError';
  }
}

export interface IAircraftImageManager {
  getImageForFlight(flight: Flight): Promise<string | null>;
  prefetchImagesForFlights(flights: Flight[]): Promise<void>;
  clearImageCache(): Promise<void>;
}

/**
 * Manager class that coordinates aircraft image retrieval and caching
 */
export class AircraftImageManager implements IAircraftImageManager {
  private static instance: AircraftImageManager;
  private logger = new Logger('AircraftImageManager');
  private errorHandler = new ErrorHandler();
  private aircraftImageService: AircraftImageService;
  private isInitialized = false;
  
  private constructor(aircraftImageService: AircraftImageService) {
    this.aircraftImageService = aircraftImageService;
  }
  
  public static getInstance(aircraftImageService?: AircraftImageService): AircraftImageManager {
    if (!AircraftImageManager.instance) {
      if (!aircraftImageService) {
        throw new Error('AircraftImageService is required for first initialization');
      }
      AircraftImageManager.instance = new AircraftImageManager(aircraftImageService);
    }
    return AircraftImageManager.instance;
  }
  
  /**
   * Initialize the image manager
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // No special initialization needed currently
      this.isInitialized = true;
      this.logger.info('Aircraft image manager initialized');
    } catch (error) {
      this.logger.error('Error initializing aircraft image manager', { error });
      this.errorHandler.handleError(
        new AircraftImageManagerError('Failed to initialize aircraft image manager', error as Error)
      );
    }
  }
  
  /**
   * Get image path for a specific flight
   * @param flight The flight to get an image for
   * @returns Promise resolving to local image path or null if not available
   */
  public async getImageForFlight(flight: Flight): Promise<string | null> {
    if (!flight.aircraftType || flight.aircraftType === 'Unknown') {
      return null;
    }
    
    try {
      return await this.aircraftImageService.getImageForAircraftType(flight.aircraftType);
    } catch (error) {
      this.logger.error('Error getting image for flight', { error, flightId: flight.id });
      this.errorHandler.handleError(
        new AircraftImageManagerError('Failed to get image for flight', error as Error)
      );
      return null;
    }
  }
  
  /**
   * Prefetch images for a list of flights
   * @param flights List of flights to prefetch images for
   */
  public async prefetchImagesForFlights(flights: Flight[]): Promise<void> {
    if (flights.length === 0) return;
    
    try {
      // Extract unique aircraft types from the flights
      const aircraftTypes = flights
        .map(flight => flight.aircraftType)
        .filter((type): type is string => !!type && type !== 'Unknown');
      
      if (aircraftTypes.length === 0) return;
      
      await this.aircraftImageService.prefetchImagesForTypes(aircraftTypes);
    } catch (error) {
      this.logger.error('Error prefetching images for flights', { error });
      this.errorHandler.handleError(
        new AircraftImageManagerError('Failed to prefetch images for flights', error as Error)
      );
    }
  }
  
  /**
   * Clear the aircraft image cache
   */
  public async clearImageCache(): Promise<void> {
    try {
      await this.aircraftImageService.clearImageCache();
    } catch (error) {
      this.logger.error('Error clearing aircraft image cache', { error });
      this.errorHandler.handleError(
        new AircraftImageManagerError('Failed to clear aircraft image cache', error as Error)
      );
    }
  }
}