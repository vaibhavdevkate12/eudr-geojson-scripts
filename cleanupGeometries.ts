import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const GEOJSON_DIR = path.join(__dirname, 'geojson');

function cleanGeometry(geom: any): { cleaned: boolean, duplicateVerticesCount: number } {
  if (!geom) return { cleaned: false, duplicateVerticesCount: 0 };
  let cleaned = false;
  let duplicateVerticesCount = 0;

  if (geom.type === 'Polygon') {
    if (Array.isArray(geom.coordinates)) {
      const origCoords = geom.coordinates;
      const newCoords = origCoords.map((ring: any) => {
        if (!Array.isArray(ring)) return ring;
        const cleanRing: number[][] = [];
        let dupCount = 0;
        
        for (let i = 0; i < ring.length; i++) {
          const curr = ring[i];
          if (!Array.isArray(curr) || curr.length < 2) continue;
          if (cleanRing.length === 0) {
            cleanRing.push(curr);
            continue;
          }
          const prev = cleanRing[cleanRing.length - 1];
          if (curr[0] === prev[0] && curr[1] === prev[1]) {
            dupCount++;
            continue;
          }
          cleanRing.push(curr);
        }
        
        // Ensure closed
        if (cleanRing.length > 1) {
          const first = cleanRing[0];
          const last = cleanRing[cleanRing.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
            cleanRing.push([first[0], first[1]]);
            cleaned = true;
          }
        }
        
        if (dupCount > 0) {
          cleaned = true;
          duplicateVerticesCount += dupCount;
        }
        return cleanRing;
      });
      geom.coordinates = newCoords;
    }
  } else if (geom.type === 'MultiPolygon') {
    if (Array.isArray(geom.coordinates)) {
      geom.coordinates.forEach((poly: any, polyIdx: number) => {
        if (Array.isArray(poly)) {
          poly.forEach((ring: any, ringIdx: number) => {
            if (!Array.isArray(ring)) return;
            const cleanRing: number[][] = [];
            let dupCount = 0;
            
            for (let i = 0; i < ring.length; i++) {
              const curr = ring[i];
              if (!Array.isArray(curr) || curr.length < 2) continue;
              if (cleanRing.length === 0) {
                cleanRing.push(curr);
                continue;
              }
              const prev = cleanRing[cleanRing.length - 1];
              if (curr[0] === prev[0] && curr[1] === prev[1]) {
                dupCount++;
                continue;
              }
              cleanRing.push(curr);
            }
            
            // Ensure closed
            if (cleanRing.length > 1) {
              const first = cleanRing[0];
              const last = cleanRing[cleanRing.length - 1];
              if (first[0] !== last[0] || first[1] !== last[1]) {
                cleanRing.push([first[0], first[1]]);
                cleaned = true;
              }
            }
            
            if (dupCount > 0) {
              cleaned = true;
              duplicateVerticesCount += dupCount;
            }
            poly[ringIdx] = cleanRing;
          });
        }
      });
    }
  } else if (geom.type === 'GeometryCollection') {
    if (Array.isArray(geom.geometries)) {
      geom.geometries.forEach((subGeom: any) => {
        const res = cleanGeometry(subGeom);
        if (res.cleaned) cleaned = true;
        duplicateVerticesCount += res.duplicateVerticesCount;
      });
    }
  }

  return { cleaned, duplicateVerticesCount };
}

function runCleanup() {
  console.log(`Starting cleanup of duplicate coordinates and features in: ${GEOJSON_DIR}`);

  if (!fs.existsSync(GEOJSON_DIR)) {
    console.error(`Error: Directory not found: ${GEOJSON_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(GEOJSON_DIR).filter(file => file.endsWith('.geojson'));
  console.log(`Found ${files.length} geojson files to scan.\n`);

  let totalDupFeaturesRemoved = 0;
  let totalDupVerticesRemoved = 0;
  let modifiedFilesCount = 0;

  for (const file of files) {
    const filePath = path.join(GEOJSON_DIR, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const geojson = JSON.parse(content);
      let fileCleaned = false;

      if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
        const seenFeatures = new Set<string>();
        const uniqueFeatures: any[] = [];
        let featureDups = 0;

        for (const feature of geojson.features) {
          if (!feature) continue;

          // Normalize 'Area' property keys (trim and check variations)
          if (feature.properties) {
            for (const key of Object.keys(feature.properties)) {
              const trimmedKey = key.trim();
              if (trimmedKey.toLowerCase() === 'area' && key !== 'Area') {
                feature.properties.Area = feature.properties[key];
                delete feature.properties[key];
                fileCleaned = true;
              }
            }
            
            // Normalize values of properties.Area to number
            if (feature.properties.Area !== undefined && feature.properties.Area !== null) {
              const val = feature.properties.Area;
              if (typeof val === 'string') {
                const parsed = parseFloat(val);
                if (!isNaN(parsed)) {
                  feature.properties.Area = parsed;
                  fileCleaned = true;
                }
              }
            }
          }

          // 1. Clean duplicate coordinates in feature geometry
          if (feature.geometry) {
            const res = cleanGeometry(feature.geometry);
            if (res.cleaned) {
              totalDupVerticesRemoved += res.duplicateVerticesCount;
              fileCleaned = true;
            }
          }

          // 2. Deduplicate features within the file
          const key = JSON.stringify({
            type: feature.type,
            properties: feature.properties,
            geometry: feature.geometry
          });

          if (seenFeatures.has(key)) {
            featureDups++;
          } else {
            seenFeatures.add(key);
            uniqueFeatures.push(feature);
          }
        }

        if (featureDups > 0) {
          geojson.features = uniqueFeatures;
          totalDupFeaturesRemoved += featureDups;
          fileCleaned = true;
        }
      } else if (geojson.type === 'Feature') {
        if (geojson.geometry) {
          const res = cleanGeometry(geojson.geometry);
          if (res.cleaned) {
            totalDupVerticesRemoved += res.duplicateVerticesCount;
            fileCleaned = true;
          }
        }
      } else if (['Polygon', 'MultiPolygon', 'GeometryCollection'].includes(geojson.type)) {
        const res = cleanGeometry(geojson);
        if (res.cleaned) {
          totalDupVerticesRemoved += res.duplicateVerticesCount;
          fileCleaned = true;
        }
      }

      if (fileCleaned) {
        fs.writeFileSync(filePath, JSON.stringify(geojson, null, 2), 'utf8');
        modifiedFilesCount++;
        console.log(`Cleaned file: ${file}`);
      }
    } catch (err: any) {
      console.error(`Error processing file ${file}: ${err.message}`);
    }
  }

  console.log('\n==================================================');
  console.log('CLEANUP SUMMARY');
  console.log('==================================================');
  console.log(`Files Analyzed: ${files.length}`);
  console.log(`Files Cleaned/Modified: ${modifiedFilesCount}`);
  console.log(`Duplicate Features Removed: ${totalDupFeaturesRemoved}`);
  console.log(`Duplicate Coordinates Removed: ${totalDupVerticesRemoved}`);
  console.log('==================================================\n');

  console.log('Re-running GeoJSON validation rules...');
  try {
    const stdout = execSync('npx tsx validateAll.ts', { encoding: 'utf8' });
    console.log(stdout);
  } catch (err: any) {
    console.error(`Validation runner failed: ${err.message}`);
  }
}

runCleanup();
