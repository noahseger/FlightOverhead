import { AircraftImageManager } from '../AircraftImageManager';
import { AircraftImageService } from '../../../data/services/AircraftImageService';
import { Flight } from '../../models';

// Mock dependencies
jest.mock('../../../data/services/AircraftImageService', () => {
  return {
    AircraftImageService: {
      getInstance: jest.fn().mockReturnValue({
        getImageForAircraftType: jest.fn(),
        prefetchImagesForTypes: jest.fn(),
        clearImageCache: jest.fn(),
      }),
    },
  };
});

describe('AircraftImageManager', () => {
  let imageManager: AircraftImageManager;
  let mockImageService: jest.Mocked<AircraftImageService>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockImageService = AircraftImageService.getInstance() as jest.Mocked<AircraftImageService>;
    imageManager = AircraftImageManager.getInstance(mockImageService);
  });
  
  describe('getInstance', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = AircraftImageManager.getInstance(mockImageService);
      const instance2 = AircraftImageManager.getInstance();
      expect(instance1).toBe(instance2);
    });
    
    it('should throw error if aircraftImageService not provided on first call', () => {
      // Reset the singleton instance
      (AircraftImageManager as any).instance = undefined;
      
      expect(() => {
        AircraftImageManager.getInstance();
      }).toThrow('AircraftImageService is required for first initialization');
    });
  });
  
  describe('getImageForFlight', () => {
    it('should return image path for flight with valid aircraft type', async () => {
      const flight: Flight = {
        id: 'test-flight-1',
        flightNumber: 'BA123',
        aircraftType: 'B737',
        origin: 'LHR',
        originCity: 'London',
        destination: 'JFK',
        destinationCity: 'New York',
        altitude: 35000,
        heading: 270,
        speed: 500,
        latitude: 51.5,
        longitude: -0.1,
        timestamp: Date.now(),
      };
      
      mockImageService.getImageForAircraftType.mockResolvedValue('/path/to/image.jpg');
      
      const result = await imageManager.getImageForFlight(flight);
      
      expect(result).toBe('/path/to/image.jpg');
      expect(mockImageService.getImageForAircraftType).toHaveBeenCalledWith('B737');
    });
    
    it('should return null for flight with unknown aircraft type', async () => {
      const flight: Flight = {
        id: 'test-flight-2',
        flightNumber: 'BA456',
        aircraftType: 'Unknown',
        origin: 'LHR',
        originCity: 'London',
        destination: 'JFK',
        destinationCity: 'New York',
        altitude: 35000,
        heading: 270,
        speed: 500,
        latitude: 51.5,
        longitude: -0.1,
        timestamp: Date.now(),
      };
      
      const result = await imageManager.getImageForFlight(flight);
      
      expect(result).toBeNull();
      expect(mockImageService.getImageForAircraftType).not.toHaveBeenCalled();
    });
    
    it('should handle errors from image service gracefully', async () => {
      const flight: Flight = {
        id: 'test-flight-3',
        flightNumber: 'BA789',
        aircraftType: 'B737',
        origin: 'LHR',
        originCity: 'London',
        destination: 'JFK',
        destinationCity: 'New York',
        altitude: 35000,
        heading: 270,
        speed: 500,
        latitude: 51.5,
        longitude: -0.1,
        timestamp: Date.now(),
      };
      
      mockImageService.getImageForAircraftType.mockRejectedValue(new Error('Test error'));
      
      const result = await imageManager.getImageForFlight(flight);
      
      expect(result).toBeNull();
      expect(mockImageService.getImageForAircraftType).toHaveBeenCalledWith('B737');
    });
  });
  
  describe('prefetchImagesForFlights', () => {
    it('should prefetch images for multiple flights', async () => {
      const flights: Flight[] = [
        {
          id: 'test-flight-1',
          flightNumber: 'BA123',
          aircraftType: 'B737',
          origin: 'LHR',
          originCity: 'London',
          destination: 'JFK',
          destinationCity: 'New York',
          altitude: 35000,
          heading: 270,
          speed: 500,
          latitude: 51.5,
          longitude: -0.1,
          timestamp: Date.now(),
        },
        {
          id: 'test-flight-2',
          flightNumber: 'LH456',
          aircraftType: 'A320',
          origin: 'FRA',
          originCity: 'Frankfurt',
          destination: 'LAX',
          destinationCity: 'Los Angeles',
          altitude: 38000,
          heading: 290,
          speed: 520,
          latitude: 52.5,
          longitude: -1.1,
          timestamp: Date.now(),
        },
      ];
      
      await imageManager.prefetchImagesForFlights(flights);
      
      expect(mockImageService.prefetchImagesForTypes).toHaveBeenCalledWith(['B737', 'A320']);
    });
    
    it('should filter out unknown aircraft types when prefetching', async () => {
      const flights: Flight[] = [
        {
          id: 'test-flight-1',
          flightNumber: 'BA123',
          aircraftType: 'B737',
          origin: 'LHR',
          originCity: 'London',
          destination: 'JFK',
          destinationCity: 'New York',
          altitude: 35000,
          heading: 270,
          speed: 500,
          latitude: 51.5,
          longitude: -0.1,
          timestamp: Date.now(),
        },
        {
          id: 'test-flight-2',
          flightNumber: 'LH456',
          aircraftType: 'Unknown',
          origin: 'FRA',
          originCity: 'Frankfurt',
          destination: 'LAX',
          destinationCity: 'Los Angeles',
          altitude: 38000,
          heading: 290,
          speed: 520,
          latitude: 52.5,
          longitude: -1.1,
          timestamp: Date.now(),
        },
      ];
      
      await imageManager.prefetchImagesForFlights(flights);
      
      expect(mockImageService.prefetchImagesForTypes).toHaveBeenCalledWith(['B737']);
    });
    
    it('should do nothing with empty flight array', async () => {
      await imageManager.prefetchImagesForFlights([]);
      
      expect(mockImageService.prefetchImagesForTypes).not.toHaveBeenCalled();
    });
  });
  
  describe('clearImageCache', () => {
    it('should delegate to the image service', async () => {
      await imageManager.clearImageCache();
      
      expect(mockImageService.clearImageCache).toHaveBeenCalled();
    });
    
    it('should handle errors from image service gracefully', async () => {
      mockImageService.clearImageCache.mockRejectedValue(new Error('Test error'));
      
      await expect(imageManager.clearImageCache()).resolves.not.toThrow();
      expect(mockImageService.clearImageCache).toHaveBeenCalled();
    });
  });
});