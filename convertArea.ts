import * as fs from 'fs';
import * as path from 'path';

const GEOJSON_DIR = path.join(__dirname, 'geojson');

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

function convertAreaFields() {
  console.log(`Starting conversion of 'Area' string to number in: ${GEOJSON_DIR}`);
  if (!fs.existsSync(GEOJSON_DIR)) {
    console.error(`Error: Directory not found: ${GEOJSON_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(GEOJSON_DIR).filter(file => file.endsWith('.geojson'));
  console.log(`Found ${files.length} geojson files to process.`);

  let totalFeaturesUpdated = 0;
  let totalFilesUpdated = 0;

  for (const file of files) {
    const filePath = path.join(GEOJSON_DIR, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const geojson = JSON.parse(content);
      
      let fileUpdated = false;
      const features = getFeaturesList(geojson);
      for (let i = 0; i < features.length; i++) {
        const feature = features[i];
        if (feature && feature.properties && 'Area' in feature.properties) {
          const areaVal = feature.properties.Area;
          if (typeof areaVal === 'string') {
            const numericVal = parseFloat(areaVal);
            if (!isNaN(numericVal)) {
              feature.properties.Area = numericVal;
              totalFeaturesUpdated++;
              fileUpdated = true;
            } else {
              console.warn(`Warning: Could not parse 'Area' value "${areaVal}" as a number at feature index ${i} in file ${file}`);
            }
          }
        }
      }

      if (fileUpdated) {
        fs.writeFileSync(filePath, JSON.stringify(geojson, null, 2), 'utf8');
        totalFilesUpdated++;
      }
    } catch (err: any) {
      console.error(`Error processing file ${file}: ${err.message}`);
    }
  }

  console.log(`\nConversion Completed:`);
  console.log(`- Total features updated: ${totalFeaturesUpdated}`);
  console.log(`- Total files updated: ${totalFilesUpdated}`);
}

convertAreaFields();
