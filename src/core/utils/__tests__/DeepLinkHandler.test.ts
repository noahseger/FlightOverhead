import { DeepLinkHandler, DeepLinkType } from '../DeepLinkHandler';
import { Linking } from 'react-native';

// Mock dependencies
jest.mock('react-native', () => ({
  Linking: {
    addEventListener: jest.fn(),
    getInitialURL: jest.fn().mockResolvedValue(null),
  },
  Platform: {
    OS: 'android'
  }
}));

describe('DeepLinkHandler', () => {
  let deepLinkHandler: DeepLinkHandler;
  let mockNavigate: jest.Mock;

  beforeEach(() => {
    mockNavigate = jest.fn();
    deepLinkHandler = DeepLinkHandler.getInstance();
    deepLinkHandler.registerNavigationFunction(mockNavigate);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a deep link for flight details', () => {
    const deepLink = deepLinkHandler.createDeepLink({
      type: DeepLinkType.FLIGHT_DETAILS,
      params: { flightId: 'flight123' }
    });
    
    expect(deepLink).toBe('flightoverhead://flight?flightId=flight123');
  });

  it('should create a deep link for flight history', () => {
    const deepLink = deepLinkHandler.createDeepLink({
      type: DeepLinkType.FLIGHT_HISTORY
    });
    
    expect(deepLink).toBe('flightoverhead://history');
  });

  it('should handle a valid deep link', async () => {
    const url = 'flightoverhead://flight?flightId=flight123';
    const result = await deepLinkHandler.handleDeepLink(url);
    
    expect(result).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith('FlightDetailsScreen', { flightId: 'flight123' });
  });

  it('should reject an invalid deep link', async () => {
    const url = 'invalidscheme://flight';
    const result = await deepLinkHandler.handleDeepLink(url);
    
    expect(result).toBe(false);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should register deep link handlers', () => {
    deepLinkHandler.registerDeepLinkHandler();
    
    expect(Linking.addEventListener).toHaveBeenCalled();
    expect(Linking.getInitialURL).toHaveBeenCalled();
  });

  it('should navigate to the correct screen', async () => {
    await deepLinkHandler.navigateToScreen({
      type: DeepLinkType.SETTINGS
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('SettingsScreen', {});
  });
});