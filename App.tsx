/**
 * Flight Overhead Notification App
 */

// Import polyfill first to patch global objects before other imports
import './src/core/utils/HermesPolyfill';

import React from 'react';
import { useColorScheme } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { ErrorBoundary } from './src/presentation/components';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { Logger, LogLevel } from './src/core/utils';
import AppNavigator from './src/presentation/navigation/AppNavigator';
import { createStore } from './src/presentation/store'; // We'll create this soon

// Initialize logger for development environment
const logger = Logger.getInstance({
  minLevel: __DEV__ ? LogLevel.DEBUG : LogLevel.WARNING,
  includeTimestamp: true,
  enableConsoleOutput: __DEV__,
});

// Initialize Redux store
const store = createStore();

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  
  // Log app initialization
  logger.info('App initialized', { isDarkMode });

  // Create theme object for Paper
  const theme = {
    dark: isDarkMode,
    colors: {
      primary: '#1E88E5',
      accent: '#26A69A',
      background: isDarkMode ? Colors.darker : Colors.lighter,
      text: isDarkMode ? Colors.lighter : Colors.darker,
      surface: isDarkMode ? '#121212' : '#ffffff',
    }
  };

  return (
    <ErrorBoundary>
      <ReduxProvider store={store}>
        <PaperProvider theme={theme}>
          {/* Main app navigation */}
          <AppNavigator />
          
          {/* Debug overlays could be added here if needed */}
        </PaperProvider>
      </ReduxProvider>
    </ErrorBoundary>
  );
}

export default App;