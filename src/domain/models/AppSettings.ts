/**
 * AppSettings interface for application configuration
 */
export interface AppSettings {
  detectionRadiusKm: number; // Default: 5.0
  lastKnownLocation: Location | null;
}

export interface Location {
  latitude: number;
  longitude: number;
}
