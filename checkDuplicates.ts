import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const GEOJSON_DIR = path.join(__dirname, 'geojson');
const REPORT_FILE = path.join(__dirname, 'duplicate_report.txt');

function checkDuplicates() {
  console.log(`Scanning directory: ${GEOJSON_DIR} for duplicate geojson files...`);
  
  if (!fs.existsSync(GEOJSON_DIR)) {
    console.error(`Error: Directory not found: ${GEOJSON_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(GEOJSON_DIR).filter(file => file.endsWith('.geojson'));
  console.log(`Found ${files.length} geojson files.`);

  const hashToFiles: { [hash: string]: string[] } = {};

  for (const file of files) {
    const filePath = path.join(GEOJSON_DIR, file);
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      
      if (!hashToFiles[hash]) {
        hashToFiles[hash] = [];
      }
      hashToFiles[hash].push(file);
    } catch (err: any) {
      console.error(`Error hashing file ${file}: ${err.message}`);
    }
  }

  const uniqueHashes = Object.keys(hashToFiles);
  const duplicateGroups = uniqueHashes.filter(hash => hashToFiles[hash].length > 1);

  const reportLines: string[] = [];
  reportLines.push('================================================================================');
  reportLines.push('GEOJSON FILE DUPLICATION REPORT');
  reportLines.push(`Date: ${new Date().toISOString()}`);
  reportLines.push('================================================================================\n');

  reportLines.push(`Total Files Checked: ${files.length}`);
  reportLines.push(`Total Unique Files: ${uniqueHashes.length}`);
  reportLines.push(`Total Duplicate Files: ${files.length - uniqueHashes.length}`);
  reportLines.push(`Total Duplicate Groups: ${duplicateGroups.length}\n`);

  if (duplicateGroups.length > 0) {
    reportLines.push('================================================================================');
    reportLines.push('DUPLICATE GROUPS DETAILS');
    reportLines.push('================================================================================\n');

    duplicateGroups.forEach((hash, idx) => {
      reportLines.push(`Group #${idx + 1} (Hash: ${hash}):`);
      hashToFiles[hash].forEach(file => {
        const stats = fs.statSync(path.join(GEOJSON_DIR, file));
        reportLines.push(`  - ${file} (${stats.size} bytes)`);
      });
      reportLines.push('');
    });
  } else {
    reportLines.push('No duplicate files were found! All files have unique contents.');
  }

  const finalOutput = reportLines.join('\n');
  console.log(finalOutput);

  fs.writeFileSync(REPORT_FILE, finalOutput, 'utf8');
  console.log(`Duplication report written to: ${REPORT_FILE}`);
}

checkDuplicates();
