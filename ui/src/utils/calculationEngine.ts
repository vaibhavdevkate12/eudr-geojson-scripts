import * as turf from '@turf/turf';

export interface FileInputData {
  name: string;
  content: string;
  geojson?: any;
  error?: string;
}

export interface UniqueFeatureEntry {
  geometryHash: string;
  fullHash: string;
  firstSeenFile: string;
  featureIndex: number;
  featureType: string; // 'Point' | 'Polygon' | 'MultiPolygon' etc.
  declaredAreaHa: number;
  calculatedAreaHa: number;
  declaredTokens: number;
  calculatedTokens: number;
  properties: any;
  duplicatesCount: number;
  duplicateSourceFiles: string[];
}

export interface CategorySummary {
  totalUniqueFeatures: number;
  pointCount: number;
  polygonCount: number;
  declaredAreaHa: number;
  declaredTokens: number;
  declaredCostEur: number;
  declaredCostInr: number;
  calculatedAreaHa: number;
  calculatedTokens: number;
  calculatedCostEur: number;
  calculatedCostInr: number;
  smallPolygonCountDeclared: number;
  largePolygonCountDeclared: number;
  smallPolygonCountCalculated: number;
  largePolygonCountCalculated: number;
}

export interface CalculationReport {
  totalFilesScanned: number;
  totalRawFeaturesProcessed: number;
  geometryOnly: CategorySummary & { uniqueEntries: UniqueFeatureEntry[] };
  geometryAndProperties: CategorySummary & { uniqueEntries: UniqueFeatureEntry[] };
}

// 6-decimal rounding
function roundCoord(c: any): any {
  if (typeof c === 'number') {
    return Math.round(c * 1e6) / 1e6;
  }
  if (Array.isArray(c)) {
    return c.map(roundCoord);
  }
  return c;
}

function cleanConsecutiveDuplicates(coordinates: any, type: string): any {
  if (!coordinates || !Array.isArray(coordinates)) return coordinates;
  
  if (type === 'Polygon') {
    return coordinates.map((ring: any) => {
      if (!Array.isArray(ring)) return ring;
      const cleanRing: number[][] = [];
      for (const curr of ring) {
        if (!Array.isArray(curr) || curr.length < 2) continue;
        if (cleanRing.length === 0) {
          cleanRing.push(curr);
          continue;
        }
        const prev = cleanRing[cleanRing.length - 1];
        if (curr[0] === prev[0] && curr[1] === prev[1]) {
          continue;
        }
        cleanRing.push(curr);
      }
      return cleanRing;
    });
  }

  if (type === 'MultiPolygon') {
    return coordinates.map((poly: any) => {
      if (!Array.isArray(poly)) return poly;
      return poly.map((ring: any) => {
        if (!Array.isArray(ring)) return ring;
        const cleanRing: number[][] = [];
        for (const curr of ring) {
          if (!Array.isArray(curr) || curr.length < 2) continue;
          if (cleanRing.length === 0) {
            cleanRing.push(curr);
            continue;
          }
          const prev = cleanRing[cleanRing.length - 1];
          if (curr[0] === prev[0] && curr[1] === prev[1]) {
            continue;
          }
          cleanRing.push(curr);
        }
        return cleanRing;
      });
    });
  }

  return coordinates;
}

function normalizeGeometry(geometry: any): any {
  if (!geometry) return null;
  const roundedCoords = roundCoord(geometry.coordinates);
  const cleanedCoords = cleanConsecutiveDuplicates(roundedCoords, geometry.type);
  return {
    type: geometry.type,
    coordinates: cleanedCoords,
  };
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(36);
}

function getFeaturesList(geojson: any): any[] {
  if (!geojson || typeof geojson !== 'object') return [];
  if (geojson.type === 'FeatureCollection') {
    return Array.isArray(geojson.features) ? geojson.features : [];
  }
  if (geojson.type === 'Feature') {
    return [geojson];
  }
  const geomTypes = ['Point', 'MultiPoint', 'Polygon', 'MultiPolygon', 'LineString', 'MultiLineString'];
  if (geomTypes.includes(geojson.type)) {
    return [{
      type: 'Feature',
      properties: geojson.properties || {},
      geometry: geojson
    }];
  }
  return [];
}

function calculateTokensForArea(areaHa: number, geomType: string): number {
  if (geomType === 'Point') {
    return Math.max(1, Math.ceil(areaHa));
  }
  // Polygon rules
  if (areaHa < 0.03) {
    return 1;
  }
  return Math.max(1, Math.ceil(areaHa));
}

function getDeclaredArea(properties: any): number {
  if (!properties || typeof properties !== 'object') return 0;
  const areaVal = properties.Area || properties.area || properties.AREA;
  if (typeof areaVal === 'number' && !isNaN(areaVal)) {
    return areaVal;
  }
  if (typeof areaVal === 'string') {
    const parsed = parseFloat(areaVal);
    if (!isNaN(parsed)) return parsed;
  }
  return 0;
}

function computeTurfAreaHa(feature: any): number {
  try {
    const geom = feature.geometry;
    if (!geom) return 0;
    if (geom.type === 'Point' || geom.type === 'MultiPoint') {
      return getDeclaredArea(feature.properties);
    }
    const areaSqMeters = turf.area(feature);
    return areaSqMeters / 10000.0;
  } catch (err) {
    return getDeclaredArea(feature.properties);
  }
}

export function runCalculation(files: FileInputData[], inrRate: number = 110): CalculationReport {
  const geometryUniqueMap = new Map<string, UniqueFeatureEntry>();
  const fullUniqueMap = new Map<string, UniqueFeatureEntry>();

  let totalRawFeaturesProcessed = 0;
  let fileCount = 0;

  for (const fileItem of files) {
    if (!fileItem.geojson) continue;
    fileCount++;
    const features = getFeaturesList(fileItem.geojson);

    features.forEach((feature, idx) => {
      totalRawFeaturesProcessed++;
      const normGeom = normalizeGeometry(feature.geometry);
      const geomStr = JSON.stringify(normGeom);
      const geomHash = simpleHash(geomStr);

      const propsStr = JSON.stringify(feature.properties || {});
      const fullHash = simpleHash(geomStr + '|' + propsStr);

      const geomType = normGeom ? normGeom.type : 'Unknown';
      const declaredArea = getDeclaredArea(feature.properties);
      const calcArea = computeTurfAreaHa(feature);

      const declaredTokens = calculateTokensForArea(declaredArea, geomType);
      const calculatedTokens = calculateTokensForArea(calcArea, geomType);

      // Geometry-only uniqueness
      if (!geometryUniqueMap.has(geomHash)) {
        geometryUniqueMap.set(geomHash, {
          geometryHash: geomHash,
          fullHash,
          firstSeenFile: fileItem.name,
          featureIndex: idx,
          featureType: geomType,
          declaredAreaHa: declaredArea,
          calculatedAreaHa: calcArea,
          declaredTokens,
          calculatedTokens,
          properties: feature.properties || {},
          duplicatesCount: 0,
          duplicateSourceFiles: [fileItem.name],
        });
      } else {
        const existing = geometryUniqueMap.get(geomHash)!;
        existing.duplicatesCount++;
        if (!existing.duplicateSourceFiles.includes(fileItem.name)) {
          existing.duplicateSourceFiles.push(fileItem.name);
        }
      }

      // Geometry + Properties uniqueness
      if (!fullUniqueMap.has(fullHash)) {
        fullUniqueMap.set(fullHash, {
          geometryHash: geomHash,
          fullHash,
          firstSeenFile: fileItem.name,
          featureIndex: idx,
          featureType: geomType,
          declaredAreaHa: declaredArea,
          calculatedAreaHa: calcArea,
          declaredTokens,
          calculatedTokens,
          properties: feature.properties || {},
          duplicatesCount: 0,
          duplicateSourceFiles: [fileItem.name],
        });
      } else {
        const existing = fullUniqueMap.get(fullHash)!;
        existing.duplicatesCount++;
        if (!existing.duplicateSourceFiles.includes(fileItem.name)) {
          existing.duplicateSourceFiles.push(fileItem.name);
        }
      }
    });
  }

  const geomSummary = buildCategorySummary(Array.from(geometryUniqueMap.values()), inrRate);
  const fullSummary = buildCategorySummary(Array.from(fullUniqueMap.values()), inrRate);

  return {
    totalFilesScanned: fileCount,
    totalRawFeaturesProcessed,
    geometryOnly: { ...geomSummary, uniqueEntries: Array.from(geometryUniqueMap.values()) },
    geometryAndProperties: { ...fullSummary, uniqueEntries: Array.from(fullUniqueMap.values()) },
  };
}

function buildCategorySummary(entries: UniqueFeatureEntry[], inrRate: number): CategorySummary {
  let pointCount = 0;
  let polygonCount = 0;

  let declaredAreaHa = 0;
  let declaredTokens = 0;
  let smallPolygonCountDeclared = 0;
  let largePolygonCountDeclared = 0;

  let calculatedAreaHa = 0;
  let calculatedTokens = 0;
  let smallPolygonCountCalculated = 0;
  let largePolygonCountCalculated = 0;

  for (const entry of entries) {
    if (entry.featureType === 'Point' || entry.featureType === 'MultiPoint') {
      pointCount++;
    } else {
      polygonCount++;
    }

    // Declared
    declaredAreaHa += entry.declaredAreaHa;
    declaredTokens += entry.declaredTokens;
    if (entry.declaredAreaHa < 0.03) {
      smallPolygonCountDeclared++;
    } else {
      largePolygonCountDeclared++;
    }

    // Calculated
    calculatedAreaHa += entry.calculatedAreaHa;
    calculatedTokens += entry.calculatedTokens;
    if (entry.calculatedAreaHa < 0.03) {
      smallPolygonCountCalculated++;
    } else {
      largePolygonCountCalculated++;
    }
  }

  const declaredCostEur = declaredTokens * 1.0;
  const declaredCostInr = Math.round(declaredCostEur * inrRate * 100) / 100;

  const calculatedCostEur = calculatedTokens * 1.0;
  const calculatedCostInr = Math.round(calculatedCostEur * inrRate * 100) / 100;

  return {
    totalUniqueFeatures: entries.length,
    pointCount,
    polygonCount,
    declaredAreaHa: Math.round(declaredAreaHa * 10000) / 10000,
    declaredTokens,
    declaredCostEur,
    declaredCostInr,
    calculatedAreaHa: Math.round(calculatedAreaHa * 10000) / 10000,
    calculatedTokens,
    calculatedCostEur,
    calculatedCostInr,
    smallPolygonCountDeclared,
    largePolygonCountDeclared,
    smallPolygonCountCalculated,
    largePolygonCountCalculated,
  };
}
