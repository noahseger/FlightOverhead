import { Flight } from '../../domain/models';
import { StorageService } from '../services/StorageService';

const FLIGHTS_STORAGE_KEY = 'flights';

/**
 * Repository for managing Flight data
 */
export class FlightRepository {
  private storageService: StorageService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  /**
   * Save flights to storage
   * @param flights Array of Flight objects
   */
  async saveFlights(flights: Flight[]): Promise<void> {
    try {
      await this.storageService.storeData(FLIGHTS_STORAGE_KEY, flights);
    } catch (error) {
      console.error('Error saving flights:', error);
      throw new Error('Failed to save flights');
    }
  }

  /**
   * Add a new flight to storage
   * @param flight Flight object to add
   */
  async addFlight(flight: Flight): Promise<void> {
    try {
      const existingFlights = await this.getAllFlights();
      const flights = [...existingFlights, flight];
      await this.saveFlights(flights);
    } catch (error) {
      console.error('Error adding flight:', error);
      throw new Error('Failed to add flight');
    }
  }

  /**
   * Get a flight by ID
   * @param id Flight ID
   * @returns Flight if found, null otherwise
   */
  async getFlightById(id: string): Promise<Flight | null> {
    try {
      const flights = await this.getAllFlights();
      return flights.find(flight => flight.id === id) || null;
    } catch (error) {
      console.error('Error getting flight by ID:', error);
      throw new Error(`Failed to get flight with ID: ${id}`);
    }
  }

  /**
   * Get all stored flights
   * @returns Array of Flight objects
   */
  async getAllFlights(): Promise<Flight[]> {
    try {
      const flights = await this.storageService.getData<Flight[]>(FLIGHTS_STORAGE_KEY);
      return flights || [];
    } catch (error) {
      console.error('Error getting all flights:', error);
      throw new Error('Failed to get all flights');
    }
  }

  /**
   * Delete all stored flights
   */
  async deleteAllFlights(): Promise<void> {
    try {
      await this.storageService.removeData(FLIGHTS_STORAGE_KEY);
    } catch (error) {
      console.error('Error deleting all flights:', error);
      throw new Error('Failed to delete all flights');
    }
  }

  /**
   * Get flights filtered by date range
   * @param startDate Start date timestamp
   * @param endDate End date timestamp
   * @returns Array of Flight objects within the date range
   */
  async getFlightsByDateRange(startDate: number, endDate: number): Promise<Flight[]> {
    try {
      const flights = await this.getAllFlights();
      return flights.filter(
        flight => flight.timestamp >= startDate && flight.timestamp <= endDate
      );
    } catch (error) {
      console.error('Error getting flights by date range:', error);
      throw new Error('Failed to get flights by date range');
    }
  }
}
