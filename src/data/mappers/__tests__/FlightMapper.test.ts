import { FlightMapper } from '../FlightMapper';
import { OpenSkyState } from '../../services/FlightApiService';

describe('FlightMapper', () => {
  describe('toFlight', () => {
    it('should correctly map OpenSky state to Flight', () => {
      // Arrange
      const openSkyState: OpenSkyState = {
        icao24: 'a0b1c2',
        callsign: 'UAL123  ', // With trailing spaces
        origin_country: 'United States',
        time_position: 1617283200,
        last_contact: 1617283210,
        longitude: -122.374,
        latitude: 37.619,
        baro_altitude: 3048, // 10,000 feet in meters
        on_ground: false,
        velocity: 257, // ~500 knots in m/s
        true_track: 270, // West
        vertical_rate: 0,
        sensors: [1, 2, 3],
        geo_altitude: 3048,
        squawk: '1200',
        spi: false,
        position_source: 0
      };

      // Act
      const flight = FlightMapper.toFlight(openSkyState);

      // Assert
      expect(flight).toEqual({
        id: 'a0b1c2',
        flightNumber: 'UAL123', // Trimmed
        aircraftType: 'Unknown', // Not provided by OpenSky
        origin: 'Unknown', // Not provided by OpenSky
        originCity: 'United States', // Using origin_country
        destination: 'Unknown', // Not provided by OpenSky
        destinationCity: 'Unknown', // Not provided by OpenSky
        altitude: 10000, // Converted to feet and rounded
        heading: 270,
        speed: 499, // Converted to knots and rounded
        latitude: 37.619,
        longitude: -122.374,
        timestamp: 1617283210000, // Converted to milliseconds
        isOnGround: false
      });
    });

    it('should handle missing data in OpenSky state', () => {
      // Arrange
      const openSkyState: OpenSkyState = {
        icao24: 'x1y2z3',
        callsign: '', // Empty callsign
        origin_country: '',
        time_position: 0,
        last_contact: 1617283210,
        longitude: -122.374,
        latitude: 37.619,
        baro_altitude: null, // Missing altitude
        on_ground: true,
        velocity: null, // Missing velocity
        true_track: null, // Missing track
        vertical_rate: 0,
        sensors: [],
        geo_altitude: 0,
        squawk: '',
        spi: false,
        position_source: 0
      };

      // Act
      const flight = FlightMapper.toFlight(openSkyState);

      // Assert
      expect(flight).toEqual({
        id: 'x1y2z3',
        flightNumber: 'Unknown', // Default when callsign is empty
        aircraftType: 'Unknown',
        origin: 'Unknown',
        originCity: 'Unknown', // Default when origin_country is empty
        destination: 'Unknown',
        destinationCity: 'Unknown',
        altitude: 0, // Default when baro_altitude is null
        heading: 0, // Default when true_track is null
        speed: 0, // Default when velocity is null
        latitude: 37.619,
        longitude: -122.374,
        timestamp: 1617283210000,
        isOnGround: true
      });
    });
  });

  describe('toFlights', () => {
    it('should map multiple OpenSky states to Flight array', () => {
      // Arrange
      const states: OpenSkyState[] = [
        {
          icao24: 'a0b1c2',
          callsign: 'UAL123',
          origin_country: 'United States',
          time_position: 1617283200,
          last_contact: 1617283210,
          longitude: -122.374,
          latitude: 37.619,
          baro_altitude: 3048,
          on_ground: false,
          velocity: 257,
          true_track: 270,
          vertical_rate: 0,
          sensors: [1, 2, 3],
          geo_altitude: 3048,
          squawk: '1200',
          spi: false,
          position_source: 0
        },
        {
          icao24: 'x1y2z3',
          callsign: 'DLH456',
          origin_country: 'Germany',
          time_position: 1617283200,
          last_contact: 1617283210,
          longitude: -122.354,
          latitude: 37.639,
          baro_altitude: 3500,
          on_ground: false,
          velocity: 220,
          true_track: 90,
          vertical_rate: -1.5,
          sensors: [1, 2, 3],
          geo_altitude: 3500,
          squawk: '1300',
          spi: false,
          position_source: 0
        }
      ];

      // Act
      const flights = FlightMapper.toFlights(states);

      // Assert
      expect(flights).toHaveLength(2);
      expect(flights[0].id).toBe('a0b1c2');
      expect(flights[1].id).toBe('x1y2z3');
    });

    it('should return empty array when input is empty', () => {
      // Arrange
      const states: OpenSkyState[] = [];

      // Act
      const flights = FlightMapper.toFlights(states);

      // Assert
      expect(flights).toEqual([]);
    });
  });
});