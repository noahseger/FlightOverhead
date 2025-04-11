import { DevToast } from './DevToast';
import { FlightApiRepository } from '../../data/repositories/FlightApiRepository';
import { FlightDetector } from '../../domain/services/FlightDetector';
import { AircraftImageService } from '../../data/services/AircraftImageService';
import { NotificationService } from '../../data/services/NotificationService';
import { PermissionManager } from './PermissionManager';
import { Flight } from '../../domain/models';

/**
 * Helper for debugging and development
 * Contains methods to test different app functions
 */
export class DebugHelper {
  /**
   * Test the flight detection system
   */
  public static async testFlightDetection(): Promise<void> {
    try {
      // Default to San Francisco coordinates for testing
      const userLocation = {
        latitude: 37.7749,
        longitude: -122.4194,
      };
      
      // Detection radius in kilometers (larger radius for testing)
      const radiusKm = 50;
      
      // Show a toast to indicate we're starting the detection
      DevToast.show('Starting flight detection test...');
      
      // Create repository and detector instances
      const flightApiRepository = new FlightApiRepository();
      const flightDetector = new FlightDetector(flightApiRepository);
      
      // Try to detect flights
      const flights = await flightDetector.detectOverheadFlights(userLocation, radiusKm);
      
      // Show results (the repository and detector should already show toasts)
      if (flights.length === 0) {
        DevToast.show('No new flights detected. Try increasing radius or changing location.');
      }
    } catch (error) {
      console.error('Error testing flight detection:', error);
      DevToast.show(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Test the toast functionality directly
   */
  public static testToast(): void {
    DevToast.show('This is a test toast message');
    
    // Show a sequence of toasts with delays
    setTimeout(() => {
      DevToast.show('Toast 1 of 3');
      
      setTimeout(() => {
        DevToast.show('Toast 2 of 3');
        
        setTimeout(() => {
          DevToast.show('Toast 3 of 3');
        }, 2000);
      }, 2000);
    }, 1000);
  }
  
  /**
   * Test the aircraft image service
   */
  public static async testAircraftImageService(): Promise<void> {
    try {
      DevToast.show('Testing Aircraft Image Service...');
      
      // Get the service instance
      const imageService = AircraftImageService.getInstance();
      
      // Test aircraft types to look up
      const aircraftTypes = [
        'B738',     // Boeing 737-800
        'A320',     // Airbus A320
        'CRJ7',     // CRJ-700
        'E190',     // Embraer E190
        'C172',     // Cessna 172
        'R44',      // Robinson R44 helicopter
        'UNKNOWN',  // Unknown type for fallback testing
      ];
      
      // Show how many types we're testing
      DevToast.show(`Testing ${aircraftTypes.length} aircraft types...`);
      
      // Test each type with a delay between tests
      for (let i = 0; i < aircraftTypes.length; i++) {
        const type = aircraftTypes[i];
        
        setTimeout(async () => {
          try {
            // Get image with aircraft info
            DevToast.show(`Looking up: ${type}...`);
            const result = await imageService.getImageForAircraftTypeWithInfo(type);
            
            // Show the result
            if (result.info) {
              const category = result.info.category;
              const manufacturer = result.info.manufacturer;
              const model = result.info.model;
              
              DevToast.show(`Found: ${manufacturer} ${model} (${category})`);
              
              // Show image path status
              if (result.path) {
                DevToast.show(`Image loaded: ${result.path.split('/').pop()}`);
              } else {
                DevToast.show('No image available');
              }
            } else {
              DevToast.show(`No info found for: ${type}`);
            }
          } catch (error) {
            DevToast.show(`Error looking up ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }, i * 3000); // 3 second delay between each test
      }
      
      // Test prefetching
      setTimeout(async () => {
        try {
          DevToast.show('Testing image prefetching...');
          await imageService.prefetchImagesForTypes(aircraftTypes);
        } catch (error) {
          DevToast.show(`Error during prefetch: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }, aircraftTypes.length * 3000 + 1000); // After all lookups are done
      
    } catch (error) {
      console.error('Error testing aircraft image service:', error);
      DevToast.show(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Test notifications by showing a sample flight notification
   */
  public static async testNotification(): Promise<void> {
    try {
      DevToast.show('Testing notification...');
      
      // Get permission manager instance
      const permissionManager = PermissionManager.getInstance();
      
      // Check if notification permission is already granted
      let hasPermission = await permissionManager.checkNotificationPermission();
      
      if (!hasPermission) {
        DevToast.show('Requesting notification permission...');
        // Request notification permission explicitly
        hasPermission = await permissionManager.requestNotificationPermission();
        
        if (!hasPermission) {
          DevToast.show('Notification permission denied. Cannot show test notification.');
          // Try to open settings to let user enable notifications
          DevToast.show('Opening app settings. Please enable notifications and try again.');
          await permissionManager.openAppSettings();
          return;
        }
      }
      
      DevToast.show('Notification permission granted! Showing test notification...');
      
      // Create notification service
      const notificationService = NotificationService.getInstance(permissionManager);
      
      // Set up notifications
      await notificationService.setupNotifications();
      
      // Create a sample flight for notification
      const sampleFlight: Flight = {
        id: 'test-flight-' + Date.now(),
        flightNumber: 'UA123',
        aircraftType: 'B738',
        origin: 'SFO',
        originCity: 'San Francisco',
        destination: 'JFK',
        destinationCity: 'New York',
        altitude: 35000,
        heading: 90,
        speed: 450,
        latitude: 37.7749,
        longitude: -122.4194,
        timestamp: Date.now(),
        isOnGround: false
      };
      
      // Try to get an aircraft image
      let imagePath: string | null = null;
      try {
        const imageService = AircraftImageService.getInstance();
        imagePath = await imageService.getImageForAircraftType(sampleFlight.aircraftType);
      } catch (e) {
        console.log('Could not get aircraft image:', e);
      }
      
      // Show notification
      const notificationId = await notificationService.showFlightNotification(sampleFlight, imagePath);
      
      DevToast.show(`Test notification sent: ${notificationId}`);
      
      // Show a toast with the notification's action buttons
      setTimeout(() => {
        DevToast.show('Check notification for action buttons: View Details, Flight History, Dismiss');
      }, 2000);
      
    } catch (error) {
      console.error('Error testing notification:', error);
      DevToast.show(`Error showing notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}