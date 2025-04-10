import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type PermissionStatusType = 'granted' | 'denied' | 'unknown';

interface PermissionStatusProps {
  type: string;
  status: PermissionStatusType;
}

export const PermissionStatusIndicator: React.FC<PermissionStatusProps> = ({
  type,
  status,
}) => {
  const getStatusIcon = (): string => {
    switch (status) {
      case 'granted':
        return '✅';
      case 'denied':
        return '❌';
      case 'unknown':
      default:
        return '❓';
    }
  };

  const getStatusColor = (): string => {
    switch (status) {
      case 'granted':
        return '#4CAF50';
      case 'denied':
        return '#F44336';
      case 'unknown':
      default:
        return '#FFC107';
    }
  };

  const getStatusText = (): string => {
    switch (status) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      case 'unknown':
      default:
        return 'Unknown';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{type}</Text>
      <View
        style={[
          styles.statusContainer,
          { backgroundColor: getStatusColor() + '20' }, // 20% opacity
        ]}
      >
        <Text style={styles.icon}>{getStatusIcon()}</Text>
        <Text style={[styles.status, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  label: {
    fontSize: 16,
    color: '#212121',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  icon: {
    fontSize: 14,
    marginRight: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
});
