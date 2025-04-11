import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Flight } from '../../domain/models';

/**
 * Interface for flight history entry
 */
export interface FlightHistoryEntry {
  flight: Flight;
  detectedAt: number; // Timestamp
  notified: boolean;
}

/**
 * Flight history filter options
 */
export interface FlightHistoryFilter {
  timeRange?: {
    startTime: number;
    endTime: number;
  };
  altitudeRange?: {
    min: number;
    max: number;
  };
  flightNumber?: string;
  aircraftType?: string;
}

/**
 * Flight history sort options
 */
export enum SortOption {
  TIME_DESC = 'time_desc',
  TIME_ASC = 'time_asc',
  ALTITUDE_DESC = 'altitude_desc',
  ALTITUDE_ASC = 'altitude_asc',
  FLIGHT_ASC = 'flight_asc',
  FLIGHT_DESC = 'flight_desc',
}

/**
 * Interface for flight history state in the Redux store
 */
export interface FlightHistoryState {
  history: FlightHistoryEntry[];
  filteredHistory: FlightHistoryEntry[];
  selectedId: string | null;
  isLoading: boolean;
  error: string | null;
  filters: FlightHistoryFilter;
  sortOption: SortOption;
  searchQuery: string;
}

/**
 * Initial state for flight history
 */
const initialState: FlightHistoryState = {
  history: [],
  filteredHistory: [],
  selectedId: null,
  isLoading: false,
  error: null,
  filters: {},
  sortOption: SortOption.TIME_DESC,
  searchQuery: '',
};

/**
 * Redux slice for flight history
 */
const flightHistorySlice = createSlice({
  name: 'flightHistory',
  initialState,
  reducers: {
    // Start loading flight history
    loadHistory: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    
    // Successfully loaded flight history
    loadHistorySuccess: (state, action: PayloadAction<FlightHistoryEntry[]>) => {
      state.history = action.payload;
      state.isLoading = false;
      state.error = null;
      
      // Apply current filters and sorting
      state.filteredHistory = filterAndSortHistory(
        state.history,
        state.filters,
        state.sortOption,
        state.searchQuery
      );
    },
    
    // Failed to load flight history
    loadHistoryFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    
    // Add new flight to history
    addFlightToHistory: (state, action: PayloadAction<FlightHistoryEntry>) => {
      // Check if the flight already exists
      const existingIndex = state.history.findIndex(
        entry => entry.flight.id === action.payload.flight.id
      );
      
      if (existingIndex >= 0) {
        // Update existing entry
        state.history[existingIndex] = action.payload;
      } else {
        // Add new entry
        state.history.push(action.payload);
      }
      
      // Re-apply filters and sorting
      state.filteredHistory = filterAndSortHistory(
        state.history,
        state.filters,
        state.sortOption,
        state.searchQuery
      );
    },
    
    // Set search query
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      
      // Apply filters with new search query
      state.filteredHistory = filterAndSortHistory(
        state.history,
        state.filters,
        state.sortOption,
        state.searchQuery
      );
    },
    
    // Set filters
    setFilters: (state, action: PayloadAction<FlightHistoryFilter>) => {
      state.filters = action.payload;
      
      // Apply new filters
      state.filteredHistory = filterAndSortHistory(
        state.history,
        state.filters,
        state.sortOption,
        state.searchQuery
      );
    },
    
    // Clear filters
    clearFilters: (state) => {
      state.filters = {};
      state.searchQuery = '';
      
      // Reset to just sorting
      state.filteredHistory = filterAndSortHistory(
        state.history,
        {},
        state.sortOption,
        ''
      );
    },
    
    // Set sort option
    setSortOption: (state, action: PayloadAction<SortOption>) => {
      state.sortOption = action.payload;
      
      // Apply sorting with new option
      state.filteredHistory = filterAndSortHistory(
        state.history,
        state.filters,
        state.sortOption,
        state.searchQuery
      );
    },
    
    // Set selected flight ID
    selectFlight: (state, action: PayloadAction<string>) => {
      state.selectedId = action.payload;
    },
    
    // Clear flight history
    clearHistory: (state) => {
      state.history = [];
      state.filteredHistory = [];
      state.selectedId = null;
    },
  },
});

/**
 * Helper function to filter and sort flight history
 */
function filterAndSortHistory(
  history: FlightHistoryEntry[],
  filters: FlightHistoryFilter,
  sortOption: SortOption,
  searchQuery: string
): FlightHistoryEntry[] {
  // First, filter the history
  let filtered = history.filter(entry => {
    // Apply time range filter
    if (filters.timeRange) {
      if (
        entry.detectedAt < filters.timeRange.startTime ||
        entry.detectedAt > filters.timeRange.endTime
      ) {
        return false;
      }
    }
    
    // Apply altitude range filter
    if (filters.altitudeRange) {
      if (
        entry.flight.altitude < filters.altitudeRange.min ||
        entry.flight.altitude > filters.altitudeRange.max
      ) {
        return false;
      }
    }
    
    // Apply flight number filter
    if (filters.flightNumber && !entry.flight.flightNumber.includes(filters.flightNumber)) {
      return false;
    }
    
    // Apply aircraft type filter
    if (filters.aircraftType && !entry.flight.aircraftType.includes(filters.aircraftType)) {
      return false;
    }
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const flight = entry.flight;
      
      return (
        flight.flightNumber.toLowerCase().includes(query) ||
        flight.aircraftType.toLowerCase().includes(query) ||
        flight.origin.toLowerCase().includes(query) ||
        flight.destination.toLowerCase().includes(query) ||
        flight.originCity.toLowerCase().includes(query) ||
        flight.destinationCity.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // Then, sort the filtered results
  return filtered.sort((a, b) => {
    switch (sortOption) {
      case SortOption.TIME_ASC:
        return a.detectedAt - b.detectedAt;
      case SortOption.TIME_DESC:
        return b.detectedAt - a.detectedAt;
      case SortOption.ALTITUDE_ASC:
        return a.flight.altitude - b.flight.altitude;
      case SortOption.ALTITUDE_DESC:
        return b.flight.altitude - a.flight.altitude;
      case SortOption.FLIGHT_ASC:
        return a.flight.flightNumber.localeCompare(b.flight.flightNumber);
      case SortOption.FLIGHT_DESC:
        return b.flight.flightNumber.localeCompare(a.flight.flightNumber);
      default:
        return 0;
    }
  });
}

// Export actions and reducer
export const {
  loadHistory,
  loadHistorySuccess,
  loadHistoryFailure,
  addFlightToHistory,
  setSearchQuery,
  setFilters,
  clearFilters,
  setSortOption,
  selectFlight,
  clearHistory,
} = flightHistorySlice.actions;

export default flightHistorySlice.reducer;