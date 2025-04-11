import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, useColorScheme } from 'react-native';
import { RootStackParamList } from './types';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import FlightDetailsScreen from '../screens/FlightDetailsScreen';
import FlightHistoryScreen from '../screens/FlightHistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DebugScreen from '../screens/DebugScreen';

// Import theme and styling
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { DeepLinkHandler } from '../../core/utils';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundColor = isDarkMode ? Colors.darker : Colors.lighter;
  const textColor = isDarkMode ? Colors.lighter : Colors.darker;

  // Register deep link handler's navigation function
  React.useEffect(() => {
    // Get the deep link handler instance
    const deepLinkHandler = DeepLinkHandler.getInstance();
    
    // Register navigation function
    deepLinkHandler.registerNavigationFunction((screenName, params) => {
      // This will be handled by our navigation system once initialized
      console.log(`Deep link navigation requested to: ${screenName}`, params);
      // Actual implementation will happen later
    });
    
    // Register deep link handlers
    deepLinkHandler.registerDeepLinkHandler();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundColor}
      />
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerStyle: {
            backgroundColor,
          },
          headerTintColor: textColor,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          cardStyle: { backgroundColor },
        }}
      >
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'Flight Overhead' }}
        />
        <Stack.Screen
          name="FlightDetails"
          component={FlightDetailsScreen}
          options={{ title: 'Flight Details' }}
        />
        <Stack.Screen
          name="FlightHistory"
          component={FlightHistoryScreen}
          options={{ title: 'Flight History' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
        {/* Debug screen - only visible in development mode */}
        {__DEV__ && (
          <Stack.Screen
            name="Debug"
            component={DebugScreen}
            options={{ title: 'Debug Tools' }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;