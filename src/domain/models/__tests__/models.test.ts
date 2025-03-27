import { Flight, AppSettings, Location } from '../index';

describe('Flight Model', () => {
  it('should create a valid Flight object', () => {
    const flight: Flight = {
      id: '123abc',
      flightNumber: 'LH123',
      aircraftType: 'A320',
      origin: 'FRA',
      originCity: 'Frankfurt',
      destination: 'JFK',
      destinationCity: 'New York',
      altitude: 30000,
      heading: 270,
      speed: 450,
      latitude: 50.123,
      longitude: -1.456,
      timestamp: Date.now(),
    };

    expect(flight.id).toBe('123abc');
    expect(flight.flightNumber).toBe('LH123');
    expect(flight.aircraftType).toBe('A320');
    expect(flight.origin).toBe('FRA');
    expect(flight.originCity).toBe('Frankfurt');
    expect(flight.destination).toBe('JFK');
    expect(flight.destinationCity).toBe('New York');
    expect(flight.altitude).toBe(30000);
    expect(flight.heading).toBe(270);
    expect(flight.speed).toBe(450);
    expect(flight.latitude).toBe(50.123);
    expect(flight.longitude).toBe(-1.456);
    expect(typeof flight.timestamp).toBe('number');
  });
});

describe('AppSettings Model', () => {
  it('should create a valid AppSettings object with location', () => {
    const location: Location = {
      latitude: 40.7128,
      longitude: -74.006,
    };

    const settings: AppSettings = {
      detectionRadiusKm: 5.0,
      lastKnownLocation: location,
    };

    expect(settings.detectionRadiusKm).toBe(5.0);
    expect(settings.lastKnownLocation).not.toBeNull();
    expect(settings.lastKnownLocation?.latitude).toBe(40.7128);
    expect(settings.lastKnownLocation?.longitude).toBe(-74.006);
  });

  it('should create a valid AppSettings object with null location', () => {
    const settings: AppSettings = {
      detectionRadiusKm: 10.0,
      lastKnownLocation: null,
    };

    expect(settings.detectionRadiusKm).toBe(10.0);
    expect(settings.lastKnownLocation).toBeNull();
  });
});
