import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { PermissionRequest } from '../PermissionRequest';
import { PermissionManager } from '../../../core/utils';
import { Alert } from 'react-native';

// Mock dependencies
jest.mock('../../../core/utils', () => ({
  PermissionManager: {
    getInstance: jest.fn(),
  },
}));

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

describe('PermissionRequest', () => {
  // Mock functions
  const mockCheckLocationPermission = jest.fn();
  const mockRequestLocationPermission = jest.fn();
  const mockOpenAppSettings = jest.fn();
  const mockOnPermissionGranted = jest.fn();
  const mockOnPermissionDenied = jest.fn();

  // Set up permission manager mock
  const mockPermissionManager = {
    checkLocationPermission: mockCheckLocationPermission,
    requestLocationPermission: mockRequestLocationPermission,
    checkBackgroundLocationPermission: jest.fn(),
    requestBackgroundLocationPermission: jest.fn(),
    checkNotificationPermission: jest.fn(),
    requestNotificationPermission: jest.fn(),
    areAllRequiredPermissionsGranted: jest.fn(),
    openAppSettings: mockOpenAppSettings,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (PermissionManager.getInstance as jest.Mock).mockReturnValue(mockPermissionManager);
  });

  it('should check permission status on mount', async () => {
    // Mock the permission check to return false (denied)
    mockCheckLocationPermission.mockResolvedValue(false);

    render(
      <PermissionRequest
        type="location"
        onPermissionGranted={mockOnPermissionGranted}
        onPermissionDenied={mockOnPermissionDenied}
      />
    );

    await waitFor(() => {
      expect(mockCheckLocationPermission).toHaveBeenCalled();
    });
  });

  it('should call onPermissionGranted if permission is already granted', async () => {
    // Mock the permission check to return true (granted)
    mockCheckLocationPermission.mockResolvedValue(true);

    render(
      <PermissionRequest
        type="location"
        onPermissionGranted={mockOnPermissionGranted}
        onPermissionDenied={mockOnPermissionDenied}
      />
    );

    await waitFor(() => {
      expect(mockOnPermissionGranted).toHaveBeenCalled();
    });
  });

  it('should request permission when the button is pressed', async () => {
    // Mock the permission check to return false (denied)
    mockCheckLocationPermission.mockResolvedValue(false);
    // Mock the permission request to return true (granted)
    mockRequestLocationPermission.mockResolvedValue(true);

    const { getByText } = render(
      <PermissionRequest
        type="location"
        onPermissionGranted={mockOnPermissionGranted}
        onPermissionDenied={mockOnPermissionDenied}
      />
    );

    await waitFor(() => {
      expect(mockCheckLocationPermission).toHaveBeenCalled();
    });

    // Press the grant permission button (it could be either text depending on state)
    const buttonText = 'Grant Permission in Settings';
    fireEvent.press(getByText(buttonText));

    await waitFor(() => {
      expect(mockRequestLocationPermission).toHaveBeenCalled();
    });
  });

  it('should call onPermissionDenied and show alert when permission is denied', async () => {
    // Mock the permission check to return false (denied)
    mockCheckLocationPermission.mockResolvedValue(false);
    // Mock the permission request to return false (denied)
    mockRequestLocationPermission.mockResolvedValue(false);

    const { getByText } = render(
      <PermissionRequest
        type="location"
        onPermissionGranted={mockOnPermissionGranted}
        onPermissionDenied={mockOnPermissionDenied}
      />
    );

    await waitFor(() => {
      expect(mockCheckLocationPermission).toHaveBeenCalled();
    });

    // Press the grant permission button
    const buttonText = 'Grant Permission in Settings';
    fireEvent.press(getByText(buttonText));

    await waitFor(() => {
      expect(mockRequestLocationPermission).toHaveBeenCalled();
      expect(mockOnPermissionDenied).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  it('should open app settings when the "Open App Settings" button is pressed', async () => {
    // Mock the permission check to return false (denied)
    mockCheckLocationPermission.mockResolvedValue(false);

    const { getByText } = render(
      <PermissionRequest
        type="location"
        onPermissionGranted={mockOnPermissionGranted}
        onPermissionDenied={mockOnPermissionDenied}
      />
    );

    await waitFor(() => {
      expect(mockCheckLocationPermission).toHaveBeenCalled();
    });

    // Find and press the open settings button
    fireEvent.press(getByText('Open App Settings'));

    expect(mockOpenAppSettings).toHaveBeenCalled();
  });

  it('should render different content based on permission type', async () => {
    // Mock the permission check to return false (denied)
    mockPermissionManager.checkNotificationPermission.mockResolvedValue(false);

    const { getByText } = render(
      <PermissionRequest
        type="notification"
        onPermissionGranted={mockOnPermissionGranted}
        onPermissionDenied={mockOnPermissionDenied}
      />
    );

    await waitFor(() => {
      expect(mockPermissionManager.checkNotificationPermission).toHaveBeenCalled();
    });

    // Check that notification-specific text is shown
    expect(getByText('Notification Permission Required')).toBeTruthy();
    expect(
      getByText('Notification permission is required to alert you when an aircraft is flying overhead.')
    ).toBeTruthy();
  });
});