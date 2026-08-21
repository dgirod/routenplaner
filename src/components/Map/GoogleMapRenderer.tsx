import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { Trip, TripDay, TripStop } from '../../types';
import { DAY_COLORS } from '../../data/sampleTrips';
import { getGoogleMapsPlaceUrl } from '../../utils/geoUtils';
import { fetchEffectiveRoute, fetchSegmentRoute, RoutePlanningOptions } from '../../utils/routingService';
import { ExternalLink, Clock, Plus } from 'lucide-react';

interface GoogleMapRendererProps {
  apiKey: string;
  trip: Trip;
  selectedDayId: string | 'all';
  focusedStopId?: string | null;
  selectedCustomPoint?: { lat: number; lng: number; title?: string } | null;
  onSelectStop?: (stop: TripStop, dayId: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

// Inner component to control camera bounds & polylines
const MapController: React.FC<{
  trip: Trip;
  selectedDayId: string | 'all';
  focusedStopId?: string | null;
  selectedCustomPoint?: { lat: number; lng: number; title?: string } | null;
}> = ({ trip, selectedDayId, focusedStopId, selectedCustomPoint }) => {
  const map = useMap();
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map) return;
    let isMounted = true;

    // Clear previous polylines
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasCoords = false;

    const routeOptions: RoutePlanningOptions = {
      transportMode: trip.transportMode,
      windingProfile: trip.motorcycleSettings?.windingProfile || 'direct',
      avoidHighways: trip.motorcycleSettings?.avoidHighways ?? false,
      avoidTolls: trip.motorcycleSettings?.avoidTolls ?? false,
    };

    if (selectedDayId === 'all') {
      // 1. Draw intra-day route polylines using real road geometry
      trip.days.forEach(async (day, dayIndex) => {
        const color = DAY_COLORS[dayIndex % DAY_COLORS.length];
        const validStops = day.stops.filter((s) => !isNaN(s.lat) && !isNaN(s.lng));

        validStops.forEach((s) => {
          bounds.extend({ lat: s.lat, lng: s.lng });
          hasCoords = true;
        });

        if (validStops.length > 1) {
          const routeRes = await fetchEffectiveRoute(validStops, routeOptions);
          if (!isMounted) return;

          const path = routeRes.coordinates.length > 0
            ? routeRes.coordinates.map((c) => ({ lat: c[0], lng: c[1] }))
            : validStops.map((s) => ({ lat: s.lat, lng: s.lng }));

          const polyline = new google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: color,
            strokeOpacity: 0.92,
            strokeWeight: trip.transportMode === 'motorcycle' ? 4.5 : 3.8,
            map,
          });
          polylinesRef.current.push(polyline);
        }
      });

      // 2. Draw inter-day connecting lines with real road segments
      for (let i = 0; i < trip.days.length - 1; i++) {
        const curDay = trip.days[i];
        const nextDay = trip.days[i + 1];
        const curStops = curDay.stops.filter((s) => !isNaN(s.lat) && !isNaN(s.lng));
        const nextStops = nextDay.stops.filter((s) => !isNaN(s.lat) && !isNaN(s.lng));

        if (curStops.length > 0 && nextStops.length > 0) {
          const lastStop = curStops[curStops.length - 1];
          const firstStop = nextStops[0];

          fetchSegmentRoute(
            { lat: lastStop.lat, lng: lastStop.lng },
            { lat: firstStop.lat, lng: firstStop.lng },
            routeOptions
          ).then((segRes) => {
            if (!isMounted) return;

            const path = segRes.coordinates.length > 0
              ? segRes.coordinates.map((c) => ({ lat: c[0], lng: c[1] }))
              : [
                  { lat: lastStop.lat, lng: lastStop.lng },
                  { lat: firstStop.lat, lng: firstStop.lng },
                ];

            const lineSymbol = {
              path: 'M 0,-1 0,1',
              strokeOpacity: 1,
              scale: 3,
              strokeColor: '#0284c7',
            };

            const dashedTransitLine = new google.maps.Polyline({
              path,
              strokeOpacity: 0,
              icons: [
                {
                  icon: lineSymbol,
                  offset: '0',
                  repeat: '16px',
                },
              ],
              map,
            });
            polylinesRef.current.push(dashedTransitLine);
          });
        }
      }
    } else {
      // Single Day View
      const curIndex = trip.days.findIndex((d) => d.id === selectedDayId);
      const currentDay = trip.days[curIndex];

      if (currentDay) {
        const color = DAY_COLORS[curIndex % DAY_COLORS.length];
        const validStops = currentDay.stops.filter((s) => !isNaN(s.lat) && !isNaN(s.lng));

        validStops.forEach((s) => {
          bounds.extend({ lat: s.lat, lng: s.lng });
          hasCoords = true;
        });

        // Intra-day line with real road routing
        if (validStops.length > 1) {
          fetchEffectiveRoute(validStops, routeOptions).then((routeRes) => {
            if (!isMounted) return;

            const path = routeRes.coordinates.length > 0
              ? routeRes.coordinates.map((c) => ({ lat: c[0], lng: c[1] }))
              : validStops.map((s) => ({ lat: s.lat, lng: s.lng }));

            const polyline = new google.maps.Polyline({
              path,
              geodesic: true,
              strokeColor: color,
              strokeOpacity: 0.95,
              strokeWeight: trip.transportMode === 'motorcycle' ? 5 : 4.2,
              map,
            });
            polylinesRef.current.push(polyline);
          });
        }

        // Connection from previous day
        if (curIndex > 0 && validStops.length > 0) {
          for (let p = curIndex - 1; p >= 0; p--) {
            const pStops = trip.days[p].stops.filter((s) => !isNaN(s.lat) && !isNaN(s.lng));
            if (pStops.length > 0) {
              const pLast = pStops[pStops.length - 1];
              bounds.extend({ lat: pLast.lat, lng: pLast.lng });

              fetchSegmentRoute(
                { lat: pLast.lat, lng: pLast.lng },
                { lat: validStops[0].lat, lng: validStops[0].lng },
                routeOptions
              ).then((segRes) => {
                if (!isMounted) return;

                const path = segRes.coordinates.length > 0
                  ? segRes.coordinates.map((c) => ({ lat: c[0], lng: c[1] }))
                  : [
                      { lat: pLast.lat, lng: pLast.lng },
                      { lat: validStops[0].lat, lng: validStops[0].lng },
                    ];

                const lineSymbol = {
                  path: 'M 0,-1 0,1',
                  strokeOpacity: 0.8,
                  scale: 3,
                  strokeColor: '#0284c7',
                };

                const prevLine = new google.maps.Polyline({
                  path,
                  strokeOpacity: 0,
                  icons: [{ icon: lineSymbol, offset: '0', repeat: '16px' }],
                  map,
                });
                polylinesRef.current.push(prevLine);
              });
              break;
            }
          }
        }

        // Connection to next day
        if (curIndex < trip.days.length - 1 && validStops.length > 0) {
          for (let n = curIndex + 1; n < trip.days.length; n++) {
            const nStops = trip.days[n].stops.filter((s) => !isNaN(s.lat) && !isNaN(s.lng));
            if (nStops.length > 0) {
              const nFirst = nStops[0];
              bounds.extend({ lat: nFirst.lat, lng: nFirst.lng });

              fetchSegmentRoute(
                { lat: validStops[validStops.length - 1].lat, lng: validStops[validStops.length - 1].lng },
                { lat: nFirst.lat, lng: nFirst.lng },
                routeOptions
              ).then((segRes) => {
                if (!isMounted) return;

                const path = segRes.coordinates.length > 0
                  ? segRes.coordinates.map((c) => ({ lat: c[0], lng: c[1] }))
                  : [
                      { lat: validStops[validStops.length - 1].lat, lng: validStops[validStops.length - 1].lng },
                      { lat: nFirst.lat, lng: nFirst.lng },
                    ];

                const lineSymbol = {
                  path: 'M 0,-1 0,1',
                  strokeOpacity: 0.8,
                  scale: 3,
                  strokeColor: '#0284c7',
                };

                const nextLine = new google.maps.Polyline({
                  path,
                  strokeOpacity: 0,
                  icons: [{ icon: lineSymbol, offset: '0', repeat: '16px' }],
                  map,
                });
                polylinesRef.current.push(nextLine);
              });
              break;
            }
          }
        }
      }
    }

    if (hasCoords && !selectedCustomPoint) {
      map.fitBounds(bounds, 60);
    }

    return () => {
      isMounted = false;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, trip, selectedDayId, focusedStopId]);

  return null;
};

export const GoogleMapRenderer: React.FC<GoogleMapRendererProps> = ({
  apiKey,
  trip,
  selectedDayId,
  focusedStopId,
  selectedCustomPoint,
  onSelectStop,
  onMapClick,
}) => {
  const [activeMarker, setActiveMarker] = useState<{
    stop: TripStop;
    day: TripDay;
    stopIndex: number;
    color: string;
  } | null>(null);

  const daysToRender = useMemo(() => {
    return selectedDayId === 'all'
      ? trip.days
      : trip.days.filter((d) => d.id === selectedDayId);
  }, [trip, selectedDayId]);

  const defaultCenter = useMemo(() => {
    for (const day of trip.days) {
      if (day.stops.length > 0 && !isNaN(day.stops[0].lat)) {
        return { lat: day.stops[0].lat, lng: day.stops[0].lng };
      }
    }
    return { lat: 43.7731, lng: 11.256 };
  }, [trip]);

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-2xl overflow-hidden shadow-inner border border-slate-200">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={8}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          className="w-full h-full cursor-crosshair"
          gestureHandling="greedy"
          disableDefaultUI={false}
          onClick={(e) => {
            if (e.detail?.latLng && onMapClick) {
              onMapClick(e.detail.latLng.lat, e.detail.latLng.lng);
            }
          }}
        >
          <MapController
            trip={trip}
            selectedDayId={selectedDayId}
            focusedStopId={focusedStopId}
            selectedCustomPoint={selectedCustomPoint}
          />

          {selectedCustomPoint && (
            <AdvancedMarker
              position={{
                lat: selectedCustomPoint.lat,
                lng: selectedCustomPoint.lng,
              }}
              title="Ausgewählter Ort"
            >
              <Pin
                background="#2563eb"
                glyphColor="#ffffff"
                borderColor="#ffffff"
                scale={1.3}
              >
                <Plus className="w-3.5 h-3.5 text-white" />
              </Pin>
            </AdvancedMarker>
          )}

          {daysToRender.map((day) => {
            const dayIndex = trip.days.findIndex((d) => d.id === day.id);
            const color = DAY_COLORS[dayIndex % DAY_COLORS.length];

            return day.stops.map((stop, stopIndex) => {
              if (isNaN(stop.lat) || !stop.lat) return null;
              const isFocused = focusedStopId === stop.id;

              return (
                <AdvancedMarker
                  key={stop.id}
                  position={{ lat: stop.lat, lng: stop.lng }}
                  title={`${stop.title} (Tag ${day.dayNumber})`}
                  onClick={() => {
                    setActiveMarker({
                      stop,
                      day,
                      stopIndex: stopIndex + 1,
                      color,
                    });
                    if (onSelectStop) onSelectStop(stop, day.id);
                  }}
                >
                  <Pin
                    background={color}
                    glyphColor="#ffffff"
                    borderColor="#ffffff"
                    scale={isFocused ? 1.25 : 1.05}
                  >
                    <span className="text-[11px] font-bold text-white">
                      {selectedDayId === 'all' ? `${day.dayNumber}` : stopIndex + 1}
                    </span>
                  </Pin>
                </AdvancedMarker>
              );
            });
          })}

          {activeMarker && (
            <InfoWindow
              position={{ lat: activeMarker.stop.lat, lng: activeMarker.stop.lng }}
              onCloseClick={() => setActiveMarker(null)}
            >
              <div className="p-1 max-w-[240px] font-['Plus_Jakarta_Sans',sans-serif]">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${activeMarker.color}20`,
                      color: activeMarker.color,
                    }}
                  >
                    Tag {activeMarker.day.dayNumber} · #{activeMarker.stopIndex}
                  </span>
                  {activeMarker.stop.time && (
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {activeMarker.stop.time}
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-sm text-slate-900 leading-snug">
                  {activeMarker.stop.title}
                </h4>

                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {activeMarker.stop.address}
                </p>

                {activeMarker.stop.notes && (
                  <div className="mt-2 text-xs bg-slate-50 border-l-2 border-amber-500 p-1.5 rounded text-slate-700">
                    💡 {activeMarker.stop.notes}
                  </div>
                )}

                <div className="mt-3 pt-2 border-t border-slate-100 flex gap-2">
                  <a
                    href={getGoogleMapsPlaceUrl(activeMarker.stop)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 px-2.5 rounded-lg transition shadow-sm"
                  >
                    <ExternalLink className="w-3 h-3" /> In Google Maps öffnen
                  </a>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>
    </div>
  );
};
