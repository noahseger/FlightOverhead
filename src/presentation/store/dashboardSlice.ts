import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Flight, Location } from '../../domain/models';

/**
 * Interface for dashboard service status
 */
export interface ServiceStatus {
  locationService: boolean;
  notificationService: boolean;
  flightService: boolean;
  backgroundService: boolean;
}

/**
 * Interface for dashboard state in the Redux store
 */
export interface DashboardState {
  nearbyFlights: Flight[];
  currentLocation: Location | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  serviceStatus: ServiceStatus;
}

/**
 * Initial state for dashboard
 */
const initialState: DashboardState = {
  nearbyFlights: [],
  currentLocation: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  serviceStatus: {
    locationService: false,
    notificationService: false,
    flightService: false,
    backgroundService: false,
  },
};

/**
 * Redux slice for dashboard
 */
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    // Start loading nearby flights
    loadNearbyFlights: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    
    // Successfully loaded nearby flights
    loadNearbyFlightsSuccess: (state, action: PayloadAction<Flight[]>) => {
      state.nearbyFlights = action.payload;
      state.isLoading = false;
      state.error = null;
      state.lastUpdated = Date.now();
    },
    
    // Failed to load nearby flights
    loadNearbyFlightsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    
    // Update current location
    updateLocation: (state, action: PayloadAction<Location>) => {
      state.currentLocation = action.payload;
    },
    
    // Update service status
    updateServiceStatus: (
      state,
      action: PayloadAction<Partial<ServiceStatus>>
    ) => {
      state.serviceStatus = {
        ...state.serviceStatus,
        ...action.payload,
      };
    },
    
    // Clear dashboard data
    clearDashboard: (state) => {
      state.nearbyFlights = [];
      state.lastUpdated = null;
    },
  },
});

// Export actions and reducer
export const {
  loadNearbyFlights,
  loadNearbyFlightsSuccess,
  loadNearbyFlightsFailure,
  updateLocation,
  updateServiceStatus,
  clearDashboard,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;