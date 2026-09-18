import * as fs from 'fs';
import * as path from 'path';
import * as turf from '@turf/turf';
import * as crypto from 'crypto';

const targetDirName = process.argv[2] || 'geojson';
const GEOJSON_DIR = path.resolve(__dirname, targetDirName);
const reportFileName = targetDirName === 'geojson' ? 'token_estimation_report.txt' : `token_estimation_report_${targetDirName}.txt`;
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

interface FileSummary {
  fileName: string;
  pointCount: number;
  polygonCount: number;
  
  // Declared Area (from properties.Area)
  polygonSmallCountDec: number; // < 0.03 ha
  polygonLargeCountDec: number; // >= 0.03 ha
  totalDeclaredAreaPoints: number;
  totalDeclaredAreaPolygons: number;
  declaredTokensPoints: number; // sum of (4 for small point/multipoint, Math.ceil(Area) for large point/multipoint)
  declaredTokensPolygons: number; // sum of (4 for small poly, Math.ceil(Area) for large poly)
  
  // Calculated Area (from turf.area)
  polygonSmallCountCalc: number; // < 0.03 ha
  polygonLargeCountCalc: number; // >= 0.03 ha
  totalCalculatedAreaPolygons: number;
  calculatedTokensPolygons: number; // sum of (4 for small poly, Math.ceil(CalculatedArea) for large poly)
  
  // Final Billed Tokens (Declared vs Calculated)
  billedTokensDeclared: number;
  billedTokensCalculated: number;
}

function runTokenEstimation() {
  console.log(`Starting token estimation analysis for files in: ${GEOJSON_DIR}`);
  
  if (!fs.existsSync(GEOJSON_DIR)) {
    console.error(`Error: Directory not found: ${GEOJSON_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(GEOJSON_DIR).filter(file => file.endsWith('.geojson'));
  console.log(`Found ${files.length} geojson files to analyze.\n`);

  const uniqueFiles: string[] = [];
  const seenHashes = new Set<string>();
  let skippedCount = 0;

  for (const file of files) {
    const filePath = path.join(GEOJSON_DIR, file);
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      if (seenHashes.has(hash)) {
        skippedCount++;
      } else {
        seenHashes.add(hash);
        uniqueFiles.push(file);
      }
    } catch (err: any) {
      console.error(`Error hashing file ${file}: ${err.message}`);
      uniqueFiles.push(file);
    }
  }

  console.log(`Analyzing ${uniqueFiles.length} unique files (${skippedCount} duplicates skipped).\n`);

  const summaries: FileSummary[] = [];

  for (const file of uniqueFiles) {
    const filePath = path.join(GEOJSON_DIR, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const geojson = JSON.parse(content);
      
      let pointCount = 0;
      let polygonCount = 0;
      
      let polygonSmallCountDec = 0;
      let polygonLargeCountDec = 0;
      let polygonSmallCountCalc = 0;
      let polygonLargeCountCalc = 0;

      let totalDeclaredAreaPoints = 0;
      let totalDeclaredAreaPolygons = 0;
      let declaredTokensPoints = 0;
      let declaredTokensPolygons = 0;
      
      let totalCalculatedAreaPolygons = 0;
      let calculatedTokensPolygons = 0;

      const features = getFeaturesList(geojson);
      for (const feature of features) {
        if (!feature || !feature.geometry) continue;
        
        const geomType = feature.geometry.type;
        let areaDec = 0;
        if (feature.properties && feature.properties.Area !== undefined && feature.properties.Area !== null) {
          const rawArea = feature.properties.Area;
          if (typeof rawArea === 'number') {
            areaDec = rawArea;
          } else if (typeof rawArea === 'string') {
            const parsed = parseFloat(rawArea);
            if (!isNaN(parsed)) {
              areaDec = parsed;
            }
          }
        } else if (geomType === 'Point' || geomType === 'MultiPoint') {
          areaDec = 4; // Default to 4 hectares if not provided
        }
        
        if (geomType === 'Point' || geomType === 'MultiPoint') {
          pointCount++;
          totalDeclaredAreaPoints += areaDec;
          if (areaDec < 0.03) {
            declaredTokensPoints += 4;
          } else {
            declaredTokensPoints += Math.ceil(areaDec);
          }
        } else if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
          polygonCount++;
          totalDeclaredAreaPolygons += areaDec;
          
          // Rule: if polygon plot less than 0.03 hectare then 4 tokens, else Math.ceil(area)
          if (areaDec < 0.03) {
            polygonSmallCountDec++;
            declaredTokensPolygons += 4;
          } else {
            polygonLargeCountDec++;
            declaredTokensPolygons += Math.ceil(areaDec);
          }
          
          // Calculate area using turf (sq meters to hectares)
          let geomAreaHa = 0;
          try {
            const sqMeters = turf.area(feature as any);
            geomAreaHa = sqMeters / 10000;
          } catch (err: any) {
            console.warn(`Warning: Turf area calculation failed for a feature in ${file}: ${err.message}`);
          }
          totalCalculatedAreaPolygons += geomAreaHa;
          
          // Rule for calculated area
          if (geomAreaHa < 0.03) {
            polygonSmallCountCalc++;
            calculatedTokensPolygons += 4;
          } else {
            polygonLargeCountCalc++;
            calculatedTokensPolygons += Math.ceil(geomAreaHa);
          }
        }
      }
      
      const billedTokensDeclared = declaredTokensPoints + declaredTokensPolygons;
      const billedTokensCalculated = declaredTokensPoints + calculatedTokensPolygons;

      summaries.push({
        fileName: file,
        pointCount,
        polygonCount,
        polygonSmallCountDec,
        polygonLargeCountDec,
        totalDeclaredAreaPoints,
        totalDeclaredAreaPolygons,
        declaredTokensPoints,
        declaredTokensPolygons,
        polygonSmallCountCalc,
        polygonLargeCountCalc,
        totalCalculatedAreaPolygons,
        calculatedTokensPolygons,
        billedTokensDeclared,
        billedTokensCalculated
      });
    } catch (err: any) {
      console.error(`Error processing file ${file}: ${err.message}`);
    }
  }

  // Generate Report and Print Summary
  generateReportAndSummary(summaries, skippedCount);
}

function generateReportAndSummary(summaries: FileSummary[], skippedCount: number) {
  const INR_RATE = 108.8;
  
  let totalPoints = 0;
  let totalPolygons = 0;
  
  // Declared breakdown totals
  let totalPolySmallDec = 0;
  let totalPolyLargeDec = 0;
  let totalDecArea = 0;
  let totalBilledTokensDec = 0;
  
  // Calculated breakdown totals
  let totalPolySmallCalc = 0;
  let totalPolyLargeCalc = 0;
  let totalCalcArea = 0;
  let totalBilledTokensCalc = 0;

  // Detailed Token Distribution Breakdown
  let totalPointsTokens = 0;
  let totalPolySmallTokensDec = 0;
  let totalPolyLargeTokensDec = 0;
  let totalPolySmallTokensCalc = 0;
  let totalPolyLargeTokensCalc = 0;

  const resultsText: string[] = [];

  resultsText.push('================================================================================');
  resultsText.push('DEFORESTATION ANALYSIS TOKEN CONSUMPTION & COST REPORT');
  resultsText.push(`Date: ${new Date().toISOString()}`);
  resultsText.push(`Total Submissions: ${summaries.length}`);
  resultsText.push('================================================================================\n');

  for (const s of summaries) {
    totalPoints += s.pointCount;
    totalPolygons += s.polygonCount;
    
    totalPolySmallDec += s.polygonSmallCountDec;
    totalPolyLargeDec += s.polygonLargeCountDec;
    totalDecArea += s.totalDeclaredAreaPoints + s.totalDeclaredAreaPolygons;
    totalBilledTokensDec += s.billedTokensDeclared;
    
    totalPolySmallCalc += s.polygonSmallCountCalc;
    totalPolyLargeCalc += s.polygonLargeCountCalc;
    totalCalcArea += s.totalDeclaredAreaPoints + s.totalCalculatedAreaPolygons;
    totalBilledTokensCalc += s.billedTokensCalculated;

    totalPointsTokens += s.declaredTokensPoints;
    totalPolySmallTokensDec += s.polygonSmallCountDec * 4;
    totalPolyLargeTokensDec += s.declaredTokensPolygons - (s.polygonSmallCountDec * 4);
    totalPolySmallTokensCalc += s.polygonSmallCountCalc * 4;
    totalPolyLargeTokensCalc += s.calculatedTokensPolygons - (s.polygonSmallCountCalc * 4);

    const fileDecCostEuro = s.billedTokensDeclared;
    const fileDecCostINR = s.billedTokensDeclared * INR_RATE;
    const fileCalcCostEuro = s.billedTokensCalculated;
    const fileCalcCostINR = s.billedTokensCalculated * INR_RATE;

    resultsText.push(`Submission File: ${s.fileName}`);
    resultsText.push(`  - Points Count: ${s.pointCount} | Polygons Count: ${s.polygonCount}`);
    resultsText.push(`  - DECLARED AREA BASIS:`);
    resultsText.push(`    * Total Area: ${(s.totalDeclaredAreaPoints + s.totalDeclaredAreaPolygons).toFixed(4)} ha`);
    resultsText.push(`    * Polygons Breakdown: < 0.03 ha: ${s.polygonSmallCountDec} | >= 0.03 ha: ${s.polygonLargeCountDec}`);
    resultsText.push(`    * Billed Tokens: ${s.billedTokensDeclared} (Points: ${s.declaredTokensPoints}, Polygons: ${s.declaredTokensPolygons})`);
    resultsText.push(`    * Estimated Cost: €${fileDecCostEuro.toFixed(2)} / ₹${fileDecCostINR.toFixed(2)}`);
    resultsText.push(`  - GEOMETRY CALCULATED BASIS:`);
    resultsText.push(`    * Total Area: ${(s.totalDeclaredAreaPoints + s.totalCalculatedAreaPolygons).toFixed(4)} ha`);
    resultsText.push(`    * Polygons Breakdown: < 0.03 ha: ${s.polygonSmallCountCalc} | >= 0.03 ha: ${s.polygonLargeCountCalc}`);
    resultsText.push(`    * Billed Tokens: ${s.billedTokensCalculated} (Points: ${s.declaredTokensPoints}, Polygons: ${s.calculatedTokensPolygons})`);
    resultsText.push(`    * Estimated Cost: €${fileCalcCostEuro.toFixed(2)} / ₹${fileCalcCostINR.toFixed(2)}`);
    resultsText.push('--------------------------------------------------------------------------------');
  }

  const finalSummaryBlock = [
    '================================================================================',
    'AGGREGATE SUMMARY',
    '================================================================================',
    `Total Files (Submissions) Analyzed: ${summaries.length} (${skippedCount} duplicates skipped)`,
    `Total Features: ${totalPoints + totalPolygons} (Points: ${totalPoints}, Polygons: ${totalPolygons})`,
    '',
    `GLOBAL FEATURE COUNTS:`,
    `- Total Point Features (billed similar to polygon based on area): ${totalPoints}`,
    `- Total Polygon Features: ${totalPolygons}`,
    `  * Declared Basis:   < 0.03 ha: ${totalPolySmallDec} | >= 0.03 ha: ${totalPolyLargeDec}`,
    `  * Calculated Basis: < 0.03 ha: ${totalPolySmallCalc} | >= 0.03 ha: ${totalPolyLargeCalc}`,
    '',
    `1. DECLARED AREA BASIS (Original properties.Area):`,
    `   * Total Hectares: ${totalDecArea.toFixed(4)} ha`,
    `   * Total Tokens: ${totalBilledTokensDec} (Points: ${totalPointsTokens}, Polygons < 0.03 ha: ${totalPolySmallTokensDec}, Polygons >= 0.03 ha: ${totalPolyLargeTokensDec})`,
    `   * Total Cost: €${totalBilledTokensDec.toFixed(2)} (Euros)`,
    `   * Total Cost: ₹${(totalBilledTokensDec * INR_RATE).toFixed(2)} (INR)`,
    '',
    `2. GEOMETRY CALCULATED BASIS (calculated using Turf + original point areas):`,
    `   * Total Hectares: ${totalCalcArea.toFixed(4)} ha`,
    `   * Total Tokens: ${totalBilledTokensCalc} (Points: ${totalPointsTokens}, Polygons < 0.03 ha: ${totalPolySmallTokensCalc}, Polygons >= 0.03 ha: ${totalPolyLargeTokensCalc})`,
    `   * Total Cost: €${totalBilledTokensCalc.toFixed(2)} (Euros)`,
    `   * Total Cost: ₹${(totalBilledTokensCalc * INR_RATE).toFixed(2)} (INR)`,
    '================================================================================'
  ].join('\n');

  const finalOutput = finalSummaryBlock + '\n\n' + resultsText.join('\n');

  // Print summary to console
  console.log(finalSummaryBlock);

  // Write report to file
  fs.writeFileSync(REPORT_FILE, finalOutput, 'utf8');
  console.log(`Detailed token analysis written to: ${REPORT_FILE}`);
}

runTokenEstimation();
