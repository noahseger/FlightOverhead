/**
 * Flight Overhead Notification App
 */

// Import polyfill first to patch global objects before other imports
import './src/core/utils/HermesPolyfill';

import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { ErrorBoundary } from './src/presentation/components';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { Logger, LogLevel } from './src/core/utils';

// Initialize logger for development environment
const logger = Logger.getInstance({
  minLevel: __DEV__ ? LogLevel.DEBUG : LogLevel.WARNING,
  includeTimestamp: true,
  enableConsoleOutput: __DEV__,
});

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  logger.info('App initialized', { isDarkMode });

  return (
    <ErrorBoundary>
      <PaperProvider>
        <SafeAreaView style={[styles.container, backgroundStyle]}>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor={backgroundStyle.backgroundColor}
          />
          <View style={styles.content}>
            <Text style={styles.title}>Flight Overhead</Text>
            <Text style={styles.description}>
              Track aircraft flying over your location with real-time notifications.
            </Text>
          </View>
        </SafeAreaView>
      </PaperProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: 'gray',
  },
});

export default App;