import { RawCompany, RawProfessional, RawEconomicData, ProcessedCompany, DatasetStats, MaterialType, PackagingType } from '../types';

// Helper to clean strings
const cleanString = (str: any): string => {
  if (!str) return '';
  return String(str).trim();
};

const normalizeName = (name: string): string => {
  return cleanString(name).toUpperCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .replace('SL', '')
    .replace('SA', '')
    .trim();
};

const getSizeLabel = (sales: number, employees: number): ProcessedCompany['segmentation']['sizeLabel'] => {
  if (sales > 50000000 || employees > 250) return 'Grande';
  if (sales > 10000000 || employees > 50) return 'Mediana';
  if (sales > 2000000 || employees > 10) return 'Pequeña';
  return 'Micro';
};

// --- LOGICA DE INFERENCIA DE MATERIALES Y TIPOS ---
const inferMaterialAndType = (text: string): { material: MaterialType, type: PackagingType } => {
  const t = text.toLowerCase();
  
  let material: MaterialType = 'Otros/Desconocido';
  let type: PackagingType = 'Maquinaria/Otros';

  // Inferencia Material
  if (t.includes('cartón') || t.includes('papel') || t.includes('corrugado') || t.includes('celulosa') || t.includes('kraft')) {
    material = 'Papel/Cartón';
  } else if (t.includes('madera') || t.includes('palet')) {
    material = 'Madera';
  } else if (t.includes('flexible') || t.includes('film') || t.includes('bolsa') || t.includes('complejo')) {
    material = 'Plástico Flexible';
  } else if (t.includes('botella') || t.includes('inyección') || t.includes('soplado') || t.includes('rígido') || t.includes('pet') || t.includes('hdpe') || t.includes('tapón')) {
    material = 'Plástico Rígido';
  } else if (t.includes('metal') || t.includes('lata') || t.includes('aluminio') || t.includes('hojalata')) {
    material = 'Metal';
  } else if (t.includes('plástico')) {
    material = 'Plástico Rígido'; // Default plastic
  }

  // Inferencia Tipo Envase (Prioridad: Transporte > Servicio > Primario)
  if (t.includes('palet') || t.includes('caja') || t.includes('logístic') || t.includes('industrial') || t.includes('contenedor') || t.includes('agrícola')) {
    type = 'Transporte/Logística';
  } else if (t.includes('take away') || t.includes('vaso') || t.includes('plato') || t.includes('horeca') || t.includes('un solo uso') || t.includes('servicio')) {
    type = 'Servicio/Horeca';
  } else if (t.includes('envase') || t.includes('botella') || t.includes('tarro') || t.includes('estuche') || t.includes('blister') || t.includes('bandeja') || t.includes('film') || t.includes('bolsa')) {
    type = 'Primario';
  }

  return { material, type };
};

const inferSegmentation = (company: RawCompany, sales: number, employees: number): ProcessedCompany['segmentation'] => {
  const rawSector = cleanString(company.Sectores);
  const rawActivity = cleanString(company.Actividad);
  
  // Clean Sector
  let primarySector = rawSector.split(/[;,]/)[0].trim();
  if (!primarySector) primarySector = "Otros / No definido";
  primarySector = primarySector.charAt(0).toUpperCase() + primarySector.slice(1).toLowerCase();

  const province = cleanString(company.Provincia) || "Desconocida";
  const sizeLabel = getSizeLabel(sales, employees);

  // Advanced Inference
  const combinedText = (rawSector + " " + rawActivity + " " + company['Razón Social']).toLowerCase();
  const { material, type } = inferMaterialAndType(combinedText);

  return { 
    primarySector, 
    activity: rawActivity || "Sin actividad detallada", 
    province,
    sizeLabel,
    material,
    packagingType: type
  };
};

const calculateGenericScore = (company: RawCompany, sales: number, employees: number, inv24: number, inv25: number, hasWeb: boolean, hasEmail: boolean): ProcessedCompany['score'] => {
  let volume = 0;      // Max 40
  let humanCapital = 0;// Max 20
  let growth = 0;      // Max 15
  let digital = 0;     // Max 15
  let geo = 0;         // Max 10

  const country = cleanString(company['País']).toLowerCase();

  // 1. Volume (Sales)
  if (sales > 100000000) volume = 40;
  else if (sales > 50000000) volume = 35;
  else if (sales > 10000000) volume = 30;
  else if (sales > 5000000) volume = 20;
  else if (sales > 1000000) volume = 10;
  else if (sales > 0) volume = 5;

  // 2. Human Capital
  if (employees > 500) humanCapital = 20;
  else if (employees > 100) humanCapital = 15;
  else if (employees > 50) humanCapital = 10;
  else if (employees > 10) humanCapital = 5;

  // 3. Growth / Investment
  if (inv25 > 0) growth = 15; 
  else if (inv24 > 0) growth = 10;
  
  // 4. Digital Maturity
  if (hasWeb) digital += 10;
  if (hasEmail) digital += 5;

  // 5. Geo
  if (country && country !== 'españa' && country !== 'spain') geo = 10;
  else if (cleanString(company.Web).includes('.com') || cleanString(company.Web).includes('.eu')) geo = 5;
  else geo = 2;

  return {
    total: volume + humanCapital + growth + digital + geo,
    breakdown: { volume, humanCapital, growth, digital, geo }
  };
};

const analyzePPWR = (company: RawCompany, segmentation: ProcessedCompany['segmentation']) => {
  const text = (
    cleanString(company.Sectores) + " " + 
    cleanString(company.Actividad) + " " + 
    cleanString(company['Razón Social'])
  ).toLowerCase();

  const isRelevant = text.includes('envase') || text.includes('embalaje') || text.includes('packaging') || 
                     text.includes('plástico') || text.includes('cartón') || text.includes('papel') || 
                     text.includes('vidrio') || text.includes('metal') || text.includes('pack') ||
                     text.includes('bolsa') || text.includes('film');

  if (!isRelevant) {
    return {
      isRelevant: false,
      roles: { isServiceManufacturer: false, isTransportManufacturer: false, isPrimaryManufacturer: false },
      impactRatio: 0,
      impactLabel: "No Aplica",
      keyDrivers: []
    };
  }

  // Use inferred types
  const isServiceManufacturer = segmentation.packagingType === 'Servicio/Horeca';
  const isTransportManufacturer = segmentation.packagingType === 'Transporte/Logística';
  const isPrimaryManufacturer = segmentation.packagingType === 'Primario';

  let ratio = -2;
  const drivers: string[] = ["Base: Regulación implica adaptación"];

  if (isServiceManufacturer) {
    ratio -= 5;
    drivers.push("Negativo: Restricciones severas envase servicio");
  }
  if (isTransportManufacturer && !text.includes('reutiliz')) {
    ratio -= 3;
    drivers.push("Negativo: Objetivos reducción/reutilización transporte");
  }
  
  if (segmentation.material.includes('Plástico') && !text.includes('reciclado')) {
    ratio -= 2;
    drivers.push("Riesgo: Plástico virgen bajo escrutinio");
  } else if (segmentation.material === 'Papel/Cartón') {
    ratio += 3;
    drivers.push("Oportunidad: Sustitución hacia fibra/papel");
  }

  if (text.includes('reutiliz') || text.includes('returnable') || text.includes('rpc') || text.includes('pooling')) {
    ratio += 8;
    drivers.push("Estratégico: Modelo reutilizable alineado con PPWR");
  }
  if (text.includes('100% reciclado') || text.includes('pcr')) {
    ratio += 4;
    drivers.push("Positivo: Uso de material reciclado");
  }

  ratio = Math.max(-10, Math.min(10, ratio));

  let impactLabel = "Neutral";
  if (ratio <= -6) impactLabel = "Crítico: Alta Responsabilidad";
  else if (ratio < 0) impactLabel = "Reto: Adaptación Requerida";
  else if (ratio > 6) impactLabel = "Liderazgo: Oportunidad Estratégica";
  else if (ratio > 0) impactLabel = "Positivo: Buena Posición";

  return {
    isRelevant: true,
    roles: { isServiceManufacturer, isTransportManufacturer, isPrimaryManufacturer },
    impactRatio: ratio,
    impactLabel,
    keyDrivers: drivers
  };
};

export const processExcelData = (
  rawCompanies: RawCompany[],
  rawProfessionals: RawProfessional[],
  rawEconomics: RawEconomicData[]
): { processed: ProcessedCompany[]; stats: DatasetStats } => {
  
  const processed: ProcessedCompany[] = [];
  const seenIds = new Set();
  let duplicates = 0;

  const profMap = new Map<string, RawProfessional[]>();
  rawProfessionals.forEach(p => {
    const id = String(p['Id. Empresa']);
    if (!profMap.has(id)) profMap.set(id, []);
    profMap.get(id)?.push(p);
  });

  const ecoMap = new Map<string, RawEconomicData[]>();
  rawEconomics.forEach(e => {
    const id = String(e['Id. Empresa']);
    if (!ecoMap.has(id)) ecoMap.set(id, []);
    // Normalize generic economics
    e['Ventas'] = (Number(e['Ventas']) || 0) * 1_000_000;
    e['Inversión Realizada'] = (Number(e['Inversión Realizada']) || 0) * 1_000_000;
    e['Inversión Prevista'] = (Number(e['Inversión Prevista']) || 0) * 1_000_000;
    ecoMap.get(id)?.push(e);
  });

  let missingWebs = 0;
  let missingEmails = 0;
  
  const sectorCounts: Record<string, number> = {};
  const provinceCounts: Record<string, number> = {};
  const sizeCounts: Record<string, number> = {};
  const materialCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};

  let ppwrHighImpact = 0;
  let ppwrNeutral = 0;
  let ppwrOpportunity = 0;

  rawCompanies.forEach(row => {
    const id = String(row['Id. Empresa']);
    if (seenIds.has(id)) { duplicates++; return; }
    seenIds.add(id);

    const sales = (Number(row['Ventas 2024']) || 0) * 1_000_000;
    const employees = Number(row['Empleo']) || 0;
    const inv24 = (Number(row['Inversión 2024']) || 0) * 1_000_000;
    const inv25 = (Number(row['Inversión 2025']) || 0) * 1_000_000;

    const normalizedName = normalizeName(row['Razón Social']);
    const segmentation = inferSegmentation(row, sales, employees);
    
    // Stats
    sectorCounts[segmentation.primarySector] = (sectorCounts[segmentation.primarySector] || 0) + 1;
    provinceCounts[segmentation.province] = (provinceCounts[segmentation.province] || 0) + 1;
    sizeCounts[segmentation.sizeLabel] = (sizeCounts[segmentation.sizeLabel] || 0) + 1;
    materialCounts[segmentation.material] = (materialCounts[segmentation.material] || 0) + 1;
    typeCounts[segmentation.packagingType] = (typeCounts[segmentation.packagingType] || 0) + 1;

    if (!row.Web) missingWebs++;
    if (!row.Email) missingEmails++;

    const score = calculateGenericScore(row, sales, employees, inv24, inv25, !!row.Web, !!row.Email);
    const ppwr = analyzePPWR(row, segmentation); // Pass segmentation now

    if (ppwr.isRelevant) {
      if (ppwr.impactRatio <= -2) ppwrHighImpact++;
      else if (ppwr.impactRatio >= 2) ppwrOpportunity++;
      else ppwrNeutral++;
    }

    processed.push({
      ...row,
      'Ventas 2024': sales,
      'Inversión 2024': inv24,
      'Inversión 2025': inv25,
      normalizedName,
      segmentation,
      score,
      ppwr,
      professionals: profMap.get(id) || [],
      economicHistory: ecoMap.get(id) || []
    });
  });

  processed.sort((a, b) => b.score.total - a.score.total);

  return {
    processed,
    stats: {
      totalCompanies: processed.length,
      totalProfessionals: rawProfessionals.length,
      duplicatesRemoved: duplicates,
      missingWebsites: missingWebs,
      missingEmails: missingEmails,
      topSectors: sectorCounts,
      topProvinces: provinceCounts,
      sizeDistribution: sizeCounts,
      materialDistribution: materialCounts,
      typeDistribution: typeCounts,
      ppwrStats: {
        highImpact: ppwrHighImpact,
        neutral: ppwrNeutral,
        opportunity: ppwrOpportunity
      }
    }
  };
};