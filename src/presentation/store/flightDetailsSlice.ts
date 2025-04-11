import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Flight } from '../../domain/models';

/**
 * Interface for flight details state in the Redux store
 */
export interface FlightDetailsState {
  currentFlight: Flight | null;
  isLoading: boolean;
  error: string | null;
  aircraftImageUrl: string | null;
  isLoadingImage: boolean;
  imageError: string | null;
}

/**
 * Initial state for flight details
 */
const initialState: FlightDetailsState = {
  currentFlight: null,
  isLoading: false,
  error: null,
  aircraftImageUrl: null,
  isLoadingImage: false,
  imageError: null,
};

/**
 * Redux slice for flight details
 */
const flightDetailsSlice = createSlice({
  name: 'flightDetails',
  initialState,
  reducers: {
    // Start loading flight details
    loadFlightDetails: (state, action: PayloadAction<string>) => {
      state.isLoading = true;
      state.error = null;
    },
    
    // Successfully loaded flight details
    loadFlightDetailsSuccess: (state, action: PayloadAction<Flight>) => {
      state.currentFlight = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    
    // Failed to load flight details
    loadFlightDetailsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    
    // Clear current flight details
    clearFlightDetails: (state) => {
      state.currentFlight = null;
      state.aircraftImageUrl = null;
    },
    
    // Start loading aircraft image
    loadAircraftImage: (state) => {
      state.isLoadingImage = true;
      state.imageError = null;
    },
    
    // Successfully loaded aircraft image
    loadAircraftImageSuccess: (state, action: PayloadAction<string>) => {
      state.aircraftImageUrl = action.payload;
      state.isLoadingImage = false;
      state.imageError = null;
    },
    
    // Failed to load aircraft image
    loadAircraftImageFailure: (state, action: PayloadAction<string>) => {
      state.isLoadingImage = false;
      state.imageError = action.payload;
    },
  },
});

// Export actions and reducer
export const {
  loadFlightDetails,
  loadFlightDetailsSuccess,
  loadFlightDetailsFailure,
  clearFlightDetails,
  loadAircraftImage,
  loadAircraftImageSuccess,
  loadAircraftImageFailure,
} = flightDetailsSlice.actions;

export default flightDetailsSlice.reducer;