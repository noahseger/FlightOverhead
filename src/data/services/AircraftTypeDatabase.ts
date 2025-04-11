import { AppError, ErrorHandler, Logger } from '../../core/utils';

export class AircraftTypeDatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(`AircraftTypeDatabaseError: ${message}`, originalError);
    this.name = 'AircraftTypeDatabaseError';
  }
}

export interface AircraftType {
  icaoCode: string;      // ICAO type designator (e.g., B738)
  manufacturer: string;  // Aircraft manufacturer (e.g., Boeing)
  model: string;         // Aircraft model (e.g., 737-800)
  category: AircraftCategory;  // Category of aircraft
  imageIds: string[];    // IDs for retrieving images
  description?: string;  // Optional description
}

export enum AircraftCategory {
  COMMERCIAL_JET = 'commercial_jet',
  REGIONAL_JET = 'regional_jet',
  TURBOPROP = 'turboprop',
  PRIVATE = 'private',
  HELICOPTER = 'helicopter',
  MILITARY = 'military',
  OTHER = 'other'
}

export interface IAircraftTypeDatabase {
  lookupByIcaoCode(icaoCode: string): AircraftType | null;
  lookupByModelName(modelName: string): AircraftType | null;
  lookupSimilar(query: string): AircraftType | null;
  getDefaultType(category: AircraftCategory): AircraftType;
}

/**
 * Database of aircraft types and their metadata
 */
export class AircraftTypeDatabase implements IAircraftTypeDatabase {
  private static instance: AircraftTypeDatabase;
  private logger = new Logger('AircraftTypeDatabase');
  private errorHandler = new ErrorHandler();
  
  // Map of ICAO codes to aircraft types
  private aircraftTypes: Map<string, AircraftType> = new Map();
  
  // Default aircraft types by category
  private defaultTypes: Record<AircraftCategory, AircraftType> = {
    [AircraftCategory.COMMERCIAL_JET]: {
      icaoCode: 'COMM',
      manufacturer: 'Generic',
      model: 'Commercial Jet',
      category: AircraftCategory.COMMERCIAL_JET,
      imageIds: ['commercial-jet-generic']
    },
    [AircraftCategory.REGIONAL_JET]: {
      icaoCode: 'REGN',
      manufacturer: 'Generic',
      model: 'Regional Jet',
      category: AircraftCategory.REGIONAL_JET,
      imageIds: ['regional-jet-generic']
    },
    [AircraftCategory.TURBOPROP]: {
      icaoCode: 'TURB',
      manufacturer: 'Generic',
      model: 'Turboprop',
      category: AircraftCategory.TURBOPROP,
      imageIds: ['turboprop-generic']
    },
    [AircraftCategory.PRIVATE]: {
      icaoCode: 'PRIV',
      manufacturer: 'Generic',
      model: 'Private Aircraft',
      category: AircraftCategory.PRIVATE,
      imageIds: ['private-aircraft-generic']
    },
    [AircraftCategory.HELICOPTER]: {
      icaoCode: 'HELI',
      manufacturer: 'Generic',
      model: 'Helicopter',
      category: AircraftCategory.HELICOPTER,
      imageIds: ['helicopter-generic']
    },
    [AircraftCategory.MILITARY]: {
      icaoCode: 'MILI',
      manufacturer: 'Generic',
      model: 'Military Aircraft',
      category: AircraftCategory.MILITARY,
      imageIds: ['military-aircraft-generic']
    },
    [AircraftCategory.OTHER]: {
      icaoCode: 'OTHR',
      manufacturer: 'Generic',
      model: 'Aircraft',
      category: AircraftCategory.OTHER,
      imageIds: ['aircraft-generic']
    }
  };
  
  private constructor() {
    this.initializeDatabase();
  }
  
  public static getInstance(): AircraftTypeDatabase {
    if (!AircraftTypeDatabase.instance) {
      AircraftTypeDatabase.instance = new AircraftTypeDatabase();
    }
    return AircraftTypeDatabase.instance;
  }
  
  /**
   * Look up aircraft type by ICAO code
   * @param icaoCode ICAO aircraft type designator
   * @returns Aircraft type or null if not found
   */
  public lookupByIcaoCode(icaoCode: string): AircraftType | null {
    if (!icaoCode) return null;
    
    // Normalize to uppercase
    const normalizedCode = icaoCode.toUpperCase();
    
    // Try direct lookup
    if (this.aircraftTypes.has(normalizedCode)) {
      return this.aircraftTypes.get(normalizedCode) || null;
    }
    
    // Try to find a partial match
    for (const [code, type] of this.aircraftTypes.entries()) {
      if (normalizedCode.startsWith(code) || code.startsWith(normalizedCode)) {
        return type;
      }
    }
    
    return null;
  }
  
  /**
   * Look up aircraft type by model name
   * @param modelName Aircraft model name
   * @returns Aircraft type or null if not found
   */
  public lookupByModelName(modelName: string): AircraftType | null {
    if (!modelName) return null;
    
    const normalizedName = modelName.toUpperCase();
    
    for (const type of this.aircraftTypes.values()) {
      const typeModel = type.model.toUpperCase();
      const typeManufacturer = type.manufacturer.toUpperCase();
      
      if (
        typeModel === normalizedName ||
        typeModel.includes(normalizedName) ||
        normalizedName.includes(typeModel) ||
        `${typeManufacturer} ${typeModel}`.includes(normalizedName)
      ) {
        return type;
      }
    }
    
    return null;
  }
  
  /**
   * Look up similar aircraft type by any matching string
   * @param query Search query
   * @returns Best matching aircraft type or null
   */
  public lookupSimilar(query: string): AircraftType | null {
    if (!query) return null;
    
    // First try ICAO code lookup
    const byIcao = this.lookupByIcaoCode(query);
    if (byIcao) return byIcao;
    
    // Then try model name lookup
    const byModel = this.lookupByModelName(query);
    if (byModel) return byModel;
    
    // Try to categorize based on query contents
    const normalizedQuery = query.toUpperCase();
    
    if (normalizedQuery.includes('BOEING') || normalizedQuery.startsWith('B7') || normalizedQuery.startsWith('B-7')) {
      return this.getDefaultType(AircraftCategory.COMMERCIAL_JET);
    } else if (normalizedQuery.includes('AIRBUS') || normalizedQuery.startsWith('A3') || normalizedQuery.startsWith('A-3')) {
      return this.getDefaultType(AircraftCategory.COMMERCIAL_JET);
    } else if (normalizedQuery.includes('HELI') || normalizedQuery.includes('ROTOR') || normalizedQuery.startsWith('R22') || normalizedQuery.startsWith('R44')) {
      return this.getDefaultType(AircraftCategory.HELICOPTER);
    } else if (normalizedQuery.includes('MILITARY') || normalizedQuery.includes('FIGHT') || normalizedQuery.startsWith('F-')) {
      return this.getDefaultType(AircraftCategory.MILITARY);
    } else if (normalizedQuery.includes('CRJ') || normalizedQuery.includes('ERJ') || normalizedQuery.includes('EMB')) {
      return this.getDefaultType(AircraftCategory.REGIONAL_JET);
    } else if (normalizedQuery.includes('CESS') || normalizedQuery.includes('PIPER') || normalizedQuery.includes('BEECH')) {
      return this.getDefaultType(AircraftCategory.PRIVATE);
    }
    
    // Default to generic aircraft
    return this.getDefaultType(AircraftCategory.OTHER);
  }
  
  /**
   * Get default aircraft type for a category
   * @param category Aircraft category
   * @returns Default aircraft type
   */
  public getDefaultType(category: AircraftCategory): AircraftType {
    return this.defaultTypes[category];
  }
  
  /**
   * Initialize the aircraft type database
   */
  private initializeDatabase(): void {
    try {
      // Load common aircraft types
      this.loadCommonAircraftTypes();
      this.logger.info(`Initialized aircraft type database with ${this.aircraftTypes.size} entries`);
    } catch (error) {
      this.logger.error('Error initializing aircraft type database', { error });
      this.errorHandler.handleError(
        new AircraftTypeDatabaseError('Failed to initialize aircraft type database', error as Error)
      );
    }
  }
  
  /**
   * Load common aircraft types into the database
   */
  private loadCommonAircraftTypes(): void {
    // Boeing aircraft
    this.addAircraftType({
      icaoCode: 'B737',
      manufacturer: 'Boeing',
      model: '737',
      category: AircraftCategory.COMMERCIAL_JET,
      imageIds: ['boeing-737', 'b737-generic'],
      description: 'Boeing 737 narrow-body aircraft'
    });
    
    this.addAircraftType({
      icaoCode: 'B738',
      manufacturer: 'Boeing',
      model: '737-800',
      category: AircraftCategory.COMMERCIAL_JET,
      imageIds: ['boeing-737-800', 'b737-800', 'b737'],
      description: 'Boeing 737-800 narrow-body aircraft'
    });
    
    this.addAircraftType({
      icaoCode: 'B739',
      manufacturer: 'Boeing',
      model: '737-900',
      category: AircraftCategory.COMMERCIAL_JET,
      imageIds: ['boeing-737-900', 'b737-900', 'b737'],
      description: 'Boeing 737-900 narrow-body aircraft'
    });
    
    this.addAircraftType({
      icaoCode: 'B744',
      manufacturer: 'Boeing',
      model: '747-400',
      category: AircraftCategory.COMMERCIAL_JET,
      imageIds: ['boeing-747-400', 'b747-400', 'b747'],
      description: 'Boeing 747-400 wide-body aircraft'
    });
    
    this.addAircraftType({
      icaoCode: 'B748',
      manufacturer: 'Boeing',
      model: '747-8',
      category: AircraftCategory.COMMERCIAL_JET,
      imageIds: ['boeing-747-8', 'b747-8', 'b747'],
      description: 'Boeing 747-8 wide-body aircraft'
    });
    
    this.addAircraftType({
      icaoCode: 'B752',
      manufacturer: 'Boeing',
      model: '757-200',
      category: AircraftCategory.COMMERCIAL_JET,
      imageIds: ['boeing-757-200', 'b757-200', 'b757'],
      description: 'Boeing 757-200 narrow-body aircraft'
    });
    
    this.addAircraftType({
      icaoCode: 'B763',
      manufacturer: 'Boeing',
      model: '767-300',
      category: AircraftCategory.COMMERCIAL_JET,
      imageIds: ['boeing-767-300', 'b767-300', 'b767'],
      description: 'Boeing 767-300 wide-body aircraft'
    });
    
    this.addAircraftType({
      icaoCode: 'B77W',
      manufacturer: 'Boeing',
      model: '777-300ER',
      category: AircraftCategory.COMMERCIAL_JET,
      imageIds: ['boeing-777-300er', 'b777-300er', 'b777'],
      description: 'Boeing 777-300ER wide-body aircraft'
    });
    
    this.addAircraftType({
      icaoCode: 'B788',
      manufacturer: 'Boeing',
      model: '787-8',
      category: AircraftCategory.COMMERCIAL_JET,
      imageIds: ['boeing-787-8', 'b787-8', 'b787'],
      description: 'Boeing 787-8 Dreamliner wide-body aircraft'
    });
    
    this.addAircraftType({
      icaoCode: 'B789',
      manufacturer: 'Boeing',
      model: '787-9',
      category: AircraftCategory.COMMERCIAL_JET,
      imageIds: ['boeing-787-9', 'b787-9', 'b787'],
      description: 'Boeing 787-9 Dreamliner wide-body aircraft'
    });
    
    // Airbus aircraft
    this.addAircraftType({
      icaoCode: 'A319',
      manufacturer: 'Airbus',
      model: 'A319',
      category: AircraftCategory.COMMERCIAL_JET,
      imageIds: ['airbus-a319', 'a319'],
      description: 'Airbus A319 narrow-body aircraft'
    });
    
    this.addAircraftType({
      icaoCode: 'A320',
      manufacturer: 'Airbus',
      model: 'A320',
      category: AircraftCategory.COMMERCIAL_JET,
      imageIds: ['airbus-a320', 'a320'],
      description: 'Airbus A320 narrow-body aircraft'
    });
    
    this.addAircraftType({
      icaoCode: 'A321',
      manufacturer: 'Airbus',
      model: 'A321',
      category: AircraftCategory.COMMERCIAL_JET,
      imageIds: ['airbus-a321', 'a321'],
      description: 'Airbus A321 narrow-body aircraft'
    });
    
    this.addAircraftType({
      icaoCode: 'A332',
      manufacturer: 'Airbus',
      model: 'A330-200',
      category: AircraftCategory.COMMERCIAL_JET,
      imageIds: ['airbus-a330-200', 'a330-200', 'a330'],
      description: 'Airbus A330-200 wide-body aircraft'
    });
    
    this.addAircraftType({
      icaoCode: 'A333',
      manufacturer: 'Airbus',
      model: 'A330-300',
      category: AircraftCategory.COMMERCIAL_JET,
      imageIds: ['airbus-a330-300', 'a330-300', 'a330'],
      description: 'Airbus A330-300 wide-body aircraft'
    });
    
    this.addAircraftType({
      icaoCode: 'A359',
      manufacturer: 'Airbus',
      model: 'A350-900',
      category: AircraftCategory.COMMERCIAL_JET,
      imageIds: ['airbus-a350-900', 'a350-900', 'a350'],
      description: 'Airbus A350-900 wide-body aircraft'
    });
    
    this.addAircraftType({
      icaoCode: 'A388',
      manufacturer: 'Airbus',
      model: 'A380-800',
      category: AircraftCategory.COMMERCIAL_JET,
      imageIds: ['airbus-a380-800', 'a380-800', 'a380'],
      description: 'Airbus A380-800 wide-body aircraft'
    });
    
    // Regional jets
    this.addAircraftType({
      icaoCode: 'CRJ2',
      manufacturer: 'Bombardier',
      model: 'CRJ-200',
      category: AircraftCategory.REGIONAL_JET,
      imageIds: ['bombardier-crj-200', 'crj-200', 'crj'],
      description: 'Bombardier CRJ-200 regional jet'
    });
    
    this.addAircraftType({
      icaoCode: 'CRJ7',
      manufacturer: 'Bombardier',
      model: 'CRJ-700',
      category: AircraftCategory.REGIONAL_JET,
      imageIds: ['bombardier-crj-700', 'crj-700', 'crj'],
      description: 'Bombardier CRJ-700 regional jet'
    });
    
    this.addAircraftType({
      icaoCode: 'CRJ9',
      manufacturer: 'Bombardier',
      model: 'CRJ-900',
      category: AircraftCategory.REGIONAL_JET,
      imageIds: ['bombardier-crj-900', 'crj-900', 'crj'],
      description: 'Bombardier CRJ-900 regional jet'
    });
    
    this.addAircraftType({
      icaoCode: 'E170',
      manufacturer: 'Embraer',
      model: 'E170',
      category: AircraftCategory.REGIONAL_JET,
      imageIds: ['embraer-e170', 'e170'],
      description: 'Embraer E170 regional jet'
    });
    
    this.addAircraftType({
      icaoCode: 'E190',
      manufacturer: 'Embraer',
      model: 'E190',
      category: AircraftCategory.REGIONAL_JET,
      imageIds: ['embraer-e190', 'e190'],
      description: 'Embraer E190 regional jet'
    });
    
    // Turboprops
    this.addAircraftType({
      icaoCode: 'DH8D',
      manufacturer: 'Bombardier',
      model: 'Dash 8 Q400',
      category: AircraftCategory.TURBOPROP,
      imageIds: ['bombardier-dash-8-q400', 'dash-8-q400', 'dash-8'],
      description: 'Bombardier Dash 8 Q400 turboprop'
    });
    
    this.addAircraftType({
      icaoCode: 'AT76',
      manufacturer: 'ATR',
      model: 'ATR 72-600',
      category: AircraftCategory.TURBOPROP,
      imageIds: ['atr-72-600', 'atr-72', 'atr'],
      description: 'ATR 72-600 turboprop'
    });
    
    // Private aircraft
    this.addAircraftType({
      icaoCode: 'C172',
      manufacturer: 'Cessna',
      model: '172 Skyhawk',
      category: AircraftCategory.PRIVATE,
      imageIds: ['cessna-172', 'c172'],
      description: 'Cessna 172 Skyhawk single-engine private aircraft'
    });
    
    this.addAircraftType({
      icaoCode: 'C208',
      manufacturer: 'Cessna',
      model: '208 Caravan',
      category: AircraftCategory.PRIVATE,
      imageIds: ['cessna-208', 'cessna-caravan', 'c208'],
      description: 'Cessna 208 Caravan utility aircraft'
    });
    
    // Helicopters
    this.addAircraftType({
      icaoCode: 'R44',
      manufacturer: 'Robinson',
      model: 'R44',
      category: AircraftCategory.HELICOPTER,
      imageIds: ['robinson-r44', 'r44'],
      description: 'Robinson R44 light helicopter'
    });
    
    this.addAircraftType({
      icaoCode: 'EC35',
      manufacturer: 'Airbus',
      model: 'EC135',
      category: AircraftCategory.HELICOPTER,
      imageIds: ['airbus-ec135', 'ec135'],
      description: 'Airbus EC135 utility helicopter'
    });
    
    // Military aircraft
    this.addAircraftType({
      icaoCode: 'F16',
      manufacturer: 'Lockheed Martin',
      model: 'F-16 Fighting Falcon',
      category: AircraftCategory.MILITARY,
      imageIds: ['f-16', 'f16'],
      description: 'F-16 Fighting Falcon fighter aircraft'
    });
    
    this.addAircraftType({
      icaoCode: 'C130',
      manufacturer: 'Lockheed Martin',
      model: 'C-130 Hercules',
      category: AircraftCategory.MILITARY,
      imageIds: ['c-130', 'c130', 'hercules'],
      description: 'C-130 Hercules military transport aircraft'
    });
  }
  
  /**
   * Add an aircraft type to the database
   * @param type Aircraft type to add
   */
  private addAircraftType(type: AircraftType): void {
    this.aircraftTypes.set(type.icaoCode, type);
  }
}