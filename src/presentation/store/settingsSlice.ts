import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppSettings } from '../../domain/models';

/**
 * Interface for settings state in the Redux store
 */
export interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
}

/**
 * Default settings
 */
const defaultSettings: AppSettings = {
  detectionRadiusKm: 50,
  notificationsEnabled: true,
  backgroundTrackingEnabled: true,
  richNotificationsEnabled: true,
  lastUpdate: Date.now(),
};

/**
 * Initial state for settings
 */
const initialState: SettingsState = {
  settings: defaultSettings,
  isLoading: false,
  error: null,
};

/**
 * Redux slice for settings
 */
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Start loading settings
    loadSettings: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    
    // Successfully loaded settings
    loadSettingsSuccess: (state, action: PayloadAction<AppSettings>) => {
      state.settings = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    
    // Failed to load settings
    loadSettingsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    
    // Update single setting value
    updateSetting: <K extends keyof AppSettings>(
      state,
      action: PayloadAction<{ key: K; value: AppSettings[K] }>
    ) => {
      const { key, value } = action.payload;
      state.settings[key] = value;
      state.settings.lastUpdate = Date.now();
    },
    
    // Update multiple settings at once
    updateSettings: (state, action: PayloadAction<Partial<AppSettings>>) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
        lastUpdate: Date.now(),
      };
    },
    
    // Reset to default settings
    resetSettings: (state) => {
      state.settings = {
        ...defaultSettings,
        lastUpdate: Date.now(),
      };
    },
  },
});

// Export actions and reducer
export const {
  loadSettings,
  loadSettingsSuccess,
  loadSettingsFailure,
  updateSetting,
  updateSettings,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;