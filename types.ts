export interface RawCompany {
  'Id. Empresa': string | number;
  'Razón Social': string;
  'CIF'?: string;
  'Domicilio'?: string;
  'Municipio'?: string;
  'Provincia'?: string;
  'País'?: string;
  'Ventas 2024'?: number;
  'Inversión 2024'?: number;
  'Inversión 2025'?: number;
  'Empleo'?: number;
  'Capital'?: number;
  'CNAE'?: string;
  'Actividad'?: string;
  'Sectores'?: string;
  'Web'?: string;
  'Email'?: string;
  [key: string]: any;
}

export interface RawProfessional {
  'Id. Empresa': string | number;
  'Razón Social': string;
  'Nombre': string;
  'Apellidos': string;
  'Cargo': string;
  'Email': string;
}

export interface RawEconomicData {
  'Id. Empresa': string | number;
  'Razón Social': string;
  'Año': number;
  'Ventas': number;
  'Inversión Realizada': number;
  'Inversión Prevista': number;
  'Empleados': number;
  'Capital': number;
}

export type MaterialType = 'Plástico Rígido' | 'Plástico Flexible' | 'Papel/Cartón' | 'Madera' | 'Metal' | 'Multimaterial' | 'Otros/Desconocido';
export type PackagingType = 'Primario' | 'Servicio/Horeca' | 'Transporte/Logística' | 'Maquinaria/Otros';

export interface ProcessedCompany extends RawCompany {
  normalizedName: string;
  // Segmentación Robust (Requisito C)
  segmentation: {
    primarySector: string; // From 'Sectores'
    activity: string;      // From 'Actividad'
    province: string;      // From 'Provincia'
    sizeLabel: 'Grande' | 'Mediana' | 'Pequeña' | 'Micro'; // Calculated
    material: MaterialType; // Inferred
    packagingType: PackagingType; // Inferred
  };
  // PPWR Analysis Module
  ppwr: {
    isRelevant: boolean; 
    roles: {
      isServiceManufacturer: boolean;   
      isTransportManufacturer: boolean; 
      isPrimaryManufacturer: boolean;   
    };
    impactRatio: number; // -10 to +10
    impactLabel: string;
    keyDrivers: string[]; 
  };
  score: {
    total: number; // 0-100
    breakdown: {
      volume: number;      // 40%
      humanCapital: number;// 20%
      growth: number;      // 15%
      digital: number;     // 15%
      geo: number;         // 10%
    };
  };
  professionals: RawProfessional[];
  economicHistory: RawEconomicData[];
}

export interface DatasetStats {
  totalCompanies: number;
  totalProfessionals: number;
  duplicatesRemoved: number;
  missingWebsites: number;
  missingEmails: number;
  topSectors: { [key: string]: number };
  topProvinces: { [key: string]: number };
  sizeDistribution: { [key: string]: number };
  materialDistribution: { [key: string]: number }; // New
  typeDistribution: { [key: string]: number }; // New
  ppwrStats: {
    highImpact: number;
    neutral: number;
    opportunity: number;
  };
}