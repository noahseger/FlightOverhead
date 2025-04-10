import { FlightApiService, OpenSkyResponse } from '../FlightApiService';
import axios from 'axios';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn()
      }
    }
  }))
}));

describe('FlightApiService', () => {
  let apiService: FlightApiService;
  let mockAxiosGet: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up the mock axios instance
    const mockAxiosInstance = axios.create() as jest.Mocked<any>;
    mockAxiosGet = mockAxiosInstance.get as jest.Mock;
    
    // Create service instance
    apiService = new FlightApiService();
  });

  describe('getAircraftInArea', () => {
    it('should fetch aircraft in the specified area', async () => {
      // Arrange
      const mockResponse: OpenSkyResponse = {
        time: 1617283200,
        states: [
          {
            icao24: 'abc123',
            callsign: 'UAL123',
            origin_country: 'United States',
            time_position: 1617283200,
            last_contact: 1617283210,
            longitude: -122.374,
            latitude: 37.619,
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
          }
        ]
      };
      
      mockAxiosGet.mockResolvedValue({ data: mockResponse });
      
      // Define area parameters
      const minLat = 37.5;
      const maxLat = 37.7;
      const minLon = -122.5;
      const maxLon = -122.3;
      
      // Act
      const result = await apiService.getAircraftInArea(minLat, maxLat, minLon, maxLon);
      
      // Assert
      expect(mockAxiosGet).toHaveBeenCalledWith('/states/all', {
        params: {
          lamin: minLat,
          lamax: maxLat,
          lomin: minLon,
          lomax: maxLon,
        }
      });
      
      expect(result).toEqual(mockResponse.states);
    });
    
    it('should return an empty array when no aircraft found', async () => {
      // Arrange
      const mockResponse: OpenSkyResponse = {
        time: 1617283200,
        states: []
      };
      
      mockAxiosGet.mockResolvedValue({ data: mockResponse });
      
      // Act
      const result = await apiService.getAircraftInArea(37.5, 37.7, -122.5, -122.3);
      
      // Assert
      expect(result).toEqual([]);
    });
    
    it('should throw an error when API call fails', async () => {
      // Arrange
      const mockError = new Error('API error');
      mockAxiosGet.mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(apiService.getAircraftInArea(37.5, 37.7, -122.5, -122.3))
        .rejects.toThrow('Failed to fetch aircraft data');
    });
  });
  
  describe('getAircraftByIcao', () => {
    it('should fetch aircraft by ICAO24 address', async () => {
      // Arrange
      const icao24 = 'abc123';
      const mockResponse: OpenSkyResponse = {
        time: 1617283200,
        states: [
          {
            icao24: icao24,
            callsign: 'UAL123',
            origin_country: 'United States',
            time_position: 1617283200,
            last_contact: 1617283210,
            longitude: -122.374,
            latitude: 37.619,
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
          }
        ]
      };
      
      mockAxiosGet.mockResolvedValue({ data: mockResponse });
      
      // Act
      const result = await apiService.getAircraftByIcao(icao24);
      
      // Assert
      expect(mockAxiosGet).toHaveBeenCalledWith('/states/all', {
        params: {
          icao24: icao24
        }
      });
      
      expect(result).toEqual(mockResponse.states[0]);
    });
    
    it('should return null when no aircraft found', async () => {
      // Arrange
      const mockResponse: OpenSkyResponse = {
        time: 1617283200,
        states: []
      };
      
      mockAxiosGet.mockResolvedValue({ data: mockResponse });
      
      // Act
      const result = await apiService.getAircraftByIcao('abc123');
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should throw an error when API call fails', async () => {
      // Arrange
      const mockError = new Error('API error');
      mockAxiosGet.mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(apiService.getAircraftByIcao('abc123'))
        .rejects.toThrow('Failed to fetch aircraft with ICAO24');
    });
  });
});