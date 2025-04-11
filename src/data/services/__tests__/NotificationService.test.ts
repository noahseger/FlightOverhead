import { NotificationService, NotificationActionType } from '../NotificationService';
import { PermissionManager } from '../../../core/utils';
import { Notifications } from 'react-native-notifications';
import { Platform } from 'react-native';

// Mock dependencies
jest.mock('react-native-notifications', () => ({
  Notifications: {
    postLocalNotification: jest.fn().mockResolvedValue(true),
    cancelLocalNotification: jest.fn().mockResolvedValue(true),
    cancelAllLocalNotifications: jest.fn().mockResolvedValue(true),
    setNotificationChannel: jest.fn(),
    events: jest.fn().mockReturnValue({
      registerNotificationReceivedForeground: jest.fn(),
      registerNotificationOpened: jest.fn(),
      registerNotificationActionReceived: jest.fn()
    })
  }
}));

jest.mock('../../../core/utils/DeepLinkHandler', () => {
  return {
    DeepLinkType: {
      FLIGHT_DETAILS: 'flight-details',
      FLIGHT_HISTORY: 'flight-history',
      SETTINGS: 'settings',
      DASHBOARD: 'dashboard'
    },
    DeepLinkHandler: {
      getInstance: jest.fn().mockReturnValue({
        navigateToScreen: jest.fn().mockResolvedValue(true),
        createDeepLink: jest.fn().mockReturnValue('flightoverhead://flight?flightId=123')
      })
    }
  };
});

jest.mock('../../../core/utils/PermissionManager', () => {
  return {
    PermissionManager: jest.fn().mockImplementation(() => ({
      requestNotificationPermission: jest.fn().mockResolvedValue(true)
    }))
  };
});

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android'
  }
}));

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let permissionManager: PermissionManager;

  beforeEach(() => {
    permissionManager = new PermissionManager();
    notificationService = NotificationService.getInstance(permissionManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize and set up notification listeners', async () => {
    await notificationService.setupNotifications();
    
    expect(Notifications.events().registerNotificationReceivedForeground).toHaveBeenCalled();
    expect(Notifications.events().registerNotificationOpened).toHaveBeenCalled();
    expect(Notifications.events().registerNotificationActionReceived).toHaveBeenCalled();
    
    if (Platform.OS === 'android') {
      expect(Notifications.setNotificationChannel).toHaveBeenCalled();
    }
  });

  it('should show a notification for a flight', async () => {
    const mockFlight = {
      id: 'flight123',
      flightNumber: 'UA123',
      aircraftType: 'B737',
      origin: 'SFO',
      originCity: 'San Francisco',
      destination: 'JFK',
      destinationCity: 'New York',
      altitude: 35000,
      heading: 90,
      speed: 450,
      latitude: 37.7749,
      longitude: -122.4194,
      timestamp: Date.now()
    };

    await notificationService.showFlightNotification(mockFlight);
    
    expect(Notifications.postLocalNotification).toHaveBeenCalled();
    
    // Check that the notification includes the actions
    const notificationArg = (Notifications.postLocalNotification as jest.Mock).mock.calls[0][0];
    expect(notificationArg.actions).toBeDefined();
    expect(notificationArg.actions.length).toBe(3);
    expect(notificationArg.actions[0].identifier).toBe(NotificationActionType.VIEW_DETAILS);
    expect(notificationArg.actions[1].identifier).toBe(NotificationActionType.SHOW_HISTORY);
    expect(notificationArg.actions[2].identifier).toBe(NotificationActionType.DISMISS);
  });

  it('should handle notification action properly', async () => {
    const mockAction = {
      identifier: NotificationActionType.VIEW_DETAILS,
      notification: {
        payload: {
          data: {
            flightId: 'flight123'
          }
        }
      }
    };

    const result = await notificationService.handleNotificationAction(mockAction as any);
    
    expect(result).toBe(true);
    
    // Check that the deep link handler was called with the right parameters
    const deepLinkHandler = require('../../../core/utils/DeepLinkHandler').DeepLinkHandler.getInstance();
    expect(deepLinkHandler.navigateToScreen).toHaveBeenCalledWith({
      type: require('../../../core/utils/DeepLinkHandler').DeepLinkType.FLIGHT_DETAILS,
      params: { flightId: 'flight123' }
    });
  });

  it('should cancel a notification', async () => {
    await notificationService.cancelNotification('flight123');
    expect(Notifications.cancelLocalNotification).toHaveBeenCalledWith('flight123');
  });

  it('should cancel all notifications', async () => {
    await notificationService.cancelAllNotifications();
    expect(Notifications.cancelAllLocalNotifications).toHaveBeenCalled();
  });
});