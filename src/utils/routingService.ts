import { Trip, TripDay, TripStop, TransportMode, MotorcycleSettings } from '../types';
import { calculateDistanceKm } from './geoUtils';

export interface RouteGeometryResult {
  coordinates: [number, number][]; // [lat, lng][]
  distanceKm: number;
  durationMinutes: number;
  legs: {
    distanceKm: number;
    durationMinutes: number;
    coordinates: [number, number][];
  }[];
  isRealRoad: boolean;
  profileUsed: string;
}

export interface RoutePlanningOptions {
  transportMode?: TransportMode;
  windingProfile?: 'super_curvy' | 'curvy' | 'direct';
  avoidHighways?: boolean;
  avoidTolls?: boolean;
}

// In-memory cache for computed routes
const routeMemoryCache = new Map<string, RouteGeometryResult>();

function getCacheKey(
  stops: { lat: number; lng: number }[],
  options?: RoutePlanningOptions
): string {
  const coordStr = stops
    .map((s) => `${s.lat.toFixed(5)},${s.lng.toFixed(5)}`)
    .join(';');
  const mode = options?.transportMode || 'car';
  const winding = options?.windingProfile || 'direct';
  const noHwy = options?.avoidHighways ? '1' : '0';
  return `${mode}_${winding}_${noHwy}_${coordStr}`;
}

/**
 * Generates a realistic curved road spline connecting points when offline or fallback.
 */
function generateRoadSplineFallback(
  stops: { lat: number; lng: number }[],
  options?: RoutePlanningOptions
): RouteGeometryResult {
  if (stops.length === 0) {
    return {
      coordinates: [],
      distanceKm: 0,
      durationMinutes: 0,
      legs: [],
      isRealRoad: false,
      profileUsed: 'fallback',
    };
  }

  if (stops.length === 1) {
    return {
      coordinates: [[stops[0].lat, stops[0].lng]],
      distanceKm: 0,
      durationMinutes: 0,
      legs: [],
      isRealRoad: false,
      profileUsed: 'fallback',
    };
  }

  const allCoords: [number, number][] = [];
  const legs: { distanceKm: number; durationMinutes: number; coordinates: [number, number][] }[] = [];
  let totalDistKm = 0;
  let totalMinutes = 0;

  const isCurvy =
    options?.windingProfile === 'super_curvy' ||
    options?.windingProfile === 'curvy' ||
    options?.avoidHighways;

  for (let i = 0; i < stops.length - 1; i++) {
    const p1 = stops[i];
    const p2 = stops[i + 1];
    const directDist = calculateDistanceKm(p1.lat, p1.lng, p2.lat, p2.lng);
    const roadFactor = isCurvy ? 1.38 : 1.25;
    const legDist = Math.round(directDist * roadFactor * 10) / 10;
    
    let speedKmH = isCurvy ? 48 : 70;
    if (legDist < 5) speedKmH = 30;
    const legDuration = Math.max(2, Math.round((legDist / speedKmH) * 60));

    // Generate spline points along the leg with natural road curves
    const legCoords: [number, number][] = [];
    const steps = Math.min(30, Math.max(6, Math.round(directDist * 2.5)));
    
    // Perpendicular vector for curves
    const dx = p2.lng - p1.lng;
    const dy = p2.lat - p1.lat;
    const norm = Math.sqrt(dx * dx + dy * dy) || 1;
    const perpX = -dy / norm;
    const perpY = dx / norm;

    // Deterministic pseudo-random seed based on coordinates
    const seed = Math.sin(p1.lat * 100 + p2.lng * 50) * 10000;
    const amplitude = (isCurvy ? 0.005 : 0.0015) * Math.min(1, directDist / 10);

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      // Linear baseline
      let lat = p1.lat + t * (p2.lat - p1.lat);
      let lng = p1.lng + t * (p2.lng - p1.lng);

      if (s > 0 && s < steps) {
        // Add subtle harmonic road weaving
        const wave = Math.sin(t * Math.PI) * Math.sin(t * Math.PI * 3 + seed);
        lat += perpY * wave * amplitude;
        lng += perpX * wave * amplitude;
      }

      legCoords.push([lat, lng]);
      if (allCoords.length === 0 || s > 0) {
        allCoords.push([lat, lng]);
      }
    }

    legs.push({
      distanceKm: legDist,
      durationMinutes: legDuration,
      coordinates: legCoords,
    });

    totalDistKm += legDist;
    totalMinutes += legDuration;
  }

  return {
    coordinates: allCoords,
    distanceKm: Math.round(totalDistKm * 10) / 10,
    durationMinutes: totalMinutes,
    legs,
    isRealRoad: false,
    profileUsed: 'spline_road',
  };
}

/**
 * Fetches real road turn-by-turn geometry and metrics for a sequence of stops.
 * Uses local OSRM routing / server-side API with automatic caching and graceful fallback.
 */
export async function fetchEffectiveRoute(
  stops: { lat: number; lng: number }[],
  options?: RoutePlanningOptions
): Promise<RouteGeometryResult> {
  const validStops = stops.filter((s) => !isNaN(s.lat) && !isNaN(s.lng));

  if (validStops.length <= 1) {
    return generateRoadSplineFallback(validStops, options);
  }

  const cacheKey = getCacheKey(validStops, options);
  if (routeMemoryCache.has(cacheKey)) {
    return routeMemoryCache.get(cacheKey)!;
  }

  // Check localStorage cache
  try {
    const localCached = localStorage.getItem(`route_${cacheKey}`);
    if (localCached) {
      const parsed = JSON.parse(localCached);
      routeMemoryCache.set(cacheKey, parsed);
      return parsed;
    }
  } catch {
    // Ignore localStorage errors
  }

  // Build OSRM URL or call local backend /api/route
  const mode = options?.transportMode || 'car';
  const osrmProfile = mode === 'bike' ? 'bike' : mode === 'walk' ? 'foot' : 'driving';
  
  // Format coordinates for OSRM: lon,lat;lon,lat;...
  const coordString = validStops.map((s) => `${s.lng},${s.lat}`).join(';');

  try {
    // 1. First attempt: call local server proxy /api/route
    const serverPromise = fetch('/api/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: validStops.map((s) => [s.lat, s.lng]),
        transportMode: mode,
        windingProfile: options?.windingProfile,
        avoidHighways: options?.avoidHighways,
        avoidTolls: options?.avoidTolls,
      }),
    });

    const serverRes = await Promise.race([
      serverPromise,
      new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('Server timeout')), 3500)),
    ]);

    if (serverRes.ok) {
      const data = await serverRes.json();
      if (data.coordinates && data.coordinates.length > 0) {
        const result: RouteGeometryResult = {
          coordinates: data.coordinates,
          distanceKm: data.distanceKm || 0,
          durationMinutes: data.durationMinutes || 0,
          legs: data.legs || [],
          isRealRoad: true,
          profileUsed: data.profileUsed || `${mode}_${options?.windingProfile || 'default'}`,
        };
        routeMemoryCache.set(cacheKey, result);
        try {
          localStorage.setItem(`route_${cacheKey}`, JSON.stringify(result));
        } catch {}
        return result;
      }
    }
  } catch (err) {
    // Server proxy failed or timed out, try direct OSRM endpoint
  }

  // 2. Direct OSRM Public Routing Fallback
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/${osrmProfile}/${coordString}?overview=full&geometries=geojson&steps=false`;
    const osrmRes = await fetch(osrmUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (osrmRes.ok) {
      const data = await osrmRes.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const primaryRoute = data.routes[0];
        // OSRM coordinates are [lng, lat], convert to [lat, lng]
        const rawCoords: [number, number][] = primaryRoute.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );

        let distanceKm = Math.round((primaryRoute.distance / 1000) * 10) / 10;
        let durationMinutes = Math.round(primaryRoute.duration / 60);

        // Adjust for motorcycle curviness or avoiding highways
        if (options?.transportMode === 'motorcycle') {
          if (options.windingProfile === 'super_curvy') {
            distanceKm = Math.round(distanceKm * 1.12 * 10) / 10;
            durationMinutes = Math.round(durationMinutes * 1.25);
          } else if (options.windingProfile === 'curvy') {
            distanceKm = Math.round(distanceKm * 1.05 * 10) / 10;
            durationMinutes = Math.round(durationMinutes * 1.15);
          }
        } else if (options?.avoidHighways) {
          durationMinutes = Math.round(durationMinutes * 1.2);
        }

        // Process individual legs if available
        const legs = (primaryRoute.legs || []).map((leg: any, idx: number) => {
          const legDist = Math.round((leg.distance / 1000) * 10) / 10;
          let legDur = Math.round(leg.duration / 60);
          if (options?.transportMode === 'motorcycle' && options.windingProfile === 'super_curvy') {
            legDur = Math.round(legDur * 1.25);
          }
          return {
            distanceKm: legDist,
            durationMinutes: Math.max(1, legDur),
            coordinates: [],
          };
        });

        const result: RouteGeometryResult = {
          coordinates: rawCoords,
          distanceKm,
          durationMinutes: Math.max(2, durationMinutes),
          legs,
          isRealRoad: true,
          profileUsed: `osrm_${osrmProfile}`,
        };

        routeMemoryCache.set(cacheKey, result);
        try {
          localStorage.setItem(`route_${cacheKey}`, JSON.stringify(result));
        } catch {}
        return result;
      }
    }
  } catch (err) {
    console.warn('OSRM route fetch error, using natural spline fallback:', err);
  }

  // 3. Fallback to natural road curve spline
  const fallbackResult = generateRoadSplineFallback(validStops, options);
  routeMemoryCache.set(cacheKey, fallbackResult);
  return fallbackResult;
}

/**
 * Fetches a single segment between two stops (e.g. Stop 1 to Stop 2).
 */
export async function fetchSegmentRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  options?: RoutePlanningOptions
): Promise<{ distanceKm: number; durationMinutes: number; coordinates: [number, number][] }> {
  const result = await fetchEffectiveRoute([from, to], options);
  return {
    distanceKm: result.distanceKm,
    durationMinutes: result.durationMinutes,
    coordinates: result.coordinates,
  };
}
