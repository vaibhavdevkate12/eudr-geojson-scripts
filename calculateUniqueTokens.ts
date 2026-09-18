import * as fs from 'fs';
import * as path from 'path';
import * as turf from '@turf/turf';
import * as crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDirName = process.argv[2] || 'geojson';
const GEOJSON_DIR = path.resolve(__dirname, targetDirName);
const reportFileName = targetDirName === 'geojson' ? 'unique_token_estimation_report.txt' : `unique_token_estimation_report_${targetDirName}.txt`;
const REPORT_FILE = path.join(__dirname, reportFileName);

function getFeaturesList(geojson: any): any[] {
  if (!geojson || typeof geojson !== 'object') return [];
  if (geojson.type === 'FeatureCollection') {
    return Array.isArray(geojson.features) ? geojson.features : [];
  }
  if (geojson.type === 'Feature') {
    return [geojson];
  }
  const geomTypes = ['Point', 'MultiPoint', 'Polygon', 'MultiPolygon', 'LineString', 'MultiLineString', 'GeometryCollection'];
  if (geomTypes.includes(geojson.type)) {
    return [{
      type: 'Feature',
      properties: geojson.properties || {},
      geometry: geojson
    }];
  }
  return [];
}

function roundCoord(c: any): any {
  if (typeof c === 'number') {
    return Math.round(c * 1000000) / 1000000;
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

function getNormalizedGeometry(geom: any): any {
  if (!geom || typeof geom !== 'object') return null;
  const geomType = geom.type;
  let coords = geom.coordinates;
  
  coords = roundCoord(coords);
  coords = cleanConsecutiveDuplicates(coords, geomType);
  
  return {
    type: geomType,
    coordinates: coords
  };
}

function normalizeProperties(properties: any): any {
  if (!properties || typeof properties !== 'object') return {};
  const normalized: any = {};
  const expectedKeys = ['ProducerName', 'ProducerCountry', 'ProductionPlace', 'Area'];
  
  for (const key of Object.keys(properties)) {
    const trimmedKey = key.trim();
    const matchedKey = expectedKeys.find(ek => ek.toLowerCase() === trimmedKey.toLowerCase());
    if (matchedKey) {
      let val = properties[key];
      if (typeof val === 'string') {
        val = val.trim();
      }
      if (matchedKey === 'Area') {
        if (typeof val === 'string') {
          const parsed = parseFloat(val);
          if (!isNaN(parsed)) {
            val = parsed;
          }
        }
      } else if (matchedKey === 'ProducerCountry') {
        if (typeof val === 'string') {
          val = val.toUpperCase();
        }
      }
      normalized[matchedKey] = val;
    } else {
      normalized[key] = properties[key];
    }
  }
  return normalized;
}

function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

interface UniqueFeatureEntry {
  hash: string;
  type: string;
  geometry: any;
  properties: any;
  sourceFiles: Set<string>;
  appearanceCount: number;
}

function runUniqueTokenEstimation() {
  console.log(`Starting unique token estimation analysis for files in: ${GEOJSON_DIR}`);
  
  if (!fs.existsSync(GEOJSON_DIR)) {
    console.error(`Error: Directory not found: ${GEOJSON_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(GEOJSON_DIR).filter(file => file.endsWith('.geojson') || file.endsWith('.json'));
  console.log(`Found ${files.length} geojson files to analyze.\n`);

  const geometryUniqueMap = new Map<string, UniqueFeatureEntry>();
  const fullUniqueMap = new Map<string, UniqueFeatureEntry>();

  let totalRawFeaturesProcessed = 0;
  let fileCount = 0;

  for (const file of files) {
    const filePath = path.join(GEOJSON_DIR, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const geojson = JSON.parse(content);
      const features = getFeaturesList(geojson);
      fileCount++;

      for (const feature of features) {
        if (!feature || !feature.geometry) continue;
        
        totalRawFeaturesProcessed++;
        
        const normGeom = getNormalizedGeometry(feature.geometry);
        if (!normGeom) continue;
        
        const normProps = normalizeProperties(feature.properties);
        
        // Definition 1: Geometry-Only Hash
        const geomHashKey = sha256(JSON.stringify(normGeom));
        if (!geometryUniqueMap.has(geomHashKey)) {
          geometryUniqueMap.set(geomHashKey, {
            hash: geomHashKey,
            type: normGeom.type,
            geometry: normGeom,
            properties: normProps,
            sourceFiles: new Set<string>(),
            appearanceCount: 0
          });
        }
        const geomEntry = geometryUniqueMap.get(geomHashKey)!;
        geomEntry.sourceFiles.add(file);
        geomEntry.appearanceCount++;

        // Definition 2: Geometry + Properties Hash
        const fullHashKey = sha256(JSON.stringify({ geometry: normGeom, properties: normProps }));
        if (!fullUniqueMap.has(fullHashKey)) {
          fullUniqueMap.set(fullHashKey, {
            hash: fullHashKey,
            type: normGeom.type,
            geometry: normGeom,
            properties: normProps,
            sourceFiles: new Set<string>(),
            appearanceCount: 0
          });
        }
        const fullEntry = fullUniqueMap.get(fullHashKey)!;
        fullEntry.sourceFiles.add(file);
        fullEntry.appearanceCount++;
      }
    } catch (err: any) {
      console.error(`Error processing file ${file}: ${err.message}`);
    }
  }

  console.log(`Finished scanning ${fileCount} files.`);
  console.log(`Total features parsed across all files: ${totalRawFeaturesProcessed}`);
  console.log(`Unique features (Geometry-Only): ${geometryUniqueMap.size}`);
  console.log(`Unique features (Geometry + Properties): ${fullUniqueMap.size}\n`);

  generateReport(geometryUniqueMap, fullUniqueMap, fileCount, totalRawFeaturesProcessed);
}

interface AnalysisResults {
  pointCount: number;
  polygonCount: number;
  
  totalDeclaredAreaPoints: number;
  totalDeclaredAreaPolygons: number;
  declaredTokensPoints: number;
  declaredTokensPolygons: number;
  
  polygonSmallCountDec: number;
  polygonLargeCountDec: number;
  
  totalCalculatedAreaPolygons: number;
  calculatedTokensPolygons: number;
  
  polygonSmallCountCalc: number;
  polygonLargeCountCalc: number;
  
  totalDecArea: number;
  totalCalcArea: number;
  totalBilledTokensDec: number;
  totalBilledTokensCalc: number;
}

function analyzeUniqueSet(uniqueMap: Map<string, UniqueFeatureEntry>): AnalysisResults {
  let pointCount = 0;
  let polygonCount = 0;
  
  let totalDeclaredAreaPoints = 0;
  let totalDeclaredAreaPolygons = 0;
  let declaredTokensPoints = 0;
  let declaredTokensPolygons = 0;
  
  let polygonSmallCountDec = 0;
  let polygonLargeCountDec = 0;
  
  let totalCalculatedAreaPolygons = 0;
  let calculatedTokensPolygons = 0;
  
  let polygonSmallCountCalc = 0;
  let polygonLargeCountCalc = 0;

  for (const entry of uniqueMap.values()) {
    const geomType = entry.type;
    let areaDec = 0;
    if (entry.properties && entry.properties.Area !== undefined && entry.properties.Area !== null) {
      const rawArea = entry.properties.Area;
      if (typeof rawArea === 'number') {
        areaDec = rawArea;
      }
    } else if (geomType === 'Point' || geomType === 'MultiPoint') {
      areaDec = 4; // Default to 4 hectares if not provided
    }
    
    if (geomType === 'Point' || geomType === 'MultiPoint') {
      pointCount++;
      totalDeclaredAreaPoints += areaDec;
      // if (areaDec < 0.03) {
      //   declaredTokensPoints += 4;
      // } else {
      //   declaredTokensPoints += Math.ceil(areaDec);
      // }

     declaredTokensPoints += Math.ceil(areaDec);

    } else if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
      polygonCount++;
      totalDeclaredAreaPolygons += areaDec;
      
      // Declared Basis
      if (areaDec < 0.03) {
        polygonSmallCountDec++;
        declaredTokensPolygons += 4;
      } else {
        polygonLargeCountDec++;
        declaredTokensPolygons += Math.ceil(areaDec);
      }
      
      // Calculated Basis using Turf
      let geomAreaHa = 0;
      try {
        const featureObj = {
          type: 'Feature',
          properties: {},
          geometry: entry.geometry
        };
        const sqMeters = turf.area(featureObj as any);
        geomAreaHa = sqMeters / 10000;
      } catch (err: any) {
        // Turf calculation failed
      }
      totalCalculatedAreaPolygons += geomAreaHa;
      
      if (geomAreaHa < 0.03) {
        polygonSmallCountCalc++;
        calculatedTokensPolygons += 4;
      } else {
        polygonLargeCountCalc++;
        calculatedTokensPolygons += Math.ceil(geomAreaHa);
      }
    }
  }

  const totalDecArea = totalDeclaredAreaPoints + totalDeclaredAreaPolygons;
  const totalCalcArea = totalDeclaredAreaPoints + totalCalculatedAreaPolygons;
  const totalBilledTokensDec = declaredTokensPoints + declaredTokensPolygons;
  const totalBilledTokensCalc = declaredTokensPoints + calculatedTokensPolygons;

  return {
    pointCount,
    polygonCount,
    totalDeclaredAreaPoints,
    totalDeclaredAreaPolygons,
    declaredTokensPoints,
    declaredTokensPolygons,
    polygonSmallCountDec,
    polygonLargeCountDec,
    totalCalculatedAreaPolygons,
    calculatedTokensPolygons,
    polygonSmallCountCalc,
    polygonLargeCountCalc,
    totalDecArea,
    totalCalcArea,
    totalBilledTokensDec,
    totalBilledTokensCalc
  };
}

function generateReport(
  geometryUniqueMap: Map<string, UniqueFeatureEntry>,
  fullUniqueMap: Map<string, UniqueFeatureEntry>,
  fileCount: number,
  totalRawFeaturesProcessed: number
) {
  const INR_RATE = 110;

  const geomResults = analyzeUniqueSet(geometryUniqueMap);
  const fullResults = analyzeUniqueSet(fullUniqueMap);

  const reportLines: string[] = [];

  reportLines.push('================================================================================');
  reportLines.push('GLOBAL UNIQUE FEATURES ANALYSIS & TOKEN ESTIMATION REPORT');
  reportLines.push(`Date: ${new Date().toISOString()}`);
  reportLines.push(`Total Files (Submissions) Scanned: ${fileCount}`);
  reportLines.push(`Total Raw Features Processed: ${totalRawFeaturesProcessed}`);
  reportLines.push('================================================================================\n');

  // --- PART 1 ---
  reportLines.push('================================================================================');
  reportLines.push('PART 1: GEOMETRY-ONLY UNIQUENESS ANALYSIS');
  reportLines.push('(Deduplication is based purely on physical geometry coordinates, rounded to 6 decimals)');
  reportLines.push('================================================================================');
  reportLines.push(`Total Unique Features: ${geometryUniqueMap.size} (Points: ${geomResults.pointCount}, Polygons: ${geomResults.polygonCount})`);
  reportLines.push('');
  reportLines.push(`GLOBAL FEATURE BREAKDOWN:`);
  reportLines.push(`- Point Features (billed similar to polygon based on area): ${geomResults.pointCount}`);
  reportLines.push(`- Polygon Features: ${geomResults.polygonCount}`);
  reportLines.push(`  * Declared Basis:   < 0.03 ha: ${geomResults.polygonSmallCountDec} | >= 0.03 ha: ${geomResults.polygonLargeCountDec}`);
  reportLines.push(`  * Calculated Basis: < 0.03 ha: ${geomResults.polygonSmallCountCalc} | >= 0.03 ha: ${geomResults.polygonLargeCountCalc}`);
  reportLines.push('');
  reportLines.push(`1. DECLARED AREA BASIS (Original properties.Area):`);
  reportLines.push(`   * Total Hectares: ${geomResults.totalDecArea.toFixed(4)} ha`);
  reportLines.push(`   * Total Tokens: ${geomResults.totalBilledTokensDec} (Points: ${geomResults.declaredTokensPoints}, Polygons < 0.03 ha: ${geomResults.polygonSmallCountDec * 4}, Polygons >= 0.03 ha: ${geomResults.declaredTokensPolygons - (geomResults.polygonSmallCountDec * 4)})`);
  reportLines.push(`   * Total Cost: €${geomResults.totalBilledTokensDec.toFixed(2)} (Euros)`);
  reportLines.push(`   * Total Cost: ₹${(geomResults.totalBilledTokensDec * INR_RATE).toFixed(2)} (INR)`);
  reportLines.push('');
  reportLines.push(`2. GEOMETRY CALCULATED BASIS (calculated using Turf + original point areas):`);
  reportLines.push(`   * Total Hectares: ${geomResults.totalCalcArea.toFixed(4)} ha`);
  reportLines.push(`   * Total Tokens: ${geomResults.totalBilledTokensCalc} (Points: ${geomResults.declaredTokensPoints}, Polygons < 0.03 ha: ${geomResults.polygonSmallCountCalc * 4}, Polygons >= 0.03 ha: ${geomResults.calculatedTokensPolygons - (geomResults.polygonSmallCountCalc * 4)})`);
  reportLines.push(`   * Total Cost: €${geomResults.totalBilledTokensCalc.toFixed(2)} (Euros)`);
  reportLines.push(`   * Total Cost: ₹${(geomResults.totalBilledTokensCalc * INR_RATE).toFixed(2)} (INR)`);
  reportLines.push('================================================================================\n');

  // --- PART 2 ---
  reportLines.push('================================================================================');
  reportLines.push('PART 2: GEOMETRY + PROPERTIES UNIQUENESS ANALYSIS');
  reportLines.push('(Deduplication is based on coordinates (rounded to 6 decimals) AND properties matching)');
  reportLines.push('================================================================================');
  reportLines.push(`Total Unique Features: ${fullUniqueMap.size} (Points: ${fullResults.pointCount}, Polygons: ${fullResults.polygonCount})`);
  reportLines.push('');
  reportLines.push(`GLOBAL FEATURE BREAKDOWN:`);
  reportLines.push(`- Point Features (billed similar to polygon based on area): ${fullResults.pointCount}`);
  reportLines.push(`- Polygon Features: ${fullResults.polygonCount}`);
  reportLines.push(`  * Declared Basis:   < 0.03 ha: ${fullResults.polygonSmallCountDec} | >= 0.03 ha: ${fullResults.polygonLargeCountDec}`);
  reportLines.push(`  * Calculated Basis: < 0.03 ha: ${fullResults.polygonSmallCountCalc} | >= 0.03 ha: ${fullResults.polygonLargeCountCalc}`);
  reportLines.push('');
  reportLines.push(`1. DECLARED AREA BASIS (Original properties.Area):`);
  reportLines.push(`   * Total Hectares: ${fullResults.totalDecArea.toFixed(4)} ha`);
  reportLines.push(`   * Total Tokens: ${fullResults.totalBilledTokensDec} (Points: ${fullResults.declaredTokensPoints}, Polygons < 0.03 ha: ${fullResults.polygonSmallCountDec * 4}, Polygons >= 0.03 ha: ${fullResults.declaredTokensPolygons - (fullResults.polygonSmallCountDec * 4)})`);
  reportLines.push(`   * Total Cost: €${fullResults.totalBilledTokensDec.toFixed(2)} (Euros)`);
  reportLines.push(`   * Total Cost: ₹${(fullResults.totalBilledTokensDec * INR_RATE).toFixed(2)} (INR)`);
  reportLines.push('');
  reportLines.push(`2. GEOMETRY CALCULATED BASIS (calculated using Turf + original point areas):`);
  reportLines.push(`   * Total Hectares: ${fullResults.totalCalcArea.toFixed(4)} ha`);
  reportLines.push(`   * Total Tokens: ${fullResults.totalBilledTokensCalc} (Points: ${fullResults.declaredTokensPoints}, Polygons < 0.03 ha: ${fullResults.polygonSmallCountCalc * 4}, Polygons >= 0.03 ha: ${fullResults.calculatedTokensPolygons - (fullResults.polygonSmallCountCalc * 4)})`);
  reportLines.push(`   * Total Cost: €${fullResults.totalBilledTokensCalc.toFixed(2)} (Euros)`);
  reportLines.push(`   * Total Cost: ₹${(fullResults.totalBilledTokensCalc * INR_RATE).toFixed(2)} (INR)`);
  reportLines.push('================================================================================\n');

  // --- PART 3 ---
  reportLines.push('================================================================================');
  reportLines.push('PART 3: CROSS-FILE GEOMETRY DUPLICATION DETAIL');
  reportLines.push('================================================================================');
  
  // Find geometry-only duplicates
  const dupEntries = Array.from(geometryUniqueMap.values())
    .filter(entry => entry.sourceFiles.size > 1)
    .sort((a, b) => b.sourceFiles.size - a.sourceFiles.size);

  reportLines.push(`Total duplicate geometries appearing in more than 1 file: ${dupEntries.length}\n`);

  if (dupEntries.length > 0) {
    reportLines.push('Top duplicated geometries (up to 50 listed):');
    dupEntries.slice(0, 50).forEach((entry, idx) => {
      const filesList = Array.from(entry.sourceFiles).join(', ');
      const desc = entry.properties.ProductionPlace 
        ? `ProductionPlace: ${entry.properties.ProductionPlace} (Producer: ${entry.properties.ProducerName || 'Unknown'})` 
        : `Type: ${entry.type}`;
      reportLines.push(`${idx + 1}. ${desc}`);
      reportLines.push(`   - Hash: ${entry.hash}`);
      reportLines.push(`   - Found in ${entry.sourceFiles.size} files: [${filesList}]`);
      reportLines.push(`   - Total raw occurrences: ${entry.appearanceCount}`);
      reportLines.push('');
    });
  } else {
    reportLines.push('No coordinate duplicates found across different files.');
  }
  reportLines.push('================================================================================');

  const finalOutput = reportLines.join('\n');
  
  // Print PART 1 and PART 2 summaries to console
  const consoleSummary = [
    '================================================================================',
    'AGGREGATE SUMMARY (GEOMETRY-ONLY UNIQUENESS)',
    '================================================================================',
    `Total Files Scanned: ${fileCount}`,
    `Total Unique Features: ${geometryUniqueMap.size} (Points: ${geomResults.pointCount}, Polygons: ${geomResults.polygonCount})`,
    `Declared Area: ${geomResults.totalDecArea.toFixed(4)} ha | Tokens: ${geomResults.totalBilledTokensDec} | Cost: €${geomResults.totalBilledTokensDec.toFixed(2)} / ₹${(geomResults.totalBilledTokensDec * INR_RATE).toFixed(2)}`,
    `Calculated Area: ${geomResults.totalCalcArea.toFixed(4)} ha | Tokens: ${geomResults.totalBilledTokensCalc} | Cost: €${geomResults.totalBilledTokensCalc.toFixed(2)} / ₹${(geomResults.totalBilledTokensCalc * INR_RATE).toFixed(2)}`,
    '',
    '================================================================================',
    'AGGREGATE SUMMARY (GEOMETRY + PROPERTIES UNIQUENESS)',
    '================================================================================',
    `Total Unique Features: ${fullUniqueMap.size} (Points: ${fullResults.pointCount}, Polygons: ${fullResults.polygonCount})`,
    `Declared Area: ${fullResults.totalDecArea.toFixed(4)} ha | Tokens: ${fullResults.totalBilledTokensDec} | Cost: €${fullResults.totalBilledTokensDec.toFixed(2)} / ₹${(fullResults.totalBilledTokensDec * INR_RATE).toFixed(2)}`,
    `Calculated Area: ${fullResults.totalCalcArea.toFixed(4)} ha | Tokens: ${fullResults.totalBilledTokensCalc} | Cost: €${fullResults.totalBilledTokensCalc.toFixed(2)} / ₹${(fullResults.totalBilledTokensCalc * INR_RATE).toFixed(2)}`,
    '================================================================================',
  ].join('\n');

  console.log(consoleSummary);

  // Write report to file
  fs.writeFileSync(REPORT_FILE, finalOutput, 'utf8');
  console.log(`\nDetailed unique token analysis report written to: ${REPORT_FILE}`);
}

runUniqueTokenEstimation();
