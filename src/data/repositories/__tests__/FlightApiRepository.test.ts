import { FlightApiRepository } from '../FlightApiRepository';
import { FlightApiService, OpenSkyState } from '../../services/FlightApiService';
import { CacheService } from '../../services/CacheService';
import { Flight } from '../../../domain/models';

// Mock dependencies
jest.mock('../../services/FlightApiService');
jest.mock('../../services/CacheService');

describe('FlightApiRepository', () => {
  let repository: FlightApiRepository;
  let mockApiService: jest.Mocked<FlightApiService>;
  let mockCacheService: jest.Mocked<CacheService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock services
    mockApiService = {
      getAircraftInArea: jest.fn(),
      getAircraftByIcao: jest.fn()
    } as unknown as jest.Mocked<FlightApiService>;
    
    mockCacheService = {
      cacheData: jest.fn(),
      getCachedData: jest.fn(),
      isCacheValid: jest.fn(),
      clearCache: jest.fn(),
      getCacheSize: jest.fn(),
      removeCacheItem: jest.fn()
    } as unknown as jest.Mocked<CacheService>;
    
    // Mock the singleton pattern
    (CacheService.getInstance as jest.Mock).mockReturnValue(mockCacheService);
    
    // Create repository with mocked dependencies
    repository = new FlightApiRepository(mockApiService, mockCacheService);
  });

  describe('getNearbyAircraft', () => {
    it('should return cached data if available', async () => {
      // Arrange
      const latitude = 37.7749;
      const longitude = -122.4194;
      const radiusKm = 5;
      
      const cachedFlights: Flight[] = [
        {
          id: 'abc123',
          flightNumber: 'UAL123',
          aircraftType: 'B738',
          origin: 'SFO',
          originCity: 'San Francisco',
          destination: 'LAX',
          destinationCity: 'Los Angeles',
          altitude: 10000,
          heading: 180,
          speed: 400,
          latitude: 37.75,
          longitude: -122.41,
          timestamp: 1617283210000,
          isOnGround: false
        }
      ];
      
      mockCacheService.getCachedData.mockResolvedValue(cachedFlights);
      
      // Act
      const result = await repository.getNearbyAircraft(latitude, longitude, radiusKm);
      
      // Assert
      expect(mockCacheService.getCachedData).toHaveBeenCalledWith(
        expect.stringContaining('nearby_aircraft')
      );
      expect(mockApiService.getAircraftInArea).not.toHaveBeenCalled();
      expect(result).toEqual(cachedFlights);
    });
    
    it('should fetch from API and filter by radius if cache is empty', async () => {
      // Arrange
      const latitude = 37.7749;
      const longitude = -122.4194;
      const radiusKm = 5;
      
      // Mock cache miss
      mockCacheService.getCachedData.mockResolvedValue(null);
      
      // Mock API response
      const mockApiResponse: OpenSkyState[] = [
        // Aircraft within radius
        {
          icao24: 'abc123',
          callsign: 'UAL123',
          origin_country: 'United States',
          time_position: 1617283200,
          last_contact: 1617283210,
          longitude: -122.41, // ~0.8km from center
          latitude: 37.78,
          baro_altitude: 3048,
          on_ground: false,
          velocity: 257,
          true_track: 270,
          vertical_rate: 0,
          sensors: [1, 2, 3],
          geo_altitude: 3048,
          squawk: '1200',
          spi: false,
          position_source: 0
        },
        // Aircraft outside radius
        {
          icao24: 'def456',
          callsign: 'DLH456',
          origin_country: 'Germany',
          time_position: 1617283200,
          last_contact: 1617283210,
          longitude: -122.30, // ~10km from center
          latitude: 37.85,
          baro_altitude: 3048,
          on_ground: false,
          velocity: 257,
          true_track: 90,
          vertical_rate: 0,
          sensors: [1, 2, 3],
          geo_altitude: 3048,
          squawk: '1300',
          spi: false,
          position_source: 0
        }
      ];
      
      mockApiService.getAircraftInArea.mockResolvedValue(mockApiResponse);
      
      // Act
      const result = await repository.getNearbyAircraft(latitude, longitude, radiusKm);
      
      // Assert
      expect(mockCacheService.getCachedData).toHaveBeenCalled();
      
      // Should call API with bounding box coordinates
      expect(mockApiService.getAircraftInArea).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number)
      );
      
      // Should cache the result
      expect(mockCacheService.cacheData).toHaveBeenCalled();
      
      // Should only return aircraft within radius (1, not 2)
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('abc123');
    });
  });

  describe('getAircraftById', () => {
    it('should return cached aircraft if available', async () => {
      // Arrange
      const aircraftId = 'abc123';
      
      const cachedFlight: Flight = {
        id: aircraftId,
        flightNumber: 'UAL123',
        aircraftType: 'B738',
        origin: 'SFO',
        originCity: 'San Francisco',
        destination: 'LAX',
        destinationCity: 'Los Angeles',
        altitude: 10000,
        heading: 180,
        speed: 400,
        latitude: 37.75,
        longitude: -122.41,
        timestamp: 1617283210000,
        isOnGround: false
      };
      
      mockCacheService.getCachedData.mockResolvedValue(cachedFlight);
      
      // Act
      const result = await repository.getAircraftById(aircraftId);
      
      // Assert
      expect(mockCacheService.getCachedData).toHaveBeenCalledWith(`aircraft_${aircraftId}`);
      expect(mockApiService.getAircraftByIcao).not.toHaveBeenCalled();
      expect(result).toEqual(cachedFlight);
    });
    
    it('should fetch from API if cache is empty', async () => {
      // Arrange
      const aircraftId = 'abc123';
      
      // Mock cache miss
      mockCacheService.getCachedData.mockResolvedValue(null);
      
      // Mock API response
      const mockApiResponse: OpenSkyState = {
        icao24: aircraftId,
        callsign: 'UAL123',
        origin_country: 'United States',
        time_position: 1617283200,
        last_contact: 1617283210,
        longitude: -122.41,
        latitude: 37.78,
        baro_altitude: 3048,
        on_ground: false,
        velocity: 257,
        true_track: 270,
        vertical_rate: 0,
        sensors: [1, 2, 3],
        geo_altitude: 3048,
        squawk: '1200',
        spi: false,
        position_source: 0
      };
      
      mockApiService.getAircraftByIcao.mockResolvedValue(mockApiResponse);
      
      // Act
      const result = await repository.getAircraftById(aircraftId);
      
      // Assert
      expect(mockCacheService.getCachedData).toHaveBeenCalled();
      expect(mockApiService.getAircraftByIcao).toHaveBeenCalledWith(aircraftId);
      expect(mockCacheService.cacheData).toHaveBeenCalled();
      expect(result?.id).toBe(aircraftId);
    });
    
    it('should return null if aircraft not found', async () => {
      // Arrange
      const aircraftId = 'notfound';
      
      // Mock cache miss
      mockCacheService.getCachedData.mockResolvedValue(null);
      
      // Mock API response (not found)
      mockApiService.getAircraftByIcao.mockResolvedValue(null);
      
      // Act
      const result = await repository.getAircraftById(aircraftId);
      
      // Assert
      expect(result).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear the cache', async () => {
      // Act
      await repository.clearCache();
      
      // Assert
      expect(mockCacheService.clearCache).toHaveBeenCalled();
    });
    
    it('should propagate errors from cache service', async () => {
      // Arrange
      const error = new Error('Cache error');
      mockCacheService.clearCache.mockRejectedValue(error);
      
      // Act & Assert
      await expect(repository.clearCache()).rejects.toThrow('Failed to clear flight API cache');
    });
  });
});