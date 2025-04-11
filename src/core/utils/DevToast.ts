import { ToastAndroid } from 'react-native';

/**
 * Simple utility class for showing development-only toast messages on Android
 */
export class DevToast {
  /**
   * Whether dev toasts are enabled
   * This should be true only during development
   */
  private static _enabled: boolean = __DEV__;

  /**
   * Maximum number of flights to show details for
   */
  private static MAX_FLIGHTS_TO_DETAIL = 5;

  /**
   * Enable or disable dev toasts
   * @param enabled Whether to enable dev toasts
   */
  public static setEnabled(enabled: boolean): void {
    DevToast._enabled = enabled && __DEV__;
  }

  /**
   * Check if dev toasts are enabled
   * @returns True if dev toasts are enabled
   */
  public static isEnabled(): boolean {
    return DevToast._enabled;
  }

  /**
   * Show a toast message
   * @param message Message to display
   */
  public static show(message: string): void {
    if (!DevToast._enabled) return;
    ToastAndroid.show(message, ToastAndroid.LONG);
  }

  /**
   * Show a toast with API results
   * @param endpoint API endpoint name
   * @param count Number of results
   * @param durationMs How long the API call took (ms)
   */
  public static showApiResults(endpoint: string, count: number, durationMs: number): void {
    const message = `API: ${endpoint} - ${count} results in ${durationMs}ms`;
    DevToast.show(message);
  }

  /**
   * Show a toast with flight detection results
   * @param total Total flights detected
   * @param overhead Number of overhead flights
   */
  public static showFlightResults(total: number, overhead: number): void {
    const message = `Flights: ${total} total, ${overhead} overhead`;
    DevToast.show(message);
  }

  /**
   * Show details for a single flight
   * @param flight The flight object
   * @param distance Distance in km (optional)
   */
  public static showFlightDetails(flight: any, distance?: number): void {
    if (!DevToast._enabled) return;
    
    let message = `Flight: ${flight.flightNumber || flight.id}`;
    
    if (flight.aircraftType && flight.aircraftType !== 'Unknown') {
      message += ` (${flight.aircraftType})`;
    }
    
    if (distance !== undefined) {
      message += ` - ${distance.toFixed(1)}km away`;
    }
    
    message += ` at ${flight.altitude.toLocaleString()}ft`;
    
    if (flight.speed) {
      message += `, ${flight.speed} knots`;
    }
    
    DevToast.show(message);
  }

  /**
   * Show a toast for each flight in the given array (limited to avoid toast spam)
   * @param flights Array of flights to show
   * @param userLocation User's current location
   */
  public static showNearbyFlights(flights: any[], userLocation?: { latitude: number, longitude: number }): void {
    if (!DevToast._enabled || flights.length === 0) return;

    // First, show a summary
    DevToast.showFlightResults(flights.length, flights.length);
    
    // Then show details for a limited number of flights
    const limitedFlights = flights.slice(0, DevToast.MAX_FLIGHTS_TO_DETAIL);
    
    // Wait a moment before showing individual flight details
    setTimeout(() => {
      limitedFlights.forEach((flight, index) => {
        // Calculate distance if location is provided
        let distance: number | undefined;
        if (userLocation && flight.latitude && flight.longitude) {
          distance = DevToast.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            flight.latitude,
            flight.longitude
          );
        }
        
        // Add delay to prevent toasts from overlapping
        setTimeout(() => {
          DevToast.showFlightDetails(flight, distance);
        }, index * 3000); // 3 second delay between each flight
      });
    }, 1000); // 1 second delay after the summary
  }
  
  /**
   * Calculate distance between two coordinates
   * @param lat1 First latitude
   * @param lon1 First longitude
   * @param lat2 Second latitude
   * @param lon2 Second longitude
   * @returns Distance in kilometers
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}