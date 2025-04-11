import { configureStore, combineReducers } from '@reduxjs/toolkit';
import settingsReducer from './settingsSlice';
import flightHistoryReducer from './flightHistorySlice';
import flightDetailsReducer from './flightDetailsSlice';
import dashboardReducer from './dashboardSlice';

/**
 * Root reducer combining all state slices
 */
const rootReducer = combineReducers({
  settings: settingsReducer,
  flightHistory: flightHistoryReducer,
  flightDetails: flightDetailsReducer,
  dashboard: dashboardReducer,
});

/**
 * Root state type
 */
export type RootState = ReturnType<typeof rootReducer>;

/**
 * Create and configure the Redux store
 */
export function createStore() {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Allows for non-serializable data in state if needed
      }),
    devTools: process.env.NODE_ENV !== 'production',
  });
}

/**
 * Dispatch type for store
 */
export type AppDispatch = ReturnType<typeof createStore>['dispatch'];

// Re-export all slice actions
export * from './settingsSlice';
export * from './flightHistorySlice';
export * from './flightDetailsSlice';
export * from './dashboardSlice';