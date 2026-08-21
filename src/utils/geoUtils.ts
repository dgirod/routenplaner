import { TripStop, TripDay, Trip } from '../types';

/**
 * Calculates Haversine great-circle distance between two coordinates in kilometers.
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimates driving distance and time considering road network factor (~1.25x direct distance).
 */
export function estimateDriveMetrics(lat1: number, lon1: number, lat2: number, lon2: number) {
  const directDistance = calculateDistanceKm(lat1, lon1, lat2, lon2);
  // Road factor typically 1.25 - 1.35
  const roadDistanceKm = Math.round(directDistance * 1.28 * 10) / 10;
  
  // Approximate speeds: Urban/Suburban (~45-60 km/h average)
  let speedKmH = 55;
  if (roadDistanceKm > 80) speedKmH = 85; // Highway component
  else if (roadDistanceKm < 5) speedKmH = 30; // Dense city

  const durationMinutes = Math.max(3, Math.round((roadDistanceKm / speedKmH) * 60));

  return {
    distanceKm: roadDistanceKm,
    durationMinutes,
  };
}

/**
 * Computes overall metrics for a list of stops, optionally starting from a departure stop.
 */
export function calculateDayMetrics(stops: TripStop[], departureStop?: TripStop | null) {
  let totalDistanceKm = 0;
  let totalDriveMinutes = 0;
  let totalCost = 0;

  const allStops = departureStop && stops.length > 0 && (stops[0].lat !== departureStop.lat || stops[0].lng !== departureStop.lng)
    ? [departureStop, ...stops]
    : stops;

  for (let i = 0; i < stops.length; i++) {
    totalCost += stops[i].cost || 0;
  }

  for (let i = 0; i < allStops.length - 1; i++) {
    const metrics = estimateDriveMetrics(
      allStops[i].lat,
      allStops[i].lng,
      allStops[i + 1].lat,
      allStops[i + 1].lng
    );
    totalDistanceKm += metrics.distanceKm;
    totalDriveMinutes += metrics.durationMinutes;
  }

  return {
    distanceKm: Math.round(totalDistanceKm * 10) / 10,
    driveMinutes: totalDriveMinutes,
    totalCost,
    stopCount: stops.length,
  };
}

/**
 * Computes global metrics for all days in a trip.
 */
export function calculateTripMetrics(trip: Trip) {
  let totalDistanceKm = 0;
  let totalDriveMinutes = 0;
  let totalCost = 0;
  let totalStops = 0;

  const allStopsInOrder: TripStop[] = [];

  trip.days.forEach((day) => {
    day.stops.forEach((stop) => {
      allStopsInOrder.push(stop);
      totalCost += stop.cost || 0;
      totalStops++;
    });
  });

  for (let i = 0; i < allStopsInOrder.length - 1; i++) {
    const metrics = estimateDriveMetrics(
      allStopsInOrder[i].lat,
      allStopsInOrder[i].lng,
      allStopsInOrder[i + 1].lat,
      allStopsInOrder[i + 1].lng
    );
    totalDistanceKm += metrics.distanceKm;
    totalDriveMinutes += metrics.durationMinutes;
  }

  return {
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    totalDriveMinutes,
    totalCost,
    totalStops,
    dayCount: trip.days.length,
  };
}

/**
 * Formats minutes into human-friendly string (e.g. "2 Std. 15 Min" or "45 Min").
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} Min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs} Std.`;
  return `${hrs} Std. ${mins} Min`;
}

/**
 * Builds a direct Google Maps Directions URL linking all stops in order.
 * Optionally starts from a previous day's departure stop.
 */
export function getGoogleMapsDirectionsUrl(stops: TripStop[], departureStop?: TripStop | null): string {
  const combined = departureStop && stops.length > 0 && (stops[0].lat !== departureStop.lat || stops[0].lng !== departureStop.lng)
    ? [departureStop, ...stops]
    : stops;

  if (!combined || combined.length === 0) return 'https://www.google.com/maps';
  if (combined.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      combined[0].title + ' ' + (combined[0].address || '')
    )}`;
  }

  const origin = encodeURIComponent(`${combined[0].lat},${combined[0].lng}`);
  const destination = encodeURIComponent(
    `${combined[combined.length - 1].lat},${combined[combined.length - 1].lng}`
  );

  let waypointsParam = '';
  if (combined.length > 2) {
    const waypoints = combined
      .slice(1, -1)
      .map((s) => `${s.lat},${s.lng}`)
      .join('|');
    waypointsParam = `&waypoints=${encodeURIComponent(waypoints)}`;
  }

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsParam}&travelmode=driving`;
}

/**
 * Calculates Calimoto-inspired motorcycle and twisty route metrics:
 * - Curviness Index (1-100)
 * - Estimated Curve Count
 * - Elevation Gain / Passes count
 * - Fuel Warning Range
 */
export function calculateMotorcycleMetrics(stops: TripStop[], settings?: {
  windingProfile?: 'super_curvy' | 'curvy' | 'direct';
  avoidHighways?: boolean;
  fuelRangeKm?: number;
}) {
  const profile = settings?.windingProfile || 'super_curvy';
  const fuelRange = settings?.fuelRangeKm || 250;

  let totalDistanceKm = 0;
  let passCount = 0;
  let scenicCount = 0;

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    if (stop.category === 'pass') passCount++;
    if (stop.category === 'viewpoint' || stop.category === 'nature') scenicCount++;

    if (i < stops.length - 1) {
      const dist = estimateDriveMetrics(stop.lat, stop.lng, stops[i + 1].lat, stops[i + 1].lng).distanceKm;
      totalDistanceKm += dist;
    }
  }

  // Curviness multiplier based on profile and passes
  let baseScore = profile === 'super_curvy' ? 91 : profile === 'curvy' ? 78 : 55;
  baseScore = Math.min(99, baseScore + passCount * 3 + scenicCount * 1.5);

  const curvesPerKm = profile === 'super_curvy' ? 4.8 : profile === 'curvy' ? 3.2 : 1.8;
  const estimatedCurves = Math.max(12, Math.round(totalDistanceKm * curvesPerKm));
  const estimatedElevationGain = Math.round(passCount * 750 + totalDistanceKm * 18);
  const fuelStopsNeeded = Math.floor(totalDistanceKm / fuelRange);
  const ridingTimeMinutes = Math.round((totalDistanceKm / (profile === 'super_curvy' ? 48 : 62)) * 60);

  return {
    curvinessScore: Math.round(baseScore),
    curvinessLabel:
      baseScore >= 88 ? 'Extrem Kurvig (Calimoto Superkurvig 🏍️🔥)' :
      baseScore >= 72 ? 'Sehr Kurvig & Landschaftlich reizvoll' :
      'Flüssig & Zügig',
    estimatedCurves,
    estimatedElevationGain,
    passCount,
    fuelStopsNeeded,
    ridingTimeMinutes,
    fuelRange,
  };
}

/**
 * Generates standard GPX XML content compatible with Calimoto, Garmin, TomTom, BMW Connected & Scenic.
 */
export function generateGPXContent(trip: Trip, day?: TripDay): string {
  const stopsToExport = day ? day.stops : trip.days.flatMap((d) => d.stops);
  const routeName = day ? `${trip.title} - Tag ${day.dayNumber}` : trip.title;
  const desc = day ? day.theme || day.title : trip.description;

  const validStops = stopsToExport.filter((s) => !isNaN(s.lat) && !isNaN(s.lng));

  let waypointsXml = '';
  let routePointsXml = '';
  let trackPointsXml = '';

  validStops.forEach((stop, index) => {
    const sym =
      stop.category === 'pass' ? 'Mountain' :
      stop.category === 'biker_spot' ? 'Scenic Area' :
      stop.category === 'hotel' ? 'Lodging' :
      stop.category === 'restaurant' ? 'Restaurant' :
      'Waypoint';

    waypointsXml += `  <wpt lat="${stop.lat.toFixed(6)}" lon="${stop.lng.toFixed(6)}">
    <name>${escapeXml(stop.title)}</name>
    <desc>${escapeXml(stop.notes || stop.address || '')}</desc>
    <sym>${sym}</sym>
    <type>${stop.category}</type>
  </wpt>\n`;

    routePointsXml += `    <rtept lat="${stop.lat.toFixed(6)}" lon="${stop.lng.toFixed(6)}">
      <name>${index + 1}. ${escapeXml(stop.title)}</name>
    </rtept>\n`;

    trackPointsXml += `      <trkpt lat="${stop.lat.toFixed(6)}" lon="${stop.lng.toFixed(6)}">
        <name>${escapeXml(stop.title)}</name>
      </trkpt>\n`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="AI Travel Planner &amp; Calimoto GPX Export"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(routeName)}</name>
    <desc>${escapeXml(desc || '')}</desc>
    <author>
      <name>Calimoto Motorcycle Route Planner</name>
    </author>
    <time>${new Date().toISOString()}</time>
  </metadata>

${waypointsXml}
  <rte>
    <name>${escapeXml(routeName)}</name>
    <desc>Motorrad-Route mit Kurven und Wegpunkten</desc>
${routePointsXml}  </rte>

  <trk>
    <name>${escapeXml(routeName)} Track</name>
    <trkseg>
${trackPointsXml}    </trkseg>
  </trk>
</gpx>`;
}

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Triggers a browser download for a GPX file.
 */
export function downloadGPX(filename: string, gpxXml: string) {
  const blob = new Blob([gpxXml], { type: 'application/gpx+xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.gpx') ? filename : `${filename}.gpx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Builds Google Maps search/place direct link.
 */
export function getGoogleMapsPlaceUrl(stop: TripStop): string {
  if (stop.googleMapsUrl && stop.googleMapsUrl.startsWith('http')) {
    return stop.googleMapsUrl;
  }
  const query = encodeURIComponent(`${stop.title}, ${stop.address}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${stop.placeId || ''}`;
}

/**
 * Optimizes a list of stops to minimize driving distance using Nearest-Neighbor heuristic.
 * Keeps the first stop as the starting point.
 */
export function optimizeRouteOrder(stops: TripStop[]): TripStop[] {
  if (stops.length <= 2) return [...stops];

  const remaining = [...stops];
  const optimized: TripStop[] = [];

  // Start with the first stop
  let current = remaining.shift()!;
  optimized.push(current);

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let shortestDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const dist = calculateDistanceKm(
        current.lat,
        current.lng,
        remaining[i].lat,
        remaining[i].lng
      );
      if (dist < shortestDistance) {
        shortestDistance = dist;
        nearestIndex = i;
      }
    }

    current = remaining.splice(nearestIndex, 1)[0];
    optimized.push(current);
  }

  return optimized;
}

/**
 * OpenStreetMap Nominatim search for location autocompletion and coordinates lookup.
 */
export async function searchLocationsNominatim(query: string) {
  if (!query || query.trim().length < 2) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&addressdetails=1&limit=6`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'de,en;q=0.9',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((item: any) => ({
      name: item.name || item.display_name.split(',')[0],
      address: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      category: 'sightseeing' as const,
    }));
  } catch (err) {
    console.warn('Geocoding fetch error:', err);
    return [];
  }
}

/**
 * OpenStreetMap Nominatim reverse geocode coordinates to place details.
 */
export async function reverseGeocodeNominatim(lat: number, lng: number) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'de,en;q=0.9',
      },
    });
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    
    const address = data.address || {};
    const name =
      data.name ||
      address.attraction ||
      address.tourism ||
      address.historic ||
      address.amenity ||
      address.building ||
      address.leisure ||
      address.road ||
      address.suburb ||
      address.city ||
      address.town ||
      address.village ||
      data.display_name?.split(',')[0] ||
      `Ort (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

    let category: 'sightseeing' | 'hotel' | 'restaurant' | 'activity' | 'viewpoint' | 'nature' = 'sightseeing';
    if (address.restaurant || address.cafe || address.pub || address.fast_food || address.bar) {
      category = 'restaurant';
    } else if (address.hotel || address.guest_house || address.hostel || address.motel || address.apartment) {
      category = 'hotel';
    } else if (address.tourism === 'viewpoint' || address.viewpoint) {
      category = 'viewpoint';
    } else if (address.natural || address.park || address.national_park || address.wood) {
      category = 'nature';
    }

    return {
      title: name,
      address: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      category,
      lat,
      lng,
    };
  } catch (err) {
    return {
      title: `Ausgewählter Ort (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      address: `Koordinaten: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      category: 'sightseeing' as const,
      lat,
      lng,
    };
  }
}
