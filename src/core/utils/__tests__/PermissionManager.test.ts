import { PermissionManager } from '../PermissionManager';
import { PERMISSIONS, RESULTS, check, request, openSettings } from 'react-native-permissions';
import { Platform } from 'react-native';

// Mock dependencies
jest.mock('react-native-permissions', () => ({
  PERMISSIONS: {
    ANDROID: {
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
      ACCESS_BACKGROUND_LOCATION: 'android.permission.ACCESS_BACKGROUND_LOCATION',
      POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
    },
    IOS: {
      LOCATION_WHEN_IN_USE: 'ios.permission.LOCATION_WHEN_IN_USE',
      LOCATION_ALWAYS: 'ios.permission.LOCATION_ALWAYS',
      NOTIFICATIONS: 'ios.permission.NOTIFICATIONS',
    },
  },
  RESULTS: {
    UNAVAILABLE: 'unavailable',
    DENIED: 'denied',
    GRANTED: 'granted',
    BLOCKED: 'blocked',
    LIMITED: 'limited',
  },
  check: jest.fn(),
  request: jest.fn(),
  openSettings: jest.fn(),
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: 15,
  },
  Linking: {
    openURL: jest.fn(),
    openSettings: jest.fn(),
  },
}));

describe('PermissionManager', () => {
  let permissionManager: PermissionManager;

  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();
    
    // Reset the singleton instance
    // @ts-ignore: accessing private static property for testing
    PermissionManager.instance = undefined;
    
    // Default mock implementations
    (check as jest.Mock).mockResolvedValue(RESULTS.GRANTED);
    (request as jest.Mock).mockResolvedValue(RESULTS.GRANTED);
    (openSettings as jest.Mock).mockResolvedValue(true);

    // Create a new instance for each test
    permissionManager = PermissionManager.getInstance();
  });

  describe('getInstance', () => {
    it('should create a new instance when first called', () => {
      expect(permissionManager).toBeInstanceOf(PermissionManager);
    });

    it('should return the existing instance on subsequent calls', () => {
      const instance2 = PermissionManager.getInstance();
      expect(instance2).toBe(permissionManager);
    });
  });

  describe('checkLocationPermission', () => {
    it('should check location permission for iOS', async () => {
      // Ensure Platform.OS is 'ios' for this test
      jest.replaceProperty(Platform, 'OS', 'ios');
      
      await permissionManager.checkLocationPermission();
      
      expect(check).toHaveBeenCalledWith(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    });

    it('should check location permission for Android', async () => {
      // Set Platform.OS to 'android' for this test
      jest.replaceProperty(Platform, 'OS', 'android');
      
      await permissionManager.checkLocationPermission();
      
      expect(check).toHaveBeenCalledWith(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    });

    it('should return true when permission is granted', async () => {
      (check as jest.Mock).mockResolvedValue(RESULTS.GRANTED);
      
      const result = await permissionManager.checkLocationPermission();
      
      expect(result).toBe(true);
    });

    it('should return false when permission is denied', async () => {
      (check as jest.Mock).mockResolvedValue(RESULTS.DENIED);
      
      const result = await permissionManager.checkLocationPermission();
      
      expect(result).toBe(false);
    });
  });

  describe('requestLocationPermission', () => {
    it('should request location permission for iOS', async () => {
      // Ensure Platform.OS is 'ios' for this test
      jest.replaceProperty(Platform, 'OS', 'ios');
      
      await permissionManager.requestLocationPermission();
      
      expect(request).toHaveBeenCalledWith(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    });

    it('should request location permission for Android', async () => {
      // Set Platform.OS to 'android' for this test
      jest.replaceProperty(Platform, 'OS', 'android');
      
      await permissionManager.requestLocationPermission();
      
      expect(request).toHaveBeenCalledWith(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    });

    it('should return true when permission is granted', async () => {
      (request as jest.Mock).mockResolvedValue(RESULTS.GRANTED);
      
      const result = await permissionManager.requestLocationPermission();
      
      expect(result).toBe(true);
    });

    it('should return false when permission is denied', async () => {
      (request as jest.Mock).mockResolvedValue(RESULTS.DENIED);
      
      const result = await permissionManager.requestLocationPermission();
      
      expect(result).toBe(false);
    });
  });

  describe('checkBackgroundLocationPermission', () => {
    it('should check always permission for iOS', async () => {
      // Ensure Platform.OS is 'ios' for this test
      jest.replaceProperty(Platform, 'OS', 'ios');
      
      await permissionManager.checkBackgroundLocationPermission();
      
      expect(check).toHaveBeenCalledWith(PERMISSIONS.IOS.LOCATION_ALWAYS);
    });

    it('should check background location permission for Android', async () => {
      // Set Platform.OS to 'android' for this test
      jest.replaceProperty(Platform, 'OS', 'android');
      
      await permissionManager.checkBackgroundLocationPermission();
      
      expect(check).toHaveBeenCalledWith(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION);
    });
  });

  describe('requestBackgroundLocationPermission', () => {
    it('should request always permission for iOS', async () => {
      // Ensure Platform.OS is 'ios' for this test
      jest.replaceProperty(Platform, 'OS', 'ios');
      
      await permissionManager.requestBackgroundLocationPermission();
      
      expect(request).toHaveBeenCalledWith(PERMISSIONS.IOS.LOCATION_ALWAYS);
    });

    it('should request background location permission for Android', async () => {
      // Set Platform.OS to 'android' for this test
      jest.replaceProperty(Platform, 'OS', 'android');
      
      // Mock foreground location check to be granted
      (check as jest.Mock).mockResolvedValue(RESULTS.GRANTED);
      
      await permissionManager.requestBackgroundLocationPermission();
      
      expect(request).toHaveBeenCalledWith(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION);
    });

    it('should not request background location for Android if foreground is not granted', async () => {
      // Set Platform.OS to 'android' for this test
      jest.replaceProperty(Platform, 'OS', 'android');
      
      // Mock foreground location check to be denied
      (check as jest.Mock).mockResolvedValue(RESULTS.DENIED);
      
      const result = await permissionManager.requestBackgroundLocationPermission();
      
      expect(result).toBe(false);
      expect(request).not.toHaveBeenCalledWith(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION);
    });
  });

  describe('checkNotificationPermission', () => {
    it('should check notification permission for iOS', async () => {
      // Ensure Platform.OS is 'ios' for this test
      jest.replaceProperty(Platform, 'OS', 'ios');
      
      await permissionManager.checkNotificationPermission();
      
      expect(check).toHaveBeenCalledWith(PERMISSIONS.IOS.NOTIFICATIONS);
    });

    it('should check notification permission for Android 13+', async () => {
      // Set Platform.OS and Version for this test
      jest.replaceProperty(Platform, 'OS', 'android');
      jest.replaceProperty(Platform, 'Version', 33);
      
      await permissionManager.checkNotificationPermission();
      
      expect(check).toHaveBeenCalledWith(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
    });

    it('should return true for Android < 13 without checking', async () => {
      // Set Platform.OS and Version for this test
      jest.replaceProperty(Platform, 'OS', 'android');
      jest.replaceProperty(Platform, 'Version', 29);
      
      const result = await permissionManager.checkNotificationPermission();
      
      expect(result).toBe(true);
      expect(check).not.toHaveBeenCalled();
    });
  });

  describe('requestNotificationPermission', () => {
    it('should request notification permission for iOS', async () => {
      // Ensure Platform.OS is 'ios' for this test
      jest.replaceProperty(Platform, 'OS', 'ios');
      
      await permissionManager.requestNotificationPermission();
      
      expect(request).toHaveBeenCalledWith(PERMISSIONS.IOS.NOTIFICATIONS);
    });

    it('should request notification permission for Android 13+', async () => {
      // Set Platform.OS and Version for this test
      jest.replaceProperty(Platform, 'OS', 'android');
      jest.replaceProperty(Platform, 'Version', 33);
      
      await permissionManager.requestNotificationPermission();
      
      expect(request).toHaveBeenCalledWith(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
    });

    it('should return true for Android < 13 without requesting', async () => {
      // Set Platform.OS and Version for this test
      jest.replaceProperty(Platform, 'OS', 'android');
      jest.replaceProperty(Platform, 'Version', 29);
      
      const result = await permissionManager.requestNotificationPermission();
      
      expect(result).toBe(true);
      expect(request).not.toHaveBeenCalled();
    });
  });

  describe('areAllRequiredPermissionsGranted', () => {
    it('should return true when all permissions are granted', async () => {
      // Mock all permission checks to return granted
      (check as jest.Mock).mockResolvedValue(RESULTS.GRANTED);
      
      const result = await permissionManager.areAllRequiredPermissionsGranted();
      
      expect(result).toBe(true);
    });

    it('should return false when location permission is denied', async () => {
      // First call (location) returns denied, others return granted
      (check as jest.Mock)
        .mockResolvedValueOnce(RESULTS.DENIED)
        .mockResolvedValue(RESULTS.GRANTED);
      
      const result = await permissionManager.areAllRequiredPermissionsGranted();
      
      expect(result).toBe(false);
    });

    it('should return false when background location permission is denied', async () => {
      // First call (location) returns granted, second call (background) returns denied
      (check as jest.Mock)
        .mockResolvedValueOnce(RESULTS.GRANTED)
        .mockResolvedValueOnce(RESULTS.DENIED)
        .mockResolvedValue(RESULTS.GRANTED);
      
      const result = await permissionManager.areAllRequiredPermissionsGranted();
      
      expect(result).toBe(false);
    });

    it('should return false when notification permission is denied', async () => {
      // First two calls return granted, third call (notification) returns denied
      (check as jest.Mock)
        .mockResolvedValueOnce(RESULTS.GRANTED)
        .mockResolvedValueOnce(RESULTS.GRANTED)
        .mockResolvedValueOnce(RESULTS.DENIED);
      
      const result = await permissionManager.areAllRequiredPermissionsGranted();
      
      expect(result).toBe(false);
    });
  });

  describe('openAppSettings', () => {
    it('should open app settings using the permissions library', async () => {
      (openSettings as jest.Mock).mockResolvedValue(true);
      
      const result = await permissionManager.openAppSettings();
      
      expect(result).toBe(true);
      expect(openSettings).toHaveBeenCalled();
    });

    it('should try an alternative method if the primary method fails', async () => {
      (openSettings as jest.Mock).mockRejectedValue(new Error('Failed to open settings'));
      
      // Set up the fallback Linking mock
      const mockLinking = require('react-native').Linking;
      mockLinking.openURL.mockResolvedValue(true);
      
      const result = await permissionManager.openAppSettings();
      
      expect(result).toBe(true);
      expect(mockLinking.openURL).toHaveBeenCalledWith('app-settings:');
    });
  });
});