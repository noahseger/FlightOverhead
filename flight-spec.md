# Flight Overhead Notification App Specification

## Executive Summary
This mobile application notifies users about aircraft flying over their current location, providing detailed flight information and aircraft images. The app prioritizes comprehensive tracking (all overhead flights) with user-configurable detection radius, using public flight tracking APIs for data and supporting both major mobile platforms.

## 1. Functional Requirements

### 1.1 Core Features
- Real-time notification of all aircraft flying overhead of the user's current location
- Display of flight details in each notification:
  - Aircraft model
  - Flight number
  - Origin airport/city
  - Destination airport/city
  - Stock photo of the aircraft model
- Configurable detection radius to ensure users can visually locate the plane
- History log of all notified flights

### 1.2 User Interface
- Primary interaction through system notifications
- Rich notifications with flight details and aircraft stock image
- System-standard notification sounds (leveraging native OS notification settings)
- Simple in-app interface for:
  - Configuring detection radius
  - Viewing flight history log
  - Managing basic app settings

### 1.3 User Preferences
- Configurable detection radius (in km/miles)
- No altitude filtering in v1
- No automatic disabling when indoors
- Option to clear history log

## 2. Technical Architecture

### 2.1 Platforms
- Native applications for:
  - iOS (Swift)
  - Android (Kotlin)

### 2.2 System Components
- **Location Service**: Background process monitoring device location
- **Flight Detection Engine**: Service that queries flight APIs based on current location
- **Notification Manager**: Handles creation and delivery of rich notifications
- **Data Storage**: Local database for flight history and app settings
- **Image Cache**: Local storage for aircraft stock photos

### 2.3 External Dependencies
- Public Flight Tracking API (e.g., ADS-B Exchange, OpenSky Network, or Aviation Edge)
- Aircraft image database or API
- Geolocation services 
- Push notification services (Firebase Cloud Messaging for Android, APNS for iOS)

### 2.4 Data Flow
1. Location Service continuously monitors user position
2. When location changes significantly, Flight Detection Engine queries flight API
3. Flight data is filtered for aircraft within the configured radius
4. For matching aircraft, Notification Manager creates and displays notifications
5. Flight details are stored in local database for history

## 3. Data Specifications

### 3.1 Flight Data
- Flight number/callsign
- Aircraft model/type
- Origin airport (IATA code and city name)
- Destination airport (IATA code and city name)
- Current altitude
- Current heading
- Current speed
- Coordinates (latitude/longitude)
- Timestamp

### 3.2 User Data
- Current location (latitude/longitude)
- Configured detection radius
- Notification preferences
- Flight history log

### 3.3 Local Storage Schema
```
Settings {
  detectionRadiusKm: float
  lastKnownLocation: {lat: float, lng: float}
}

FlightLog {
  id: string
  timestamp: datetime
  flightNumber: string
  aircraftType: string
  origin: string
  destination: string
  altitude: float
  heading: float
  coordinatesAtDetection: {lat: float, lng: float}
}
```

### 3.4 Privacy & Data Handling
- Full location logging permission required
- Location data used only for flight detection, not shared externally
- Flight history stored locally only
- No user identification data required or collected

## 4. Permission Requirements

### 4.1 iOS
- Location Services (Always)
- Notification permissions
- Background App Refresh

### 4.2 Android
- Fine Location permission
- Background Location permission
- Notification permission
- Internet access
- Wake lock (to run periodically in background)

## 5. Technical Implementation Details

### 5.1 Background Processing
- iOS: Implement background fetch with maximum allowed frequency
- Android: Scheduled job service with optimal intervals for location checks
- Both platforms: Optimize for accuracy over battery consumption

### 5.2 Location Updates
- Request location updates at highest practical frequency
- Filter insignificant location changes to reduce API calls
- Implement appropriate geofencing where applicable

### 5.3 API Integration
- Poll flight API at appropriate intervals based on:
  - User movement (significant location changes)
  - Time elapsed since last check
  - Available bandwidth
- Implement appropriate rate limiting to avoid API quota issues
- Cache responses when appropriate

### 5.4 Notification Handling
- Create rich notifications with all required flight details
- Include stock aircraft image (downloaded and cached)
- Ensure notifications are stackable when multiple aircraft are detected
- Use system notification channels/categories for sound configuration

### 5.5 Error Handling
- Implement exponential backoff for API failures
- Cache last known flight data to handle offline scenarios
- Gracefully degrade functionality when location services are unavailable
- Provide clear error messaging when services are unavailable

## 6. Testing Plan

### 6.1 Unit Testing
- Location service functionality
- Flight detection algorithm
- Notification creation and formatting
- Database operations
- API response parsing

### 6.2 Integration Testing
- End-to-end notification flow
- Background processing reliability
- API integration under various network conditions
- Permission handling and degraded operation

### 6.3 Performance Testing
- Battery consumption benchmarks
- Memory usage monitoring
- Response time for notifications
- Cold start and background wake performance

### 6.4 Field Testing
- Real-world flight detection accuracy
- GPS accuracy in various environments
- Notification delivery reliability
- Cross-device compatibility

## 7. Development Milestones

### 7.1 Phase 1: Core Architecture
- Set up project structure for both platforms
- Implement location tracking service
- Create local storage schema
- Establish API integration framework

### 7.2 Phase 2: Basic Functionality
- Implement flight detection algorithm
- Create notification system
- Develop basic UI for configuration
- Integrate aircraft image retrieval

### 7.3 Phase 3: Refinement
- Implement flight history logging
- Optimize background processing
- Add error handling and offline capabilities
- Fine-tune detection radius configuration

### 7.4 Phase 4: Testing & Optimization
- Conduct performance testing
- Optimize battery usage
- Fix identified issues
- Prepare for beta testing

## 8. Future Enhancements (v2+)
- Map view showing all nearby aircraft
- Advanced filtering options (by altitude, aircraft type, etc.)
- Smart notification throttling
- Integration with smart home devices
- Premium data sources for enhanced accuracy
- Weather integration for visibility information
- Social sharing of spotted aircraft

## 9. Known Limitations
- Public flight APIs may have limited coverage or delayed data
- Battery consumption will be higher than typical apps due to location tracking
- Background processing restrictions on iOS may limit detection frequency
- Stock photos may not match exact livery/airline branding of actual aircraft

## 10. Current Implementation Details

### 10.1 Notification System

#### Basic Notifications
- NotificationService handles platform-specific notification setup using react-native-notifications
- Flight notifications include title, body, sound, and badge
- Notification content is formatted based on flight info (type, altitude, speed, route)
- Throttling implemented to prevent notification spam

#### Rich Notifications
- Enhanced with images of the aircraft type
- Images are downloaded, cached, and used in notifications
- Different image handling for iOS and Android

#### Notification Actions
- Notification actions defined: VIEW_DETAILS, SHOW_HISTORY, DISMISS
- Action buttons added to notifications
- DeepLinkHandler created for navigation from notifications
- Notifications register tap and action handlers
- Navigation will be integrated in Phase 6 when UI is implemented

### 10.2 Deep Linking
- DeepLinkHandler class implemented to manage deep links
- Support for multiple deep link types:
  - FLIGHT_DETAILS - Shows details for a specific flight
  - FLIGHT_HISTORY - Shows flight history
  - SETTINGS - Opens settings screen
  - DASHBOARD - Goes to main dashboard
- URL structure: flightoverhead://[screen]?[params]
- Deep link registration during app initialization
- Navigation function registration for UI implementation
