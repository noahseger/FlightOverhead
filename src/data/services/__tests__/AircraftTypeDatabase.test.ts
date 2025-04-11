import { AircraftTypeDatabase, AircraftCategory } from '../AircraftTypeDatabase';

describe('AircraftTypeDatabase', () => {
  let database: AircraftTypeDatabase;

  beforeEach(() => {
    database = AircraftTypeDatabase.getInstance();
  });

  it('should lookup aircraft by ICAO code', () => {
    const b737 = database.lookupByIcaoCode('B737');
    expect(b737).not.toBeNull();
    expect(b737?.manufacturer).toBe('Boeing');
    expect(b737?.model).toBe('737');
    expect(b737?.category).toBe(AircraftCategory.COMMERCIAL_JET);
    
    const a320 = database.lookupByIcaoCode('A320');
    expect(a320).not.toBeNull();
    expect(a320?.manufacturer).toBe('Airbus');
    expect(a320?.model).toBe('A320');
    
    // Should handle case insensitivity
    const b777 = database.lookupByIcaoCode('b77w');
    expect(b777).not.toBeNull();
    expect(b777?.model).toBe('777-300ER');
  });

  it('should lookup aircraft by model name', () => {
    // Test exact match
    const b747 = database.lookupByModelName('747-400');
    expect(b747).not.toBeNull();
    expect(b747?.icaoCode).toBe('B744');
    
    // Test partial match
    const a330 = database.lookupByModelName('A330');
    expect(a330).not.toBeNull();
    expect(a330?.icaoCode).toBe('A332');
    
    // Test with manufacturer included
    const dreamliner = database.lookupByModelName('Boeing 787');
    expect(dreamliner).not.toBeNull();
    expect(dreamliner?.icaoCode).toBe('B788');
  });

  it('should lookup similar aircraft types', () => {
    // Test boeing pattern
    const boeing = database.lookupSimilar('B-777');
    expect(boeing).not.toBeNull();
    expect(boeing?.category).toBe(AircraftCategory.COMMERCIAL_JET);
    
    // Test airbus pattern
    const airbus = database.lookupSimilar('AiRbUs');
    expect(airbus).not.toBeNull();
    expect(airbus?.category).toBe(AircraftCategory.COMMERCIAL_JET);
    
    // Test helicopter pattern
    const helicopter = database.lookupSimilar('HELICOPTER');
    expect(helicopter).not.toBeNull();
    expect(helicopter?.category).toBe(AircraftCategory.HELICOPTER);
    
    // Test military pattern
    const military = database.lookupSimilar('F-22');
    expect(military).not.toBeNull();
    expect(military?.category).toBe(AircraftCategory.MILITARY);
  });

  it('should return default type for a category', () => {
    const defaultCommercial = database.getDefaultType(AircraftCategory.COMMERCIAL_JET);
    expect(defaultCommercial).not.toBeNull();
    expect(defaultCommercial.category).toBe(AircraftCategory.COMMERCIAL_JET);
    
    const defaultHelicopter = database.getDefaultType(AircraftCategory.HELICOPTER);
    expect(defaultHelicopter).not.toBeNull();
    expect(defaultHelicopter.category).toBe(AircraftCategory.HELICOPTER);
  });
});