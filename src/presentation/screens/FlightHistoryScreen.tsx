import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Appbar, Button, Card, Chip, Divider, FAB, List, Menu, Searchbar } from 'react-native-paper';
import { FlightHistoryScreenProps } from '../navigation/types';
import { useColorScheme } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';

/**
 * Flight history screen component
 * Shows list of previously detected flights
 */
const FlightHistoryScreen: React.FC<FlightHistoryScreenProps> = ({ navigation }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const textColor = isDarkMode ? Colors.lighter : Colors.darker;
  
  // Search state
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Filter menu state
  const [filterMenuVisible, setFilterMenuVisible] = React.useState(false);
  const [activeFilters, setActiveFilters] = React.useState<string[]>([]);
  
  // Sort state
  const [sortMenuVisible, setSortMenuVisible] = React.useState(false);
  const [sortOption, setSortOption] = React.useState('time_desc');
  
  // Placeholder data for flight history
  const flightHistory = [
    { 
      id: 'hist1', 
      flightNumber: 'UA123', 
      aircraftType: 'B737', 
      altitude: 35000, 
      timestamp: Date.now() - 3600000, // 1 hour ago
      origin: 'SFO',
      destination: 'JFK',
    },
    { 
      id: 'hist2', 
      flightNumber: 'DL456', 
      aircraftType: 'A320', 
      altitude: 28000, 
      timestamp: Date.now() - 86400000, // 1 day ago
      origin: 'LAX',
      destination: 'ATL',
    },
    { 
      id: 'hist3', 
      flightNumber: 'AA789', 
      aircraftType: 'B77W', 
      altitude: 31000, 
      timestamp: Date.now() - 172800000, // 2 days ago
      origin: 'ORD',
      destination: 'MIA',
    },
    { 
      id: 'hist4', 
      flightNumber: 'WN234', 
      aircraftType: 'B738', 
      altitude: 29000, 
      timestamp: Date.now() - 259200000, // 3 days ago
      origin: 'DEN',
      destination: 'SEA',
    },
    { 
      id: 'hist5', 
      flightNumber: 'AS567', 
      aircraftType: 'A321', 
      altitude: 33000, 
      timestamp: Date.now() - 345600000, // 4 days ago
      origin: 'SEA',
      destination: 'ANC',
    },
  ];
  
  // Filter options
  const filterOptions = [
    { key: 'commercial', label: 'Commercial' },
    { key: 'high_altitude', label: 'High Altitude' },
    { key: 'low_altitude', label: 'Low Altitude' },
    { key: 'boeing', label: 'Boeing' },
    { key: 'airbus', label: 'Airbus' },
  ];
  
  // Filter flights based on search and active filters
  const filteredFlights = React.useMemo(() => {
    return flightHistory.filter(flight => {
      // Apply search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!flight.flightNumber.toLowerCase().includes(query) &&
            !flight.aircraftType.toLowerCase().includes(query) &&
            !flight.origin.toLowerCase().includes(query) &&
            !flight.destination.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Apply active filters (just a placeholder, not real filtering logic)
      if (activeFilters.includes('high_altitude') && flight.altitude < 30000) {
        return false;
      }
      
      if (activeFilters.includes('low_altitude') && flight.altitude >= 30000) {
        return false;
      }
      
      if (activeFilters.includes('boeing') && !flight.aircraftType.startsWith('B')) {
        return false;
      }
      
      if (activeFilters.includes('airbus') && !flight.aircraftType.startsWith('A')) {
        return false;
      }
      
      return true;
    });
  }, [searchQuery, activeFilters, flightHistory]);
  
  // Sort flights based on sort option
  const sortedFlights = React.useMemo(() => {
    return [...filteredFlights].sort((a, b) => {
      switch (sortOption) {
        case 'time_asc':
          return a.timestamp - b.timestamp;
        case 'time_desc':
          return b.timestamp - a.timestamp;
        case 'altitude_asc':
          return a.altitude - b.altitude;
        case 'altitude_desc':
          return b.altitude - a.altitude;
        case 'flight_asc':
          return a.flightNumber.localeCompare(b.flightNumber);
        case 'flight_desc':
          return b.flightNumber.localeCompare(a.flightNumber);
        default:
          return 0;
      }
    });
  }, [filteredFlights, sortOption]);
  
  // Toggle filter
  const toggleFilter = (key: string) => {
    if (activeFilters.includes(key)) {
      setActiveFilters(activeFilters.filter(filter => filter !== key));
    } else {
      setActiveFilters([...activeFilters, key]);
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setActiveFilters([]);
    setSearchQuery('');
  };
  
  // Render a flight history item
  const renderItem = ({ item }: { item: typeof flightHistory[0] }) => (
    <Card style={styles.flightCard} onPress={() => navigation.navigate('FlightDetails', { flightId: item.id })}>
      <Card.Content>
        <View style={styles.flightHeader}>
          <Text style={[styles.flightNumber, { color: textColor }]}>{item.flightNumber}</Text>
          <Text style={styles.flightTimestamp}>{formatTimestamp(item.timestamp)}</Text>
        </View>
        
        <View style={styles.flightDetails}>
          <Text style={styles.flightType}>{item.aircraftType}</Text>
          <Text style={styles.flightAltitude}>{item.altitude.toLocaleString()} ft</Text>
        </View>
        
        <View style={styles.flightRoute}>
          <Text style={styles.flightRouteText}>
            {item.origin} → {item.destination}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
  
  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Flight History" />
        
        <Menu
          visible={sortMenuVisible}
          onDismiss={() => setSortMenuVisible(false)}
          anchor={
            <Appbar.Action 
              icon="sort" 
              onPress={() => setSortMenuVisible(true)} 
            />
          }
        >
          <Menu.Item 
            title="Newest First" 
            onPress={() => { 
              setSortOption('time_desc'); 
              setSortMenuVisible(false); 
            }} 
            leadingIcon="clock-descending"
            trailingIcon={sortOption === 'time_desc' ? 'check' : undefined}
          />
          <Menu.Item 
            title="Oldest First" 
            onPress={() => { 
              setSortOption('time_asc'); 
              setSortMenuVisible(false); 
            }} 
            leadingIcon="clock-ascending"
            trailingIcon={sortOption === 'time_asc' ? 'check' : undefined}
          />
          <Divider />
          <Menu.Item 
            title="Highest Altitude" 
            onPress={() => { 
              setSortOption('altitude_desc'); 
              setSortMenuVisible(false); 
            }}
            leadingIcon="arrow-up"
            trailingIcon={sortOption === 'altitude_desc' ? 'check' : undefined}
          />
          <Menu.Item 
            title="Lowest Altitude" 
            onPress={() => { 
              setSortOption('altitude_asc'); 
              setSortMenuVisible(false); 
            }}
            leadingIcon="arrow-down"
            trailingIcon={sortOption === 'altitude_asc' ? 'check' : undefined}
          />
          <Divider />
          <Menu.Item 
            title="Flight Number (A-Z)" 
            onPress={() => { 
              setSortOption('flight_asc'); 
              setSortMenuVisible(false); 
            }}
            leadingIcon="sort-alphabetical-ascending"
            trailingIcon={sortOption === 'flight_asc' ? 'check' : undefined}
          />
          <Menu.Item 
            title="Flight Number (Z-A)" 
            onPress={() => { 
              setSortOption('flight_desc'); 
              setSortMenuVisible(false); 
            }}
            leadingIcon="sort-alphabetical-descending"
            trailingIcon={sortOption === 'flight_desc' ? 'check' : undefined}
          />
        </Menu>
        
        <Appbar.Action 
          icon="filter" 
          onPress={() => setFilterMenuVisible(true)} 
        />
      </Appbar.Header>
      
      <Menu
        visible={filterMenuVisible}
        onDismiss={() => setFilterMenuVisible(false)}
        anchor={{ x: 0, y: 0 }}
        style={styles.filterMenu}
      >
        <Menu.Item 
          title="Apply Filters"
          disabled
        />
        <Divider />
        {filterOptions.map(option => (
          <Menu.Item
            key={option.key}
            title={option.label}
            onPress={() => toggleFilter(option.key)}
            trailingIcon={activeFilters.includes(option.key) ? 'check' : undefined}
          />
        ))}
        <Divider />
        <Menu.Item 
          title="Clear All Filters"
          onPress={() => {
            clearFilters();
            setFilterMenuVisible(false);
          }}
          leadingIcon="filter-off"
        />
      </Menu>
      
      <Searchbar
        placeholder="Search flight history"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      {activeFilters.length > 0 && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {activeFilters.map(filter => {
              const filterOption = filterOptions.find(opt => opt.key === filter);
              
              return (
                <Chip
                  key={filter}
                  onClose={() => toggleFilter(filter)}
                  style={styles.filterChip}
                >
                  {filterOption?.label || filter}
                </Chip>
              );
            })}
            
            <Chip
              onPress={clearFilters}
              icon="close"
              style={styles.clearChip}
            >
              Clear All
            </Chip>
          </ScrollView>
        </View>
      )}
      
      {sortedFlights.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: textColor }]}>
            No flight history found
          </Text>
          {(searchQuery || activeFilters.length > 0) && (
            <Button 
              mode="outlined" 
              icon="filter-off"
              onPress={clearFilters}
              style={styles.clearFiltersButton}
            >
              Clear Filters
            </Button>
          )}
        </View>
      ) : (
        <FlatList
          data={sortedFlights}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <FAB
        icon="delete"
        style={styles.fab}
        onPress={() => {
          // Placeholder for clear history action
          alert('Clear flight history?');
        }}
      />
    </View>
  );
};

// Scrollable horizontal view for filter chips
const ScrollView = ({ children, ...props }: React.PropsWithChildren<any>) => (
  <View style={{ flexDirection: 'row' }} {...props}>
    {children}
  </View>
);

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
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()}`;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    margin: 8,
    elevation: 2,
  },
  filterMenu: {
    width: 300,
    marginTop: 56, // Appbar height
  },
  activeFiltersContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  filterChip: {
    marginHorizontal: 4,
  },
  clearChip: {
    marginHorizontal: 4,
    backgroundColor: '#ffebee',
  },
  listContent: {
    padding: 8,
    paddingBottom: 80, // Space for FAB
  },
  flightCard: {
    marginVertical: 4,
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  flightNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  flightTimestamp: {
    fontSize: 12,
    color: 'gray',
  },
  flightDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  flightType: {
    fontSize: 14,
    color: 'gray',
  },
  flightAltitude: {
    fontSize: 14,
    color: 'gray',
  },
  flightRoute: {
    marginTop: 4,
  },
  flightRouteText: {
    fontSize: 14,
    color: 'gray',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
  },
  clearFiltersButton: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#f44336',
  },
});

export default FlightHistoryScreen;