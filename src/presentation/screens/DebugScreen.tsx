import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { DebugHelper } from '../../core/utils';
import { Button, Card, Divider } from 'react-native-paper';

/**
 * Debug screen with various test options
 * Only accessible in development mode
 */
const DebugScreen: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const textColor = isDarkMode ? Colors.lighter : Colors.darker;
  const backgroundColor = isDarkMode ? Colors.darker : Colors.lighter;

  // Test the toast functionality
  const handleTestToast = () => {
    DebugHelper.testToast();
  };

  // Test the flight detection
  const handleTestFlightDetection = async () => {
    await DebugHelper.testFlightDetection();
  };
  
  // Test the aircraft image service
  const handleTestImageService = async () => {
    await DebugHelper.testAircraftImageService();
  };
  
  // Test notifications
  const handleTestNotification = async () => {
    await DebugHelper.testNotification();
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Card style={styles.card}>
        <Card.Title title="Development Tools" />
        <Card.Content>
          <Text style={[styles.description, { color: textColor }]}>
            These tools are only available in development mode and will not be included in production builds.
          </Text>
        </Card.Content>
      </Card>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>UI Testing</Text>
        <Divider style={styles.divider} />
        
        <Button
          mode="contained"
          onPress={handleTestToast}
          style={styles.button}
        >
          Test Toast Messages
        </Button>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>API Testing</Text>
        <Divider style={styles.divider} />
        
        <Button
          mode="contained"
          onPress={handleTestFlightDetection}
          style={styles.button}
        >
          Test Flight Detection
        </Button>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Image Testing</Text>
        <Divider style={styles.divider} />
        
        <Button
          mode="contained"
          onPress={handleTestImageService}
          style={styles.button}
        >
          Test Aircraft Images
        </Button>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Notification Testing</Text>
        <Divider style={styles.divider} />
        
        <Button
          mode="contained"
          onPress={handleTestNotification}
          style={styles.notificationButton}
          icon="bell"
          contentStyle={{ height: 60 }}
          labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
          buttonColor="#2196F3"
        >
          SEND TEST NOTIFICATION
        </Button>
        
        <Text style={[styles.note, { color: textColor }]}>
          Note: This will request notification permissions if not already granted.
          If you don't see notifications, check app settings and ensure notifications
          are enabled for the app.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 12,
  },
  notificationButton: {
    marginBottom: 12,
    paddingVertical: 8,
  },
  note: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
});

export default DebugScreen;