import React, { useState } from 'react';
import { Trip, TripDay, TripStop } from '../../types';
import {
  calculateTripMetrics,
  formatMinutes,
  getGoogleMapsDirectionsUrl,
  calculateDayMetrics,
  calculateMotorcycleMetrics,
  generateGPXContent,
  downloadGPX,
} from '../../utils/geoUtils';
import { getStopImage } from '../../utils/imageService';
import { DAY_COLORS, CATEGORY_CONFIG } from '../../data/sampleTrips';
import {
  Compass,
  MapPin,
  Clock,
  Car,
  Wallet,
  Calendar,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Plus,
  Route as RouteIcon,
  CheckCircle2,
  Navigation,
  BookOpen,
  ImageIcon,
  Maximize2,
  X,
  Flame,
  Download,
  Mountain,
  Gauge,
  Fuel,
  TrendingUp,
} from 'lucide-react';

interface OverallRouteOverviewProps {
  trip: Trip;
  onSelectDay: (dayId: string) => void;
  onAddDay: () => void;
  onOpenAssistant: () => void;
  onOpenGuide?: () => void;
}

export const OverallRouteOverview: React.FC<OverallRouteOverviewProps> = ({
  trip,
  onSelectDay,
  onAddDay,
  onOpenAssistant,
  onOpenGuide,
}) => {
  const metrics = calculateTripMetrics(trip);
  const allStops = trip.days.flatMap((d) => d.stops);
  const fullRouteMapsUrl = getGoogleMapsDirectionsUrl(allStops);
  const isMotorcycle = trip.transportMode === 'motorcycle';
  const motoMetrics = isMotorcycle ? calculateMotorcycleMetrics(trip) : null;

  const [selectedLightboxImg, setSelectedLightboxImg] = useState<{
    url: string;
    title: string;
    dayNum: number;
    address?: string;
  } | null>(null);

  const handleDownloadGPX = (day?: TripDay) => {
    const xml = generateGPXContent(trip, day);
    const filename = day
      ? `${trip.title.replace(/\s+/g, '_')}_Tag${day.dayNumber}.gpx`
      : `${trip.title.replace(/\s+/g, '_')}_Calimoto_Route.gpx`;
    downloadGPX(filename, xml);
  };

  // Find start and end place titles
  const firstStop = allStops[0];
  const lastStop = allStops[allStops.length - 1];

  return (
    <div className="space-y-6">
      {/* Top Banner with Key Highlights */}
      <div className="relative bg-[#0d121d] border border-slate-800 rounded-3xl p-6 lg:p-8 text-white shadow-2xl overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full text-xs font-semibold text-blue-400 border border-blue-500/20">
                  <Compass className="w-3.5 h-3.5 text-blue-400" />
                  <span>Gesamtübersicht der Reiseroute</span>
                </div>
                {isMotorcycle && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/15 rounded-full text-xs font-bold text-orange-400 border border-orange-500/30">
                    <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                    <span>Calimoto Kurvenmodus</span>
                  </div>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 font-['Outfit',sans-serif]">
                {trip.title}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                {trip.description}
              </p>
            </div>

            {/* Main Actions: Open Full Route in Google Maps, Guide & AI & GPX */}
            <div className="flex flex-wrap gap-2.5">
              {isMotorcycle && (
                <button
                  onClick={() => handleDownloadGPX()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-lg shadow-orange-600/25 hover:scale-[1.02] active:scale-[0.98]"
                  title="Route als GPX-Datei für Calimoto App, Garmin, TomTom oder BMW Motorrad exportieren"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>Calimoto GPX Export</span>
                </button>
              )}

              {onOpenGuide && (
                <button
                  onClick={onOpenGuide}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-lg shadow-blue-600/25 hover:scale-[1.02] active:scale-[0.98]"
                  title="Öffnet die Reise als gestalteten Reiseführer mit PDF Export"
                >
                  <BookOpen className="w-4 h-4 text-white" />
                  <span>Reise ansehen & PDF</span>
                </button>
              )}

              {allStops.length > 0 && (
                <a
                  href={fullRouteMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600/80 hover:bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98]"
                  title="Öffnet alle Stationen als zusammenhängende Route in Google Maps"
                >
                  <Navigation className="w-4 h-4 text-white" />
                  <span>Google Maps Route</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              )}

              <button
                onClick={onOpenAssistant}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold rounded-xl border border-slate-700/80 transition hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>KI-Routenberater</span>
              </button>
            </div>
          </div>

          {/* Calimoto Special Motorcycle Metrics Widget */}
          {isMotorcycle && motoMetrics && (
            <div className="bg-gradient-to-r from-orange-950/60 via-slate-900 to-slate-900 border border-orange-500/40 rounded-2xl p-4 mb-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider block">
                      Calimoto Kurven-Analyse
                    </span>
                    <span className="text-sm font-bold text-slate-100">
                      {motoMetrics.curvinessLabel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-orange-400 font-['Outfit',sans-serif]">
                    {motoMetrics.curvinessScore}
                  </span>
                  <span className="text-xs text-orange-300 font-semibold">/ 100 Kurven-Index</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-orange-500/20">
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-orange-500/20">
                  <span className="text-[10px] text-slate-400 block">Geschätzte Kurven</span>
                  <span className="text-sm font-bold text-orange-300 flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-orange-400" />
                    ~{motoMetrics.estimatedCurves.toLocaleString('de-DE')} Kurven
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-orange-500/20">
                  <span className="text-[10px] text-slate-400 block">Höhenmeter gesamt</span>
                  <span className="text-sm font-bold text-slate-200 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    +{motoMetrics.estimatedElevationGain.toLocaleString('de-DE')} m
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-orange-500/20">
                  <span className="text-[10px] text-slate-400 block">Pässe / Bergstraßen</span>
                  <span className="text-sm font-bold text-slate-200 flex items-center gap-1">
                    <Mountain className="w-3.5 h-3.5 text-blue-400" />
                    {motoMetrics.passCount} Alpenpässe
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-orange-500/20">
                  <span className="text-[10px] text-slate-400 block">Tankreichweite</span>
                  <span className="text-sm font-bold text-slate-200 flex items-center gap-1">
                    <Fuel className="w-3.5 h-3.5 text-amber-400" />
                    ca. {motoMetrics.fuelRange} km ({motoMetrics.fuelStopsNeeded} Tankstopps)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Journey Waypoint Track Preview */}
          {firstStop && (
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                      Startpunkt (Tag 1)
                    </span>
                    <span className="font-semibold text-slate-200">
                      {firstStop.title}
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex flex-1 items-center px-4">
                  <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500/60 via-blue-500/60 to-rose-500/60 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2.5 py-0.5 bg-slate-900 text-[10px] font-bold text-blue-300 rounded-full border border-slate-700">
                      {metrics.totalDistanceKm} km · {trip.days.length} Tage
                    </div>
                  </div>
                </div>

                {lastStop && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400 ring-4 ring-rose-400/20" />
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                        Zielort (Tag {trip.days.length})
                      </span>
                      <span className="font-semibold text-slate-200">
                        {lastStop.title}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-3.5">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Car className="w-4 h-4 text-blue-400" />
                <span>Gesamtstrecke</span>
              </div>
              <div className="text-xl font-bold text-slate-100 font-['Outfit',sans-serif]">
                {metrics.totalDistanceKm} <span className="text-xs font-normal text-slate-400">km</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                ca. {formatMinutes(metrics.totalDriveMinutes)} Fahrzeit
              </div>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-3.5">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Reisedauer</span>
              </div>
              <div className="text-xl font-bold text-slate-100 font-['Outfit',sans-serif]">
                {trip.days.length} <span className="text-xs font-normal text-slate-400">Tage</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {trip.startDate} bis {trip.endDate}
              </div>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-3.5">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>Stopps & Orte</span>
              </div>
              <div className="text-xl font-bold text-slate-100 font-['Outfit',sans-serif]">
                {metrics.totalStops} <span className="text-xs font-normal text-slate-400">Stationen</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Über alle Reisetage
              </div>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-3.5">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Wallet className="w-4 h-4 text-purple-400" />
                <span>Geplante Ausgaben</span>
              </div>
              <div className="text-xl font-bold text-slate-100 font-['Outfit',sans-serif]">
                {metrics.totalCost.toLocaleString('de-DE')} {trip.currency}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {trip.budgetGoal ? `von ${trip.budgetGoal} ${trip.currency} Budget` : 'Tickets, Essen & Eintritte'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Highlights & Photos Section */}
      {allStops.length > 0 && (
        <div className="bg-[#0d121d] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-['Outfit',sans-serif]">
                  Stationen & Sehenswürdigkeiten im Überblick
                </h3>
                <p className="text-[11px] text-slate-400">
                  Automatisch geladene Bilder aus Google Maps & Wikipedia
                </p>
              </div>
            </div>
            {onOpenGuide && (
              <button
                onClick={onOpenGuide}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
              >
                <span>Alle im Reiseführer ansehen</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
            {trip.days.flatMap((day) =>
              day.stops.map((stop) => {
                const img = stop.image || getStopImage(stop, trip.destination);
                return (
                  <div
                    key={stop.id}
                    onClick={() =>
                      setSelectedLightboxImg({
                        url: img,
                        title: stop.title,
                        dayNum: day.dayNumber,
                        address: stop.address,
                      })
                    }
                    className="group/card relative w-44 h-32 rounded-2xl overflow-hidden shrink-0 border border-slate-800 hover:border-blue-500/50 shadow-md cursor-pointer transition-all duration-300 hover:scale-[1.03]"
                  >
                    <img
                      src={img}
                      alt={stop.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-between p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-blue-300 backdrop-blur-xs border border-white/10">
                          Tag {day.dayNumber}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-black/50 backdrop-blur-xs flex items-center justify-center text-white/80 opacity-0 group-hover/card:opacity-100 transition">
                          <Maximize2 className="w-3 h-3" />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white line-clamp-1 group-hover/card:text-blue-300 transition">
                          {stop.title}
                        </div>
                        {stop.address && (
                          <div className="text-[10px] text-slate-300/80 line-clamp-1">
                            {stop.address}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Day by Day Itinerary Cards Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100 font-['Outfit',sans-serif] flex items-center gap-2">
              <span>Etappen & Tagesverlauf</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full border border-slate-700">
                {trip.days.length} Tage
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Klicke auf einen Tag, um die detaillierten Zeiten, Notizen und Routen zu bearbeiten.
            </p>
          </div>

          <button
            onClick={onAddDay}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 text-xs font-semibold rounded-xl border border-blue-500/30 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Neuen Tag hinzufügen</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trip.days.map((day, index) => {
            const dayMetrics = calculateDayMetrics(day.stops);
            const color = DAY_COLORS[index % DAY_COLORS.length];
            const dayGmapsUrl = getGoogleMapsDirectionsUrl(day.stops);

            return (
              <div
                key={day.id}
                onClick={() => onSelectDay(day.id)}
                className="group relative bg-[#111827] hover:bg-[#151e30] rounded-2xl p-5 border border-slate-800 hover:border-slate-700 shadow-xl transition cursor-pointer flex flex-col justify-between"
              >
                {/* Day Header */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-xs"
                        style={{ backgroundColor: color }}
                      >
                        {day.dayNumber}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                          Tag {day.dayNumber} {day.date ? `· ${day.date}` : ''}
                        </span>
                        <h4 className="text-base font-bold text-slate-200 group-hover:text-blue-400 transition">
                          {day.title}
                        </h4>
                      </div>
                    </div>

                    <div className="p-1.5 rounded-xl bg-slate-800/80 group-hover:bg-blue-500/20 text-slate-500 group-hover:text-blue-400 transition border border-slate-700/50">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  {day.theme && (
                    <p className="text-xs text-slate-400 mb-3 font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      {day.theme}
                    </p>
                  )}

                  {/* Stops list pills */}
                  <div className="space-y-1.5 mb-4">
                    {day.stops.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">
                        Noch keine Stopps für diesen Tag hinzugefügt.
                      </p>
                    ) : (
                      day.stops.slice(0, 3).map((stop, sIdx) => {
                        const cat = CATEGORY_CONFIG[stop.category] || CATEGORY_CONFIG.sightseeing;
                        return (
                          <div
                            key={stop.id}
                            className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-slate-900/80 border border-slate-800"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-semibold text-slate-500 text-[11px] w-4">
                                {sIdx + 1}.
                              </span>
                              <span className="font-medium text-slate-300 truncate">
                                {stop.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 shrink-0">
                              {stop.time || cat.label}
                            </span>
                          </div>
                        );
                      })
                    )}
                    {day.stops.length > 3 && (
                      <div className="text-[11px] text-slate-400 font-medium pl-2">
                        + {day.stops.length - 3} weitere Stationen
                      </div>
                    )}
                  </div>
                </div>

                {/* Day Footer stats */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-slate-500" />
                      {dayMetrics.distanceKm} km
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {formatMinutes(dayMetrics.driveMinutes)}
                    </span>
                    {dayMetrics.totalCost > 0 && (
                      <span className="font-medium text-slate-300">
                        {dayMetrics.totalCost} {trip.currency}
                      </span>
                    )}
                  </div>

                  <a
                    href={dayGmapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 hover:underline"
                    title="Diesen Tag in Google Maps navigieren"
                  >
                    <span>Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedLightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedLightboxImg(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-[#111827] rounded-3xl overflow-hidden border border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video w-full bg-slate-950">
              <img
                src={selectedLightboxImg.url}
                alt={selectedLightboxImg.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedLightboxImg(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white inline-block mb-1">
                  Tag {selectedLightboxImg.dayNum}
                </span>
                <h3 className="text-lg font-bold text-white">
                  {selectedLightboxImg.title}
                </h3>
                {selectedLightboxImg.address && (
                  <p className="text-xs text-slate-300">
                    {selectedLightboxImg.address}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
