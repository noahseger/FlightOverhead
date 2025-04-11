import { Flight } from '../models';
import { FlightApiRepository } from '../../data/repositories/FlightApiRepository';
import { AppError, DevToast, ErrorHandler, Logger } from '../../core/utils';

export class FlightDetectionError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(`FlightDetectionError: ${message}`, originalError);
    this.name = 'FlightDetectionError';
  }
}

export interface IFlightDetector {
  detectOverheadFlights(
    userLocation: { latitude: number; longitude: number },
    radiusKm: number
  ): Promise<Flight[]>;
  getLastDetectedFlights(): Flight[];
}

export class FlightDetector implements IFlightDetector {
  private logger = new Logger('FlightDetector');
  private errorHandler = new ErrorHandler();
  private flightApiRepository: FlightApiRepository;
  private lastDetectedFlights: Flight[] = [];
  private lastDetectionTime: number = 0;

  constructor(flightApiRepository: FlightApiRepository) {
    this.flightApiRepository = flightApiRepository;
  }

  /**
   * Detect aircraft flying overhead within the specified radius
   * @param userLocation The user's location
   * @param radiusKm The detection radius in kilometers
   * @returns Array of detected flights
   */
  public async detectOverheadFlights(
    userLocation: { latitude: number; longitude: number },
    radiusKm: number
  ): Promise<Flight[]> {
    try {
      // Get nearby aircraft from repository
      const nearbyAircraft = await this.flightApiRepository.getNearbyAircraft(
        userLocation.latitude,
        userLocation.longitude,
        radiusKm
      );

      // Identify new aircraft that weren't previously detected
      const newDetections = this.identifyNewFlights(nearbyAircraft);
      
      // Update last detected flights list
      this.lastDetectedFlights = nearbyAircraft;
      this.lastDetectionTime = Date.now();
      
      this.logger.info(`Detected ${nearbyAircraft.length} nearby aircraft, ${newDetections.length} new`);
      
      // If there are new detections, show a toast with details
      if (newDetections.length > 0) {
        DevToast.show(`NEW DETECTIONS: ${newDetections.length} aircraft`);
        
        // Show details for each new flight (with delayed timing)
        setTimeout(() => {
          newDetections.forEach((flight, index) => {
            setTimeout(() => {
              DevToast.showFlightDetails(flight);
            }, index * 3000); // 3 second delay between each flight
          });
        }, 1000);
      }
      
      return newDetections;
    } catch (error) {
      this.logger.error('Error detecting overhead flights', { error, userLocation, radiusKm });
      this.errorHandler.handleError(
        new FlightDetectionError('Failed to detect overhead flights', error as Error)
      );
      throw new FlightDetectionError('Failed to detect overhead flights', error as Error);
    }
  }

  /**
   * Get the list of flights detected in the most recent detection
   * @returns Array of flights
   */
  public getLastDetectedFlights(): Flight[] {
    return this.lastDetectedFlights;
  }

  /**
   * Identify new flights that weren't in the previous detection
   * @param currentFlights The current set of detected flights
   * @returns Array of newly detected flights
   */
  private identifyNewFlights(currentFlights: Flight[]): Flight[] {
    // If this is the first detection, consider all flights as new
    if (this.lastDetectedFlights.length === 0) {
      return currentFlights;
    }
    
    // Extract IDs of previously detected flights
    const previousIds = new Set(this.lastDetectedFlights.map(flight => flight.id));
    
    // Filter current flights to only include those not previously detected
    return currentFlights.filter(flight => !previousIds.has(flight.id));
  }
}