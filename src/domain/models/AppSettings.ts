/**
 * AppSettings interface for application configuration
 */
export interface AppSettings {
  // Detection settings
  detectionRadiusKm: number; // Default: 50.0
  
  // Notification settings
  notificationsEnabled: boolean;
  richNotificationsEnabled: boolean;
  
  // Background tracking settings
  backgroundTrackingEnabled: boolean;
  
  // Location data
  lastKnownLocation?: Location | null;
  
  // App settings
  lastUpdate: number; // Timestamp
}

export interface Location {
  latitude: number;
  longitude: number;
}
