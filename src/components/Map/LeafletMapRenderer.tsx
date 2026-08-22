import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Trip, TripDay, TripStop } from '../../types';
import { DAY_COLORS } from '../../data/sampleTrips';
import { getGoogleMapsPlaceUrl } from '../../utils/geoUtils';
import { fetchEffectiveRoute, fetchSegmentRoute, RoutePlanningOptions } from '../../utils/routingService';

interface LeafletMapRendererProps {
  trip: Trip;
  selectedDayId: string | 'all';
  focusedStopId?: string | null;
  selectedCustomPoint?: { lat: number; lng: number; title?: string } | null;
  onSelectStop?: (stop: TripStop, dayId: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

export const LeafletMapRenderer: React.FC<LeafletMapRendererProps> = ({
  trip,
  selectedDayId,
  focusedStopId,
  selectedCustomPoint,
  onSelectStop,
  onMapClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const customPointLayerRef = useRef<L.LayerGroup | null>(null);
  const onMapClickRef = useRef(onMapClick);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      let initialLat = 43.7731;
      let initialLng = 11.256;
      for (const day of trip.days) {
        const valid = day.stops.find((s) => !isNaN(s.lat) && !isNaN(s.lng));
        if (valid) {
          initialLat = valid.lat;
          initialLng = valid.lng;
          break;
        }
      }

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView([initialLat, initialLng], 8);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      const customPointLayer = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      customPointLayerRef.current = customPointLayer;
      mapInstanceRef.current = map;

      // Handle map click to select a location like Google Maps
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onMapClickRef.current) {
          onMapClickRef.current(e.latlng.lat, e.latlng.lng);
        }
      });
    }
  }, []);

  // Update selected custom point pin
  useEffect(() => {
    const customLayer = customPointLayerRef.current;
    if (!customLayer) return;

    customLayer.clearLayers();

    if (selectedCustomPoint && !isNaN(selectedCustomPoint.lat) && !isNaN(selectedCustomPoint.lng)) {
      const { lat, lng, title } = selectedCustomPoint;
      const latLng = L.latLng(lat, lng);

      const selectionIcon = L.divIcon({
        className: 'custom-selection-pin',
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="
              position: absolute;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              background: rgba(37, 99, 235, 0.4);
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <div style="
              background-color: #2563eb;
              color: white;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 800;
              font-size: 16px;
              border: 3px solid #ffffff;
              box-shadow: 0 4px 12px rgba(37,99,235,0.6), 0 2px 4px rgba(0,0,0,0.3);
              cursor: pointer;
              z-index: 10;
            ">
              +
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
      });

      const marker = L.marker(latLng, { icon: selectionIcon, zIndexOffset: 1000 }).addTo(customLayer);
      if (title) {
        marker.bindTooltip(`📍 ${title}`, { permanent: false, direction: 'top' });
      }
    }
  }, [selectedCustomPoint]);

  // Update markers, lines and viewport when trip, selected day or focused stop changes
  useEffect(() => {
    let isMounted = true;
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const bounds = L.latLngBounds([]);
    let hasCoords = false;

    const routeOptions: RoutePlanningOptions = {
      transportMode: trip.transportMode,
      windingProfile: trip.motorcycleSettings?.windingProfile || 'direct',
      avoidHighways: trip.motorcycleSettings?.avoidHighways ?? false,
      avoidTolls: trip.motorcycleSettings?.avoidTolls ?? false,
    };

    // Helper: draw inter-day connector line with real road routing
    const drawInterDayConnector = async (
      fromStop: TripStop,
      toStop: TripStop,
      fromDayNum: number,
      toDayNum: number,
      opacity: number = 0.95
    ) => {
      const p1: [number, number] = [fromStop.lat, fromStop.lng];
      const p2: [number, number] = [toStop.lat, toStop.lng];

      const routeRes = await fetchSegmentRoute(
        { lat: fromStop.lat, lng: fromStop.lng },
        { lat: toStop.lat, lng: toStop.lng },
        routeOptions
      );

      if (!isMounted) return;

      const pathCoords = routeRes.coordinates.length > 0 ? routeRes.coordinates : [p1, p2];

      // White casing
      L.polyline(pathCoords, {
        color: '#ffffff',
        weight: 6,
        opacity: opacity * 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(layerGroup);

      // Dashed transit line
      const transitLine = L.polyline(pathCoords, {
        color: '#0284c7',
        weight: 3.5,
        opacity: opacity,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(layerGroup);

      const modeIcon = trip.transportMode === 'motorcycle' ? '🏍️' : '🚗';
      transitLine.bindTooltip(
        `<div style="font-family: 'Outfit', sans-serif; font-size: 11px;">
          <div style="font-weight: 700; color: #0284c7;">${modeIcon} Weiterfahrt: Tag ${fromDayNum} ➔ Tag ${toDayNum}</div>
          <div style="color: #334155;"><strong>${fromStop.title}</strong> ➔ <strong>${toStop.title}</strong></div>
          <div style="color: #64748b; font-size: 10px; margin-top: 2px;">ca. ${routeRes.distanceKm} km · ca. ${routeRes.durationMinutes} Min. Fahrt (Reale Straßenroute)</div>
        </div>`,
        { sticky: true, className: 'leaflet-custom-tooltip' }
      );
    };

    if (selectedDayId === 'all') {
      // -------------------------------------------------------------
      // OVERALL VIEW: RENDER ALL DAYS WITH REAL ROAD GEOMETRY
      // -------------------------------------------------------------
      trip.days.forEach(async (day, dayIndex) => {
        const color = DAY_COLORS[dayIndex % DAY_COLORS.length];
        const validStops = day.stops.filter((s) => !isNaN(s.lat) && !isNaN(s.lng));

        // 1. Draw intra-day route connecting stops within this day
        if (validStops.length > 1) {
          const routeRes = await fetchEffectiveRoute(validStops, routeOptions);
          if (!isMounted) return;

          const pathCoords = routeRes.coordinates.length > 0
            ? routeRes.coordinates
            : validStops.map((s) => [s.lat, s.lng] as [number, number]);

          // Casing
          L.polyline(pathCoords, {
            color: '#ffffff',
            weight: 7,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(layerGroup);

          // Route
          const polyline = L.polyline(pathCoords, {
            color: color,
            weight: trip.transportMode === 'motorcycle' ? 4.5 : 3.8,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(layerGroup);

          const curveInfo = trip.transportMode === 'motorcycle'
            ? ` · ${trip.motorcycleSettings?.windingProfile === 'super_curvy' ? '🏍️ Superkurvig' : '🏍️ Kurvig'}`
            : '';

          polyline.bindTooltip(
            `<strong>Tag ${day.dayNumber}:</strong> ${day.title} (${validStops.length} Stopps · ${routeRes.distanceKm} km · ca. ${routeRes.durationMinutes} Min.${curveInfo})`,
            { sticky: true, className: 'leaflet-custom-tooltip' }
          );
        }

        // 2. Add Stop Markers for this day
        validStops.forEach((stop, index) => {
          const isFocused = focusedStopId === stop.id;
          const latLng = L.latLng(stop.lat, stop.lng);
          bounds.extend(latLng);
          hasCoords = true;

          const stopNumber = index + 1;
          const customIcon = L.divIcon({
            className: 'custom-map-pin',
            html: `
              <div style="
                background-color: ${color};
                color: white;
                width: ${isFocused ? '36px' : '28px'};
                height: ${isFocused ? '36px' : '28px'};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: ${isFocused ? '13px' : '11px'};
                border: 2.5px solid #ffffff;
                box-shadow: 0 3px 8px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.2);
                transition: all 0.2s ease;
                transform: ${isFocused ? 'scale(1.15)' : 'scale(1)'};
                cursor: pointer;
              ">
                ${day.dayNumber}
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -18],
          });

          const marker = L.marker(latLng, { icon: customIcon }).addTo(layerGroup);
          const gmapsLink = getGoogleMapsPlaceUrl(stop);

          const popupContent = `
            <div style="min-width: 220px; font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif; padding: 12px; background: #ffffff; border-radius: 12px; color: #0f172a;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-size: 10px; font-weight: 700; color: ${color}; background: ${color}15; border: 1px solid ${color}30; padding: 2px 8px; border-radius: 9999px;">
                  Tag ${day.dayNumber} · Stopp #${stopNumber}
                </span>
                <span style="font-size: 11px; color: #64748b; font-weight: 600;">${stop.time ? '🕒 ' + stop.time : ''}</span>
              </div>
              <h4 style="margin: 4px 0 2px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${stop.title}</h4>
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #64748b; line-height: 1.3;">${stop.address || ''}</p>
              ${
                stop.notes
                  ? `<div style="font-size: 11px; background: #f8fafc; border-left: 3px solid ${color}; padding: 5px 8px; margin-bottom: 8px; color: #334155; border-radius: 0 6px 6px 0; border: 1px solid #f1f5f9; border-left-color: ${color};">
                      💡 ${stop.notes}
                     </div>`
                  : ''
              }
              <div style="display: flex; gap: 6px; margin-top: 6px;">
                <a href="${gmapsLink}" target="_blank" rel="noopener noreferrer" 
                   style="flex: 1; display: inline-flex; align-items: center; justify-content: center; background: #2563eb; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 600; padding: 6px 10px; border-radius: 8px; text-align: center;">
                  🗺️ In Google Maps öffnen
                </a>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);
          marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            if (onSelectStop) onSelectStop(stop, day.id);
          });

          if (isFocused) {
            marker.openPopup();
          }
        });
      });

      // 3. Connect consecutive days with styled transit line
      for (let i = 0; i < trip.days.length - 1; i++) {
        const curDay = trip.days[i];
        const nextDay = trip.days[i + 1];
        const curStops = curDay.stops.filter((s) => !isNaN(s.lat) && !isNaN(s.lng));
        const nextStops = nextDay.stops.filter((s) => !isNaN(s.lat) && !isNaN(s.lng));

        if (curStops.length > 0 && nextStops.length > 0) {
          const lastStop = curStops[curStops.length - 1];
          const firstStop = nextStops[0];
          drawInterDayConnector(lastStop, firstStop, curDay.dayNumber, nextDay.dayNumber, 0.95);
        }
      }
    } else {
      // -------------------------------------------------------------
      // SINGLE DAY VIEW: REAL ROAD INTRA-DAY ROUTE & INTER-DAY ROADS
      // -------------------------------------------------------------
      const currentDayIndex = trip.days.findIndex((d) => d.id === selectedDayId);
      const currentDay = trip.days[currentDayIndex];

      if (currentDay) {
        const color = DAY_COLORS[currentDayIndex % DAY_COLORS.length];
        const validStops = currentDay.stops.filter((s) => !isNaN(s.lat) && !isNaN(s.lng));

        // 1. Draw intra-day route using real road geometry
        if (validStops.length > 1) {
          fetchEffectiveRoute(validStops, routeOptions).then((routeRes) => {
            if (!isMounted) return;
            const pathCoords = routeRes.coordinates.length > 0
              ? routeRes.coordinates
              : validStops.map((s) => [s.lat, s.lng] as [number, number]);

            L.polyline(pathCoords, {
              color: '#ffffff',
              weight: 8,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round',
            }).addTo(layerGroup);

            const polyline = L.polyline(pathCoords, {
              color: color,
              weight: trip.transportMode === 'motorcycle' ? 5 : 4.2,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round',
            }).addTo(layerGroup);

            const curveInfo = trip.transportMode === 'motorcycle'
              ? ` · ${trip.motorcycleSettings?.windingProfile === 'super_curvy' ? '🏍️ Superkurvig' : '🏍️ Kurvig'}`
              : '';

            polyline.bindTooltip(
              `<strong>Tag ${currentDay.dayNumber}:</strong> ${currentDay.title} (${routeRes.distanceKm} km · ca. ${routeRes.durationMinutes} Min.${curveInfo})`,
              { sticky: true, className: 'leaflet-custom-tooltip' }
            );
          });
        }

        // 2. Add Stop Markers for current day
        validStops.forEach((stop, index) => {
          const isFocused = focusedStopId === stop.id;
          const latLng = L.latLng(stop.lat, stop.lng);
          bounds.extend(latLng);
          hasCoords = true;

          const stopNumber = index + 1;
          const customIcon = L.divIcon({
            className: 'custom-map-pin',
            html: `
              <div style="
                background-color: ${color};
                color: white;
                width: ${isFocused ? '38px' : '30px'};
                height: ${isFocused ? '38px' : '30px'};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: ${isFocused ? '14px' : '12px'};
                border: 2.5px solid #ffffff;
                box-shadow: 0 4px 10px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.2);
                transition: all 0.2s ease;
                transform: ${isFocused ? 'scale(1.15)' : 'scale(1)'};
                cursor: pointer;
              ">
                ${stopNumber}
              </div>
            `,
            iconSize: [38, 38],
            iconAnchor: [19, 19],
            popupAnchor: [0, -19],
          });

          const marker = L.marker(latLng, { icon: customIcon }).addTo(layerGroup);
          const gmapsLink = getGoogleMapsPlaceUrl(stop);

          const popupContent = `
            <div style="min-width: 220px; font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif; padding: 12px; background: #ffffff; border-radius: 12px; color: #0f172a;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-size: 10px; font-weight: 700; color: ${color}; background: ${color}15; border: 1px solid ${color}30; padding: 2px 8px; border-radius: 9999px;">
                  Tag ${currentDay.dayNumber} · Stopp #${stopNumber}
                </span>
                <span style="font-size: 11px; color: #64748b; font-weight: 600;">${stop.time ? '🕒 ' + stop.time : ''}</span>
              </div>
              <h4 style="margin: 4px 0 2px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${stop.title}</h4>
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #64748b; line-height: 1.3;">${stop.address || ''}</p>
              ${
                stop.notes
                  ? `<div style="font-size: 11px; background: #f8fafc; border-left: 3px solid ${color}; padding: 5px 8px; margin-bottom: 8px; color: #334155; border-radius: 0 6px 6px 0; border: 1px solid #f1f5f9; border-left-color: ${color};">
                      💡 ${stop.notes}
                     </div>`
                  : ''
              }
              <div style="display: flex; gap: 6px; margin-top: 6px;">
                <a href="${gmapsLink}" target="_blank" rel="noopener noreferrer" 
                   style="flex: 1; display: inline-flex; align-items: center; justify-content: center; background: #2563eb; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 600; padding: 6px 10px; border-radius: 8px; text-align: center;">
                  🗺️ In Google Maps öffnen
                </a>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);
          marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            if (onSelectStop) onSelectStop(stop, currentDay.id);
          });

          if (isFocused) {
            marker.openPopup();
          }
        });

        // 3. Connect from PREVIOUS day (Anreise von vorherigem Tag)
        if (currentDayIndex > 0 && validStops.length > 0) {
          let prevDay: TripDay | null = null;
          for (let p = currentDayIndex - 1; p >= 0; p--) {
            if (trip.days[p].stops.some((s) => !isNaN(s.lat) && !isNaN(s.lng))) {
              prevDay = trip.days[p];
              break;
            }
          }

          if (prevDay) {
            const prevValidStops = prevDay.stops.filter((s) => !isNaN(s.lat) && !isNaN(s.lng));
            const prevLastStop = prevValidStops[prevValidStops.length - 1];
            const currentFirstStop = validStops[0];

            if (prevLastStop && currentFirstStop) {
              const prevLatLng = L.latLng(prevLastStop.lat, prevLastStop.lng);
              bounds.extend(prevLatLng);
              hasCoords = true;

              drawInterDayConnector(prevLastStop, currentFirstStop, prevDay.dayNumber, currentDay.dayNumber, 0.9);

              const prevColor = DAY_COLORS[(currentDayIndex - 1) % DAY_COLORS.length];
              const prevPin = L.divIcon({
                className: 'custom-context-pin',
                html: `
                  <div style="
                    background-color: #1e293b;
                    color: ${prevColor};
                    font-size: 10px;
                    font-weight: 700;
                    padding: 3px 8px;
                    border-radius: 9999px;
                    border: 2px solid ${prevColor};
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    cursor: pointer;
                  ">
                    <span>${trip.transportMode === 'motorcycle' ? '🏍️' : '🚗'} Start: Tag ${prevDay.dayNumber}</span>
                  </div>
                `,
                iconAnchor: [45, 12],
              });

              const prevMarker = L.marker(prevLatLng, { icon: prevPin, opacity: 0.85 }).addTo(layerGroup);
              prevMarker.bindTooltip(`📍 Anreise von Tag ${prevDay.dayNumber}: ${prevLastStop.title}`, {
                direction: 'top',
              });
              prevMarker.on('click', () => {
                if (onSelectStop && prevDay) onSelectStop(prevLastStop, prevDay.id);
              });
            }
          }
        }

        // 4. Connect to NEXT day (Weiterreise zum nächsten Tag)
        if (currentDayIndex < trip.days.length - 1 && validStops.length > 0) {
          let nextDay: TripDay | null = null;
          for (let n = currentDayIndex + 1; n < trip.days.length; n++) {
            if (trip.days[n].stops.some((s) => !isNaN(s.lat) && !isNaN(s.lng))) {
              nextDay = trip.days[n];
              break;
            }
          }

          if (nextDay) {
            const nextValidStops = nextDay.stops.filter((s) => !isNaN(s.lat) && !isNaN(s.lng));
            const nextFirstStop = nextValidStops[0];
            const currentLastStop = validStops[validStops.length - 1];

            if (nextFirstStop && currentLastStop) {
              const nextLatLng = L.latLng(nextFirstStop.lat, nextFirstStop.lng);
              bounds.extend(nextLatLng);
              hasCoords = true;

              drawInterDayConnector(currentLastStop, nextFirstStop, currentDay.dayNumber, nextDay.dayNumber, 0.9);

              const nextColor = DAY_COLORS[(currentDayIndex + 1) % DAY_COLORS.length];
              const nextPin = L.divIcon({
                className: 'custom-context-pin',
                html: `
                  <div style="
                    background-color: #1e293b;
                    color: ${nextColor};
                    font-size: 10px;
                    font-weight: 700;
                    padding: 3px 8px;
                    border-radius: 9999px;
                    border: 2px solid ${nextColor};
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    cursor: pointer;
                  ">
                    <span>${trip.transportMode === 'motorcycle' ? '🏍️' : '🚗'} Ziel: Tag ${nextDay.dayNumber}</span>
                  </div>
                `,
                iconAnchor: [45, 12],
              });

              const nextMarker = L.marker(nextLatLng, { icon: nextPin, opacity: 0.85 }).addTo(layerGroup);
              nextMarker.bindTooltip(`📍 Weiterreise zu Tag ${nextDay.dayNumber}: ${nextFirstStop.title}`, {
                direction: 'top',
              });
              nextMarker.on('click', () => {
                if (onSelectStop && nextDay) onSelectStop(nextFirstStop, nextDay.id);
              });
            }
          }
        }
      }
    }

    if (hasCoords && map && !selectedCustomPoint) {
      map.invalidateSize();
      map.fitBounds(bounds, {
        padding: [45, 45],
        maxZoom: 15,
        animate: false,
      });
    }

    return () => {
      isMounted = false;
    };
  }, [trip, selectedDayId, focusedStopId]);

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-2xl overflow-hidden shadow-inner border border-slate-800 bg-[#f1f5f9]">
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" style={{ minHeight: '100%' }} />
    </div>
  );
};
