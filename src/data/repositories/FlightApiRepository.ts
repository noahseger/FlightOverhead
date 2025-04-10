import { Flight } from '../../domain/models';
import { FlightApiService, OpenSkyState, ApiError } from '../services/FlightApiService';
import { CacheService } from '../services/CacheService';
import { FlightMapper } from '../mappers';
import { ErrorHandler, Logger } from '../../core/utils';

// Cache expiration times
const NEARBY_AIRCRAFT_CACHE_EXPIRY_MS = 60 * 1000; // 1 minute
const AIRCRAFT_DETAILS_CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export interface IFlightApiRepository {
  getNearbyAircraft(
    latitude: number,
    longitude: number,
    radiusKm: number
  ): Promise<Flight[]>;
  getAircraftById(id: string): Promise<Flight | null>;
  clearCache(): Promise<void>;
}

export class FlightApiRepository implements IFlightApiRepository {
  private apiService: FlightApiService;
  private cacheService: CacheService;
  private logger = new Logger('FlightApiRepository');
  private errorHandler = new ErrorHandler();

  constructor(
    apiService: FlightApiService = new FlightApiService(),
    cacheService: CacheService = CacheService.getInstance()
  ) {
    this.apiService = apiService;
    this.cacheService = cacheService;
  }

  /**
   * Get aircraft near a specific location within a radius
   * @param latitude The center latitude
   * @param longitude The center longitude
   * @param radiusKm The radius in kilometers
   * @returns Array of Flight objects
   */
  public async getNearbyAircraft(
    latitude: number,
    longitude: number,
    radiusKm: number
  ): Promise<Flight[]> {
    try {
      // Create a unique cache key based on location and radius
      // Round to 2 decimal places to avoid too many unique cache entries
      const roundedLat = Math.round(latitude * 100) / 100;
      const roundedLon = Math.round(longitude * 100) / 100;
      const cacheKey = `nearby_aircraft_${roundedLat}_${roundedLon}_${radiusKm}`;

      // Try to get from cache first
      const cachedData = await this.cacheService.getCachedData<Flight[]>(cacheKey);
      if (cachedData) {
        this.logger.info(`Retrieved ${cachedData.length} nearby aircraft from cache`);
        return cachedData;
      }

      // Calculate bounding box (simple approximation)
      // 1 degree of latitude = ~111km
      const latOffset = radiusKm / 111;
      // 1 degree of longitude = ~111km * cos(latitude)
      const lonOffset = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

      const minLat = latitude - latOffset;
      const maxLat = latitude + latOffset;
      const minLon = longitude - lonOffset;
      const maxLon = longitude + lonOffset;

      // Fetch from API
      const aircraftStates = await this.apiService.getAircraftInArea(
        minLat,
        maxLat,
        minLon,
        maxLon
      );

      // Convert to domain models
      const flights = FlightMapper.toFlights(aircraftStates);

      // Filter to only include aircraft within the actual radius (circle)
      const filteredFlights = this.filterByRadius(flights, latitude, longitude, radiusKm);

      // Cache the result
      await this.cacheService.cacheData(cacheKey, filteredFlights, NEARBY_AIRCRAFT_CACHE_EXPIRY_MS);

      this.logger.info(`Retrieved ${filteredFlights.length} nearby aircraft from API`);
      return filteredFlights;
    } catch (error) {
      this.logger.error('Error getting nearby aircraft', { error, latitude, longitude, radiusKm });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to get nearby aircraft', error as Error);
    }
  }

  /**
   * Get details for a specific aircraft by ID
   * @param id The aircraft ICAO24 ID
   * @returns Flight object or null if not found
   */
  public async getAircraftById(id: string): Promise<Flight | null> {
    try {
      // Create cache key
      const cacheKey = `aircraft_${id}`;

      // Try to get from cache first
      const cachedData = await this.cacheService.getCachedData<Flight>(cacheKey);
      if (cachedData) {
        this.logger.info(`Retrieved aircraft ${id} from cache`);
        return cachedData;
      }

      // Fetch from API
      const aircraftState = await this.apiService.getAircraftByIcao(id);
      
      if (!aircraftState) {
        return null;
      }

      // Convert to domain model
      const flight = FlightMapper.toFlight(aircraftState);

      // Cache the result
      await this.cacheService.cacheData(cacheKey, flight, AIRCRAFT_DETAILS_CACHE_EXPIRY_MS);

      this.logger.info(`Retrieved aircraft ${id} from API`);
      return flight;
    } catch (error) {
      this.logger.error('Error getting aircraft by ID', { error, id });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`Failed to get aircraft with ID: ${id}`, error as Error);
    }
  }

  /**
   * Clear all cached flight data
   */
  public async clearCache(): Promise<void> {
    try {
      await this.cacheService.clearCache();
      this.logger.info('Cleared flight API cache');
    } catch (error) {
      this.logger.error('Error clearing flight API cache', { error });
      throw new ApiError('Failed to clear flight API cache', error as Error);
    }
  }

  /**
   * Filter flights to only include those within a radius
   * @param flights Array of flights
   * @param centerLat Center latitude
   * @param centerLon Center longitude
   * @param radiusKm Radius in kilometers
   * @returns Filtered array of flights
   */
  private filterByRadius(
    flights: Flight[],
    centerLat: number,
    centerLon: number,
    radiusKm: number
  ): Flight[] {
    return flights.filter(flight => {
      const distance = this.calculateDistance(
        centerLat,
        centerLon,
        flight.latitude,
        flight.longitude
      );
      return distance <= radiusKm;
    });
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @param lat1 First latitude
   * @param lon1 First longitude
   * @param lat2 Second latitude
   * @param lon2 Second longitude
   * @returns Distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   * @param degrees Angle in degrees
   * @returns Angle in radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}