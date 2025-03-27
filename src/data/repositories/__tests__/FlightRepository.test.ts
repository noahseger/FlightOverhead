import { FlightRepository } from '../FlightRepository';
import { StorageService } from '../../services/StorageService';
import { Flight } from '../../../domain/models';

// Mock StorageService
jest.mock('../../services/StorageService');

describe('FlightRepository', () => {
  let flightRepository: FlightRepository;
  let mockStorageService: jest.Mocked<StorageService>;

  const mockFlights: Flight[] = [
    {
      id: 'flight1',
      flightNumber: 'BA123',
      aircraftType: 'B747',
      origin: 'LHR',
      originCity: 'London',
      destination: 'JFK',
      destinationCity: 'New York',
      altitude: 35000,
      heading: 270,
      speed: 550,
      latitude: 51.5,
      longitude: -0.12,
      timestamp: 1616457600000, // 2021-03-23
    },
    {
      id: 'flight2',
      flightNumber: 'LH456',
      aircraftType: 'A380',
      origin: 'FRA',
      originCity: 'Frankfurt',
      destination: 'LAX',
      destinationCity: 'Los Angeles',
      altitude: 37000,
      heading: 280,
      speed: 560,
      latitude: 50.1,
      longitude: 8.6,
      timestamp: 1616544000000, // 2021-03-24
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a fresh mocked instance for each test
    mockStorageService = {
      storeData: jest.fn(),
      getData: jest.fn(),
      removeData: jest.fn(),
      getAllKeys: jest.fn(),
    } as unknown as jest.Mocked<StorageService>;

    flightRepository = new FlightRepository(mockStorageService);
  });

  describe('saveFlights', () => {
    it('should save flights to storage', async () => {
      await flightRepository.saveFlights(mockFlights);

      expect(mockStorageService.storeData).toHaveBeenCalledWith('flights', mockFlights);
    });

    it('should throw error when storage fails', async () => {
      mockStorageService.storeData.mockRejectedValueOnce(new Error('Storage error'));

      await expect(flightRepository.saveFlights(mockFlights))
        .rejects
        .toThrow('Failed to save flights');

      expect(mockStorageService.storeData).toHaveBeenCalledWith('flights', mockFlights);
    });
  });

  describe('addFlight', () => {
    it('should add a flight to existing flights', async () => {
      const newFlight: Flight = {
        id: 'flight3',
        flightNumber: 'EK789',
        aircraftType: 'B777',
        origin: 'DXB',
        originCity: 'Dubai',
        destination: 'SYD',
        destinationCity: 'Sydney',
        altitude: 40000,
        heading: 120,
        speed: 570,
        latitude: 25.2,
        longitude: 55.3,
        timestamp: 1616630400000, // 2021-03-25
      };

      mockStorageService.getData.mockResolvedValueOnce(mockFlights);

      await flightRepository.addFlight(newFlight);

      expect(mockStorageService.getData).toHaveBeenCalledWith('flights');
      expect(mockStorageService.storeData).toHaveBeenCalledWith('flights', [...mockFlights, newFlight]);
    });

    it('should add a flight when no flights exist', async () => {
      const newFlight: Flight = {
        id: 'flight1',
        flightNumber: 'EK789',
        aircraftType: 'B777',
        origin: 'DXB',
        originCity: 'Dubai',
        destination: 'SYD',
        destinationCity: 'Sydney',
        altitude: 40000,
        heading: 120,
        speed: 570,
        latitude: 25.2,
        longitude: 55.3,
        timestamp: 1616630400000, // 2021-03-25
      };

      mockStorageService.getData.mockResolvedValueOnce(null);

      await flightRepository.addFlight(newFlight);

      expect(mockStorageService.getData).toHaveBeenCalledWith('flights');
      expect(mockStorageService.storeData).toHaveBeenCalledWith('flights', [newFlight]);
    });
  });

  describe('getFlightById', () => {
    it('should return a flight by id', async () => {
      mockStorageService.getData.mockResolvedValueOnce(mockFlights);

      const result = await flightRepository.getFlightById('flight2');

      expect(mockStorageService.getData).toHaveBeenCalledWith('flights');
      expect(result).toEqual(mockFlights[1]);
    });

    it('should return null when flight is not found', async () => {
      mockStorageService.getData.mockResolvedValueOnce(mockFlights);

      const result = await flightRepository.getFlightById('nonexistent');

      expect(mockStorageService.getData).toHaveBeenCalledWith('flights');
      expect(result).toBeNull();
    });
  });

  describe('getAllFlights', () => {
    it('should return all flights', async () => {
      mockStorageService.getData.mockResolvedValueOnce(mockFlights);

      const result = await flightRepository.getAllFlights();

      expect(mockStorageService.getData).toHaveBeenCalledWith('flights');
      expect(result).toEqual(mockFlights);
    });

    it('should return empty array when no flights exist', async () => {
      mockStorageService.getData.mockResolvedValueOnce(null);

      const result = await flightRepository.getAllFlights();

      expect(mockStorageService.getData).toHaveBeenCalledWith('flights');
      expect(result).toEqual([]);
    });
  });

  describe('deleteAllFlights', () => {
    it('should delete all flights', async () => {
      await flightRepository.deleteAllFlights();

      expect(mockStorageService.removeData).toHaveBeenCalledWith('flights');
    });
  });

  describe('getFlightsByDateRange', () => {
    it('should return flights within date range', async () => {
      mockStorageService.getData.mockResolvedValueOnce(mockFlights);

      const startDate = 1616457600000; // 2021-03-23
      const endDate = 1616544000000; // 2021-03-24

      const result = await flightRepository.getFlightsByDateRange(startDate, endDate);

      expect(mockStorageService.getData).toHaveBeenCalledWith('flights');
      expect(result).toEqual(mockFlights); // Both flights are within the range
    });

    it('should return empty array when no flights in range', async () => {
      mockStorageService.getData.mockResolvedValueOnce(mockFlights);

      const startDate = 1617235200000; // 2021-04-01
      const endDate = 1617321600000; // 2021-04-02

      const result = await flightRepository.getFlightsByDateRange(startDate, endDate);

      expect(mockStorageService.getData).toHaveBeenCalledWith('flights');
      expect(result).toEqual([]);
    });
  });
});
