import { FlightDetector } from '../FlightDetector';
import { FlightApiRepository } from '../../../data/repositories/FlightApiRepository';
import { Flight } from '../../models';

// Mock dependencies
jest.mock('../../../data/repositories/FlightApiRepository');

describe('FlightDetector', () => {
  let flightDetector: FlightDetector;
  let mockRepository: jest.Mocked<FlightApiRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock repository
    mockRepository = {
      getNearbyAircraft: jest.fn(),
      getAircraftById: jest.fn(),
      clearCache: jest.fn()
    } as unknown as jest.Mocked<FlightApiRepository>;
    
    // Create detector with mocked repository
    flightDetector = new FlightDetector(mockRepository);
  });

  describe('detectOverheadFlights', () => {
    it('should detect overhead flights within the specified radius', async () => {
      // Arrange
      const userLocation = { latitude: 37.7749, longitude: -122.4194 };
      const radiusKm = 5;
      
      const mockFlights: Flight[] = [
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
        },
        {
          id: 'def456',
          flightNumber: 'DLH456',
          aircraftType: 'A320',
          origin: 'FRA',
          originCity: 'Frankfurt',
          destination: 'SFO',
          destinationCity: 'San Francisco',
          altitude: 8000,
          heading: 270,
          speed: 350,
          latitude: 37.76,
          longitude: -122.42,
          timestamp: 1617283210000,
          isOnGround: false
        }
      ];
      
      mockRepository.getNearbyAircraft.mockResolvedValue(mockFlights);
      
      // Act
      const result = await flightDetector.detectOverheadFlights(userLocation, radiusKm);
      
      // Assert
      expect(mockRepository.getNearbyAircraft).toHaveBeenCalledWith(
        userLocation.latitude,
        userLocation.longitude,
        radiusKm
      );
      expect(result).toEqual(mockFlights);
    });
    
    it('should identify only new flights on subsequent detections', async () => {
      // Arrange
      const userLocation = { latitude: 37.7749, longitude: -122.4194 };
      const radiusKm = 5;
      
      // First detection
      const firstFlights: Flight[] = [
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
      
      // Second detection (one existing, one new)
      const secondFlights: Flight[] = [
        // Existing flight
        {
          id: 'abc123',
          flightNumber: 'UAL123',
          aircraftType: 'B738',
          origin: 'SFO',
          originCity: 'San Francisco',
          destination: 'LAX',
          destinationCity: 'Los Angeles',
          altitude: 9500, // Changed altitude
          heading: 185, // Changed heading
          speed: 395, // Changed speed
          latitude: 37.76, // Changed position
          longitude: -122.42,
          timestamp: 1617283270000, // Later timestamp
          isOnGround: false
        },
        // New flight
        {
          id: 'def456',
          flightNumber: 'DLH456',
          aircraftType: 'A320',
          origin: 'FRA',
          originCity: 'Frankfurt',
          destination: 'SFO',
          destinationCity: 'San Francisco',
          altitude: 8000,
          heading: 270,
          speed: 350,
          latitude: 37.76,
          longitude: -122.42,
          timestamp: 1617283270000,
          isOnGround: false
        }
      ];
      
      // First call returns first set of flights
      mockRepository.getNearbyAircraft.mockResolvedValueOnce(firstFlights);
      
      // Second call returns second set
      mockRepository.getNearbyAircraft.mockResolvedValueOnce(secondFlights);
      
      // First detection
      await flightDetector.detectOverheadFlights(userLocation, radiusKm);
      
      // Second detection
      const result = await flightDetector.detectOverheadFlights(userLocation, radiusKm);
      
      // Assert
      expect(mockRepository.getNearbyAircraft).toHaveBeenCalledTimes(2);
      
      // Should only return the new flight
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('def456');
    });
    
    it('should handle errors from the repository', async () => {
      // Arrange
      const userLocation = { latitude: 37.7749, longitude: -122.4194 };
      const radiusKm = 5;
      
      mockRepository.getNearbyAircraft.mockRejectedValue(new Error('API error'));
      
      // Act & Assert
      await expect(flightDetector.detectOverheadFlights(userLocation, radiusKm))
        .rejects.toThrow('Failed to detect overhead flights');
    });
  });

  describe('getLastDetectedFlights', () => {
    it('should return the last detected flights', async () => {
      // Arrange
      const userLocation = { latitude: 37.7749, longitude: -122.4194 };
      const radiusKm = 5;
      
      const mockFlights: Flight[] = [
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
      
      mockRepository.getNearbyAircraft.mockResolvedValue(mockFlights);
      
      // Perform a detection first
      await flightDetector.detectOverheadFlights(userLocation, radiusKm);
      
      // Act
      const result = flightDetector.getLastDetectedFlights();
      
      // Assert
      expect(result).toEqual(mockFlights);
    });
    
    it('should return empty array if no detection performed yet', () => {
      // Act
      const result = flightDetector.getLastDetectedFlights();
      
      // Assert
      expect(result).toEqual([]);
    });
  });
});