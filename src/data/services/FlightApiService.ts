import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AppError, DevToast, ErrorHandler, Logger } from '../../core/utils';

// OpenSky API base URL
const API_BASE_URL = 'https://opensky-network.org/api';

// Rate limiting: 1 request per 10 seconds for anonymous users
// 1 request per 5 seconds for authenticated users
const MIN_REQUEST_INTERVAL_MS = 10000;

export class ApiError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(`ApiError: ${message}`, originalError);
    this.name = 'ApiError';
  }
}

// API response interfaces
export interface OpenSkyState {
  icao24: string;         // ICAO24 transponder address
  callsign: string;       // Callsign (flight number)
  origin_country: string; // Country of origin
  time_position: number;  // Unix timestamp for last position update
  last_contact: number;   // Unix timestamp for last update
  longitude: number;      // WGS-84 longitude in decimal degrees
  latitude: number;       // WGS-84 latitude in decimal degrees
  baro_altitude: number;  // Barometric altitude in meters
  on_ground: boolean;     // Indicates if the aircraft is on ground
  velocity: number;       // Velocity in m/s
  true_track: number;     // True track in decimal degrees (0-359)
  vertical_rate: number;  // Vertical rate in m/s
  sensors: number[];      // IDs of sensors that received signals
  geo_altitude: number;   // Geometric altitude in meters
  squawk: string;         // Transponder code (squawk)
  spi: boolean;           // Special purpose indicator
  position_source: number; // Source of position information (0-3)
}

export interface OpenSkyResponse {
  time: number;
  states: OpenSkyState[];
}

export interface OpenSkyApi {
  getAircraftInArea(
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number
  ): Promise<OpenSkyState[]>;
  getAircraftByIcao(icao24: string): Promise<OpenSkyState | null>;
}

export class FlightApiService implements OpenSkyApi {
  private apiClient: AxiosInstance;
  private logger = new Logger('FlightApiService');
  private errorHandler = new ErrorHandler();
  private lastRequestTime: number = 0;
  private username?: string;
  private password?: string;

  constructor(username?: string, password?: string) {
    this.username = username;
    this.password = password;

    const config: AxiosRequestConfig = {
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    // Add basic auth if credentials are provided
    if (username && password) {
      config.auth = {
        username,
        password
      };
    }

    this.apiClient = axios.create(config);

    // Add request interceptor for rate limiting
    this.apiClient.interceptors.request.use(async (config) => {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      // Apply rate limiting
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
        const delayMs = MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest;
        this.logger.debug(`Rate limiting - delaying request by ${delayMs}ms`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      this.lastRequestTime = Date.now();
      return config;
    });
  }

  /**
   * Get all aircraft in a specified area (bounding box)
   * @param minLat Minimum latitude
   * @param maxLat Maximum latitude
   * @param minLon Minimum longitude
   * @param maxLon Maximum longitude
   * @returns Array of aircraft states
   */
  public async getAircraftInArea(
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number
  ): Promise<OpenSkyState[]> {
    try {
      const response: AxiosResponse<OpenSkyResponse> = await this.apiClient.get(
        '/states/all',
        {
          params: {
            lamin: minLat,
            lamax: maxLat,
            lomin: minLon,
            lomax: maxLon,
          },
        }
      );

      const aircraft = response.data.states || [];
      this.logger.info(`Retrieved ${aircraft.length} aircraft in area`);
      return aircraft;
    } catch (error) {
      this.logger.error('Error fetching aircraft in area', { error, minLat, maxLat, minLon, maxLon });
      this.errorHandler.handleError(
        new ApiError('Failed to fetch aircraft data from OpenSky API', error as Error)
      );
      throw new ApiError('Failed to fetch aircraft data', error as Error);
    }
  }

  /**
   * Get details for a specific aircraft by ICAO24 address
   * @param icao24 The ICAO24 address of the aircraft
   * @returns Aircraft state or null if not found
   */
  public async getAircraftByIcao(icao24: string): Promise<OpenSkyState | null> {
    try {
      const response: AxiosResponse<OpenSkyResponse> = await this.apiClient.get(
        '/states/all',
        {
          params: {
            icao24: icao24,
          },
        }
      );

      const aircraft = response.data.states || [];
      if (aircraft.length === 0) {
        this.logger.info(`No aircraft found with ICAO24: ${icao24}`);
        return null;
      }

      this.logger.info(`Retrieved aircraft with ICAO24: ${icao24}`);
      return aircraft[0];
    } catch (error) {
      this.logger.error('Error fetching aircraft by ICAO24', { error, icao24 });
      this.errorHandler.handleError(
        new ApiError(`Failed to fetch aircraft with ICAO24: ${icao24}`, error as Error)
      );
      throw new ApiError(`Failed to fetch aircraft with ICAO24: ${icao24}`, error as Error);
    }
  }
}