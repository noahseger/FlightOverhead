import { Flight } from '../../domain/models';
import { OpenSkyState } from '../services/FlightApiService';

export class FlightMapper {
  /**
   * Converts an OpenSky API state to our domain Flight model
   * @param state The OpenSky state to convert
   * @returns A Flight domain model
   */
  public static toFlight(state: OpenSkyState): Flight {
    // Clean callsign by removing trailing spaces
    const callsign = state.callsign ? state.callsign.trim() : 'Unknown';
    
    // Default values for fields not directly available in OpenSky API
    const flightNumber = callsign;
    const aircraftType = 'Unknown'; // OpenSky doesn't provide aircraft type directly
    const origin = 'Unknown'; // Not provided by OpenSky
    const originCity = state.origin_country || 'Unknown';
    const destination = 'Unknown'; // Not provided by OpenSky
    const destinationCity = 'Unknown'; // Not provided by OpenSky

    // Convert meters to feet for altitude
    const altitudeFeet = state.baro_altitude ? Math.round(state.baro_altitude * 3.28084) : 0;
    
    // Convert m/s to knots for speed
    const speedKnots = state.velocity ? Math.round(state.velocity * 1.94384) : 0;
    
    return {
      id: state.icao24,
      flightNumber,
      aircraftType,
      origin,
      originCity,
      destination,
      destinationCity,
      altitude: altitudeFeet,
      heading: state.true_track || 0,
      speed: speedKnots,
      latitude: state.latitude,
      longitude: state.longitude,
      timestamp: state.last_contact * 1000, // Convert to milliseconds
      isOnGround: state.on_ground,
    };
  }

  /**
   * Converts multiple OpenSky API states to domain Flight models
   * @param states Array of OpenSky states
   * @returns Array of Flight domain models
   */
  public static toFlights(states: OpenSkyState[]): Flight[] {
    return states.map(state => this.toFlight(state));
  }
}