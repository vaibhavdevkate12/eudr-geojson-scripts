import * as turf from '@turf/turf';

export interface ValidationError {
  path: string;
  message: string;
  featureIndex?: number;
}

export interface ValidationResult {
  valid: boolean;
  summary: {
    totalFeatures: number;
    errorCount: number;
  };
  errors: ValidationError[];
}

const isClosed = (ring: number[][]) => {
  if (ring.length < 4) return false;
  const first = ring[0];
  const last = ring[ring.length - 1];
  return first[0] === last[0] && first[1] === last[1];
};

const validatePosition = (pos: any, path: string, errors: ValidationError[], featureIndex: number) => {
  if (!Array.isArray(pos)) {
    errors.push({ path, message: 'Position must be an array of coordinates', featureIndex });
    return false;
  }
  if (pos.length < 2 || pos.length > 3) {
    errors.push({ path, message: 'Position must have at least 2 items (longitude, latitude) and at most 3 items', featureIndex });
    return false;
  }
  const lon = pos[0];
  const lat = pos[1];
  if (typeof lon !== 'number' || isNaN(lon)) {
    errors.push({ path: `${path}[0]`, message: `Longitude must be a number, got ${typeof lon}`, featureIndex });
    return false;
  }
  if (typeof lat !== 'number' || isNaN(lat)) {
    errors.push({ path: `${path}[1]`, message: `Latitude must be a number, got ${typeof lat}`, featureIndex });
    return false;
  }
  if (lon < -180 || lon > 180) {
    errors.push({ path: `${path}[0]`, message: `Longitude must be between -180 and 180, got ${lon}`, featureIndex });
  }
  if (lat < -90 || lat > 90) {
    errors.push({ path: `${path}[1]`, message: `Latitude must be between -90 and 90, got ${lat}`, featureIndex });
  }
  return true;
};

const checkPropertyCasing = (properties: any, path: string, errors: ValidationError[], featureIndex: number) => {
  if (!properties || typeof properties !== 'object') return;
  const expectedKeys = ['ProducerName', 'ProducerCountry', 'ProductionPlace', 'Area'];
  for (const key of Object.keys(properties)) {
    const matchingExpected = expectedKeys.find(
      (ek) => ek.toLowerCase() === key.toLowerCase(),
    );
    if (matchingExpected && matchingExpected !== key) {
      errors.push({
        path: `${path}.${key}`,
        message: `Property name '${key}' is invalid. It must be capitalized exactly as '${matchingExpected}'.`,
        featureIndex,
      });
    }
  }
};

const validateProperties = (properties: any, path: string, errors: ValidationError[], featureIndex: number, geomType?: string) => {
  if (properties === null || properties === undefined) {
    if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
      errors.push({
        path,
        message: `Properties object is required for geometry type '${geomType}' and must contain 'Area'`,
        featureIndex,
      });
    }
    return;
  }
  if (typeof properties !== 'object' || Array.isArray(properties)) {
    errors.push({ path, message: 'Properties must be an object', featureIndex });
    return;
  }

  checkPropertyCasing(properties, path, errors, featureIndex);

  // Validate ProducerCountry
  if ('ProducerCountry' in properties) {
    const country = properties.ProducerCountry;
    if (typeof country !== 'string') {
      errors.push({
        path: `${path}.ProducerCountry`,
        message: `'ProducerCountry' must be a string, got ${typeof country}`,
        featureIndex,
      });
    } else if (!/^[A-Z]{2}$/.test(country)) {
      errors.push({
        path: `${path}.ProducerCountry`,
        message: `'ProducerCountry' must be a 2-character uppercase ISO2 country code (e.g. BR, AO), got '${country}'`,
        featureIndex,
      });
    }
  }

  // Validate Area
  const hasArea = 'Area' in properties;
  if (!hasArea && (geomType === 'Polygon' || geomType === 'MultiPolygon')) {
    errors.push({
      path: `${path}.Area`,
      message: `'Area' is required for geometry type '${geomType}'`,
      featureIndex,
    });
  } else if (hasArea) {
    const area = properties.Area;
    if (typeof area !== 'number' || isNaN(area)) {
      errors.push({
        path: `${path}.Area`,
        message: `'Area' must be a number, got ${typeof area}`,
        featureIndex,
      });
    } else if (area <= 0) {
      errors.push({
        path: `${path}.Area`,
        message: `'Area' must be a positive number, got ${area}`,
        featureIndex,
      });
    }
  }
};

export const validateGeoJSON = (data: any): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    errors.push({ path: 'root', message: 'GeoJSON must be a valid JSON object' });
    return { valid: false, summary: { totalFeatures: 0, errorCount: 1 }, errors };
  }

  if (data.type !== 'FeatureCollection') {
    errors.push({ path: 'type', message: `Root object type must be 'FeatureCollection', got '${data.type || 'undefined'}'` });
    return { valid: false, summary: { totalFeatures: 0, errorCount: errors.length }, errors };
  }

  if (!Array.isArray(data.features)) {
    errors.push({ path: 'features', message: "Root object must have a 'features' array" });
    return { valid: false, summary: { totalFeatures: 0, errorCount: errors.length }, errors };
  }

  const features = data.features;

  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const featPath = `features[${i}]`;

    if (!feature || typeof feature !== 'object' || Array.isArray(feature)) {
      errors.push({ path: featPath, message: 'Feature must be a valid object', featureIndex: i });
      continue;
    }

    if (feature.type !== 'Feature') {
      errors.push({ path: `${featPath}.type`, message: `Feature type must be 'Feature', got '${feature.type || 'undefined'}'`, featureIndex: i });
    }

    const featureGeomType = feature.geometry && typeof feature.geometry === 'object' ? feature.geometry.type : undefined;

    // Validate properties
    validateProperties(feature.properties, `${featPath}.properties`, errors, i, featureGeomType);

    // Validate geometry existence
    if (!feature.geometry) {
      errors.push({ path: `${featPath}.geometry`, message: 'Feature is missing a geometry object', featureIndex: i });
      continue;
    }

    const geometry = feature.geometry;
    const geomPath = `${featPath}.geometry`;

    if (typeof geometry !== 'object' || Array.isArray(geometry)) {
      errors.push({ path: geomPath, message: 'Geometry must be an object', featureIndex: i });
      continue;
    }

    const geomType = geometry.type;
    if (!geomType) {
      errors.push({ path: `${geomPath}.type`, message: 'Geometry object is missing type property', featureIndex: i });
      continue;
    }

    // Reject unsupported geometries
    const supportedTypes = ['Point', 'MultiPoint', 'Polygon', 'MultiPolygon'];
    if (!supportedTypes.includes(geomType)) {
      errors.push({
        path: `${geomPath}.type`,
        message: `Geometry type '${geomType}' is not supported by EUDR. Supported types are: Point, MultiPoint, Polygon, MultiPolygon`,
        featureIndex: i
      });
      continue;
    }

    const coords = geometry.coordinates;
    const coordsPath = `${geomPath}.coordinates`;

    if (!coords && geomType !== 'GeometryCollection') {
      errors.push({ path: coordsPath, message: 'Geometry coordinates property is missing', featureIndex: i });
      continue;
    }

    // Point validation
    if (geomType === 'Point') {
      if (Array.isArray(coords) && Array.isArray(coords[0])) {
        errors.push({
          path: coordsPath,
          message: 'Point coordinates must be a single flat array of numbers [longitude, latitude], not nested arrays',
          featureIndex: i
        });
      } else {
        validatePosition(coords, coordsPath, errors, i);
      }
    }

    // MultiPoint validation
    else if (geomType === 'MultiPoint') {
      if (!Array.isArray(coords)) {
        errors.push({ path: coordsPath, message: 'MultiPoint coordinates must be an array of positions', featureIndex: i });
      } else {
        for (let j = 0; j < coords.length; j++) {
          validatePosition(coords[j], `${coordsPath}[${j}]`, errors, i);
        }
      }
    }

    // Polygon validation
    else if (geomType === 'Polygon') {
      if (!Array.isArray(coords)) {
        errors.push({ path: coordsPath, message: 'Polygon coordinates must be an array of rings', featureIndex: i });
      } else if (coords.length === 0) {
        errors.push({ path: coordsPath, message: 'Polygon must have at least one ring (outer boundary)', featureIndex: i });
      } else {
        if (coords.length > 1) {
          errors.push({
            path: coordsPath,
            message: `Polygons with holes (multiple rings) are not supported by EUDR. Found ${coords.length} rings`,
            featureIndex: i
          });
        }

        const outerRing = coords[0];
        const ringPath = `${coordsPath}[0]`;
        if (!Array.isArray(outerRing)) {
          errors.push({ path: ringPath, message: 'Polygon ring must be an array of positions', featureIndex: i });
        } else if (outerRing.length < 4) {
          errors.push({
            path: ringPath,
            message: `Polygon ring must contain at least 4 positions (closed triangle), got ${outerRing.length}`,
            featureIndex: i
          });
        } else {
          let positionsValid = true;
          for (let j = 0; j < outerRing.length; j++) {
            const posValid = validatePosition(outerRing[j], `${ringPath}[${j}]`, errors, i);
            if (!posValid) positionsValid = false;
          }

          if (positionsValid) {
            if (!isClosed(outerRing)) {
              errors.push({
                path: ringPath,
                message: 'Polygon ring must be closed (first and last coordinates must match)',
                featureIndex: i
              });
            }
          }
        }

        try {
          const kinks = turf.kinks(feature as any);
          if (kinks.features.length > 0) {
            errors.push({
              path: geomPath,
              message: 'Polygons with crossing lines (self-intersections) are not supported by EUDR',
              featureIndex: i
            });
          }
        } catch (kinksErr: any) {
          // ignore parsing error if geometry invalid
        }
      }
    }

    // MultiPolygon validation
    else if (geomType === 'MultiPolygon') {
      if (!Array.isArray(coords)) {
        errors.push({ path: coordsPath, message: 'MultiPolygon coordinates must be an array of polygons', featureIndex: i });
      } else {
        for (let p = 0; p < coords.length; p++) {
          const polyCoords = coords[p];
          const polyPath = `${coordsPath}[${p}]`;

          if (!Array.isArray(polyCoords)) {
            errors.push({ path: polyPath, message: 'MultiPolygon elements must be arrays of rings', featureIndex: i });
            continue;
          }

          if (polyCoords.length === 0) {
            errors.push({ path: polyPath, message: 'Polygon must have at least one ring', featureIndex: i });
            continue;
          }

          if (polyCoords.length > 1) {
            errors.push({
              path: polyPath,
              message: `Polygons with holes (multiple rings) are not supported by EUDR. Found ${polyCoords.length} rings in polygon ${p}`,
              featureIndex: i
            });
          }

          const outerRing = polyCoords[0];
          const ringPath = `${polyPath}[0]`;

          if (!Array.isArray(outerRing)) {
            errors.push({ path: ringPath, message: 'Polygon ring must be an array of positions', featureIndex: i });
          } else if (outerRing.length < 4) {
            errors.push({
              path: ringPath,
              message: `Polygon ring must contain at least 4 positions, got ${outerRing.length}`,
              featureIndex: i
            });
          } else {
            let positionsValid = true;
            for (let j = 0; j < outerRing.length; j++) {
              const posValid = validatePosition(outerRing[j], `${ringPath}[${j}]`, errors, i);
              if (!posValid) positionsValid = false;
            }

            if (positionsValid) {
              if (!isClosed(outerRing)) {
                errors.push({
                  path: ringPath,
                  message: `Polygon ring of MultiPolygon at index ${p} must be closed`,
                  featureIndex: i
                });
              }
            }
          }
        }

        try {
          const kinks = turf.kinks(feature as any);
          if (kinks.features.length > 0) {
            errors.push({
              path: geomPath,
              message: 'MultiPolygons with crossing lines (self-intersections) are not supported by EUDR',
              featureIndex: i
            });
          }
        } catch (kinksErr: any) {
          // ignore
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    summary: {
      totalFeatures: features.length,
      errorCount: errors.length,
    },
    errors,
  };
};
