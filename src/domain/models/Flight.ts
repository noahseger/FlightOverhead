/**
 * Flight interface representing an aircraft tracked by the app
 */
export interface Flight {
  id: string;
  flightNumber: string;
  aircraftType: string;
  origin: string; // Airport code
  originCity: string;
  destination: string; // Airport code
  destinationCity: string;
  altitude: number; // In feet
  heading: number; // In degrees
  speed: number; // In knots
  latitude: number;
  longitude: number;
  timestamp: number; // Unix timestamp
}
