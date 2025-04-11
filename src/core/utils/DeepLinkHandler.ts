import { Linking } from 'react-native';
import { Logger } from './Logger';
import { AppError, ErrorHandler } from './index';

export class DeepLinkHandlerError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(`DeepLinkHandlerError: ${message}`, originalError);
    this.name = 'DeepLinkHandlerError';
  }
}

export enum DeepLinkType {
  FLIGHT_DETAILS = 'flight-details',
  FLIGHT_HISTORY = 'flight-history',
  SETTINGS = 'settings',
  DASHBOARD = 'dashboard'
}

export interface DeepLinkConfig {
  type: DeepLinkType;
  params?: Record<string, string>;
}

export interface IDeepLinkHandler {
  handleDeepLink(url: string): Promise<boolean>;
  registerDeepLinkHandler(): void;
  navigateToScreen(config: DeepLinkConfig): Promise<boolean>;
  createDeepLink(config: DeepLinkConfig): string;
}

/**
 * Service for handling deep links and in-app navigation
 */
export class DeepLinkHandler implements IDeepLinkHandler {
  private static instance: DeepLinkHandler;
  private appScheme = 'flightoverhead://';
  private logger = new Logger('DeepLinkHandler');
  private errorHandler = new ErrorHandler();
  
  // Navigation function to be registered when app initializes
  private navigateFunction: ((screenName: string, params?: any) => void) | null = null;
  
  private constructor() {}
  
  public static getInstance(): DeepLinkHandler {
    if (!DeepLinkHandler.instance) {
      DeepLinkHandler.instance = new DeepLinkHandler();
    }
    return DeepLinkHandler.instance;
  }
  
  /**
   * Register navigation function to handle deep links
   * @param navigateFunction Function to call for navigation
   */
  public registerNavigationFunction(navigateFunction: (screenName: string, params?: any) => void): void {
    this.navigateFunction = navigateFunction;
    this.logger.info('Navigation function registered');
  }
  
  /**
   * Register listeners for handling deep links
   */
  public registerDeepLinkHandler(): void {
    try {
      // Handle deep links when app is already open
      Linking.addEventListener('url', ({ url }) => {
        this.handleDeepLink(url);
      });
      
      // Check for initial link used to open the app
      Linking.getInitialURL().then((url) => {
        if (url) {
          this.handleDeepLink(url);
        }
      }).catch(error => {
        this.logger.error('Failed to get initial URL', { error });
      });
      
      this.logger.info('Deep link handlers registered');
    } catch (error) {
      this.logger.error('Failed to register deep link handlers', { error });
      this.errorHandler.handleError(
        new DeepLinkHandlerError('Failed to register deep link handlers', error as Error)
      );
    }
  }
  
  /**
   * Handle deep link URL
   * @param url The deep link URL
   * @returns Promise resolving to true if the link was handled
   */
  public async handleDeepLink(url: string): Promise<boolean> {
    try {
      this.logger.info('Handling deep link', { url });
      
      // Check if URL starts with our app scheme
      if (!url.startsWith(this.appScheme)) {
        this.logger.warn('Invalid deep link scheme', { url });
        return false;
      }
      
      // Parse the URL path and parameters
      const path = url.substring(this.appScheme.length);
      const [screenPath, queryString] = path.split('?');
      const params: Record<string, string> = {};
      
      // Parse query parameters if present
      if (queryString) {
        queryString.split('&').forEach(param => {
          const [key, value] = param.split('=');
          if (key && value) {
            params[key] = decodeURIComponent(value);
          }
        });
      }
      
      // Map path to screen and type
      const config: DeepLinkConfig = {
        type: this.getDeepLinkTypeFromPath(screenPath),
        params
      };
      
      // Navigate to the screen
      return await this.navigateToScreen(config);
    } catch (error) {
      this.logger.error('Failed to handle deep link', { error, url });
      this.errorHandler.handleError(
        new DeepLinkHandlerError('Failed to handle deep link', error as Error)
      );
      return false;
    }
  }
  
  /**
   * Navigate to screen based on deep link configuration
   * @param config Deep link configuration
   * @returns Promise resolving to true if navigation was successful
   */
  public async navigateToScreen(config: DeepLinkConfig): Promise<boolean> {
    try {
      // Check if we have a navigate function registered
      if (!this.navigateFunction) {
        this.logger.warn('Navigation function not registered, cannot navigate to screen');
        return false;
      }
      
      // Map the deep link type to a screen name
      let screenName = '';
      
      switch (config.type) {
        case DeepLinkType.FLIGHT_DETAILS:
          screenName = 'FlightDetailsScreen';
          break;
        case DeepLinkType.FLIGHT_HISTORY:
          screenName = 'FlightHistoryScreen';
          break;
        case DeepLinkType.SETTINGS:
          screenName = 'SettingsScreen';
          break;
        case DeepLinkType.DASHBOARD:
          screenName = 'DashboardScreen';
          break;
        default:
          this.logger.warn('Unknown deep link type', { type: config.type });
          return false;
      }
      
      // Navigate to the screen
      this.navigateFunction(screenName, config.params);
      this.logger.info('Navigated to screen', { screen: screenName, params: config.params });
      
      return true;
    } catch (error) {
      this.logger.error('Failed to navigate to screen', { error, config });
      this.errorHandler.handleError(
        new DeepLinkHandlerError('Failed to navigate to screen', error as Error)
      );
      return false;
    }
  }
  
  /**
   * Create a deep link URL from configuration
   * @param config Deep link configuration
   * @returns Deep link URL string
   */
  public createDeepLink(config: DeepLinkConfig): string {
    try {
      const path = this.getPathFromDeepLinkType(config.type);
      
      // Start with the scheme and path
      let deepLink = `${this.appScheme}${path}`;
      
      // Add parameters if present
      if (config.params && Object.keys(config.params).length > 0) {
        const queryParams = Object.entries(config.params)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&');
        
        deepLink += `?${queryParams}`;
      }
      
      return deepLink;
    } catch (error) {
      this.logger.error('Failed to create deep link', { error, config });
      this.errorHandler.handleError(
        new DeepLinkHandlerError('Failed to create deep link', error as Error)
      );
      return '';
    }
  }
  
  /**
   * Map screen path to deep link type
   * @param path URL path
   * @returns DeepLinkType
   */
  private getDeepLinkTypeFromPath(path: string): DeepLinkType {
    switch (path) {
      case 'flight':
        return DeepLinkType.FLIGHT_DETAILS;
      case 'history':
        return DeepLinkType.FLIGHT_HISTORY;
      case 'settings':
        return DeepLinkType.SETTINGS;
      case '':
      case 'dashboard':
        return DeepLinkType.DASHBOARD;
      default:
        return DeepLinkType.DASHBOARD;
    }
  }
  
  /**
   * Map deep link type to screen path
   * @param type DeepLinkType
   * @returns URL path
   */
  private getPathFromDeepLinkType(type: DeepLinkType): string {
    switch (type) {
      case DeepLinkType.FLIGHT_DETAILS:
        return 'flight';
      case DeepLinkType.FLIGHT_HISTORY:
        return 'history';
      case DeepLinkType.SETTINGS:
        return 'settings';
      case DeepLinkType.DASHBOARD:
        return 'dashboard';
      default:
        return '';
    }
  }
}