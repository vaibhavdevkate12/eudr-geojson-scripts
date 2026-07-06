import * as fs from 'fs';
import * as path from 'path';
import { validateGeoJSON } from './utils/geojsonValidator';

const GEOJSON_DIR = path.join(__dirname, 'geojson');
const OUTPUT_FILE = path.join(__dirname, 'validation_results.txt');

function runValidation() {
  console.log(`Starting GeoJSON validation for files in: ${GEOJSON_DIR}`);
  
  if (!fs.existsSync(GEOJSON_DIR)) {
    console.error(`Error: Directory not found: ${GEOJSON_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(GEOJSON_DIR).filter(file => file.endsWith('.geojson'));
  console.log(`Found ${files.length} geojson files to validate.\n`);

  let passedCount = 0;
  let failedCount = 0;
  const results: string[] = [];

  results.push('==================================================');
  results.push('GEOJSON VALIDATION REPORT');
  results.push(`Date: ${new Date().toISOString()}`);
  results.push(`Total Files Found: ${files.length}`);
  results.push('==================================================\n');

  for (const file of files) {
    const filePath = path.join(GEOJSON_DIR, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const geojson = JSON.parse(content);
      
      const result = validateGeoJSON(geojson);
      
      if (result.valid) {
        passedCount++;
        results.push(`[PASS] ${file}`);
        results.push(`       Features: ${result.summary.totalFeatures}\n`);
      } else {
        failedCount++;
        results.push(`[FAIL] ${file}`);
        results.push(`       Errors (${result.summary.errorCount}):`);
        result.errors.forEach((err, idx) => {
          results.push(`       ${idx + 1}. Path: ${err.path}`);
          results.push(`          Message: ${err.message}`);
          if (err.featureIndex !== undefined) {
            results.push(`          Feature Index: ${err.featureIndex}`);
          }
        });
        results.push('');
      }
    } catch (err: any) {
      failedCount++;
      results.push(`[FAIL] ${file} - Failed to parse/read file`);
      results.push(`       Error: ${err.message}\n`);
    }
  }

  const summaryHeader = [
    '==================================================',
    'SUMMARY',
    '==================================================',
    `Total Files Checked: ${files.length}`,
    `Passed: ${passedCount}`,
    `Failed: ${failedCount}`,
    '==================================================\n'
  ].join('\n');

  const finalOutput = summaryHeader + results.join('\n');

  // Print summary to console
  console.log(summaryHeader);

  // Write detailed results to file
  fs.writeFileSync(OUTPUT_FILE, finalOutput, 'utf8');
  console.log(`Detailed results written to: ${OUTPUT_FILE}`);
}

runValidation();
