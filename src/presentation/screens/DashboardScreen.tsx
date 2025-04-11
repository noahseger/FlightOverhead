import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button, Card, FAB, List, Surface } from 'react-native-paper';
import { DashboardScreenProps } from '../navigation/types';
import { useColorScheme } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';

/**
 * Dashboard screen component
 * Main screen showing nearby flights
 */
const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const textColor = isDarkMode ? Colors.lighter : Colors.darker;
  
  // Placeholder data for nearby flights
  const nearbyFlights = [
    { id: 'flight1', flightNumber: 'UA123', altitude: 35000, distance: 2.3, aircraftType: 'B738' },
    { id: 'flight2', flightNumber: 'DL456', altitude: 28000, distance: 3.1, aircraftType: 'A320' },
    { id: 'flight3', flightNumber: 'AA789', altitude: 31000, distance: 4.5, aircraftType: 'B77W' },
  ];
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.locationCard}>
          <Card.Title title="Current Location" />
          <Card.Content>
            <Text style={[styles.locationText, { color: textColor }]}>
              37.7749° N, 122.4194° W
            </Text>
            <Text style={styles.locationSubtext}>
              San Francisco, CA
            </Text>
            <Text style={[styles.updatedText, { color: textColor }]}>
              Updated: 2 minutes ago
            </Text>
            
            <View style={styles.buttonContainer}>
              <Button 
                mode="contained" 
                icon="refresh"
                onPress={() => {
                  // Placeholder for refresh action
                  alert('Location refreshed');
                }}
              >
                Refresh
              </Button>
            </View>
          </Card.Content>
        </Card>
        
        <View style={styles.listHeader}>
          <Text style={[styles.listHeaderText, { color: textColor }]}>
            Nearby Aircraft ({nearbyFlights.length})
          </Text>
        </View>
        
        {nearbyFlights.map(flight => (
          <Surface style={styles.flightCard} key={flight.id} elevation={1}>
            <List.Item
              title={flight.flightNumber}
              description={`${flight.aircraftType} · ${flight.altitude.toLocaleString()} feet · ${flight.distance} km away`}
              left={props => <List.Icon {...props} icon="airplane" />}
              onPress={() => navigation.navigate('FlightDetails', { flightId: flight.id })}
              right={props => (
                <Button 
                  {...props} 
                  icon="chevron-right" 
                  mode="text"
                  onPress={() => navigation.navigate('FlightDetails', { flightId: flight.id })}
                />
              )}
            />
          </Surface>
        ))}
        
        {nearbyFlights.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: textColor }]}>
              No aircraft detected nearby
            </Text>
            <Button 
              mode="contained" 
              icon="refresh"
              style={styles.emptyButton}
              onPress={() => {
                // Placeholder for scan action
                alert('Scanning for aircraft');
              }}
            >
              Scan Now
            </Button>
          </View>
        )}
      </ScrollView>
      
      {/* Settings and Debug FABs */}
      <FAB
        style={styles.fab}
        icon="cog"
        onPress={() => navigation.navigate('Settings')}
      />
      
      {/* Debug FAB - only visible in development */}
      {__DEV__ && (
        <FAB
          style={styles.debugFab}
          icon="bug"
          onPress={() => navigation.navigate('Debug')}
          small
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  locationCard: {
    margin: 16,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationSubtext: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 8,
  },
  updatedText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 16,
    alignItems: 'flex-start',
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  listHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  flightCard: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  debugFab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 80,
    backgroundColor: '#f44336',
  },
});

export default DashboardScreen;