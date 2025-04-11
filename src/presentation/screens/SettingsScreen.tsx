import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SettingsScreenProps } from '../navigation/types';
import { List, Switch, Divider, Button, Card, TextInput, ActivityIndicator } from 'react-native-paper';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { useColorScheme } from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks';
import { 
  loadSettings, 
  loadSettingsSuccess, 
  updateSetting, 
  updateSettings, 
  resetSettings 
} from '../store';
import { SettingsRepository } from '../../data/repositories';

/**
 * Settings screen component
 */
const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const textColor = isDarkMode ? Colors.lighter : Colors.darker;
  
  const dispatch = useAppDispatch();
  const { settings, isLoading, error } = useAppSelector(state => state.settings);
  
  // Local state for forms
  const [detectionRadius, setDetectionRadius] = React.useState(settings.detectionRadiusKm.toString());
  
  // Get settings from repository
  useEffect(() => {
    const loadAppSettings = async () => {
      try {
        dispatch(loadSettings());
        const settingsRepository = new SettingsRepository();
        const savedSettings = await settingsRepository.getSettings();
        
        if (savedSettings) {
          dispatch(loadSettingsSuccess(savedSettings));
          setDetectionRadius(savedSettings.detectionRadiusKm.toString());
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    
    loadAppSettings();
  }, [dispatch]);
  
  // Save settings to repository
  const saveSettings = async () => {
    try {
      // Update settings with radius from text input
      dispatch(updateSetting({ 
        key: 'detectionRadiusKm', 
        value: parseInt(detectionRadius, 10) || 50 
      }));
      
      // Save to repository
      const settingsRepository = new SettingsRepository();
      await settingsRepository.saveSettings(settings);
      
      // Show success
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    }
  };
  
  // Handle toggle changes
  const handleToggleNotifications = (value: boolean) => {
    dispatch(updateSetting({ key: 'notificationsEnabled', value }));
  };
  
  const handleToggleRichNotifications = (value: boolean) => {
    dispatch(updateSetting({ key: 'richNotificationsEnabled', value }));
  };
  
  const handleToggleBackgroundTracking = (value: boolean) => {
    dispatch(updateSetting({ key: 'backgroundTrackingEnabled', value }));
  };
  
  // Show loading indicator if loading
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={[styles.loadingText, { color: textColor }]}>
          Loading settings...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="About" />
        <Card.Content>
          <Text style={[styles.description, { color: textColor }]}>
            Flight Overhead tracks aircraft flying over your location and sends real-time notifications.
          </Text>
        </Card.Content>
      </Card>
      
      <List.Section title="Notifications">
        <List.Item
          title="Enable notifications"
          description="Receive alerts when aircraft fly overhead"
          left={props => <List.Icon {...props} icon="bell" />}
          right={props => 
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={handleToggleNotifications}
            />
          }
        />
        <Divider />
        <List.Item
          title="Rich notifications"
          description="Include aircraft images in notifications"
          left={props => <List.Icon {...props} icon="image" />}
          right={props => 
            <Switch
              value={settings.richNotificationsEnabled}
              onValueChange={handleToggleRichNotifications}
              disabled={!settings.notificationsEnabled}
            />
          }
        />
      </List.Section>
      
      <List.Section title="Detection">
        <List.Item
          title="Background tracking"
          description="Continue detection when app is in background"
          left={props => <List.Icon {...props} icon="radar" />}
          right={props => 
            <Switch
              value={settings.backgroundTrackingEnabled}
              onValueChange={handleToggleBackgroundTracking}
            />
          }
        />
        <Divider />
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: textColor }]}>Detection radius (km)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={detectionRadius}
            onChangeText={setDetectionRadius}
            mode="outlined"
          />
        </View>
      </List.Section>
      
      <List.Section title="Data">
        <List.Item
          title="Flight history"
          description="View past detected flights"
          left={props => <List.Icon {...props} icon="history" />}
          onPress={() => navigation.navigate('FlightHistory')}
        />
        <Divider />
        <List.Item
          title="Clear cache"
          description="Remove stored images and flight data"
          left={props => <List.Icon {...props} icon="delete" />}
          onPress={() => {
            // Clear caches
            const clearCaches = async () => {
              try {
                const settingsRepository = new SettingsRepository();
                await settingsRepository.clearCache();
                alert('Cache cleared');
              } catch (error) {
                console.error('Failed to clear cache:', error);
                alert('Failed to clear cache');
              }
            };
            
            clearCaches();
          }}
        />
      </List.Section>
      
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={saveSettings}
          loading={isLoading}
          disabled={isLoading}
        >
          Save Settings
        </Button>
        
        <Button
          mode="outlined"
          onPress={() => {
            dispatch(resetSettings());
            setDetectionRadius(settings.detectionRadiusKm.toString());
          }}
          style={styles.resetButton}
        >
          Reset to Defaults
        </Button>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    padding: 16,
    paddingTop: 8,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    width: '100%',
  },
  buttonContainer: {
    padding: 16,
    marginBottom: 32,
  },
  resetButton: {
    marginTop: 8,
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 4,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
});

export default SettingsScreen;