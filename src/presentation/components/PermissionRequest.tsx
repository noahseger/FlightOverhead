import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { PermissionManager } from '../../core/utils';

type PermissionType = 'location' | 'backgroundLocation' | 'notification';

interface PermissionRequestProps {
  type: PermissionType;
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
}

export const PermissionRequest: React.FC<PermissionRequestProps> = ({
  type,
  onPermissionGranted,
  onPermissionDenied,
}) => {
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const permissionManager = PermissionManager.getInstance();

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    let isGranted = false;

    switch (type) {
      case 'location':
        isGranted = await permissionManager.checkLocationPermission();
        break;
      case 'backgroundLocation':
        isGranted = await permissionManager.checkBackgroundLocationPermission();
        break;
      case 'notification':
        isGranted = await permissionManager.checkNotificationPermission();
        break;
    }

    setPermissionStatus(isGranted ? 'granted' : 'denied');
    setPermissionChecked(true);

    if (isGranted) {
      onPermissionGranted();
    }
  };

  const requestPermission = async () => {
    let isGranted = false;

    switch (type) {
      case 'location':
        isGranted = await permissionManager.requestLocationPermission();
        break;
      case 'backgroundLocation':
        isGranted = await permissionManager.requestBackgroundLocationPermission();
        break;
      case 'notification':
        isGranted = await permissionManager.requestNotificationPermission();
        break;
    }

    setPermissionStatus(isGranted ? 'granted' : 'denied');

    if (isGranted) {
      onPermissionGranted();
    } else {
      onPermissionDenied();
      showPermissionDeniedAlert();
    }
  };

  const showPermissionDeniedAlert = () => {
    Alert.alert(
      'Permission Required',
      `${getPermissionTitle()} permission is required for this app to function properly.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: openAppSettings,
        },
      ]
    );
  };

  const openAppSettings = async () => {
    await permissionManager.openAppSettings();
  };

  const getPermissionTitle = (): string => {
    switch (type) {
      case 'location':
        return 'Location';
      case 'backgroundLocation':
        return 'Background Location';
      case 'notification':
        return 'Notification';
      default:
        return '';
    }
  };

  const getPermissionDescription = (): string => {
    switch (type) {
      case 'location':
        return 'The app needs access to your location to detect aircraft flying overhead.';
      case 'backgroundLocation':
        return 'Background location access is required to continue tracking aircraft even when the app is not in use.';
      case 'notification':
        return 'Notification permission is required to alert you when an aircraft is flying overhead.';
      default:
        return '';
    }
  };

  const getPermissionIconName = (): string => {
    switch (type) {
      case 'location':
      case 'backgroundLocation':
        return '📍';
      case 'notification':
        return '🔔';
      default:
        return '❓';
    }
  };

  if (!permissionChecked) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Checking permission status...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getPermissionIconName()}</Text>
      </View>

      <Text style={styles.title}>{getPermissionTitle()} Permission Required</Text>
      <Text style={styles.description}>{getPermissionDescription()}</Text>

      {permissionStatus === 'denied' && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            The app cannot function properly without this permission.
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={requestPermission}>
        <Text style={styles.buttonText}>
          {permissionStatus === 'denied' ? 'Grant Permission in Settings' : 'Grant Permission'}
        </Text>
      </TouchableOpacity>

      {permissionStatus === 'denied' && (
        <TouchableOpacity style={styles.secondaryButton} onPress={openAppSettings}>
          <Text style={styles.secondaryButtonText}>Open App Settings</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#555',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },
  warningContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFEEBA',
  },
  warningText: {
    color: '#856404',
    textAlign: 'center',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4285F4',
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 16,
    color: '#555',
  },
});
