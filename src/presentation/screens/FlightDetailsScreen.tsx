import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Card, Button, Divider, ActivityIndicator } from 'react-native-paper';
import { FlightDetailsScreenProps } from '../navigation/types';
import { useColorScheme } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';

/**
 * Flight details screen component
 * Shows detailed information about a specific flight
 */
const FlightDetailsScreen: React.FC<FlightDetailsScreenProps> = ({ route, navigation }) => {
  const { flightId } = route.params;
  const isDarkMode = useColorScheme() === 'dark';
  const textColor = isDarkMode ? Colors.lighter : Colors.darker;
  
  // Placeholder loading state
  const [loading, setLoading] = React.useState(false);
  
  // Placeholder flight data
  const flight = {
    id: flightId,
    flightNumber: 'UA123',
    aircraftType: 'Boeing 737-800',
    origin: 'SFO',
    originCity: 'San Francisco',
    destination: 'JFK',
    destinationCity: 'New York',
    altitude: 35000,
    heading: 90,
    speed: 450,
    latitude: 37.7749,
    longitude: -122.4194,
    timestamp: Date.now() - 120000, // 2 minutes ago
  };
  
  return (
    <ScrollView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={[styles.loadingText, { color: textColor }]}>
            Loading flight details...
          </Text>
        </View>
      ) : (
        <>
          <Card style={styles.card}>
            <Card.Title 
              title={flight.flightNumber} 
              subtitle={flight.aircraftType}
            />
            <Card.Content>
              <View style={styles.routeContainer}>
                <View style={styles.routeItem}>
                  <Text style={styles.airportCode}>{flight.origin}</Text>
                  <Text style={styles.cityName}>{flight.originCity}</Text>
                </View>
                <View style={styles.routeArrow}>
                  <Text style={styles.arrowText}>✈️</Text>
                </View>
                <View style={styles.routeItem}>
                  <Text style={styles.airportCode}>{flight.destination}</Text>
                  <Text style={styles.cityName}>{flight.destinationCity}</Text>
                </View>
              </View>
            </Card.Content>
            <Card.Cover 
              source={{ uri: 'https://picsum.photos/seed/aircraft/400/200' }} 
              style={styles.aircraftImage}
            />
          </Card>
          
          <Card style={styles.detailsCard}>
            <Card.Title title="Flight Details" />
            <Card.Content>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Altitude:</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  {flight.altitude.toLocaleString()} feet
                </Text>
              </View>
              <Divider style={styles.divider} />
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Speed:</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  {flight.speed} knots
                </Text>
              </View>
              <Divider style={styles.divider} />
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Heading:</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  {flight.heading}° ({getHeadingDirection(flight.heading)})
                </Text>
              </View>
              <Divider style={styles.divider} />
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Updated:</Text>
                <Text style={[styles.detailValue, { color: textColor }]}>
                  {formatTimestamp(flight.timestamp)}
                </Text>
              </View>
            </Card.Content>
          </Card>
          
          <Card style={styles.mapCard}>
            <Card.Title title="Location" />
            <Card.Content>
              <View style={styles.mapPlaceholder}>
                <Text style={styles.mapPlaceholderText}>
                  Map view will be displayed here
                </Text>
                <Text style={styles.coordinatesText}>
                  {flight.latitude.toFixed(4)}°, {flight.longitude.toFixed(4)}°
                </Text>
              </View>
            </Card.Content>
          </Card>
          
          <View style={styles.buttonContainer}>
            <Button 
              mode="contained" 
              icon="refresh"
              onPress={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 1000);
              }}
            >
              Refresh Data
            </Button>
            
            <Button 
              mode="outlined" 
              icon="arrow-left"
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              Back to Dashboard
            </Button>
          </View>
        </>
      )}
    </ScrollView>
  );
};

// Helper function to convert heading to cardinal direction
const getHeadingDirection = (heading: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(heading / 45) % 8];
};

// Helper function to format timestamp
const formatTimestamp = (timestamp: number): string => {
  const now = Date.now();
  const diffSeconds = Math.floor((now - timestamp) / 1000);
  
  if (diffSeconds < 60) {
    return `${diffSeconds} seconds ago`;
  } else if (diffSeconds < 3600) {
    return `${Math.floor(diffSeconds / 60)} minutes ago`;
  } else if (diffSeconds < 86400) {
    return `${Math.floor(diffSeconds / 3600)} hours ago`;
  } else {
    return new Date(timestamp).toLocaleString();
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  detailsCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  mapCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  aircraftImage: {
    height: 180,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  routeItem: {
    alignItems: 'center',
    flex: 1,
  },
  routeArrow: {
    padding: 8,
  },
  arrowText: {
    fontSize: 18,
  },
  airportCode: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cityName: {
    fontSize: 14,
    color: 'gray',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: 'gray',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
  },
  mapPlaceholder: {
    height: 180,
    backgroundColor: '#e1e1e1',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#666',
  },
  coordinatesText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  buttonContainer: {
    padding: 16,
    marginBottom: 32,
  },
  backButton: {
    marginTop: 8,
  },
});

export default FlightDetailsScreen;