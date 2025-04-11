import { StackScreenProps } from '@react-navigation/stack';

/**
 * Main navigation stack parameter list
 */
export type RootStackParamList = {
  Dashboard: undefined;
  FlightDetails: { flightId: string };
  FlightHistory: undefined;
  Settings: undefined;
};

/**
 * Type for dashboard screen props
 */
export type DashboardScreenProps = StackScreenProps<RootStackParamList, 'Dashboard'>;

/**
 * Type for flight details screen props
 */
export type FlightDetailsScreenProps = StackScreenProps<RootStackParamList, 'FlightDetails'>;

/**
 * Type for flight history screen props
 */
export type FlightHistoryScreenProps = StackScreenProps<RootStackParamList, 'FlightHistory'>;

/**
 * Type for settings screen props
 */
export type SettingsScreenProps = StackScreenProps<RootStackParamList, 'Settings'>;

/**
 * Navigation utility type for accessing navigation object
 */
export type MainStackNavigationProp = DashboardScreenProps['navigation'];