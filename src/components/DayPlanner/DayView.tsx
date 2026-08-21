import React, { useState } from 'react';
import { Trip, TripDay, TripStop } from '../../types';
import {
  calculateDayMetrics,
  formatMinutes,
  getGoogleMapsDirectionsUrl,
  getGoogleMapsPlaceUrl,
  estimateDriveMetrics,
} from '../../utils/geoUtils';
import { getStopImage } from '../../utils/imageService';
import { CATEGORY_CONFIG, DAY_COLORS } from '../../data/sampleTrips';
import {
  Calendar,
  Clock,
  Car,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Navigation,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Circle,
  HelpCircle,
  Tag,
  Hotel,
  Landmark,
  Utensils,
  Ticket,
  Trees,
  Camera,
  Plane,
  ShoppingBag,
  Share2,
  ArrowRight,
  ChevronRight,
  ZoomIn,
  X,
  ImageIcon,
} from 'lucide-react';

interface DayViewProps {
  trip: Trip;
  day: TripDay;
  dayIndex: number;
  onUpdateDay: (updatedDay: TripDay) => void;
  onDeleteDay: (dayId: string) => void;
  onDeleteStop: (dayId: string, stopId: string) => void;
  onAddStopClick: () => void;
  onEditStopClick: (stop: TripStop) => void;
  onFocusStopOnMap: (stop: TripStop) => void;
  onOptimizeDayRoute: () => void;
  onSelectDay?: (dayId: string) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  trip,
  day,
  dayIndex,
  onUpdateDay,
  onDeleteDay,
  onDeleteStop,
  onAddStopClick,
  onEditStopClick,
  onFocusStopOnMap,
  onOptimizeDayRoute,
  onSelectDay,
}) => {
  const dayColor = DAY_COLORS[dayIndex % DAY_COLORS.length];

  // Find previous day with stops (to automatically take as start point)
  let prevDay: TripDay | null = null;
  let prevStop: TripStop | null = null;
  let prevMetrics: { distanceKm: number; durationMinutes: number } | null = null;

  if (dayIndex > 0) {
    for (let p = dayIndex - 1; p >= 0; p--) {
      const pStops = trip.days[p].stops.filter((s) => !isNaN(s.lat) && !isNaN(s.lng));
      if (pStops.length > 0) {
        prevDay = trip.days[p];
        prevStop = pStops[pStops.length - 1];
        if (day.stops.length > 0 && !isNaN(day.stops[0].lat)) {
          prevMetrics = estimateDriveMetrics(
            prevStop.lat,
            prevStop.lng,
            day.stops[0].lat,
            day.stops[0].lng
          );
        }
        break;
      }
    }
  }

  // Calculate day metrics and directions URL (incorporating start from previous day's endpoint)
  const metrics = calculateDayMetrics(day.stops, prevStop);
  const dayGmapsUrl = getGoogleMapsDirectionsUrl(day.stops, prevStop);

  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editTitle, setEditTitle] = useState(day.title);
  const [editTheme, setEditTheme] = useState(day.theme || '');
  const [editAccommodation, setEditAccommodation] = useState(day.accommodation || '');
  const [editNotes, setEditNotes] = useState(day.notes || '');
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<{
    url: string;
    title: string;
    category: string;
    address?: string;
  } | null>(null);

  const handleSaveHeader = () => {
    onUpdateDay({
      ...day,
      title: editTitle.trim() || `Tag ${day.dayNumber}`,
      theme: editTheme.trim(),
      accommodation: editAccommodation.trim(),
      notes: editNotes.trim(),
    });
    setIsEditingHeader(false);
  };

  const handleToggleStopCompleted = (stopId: string) => {
    const updated = day.stops.map((s) =>
      s.id === stopId ? { ...s, completed: !s.completed } : s
    );
    onUpdateDay({ ...day, stops: updated });
  };

  const handleMoveStop = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= day.stops.length) return;

    const newStops = [...day.stops];
    const [moved] = newStops.splice(index, 1);
    newStops.splice(targetIndex, 0, moved);
    onUpdateDay({ ...day, stops: newStops });
  };

  // Adopt the previous day's endpoint as the official first stop of this day
  const handleAdoptStartPoint = () => {
    if (!prevStop || !prevDay) return;
    const startStop: TripStop = {
      id: `stop-${Date.now()}-start`,
      title: `Start: ${prevStop.title.replace(/^Start:\s*/i, '')}`,
      category: prevStop.category === 'hotel' ? 'hotel' : 'transit',
      address: prevStop.address,
      lat: prevStop.lat,
      lng: prevStop.lng,
      time: '09:00',
      durationMinutes: 30,
      cost: 0,
      notes: `Startpunkt übernommen vom Endpunkt an Tag ${prevDay.dayNumber}`,
      googleMapsUrl: prevStop.googleMapsUrl,
      image: prevStop.image,
      completed: false,
    };
    onUpdateDay({ ...day, stops: [startStop, ...day.stops] });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sightseeing':
        return <Landmark className="w-4 h-4" />;
      case 'hotel':
        return <Hotel className="w-4 h-4" />;
      case 'restaurant':
        return <Utensils className="w-4 h-4" />;
      case 'activity':
        return <Ticket className="w-4 h-4" />;
      case 'nature':
        return <Trees className="w-4 h-4" />;
      case 'viewpoint':
        return <Camera className="w-4 h-4" />;
      case 'transit':
        return <Plane className="w-4 h-4" />;
      case 'shopping':
        return <ShoppingBag className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  // Find next day with stops
  let nextDay: TripDay | null = null;
  let nextStop: TripStop | null = null;
  let nextMetrics: { distanceKm: number; durationMinutes: number } | null = null;

  if (dayIndex < trip.days.length - 1) {
    for (let n = dayIndex + 1; n < trip.days.length; n++) {
      const nStops = trip.days[n].stops.filter((s) => !isNaN(s.lat) && !isNaN(s.lng));
      if (nStops.length > 0) {
        nextDay = trip.days[n];
        nextStop = nStops[0];
        if (day.stops.length > 0 && !isNaN(day.stops[day.stops.length - 1].lat)) {
          const curLast = day.stops[day.stops.length - 1];
          nextMetrics = estimateDriveMetrics(curLast.lat, curLast.lng, nextStop.lat, nextStop.lng);
        }
        break;
      } else if (!nextDay) {
        nextDay = trip.days[n];
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Day Header Card */}
      <div className="bg-[#111827] rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: dayColor }}
        />

        {isEditingHeader ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Tag {day.dayNumber} bearbeiten
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveHeader}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition"
                >
                  Speichern
                </button>
                <button
                  onClick={() => setIsEditingHeader(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Abbrechen
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Tagesüberschrift / Titel:
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-sm font-semibold px-3 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600"
                placeholder="z.B. Rom Antike & Kolosseum"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Thema / Motto:
                </label>
                <input
                  type="text"
                  value={editTheme}
                  onChange={(e) => setEditTheme(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600"
                  placeholder="z.B. Kultur, Spaziergang, Kulinarik"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Unterkunft / Hotel für diesen Tag:
                </label>
                <input
                  type="text"
                  value={editAccommodation}
                  onChange={(e) => setEditAccommodation(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600"
                  placeholder="z.B. Hotel Artemide, Rom"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Wichtige Notizen für diesen Tag:
              </label>
              <textarea
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600"
                placeholder="z.B. Tickets vorab online reservieren, bequeme Schuhe anziehen..."
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-xs"
                    style={{ backgroundColor: dayColor }}
                  >
                    {day.dayNumber}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Tag {day.dayNumber} {day.date ? `· ${day.date}` : ''}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 font-['Outfit',sans-serif]">
                  {day.title}
                </h2>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsEditingHeader(true)}
                  className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition border border-slate-800"
                  title="Tag bearbeiten"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteDay(day.id)}
                  className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition border border-rose-900/40"
                  title="Diesen Tag löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Badges / Meta row */}
            <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
              {day.theme && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800/90 text-slate-200 rounded-xl border border-slate-700/60 font-medium">
                  <Tag className="w-3 h-3 text-blue-400" />
                  {day.theme}
                </span>
              )}
              {day.accommodation && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-950/60 text-indigo-300 rounded-xl border border-indigo-800/50 font-medium">
                  <Hotel className="w-3 h-3 text-indigo-400" />
                  Unterkunft: {day.accommodation}
                </span>
              )}
              {day.notes && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-950/50 text-amber-300 rounded-xl border border-amber-800/40 font-medium">
                  💡 {day.notes}
                </span>
              )}
            </div>

            {/* Day Stats Bar */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  {day.stops.length} Stationen
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <Car className="w-3.5 h-3.5 text-emerald-400" />
                  {metrics.distanceKm} km Strecke
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  ca. {formatMinutes(metrics.driveMinutes)} Fahrzeit
                </span>
                {metrics.totalCost > 0 && (
                  <span className="font-semibold text-emerald-400">
                    💰 {metrics.totalCost.toLocaleString('de-DE')} {trip.currency}
                  </span>
                )}
              </div>

              {/* Day Actions */}
              <div className="flex items-center gap-2">
                {day.stops.length > 2 && (
                  <button
                    onClick={onOptimizeDayRoute}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-800/60 transition"
                    title="Ordnet die Stopps nach kürzester Fahrtstrecke an"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Route optimieren</span>
                  </button>
                )}

                {day.stops.length > 0 && (
                  <a
                    href={dayGmapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition shadow-xs"
                    title="Tagesroute in Google Maps öffnen"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Tagesroute in Google Maps</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tages-Highlights Fotogalerie */}
      {day.stops.length > 0 && (
        <div className="bg-[#111827] rounded-2xl p-4 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>Orte & Impressionen dieses Tages</span>
            </h4>
            <span className="text-[11px] text-slate-400 font-medium">
              {day.stops.length} Stationen mit Google Maps / Reisemotiven
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-700">
            {day.stops.map((stop, sIdx) => {
              const stopImg = getStopImage(stop, trip.destination);
              return (
                <div
                  key={stop.id}
                  onClick={() =>
                    setSelectedLightboxImage({
                      url: stopImg,
                      title: stop.title,
                      category: stop.category,
                      address: stop.address,
                    })
                  }
                  className="relative group shrink-0 w-32 sm:w-40 h-24 rounded-xl overflow-hidden cursor-pointer border border-slate-700/80 shadow-md hover:border-blue-500 transition-all duration-200"
                >
                  <img
                    src={stopImg}
                    alt={stop.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  
                  {/* Number Badge */}
                  <div
                    className="absolute top-1.5 left-1.5 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                    style={{ backgroundColor: dayColor }}
                  >
                    {sIdx + 1}
                  </div>

                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition p-1 bg-black/60 rounded-md text-white">
                    <ZoomIn className="w-3 h-3" />
                  </div>

                  <div className="absolute bottom-1.5 left-2 right-2">
                    <span className="text-[11px] font-bold text-white truncate block leading-tight">
                      {stop.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* INCOMING CONNECTION BANNER (from previous day) */}
      {prevDay && prevStop && (
        <div className="bg-gradient-to-r from-sky-950/40 via-slate-900/80 to-slate-900/80 rounded-2xl p-3.5 border border-sky-800/40 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
              <Car className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
                Startpunkt automatisch von Tag {prevDay.dayNumber} ({prevDay.title})
              </span>
              <div className="text-slate-200 font-semibold truncate">
                Abfahrt bei: <span className="text-slate-100">{prevStop.title}</span>
                {prevMetrics && (
                  <span className="text-slate-400 font-normal ml-1">
                    (ca. {prevMetrics.distanceKm} km · ~{formatMinutes(prevMetrics.durationMinutes)} Fahrt zum 1. Stopp)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {(!day.stops.length || Math.abs(day.stops[0].lat - prevStop.lat) > 0.0001 || Math.abs(day.stops[0].lng - prevStop.lng) > 0.0001) && (
              <button
                onClick={handleAdoptStartPoint}
                className="px-2.5 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-[11px] font-semibold rounded-xl border border-emerald-500/40 transition flex items-center gap-1.5 shadow-xs"
                title="Endpunkt des Vortages als ersten Stopp in diesen Tag einfügen"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Als 1. Stopp übernehmen</span>
              </button>
            )}
            <button
              onClick={() => onFocusStopOnMap(prevStop!)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium rounded-xl border border-slate-700 transition"
              title="Auf der Karte anzeigen"
            >
              Startpunkt auf Karte
            </button>
            {onSelectDay && (
              <button
                onClick={() => onSelectDay(prevDay!.id)}
                className="px-2.5 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 text-[11px] font-semibold rounded-xl border border-sky-500/30 transition flex items-center gap-1"
              >
                <span>Zu Tag {prevDay.dayNumber}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stops Timeline Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100 font-['Outfit',sans-serif] flex items-center gap-2">
            <span>Aktivitäten & Routenstopps</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full border border-slate-700">
              {day.stops.length}
            </span>
          </h3>

          <button
            onClick={onAddStopClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Ort / Aktivität hinzufügen</span>
          </button>
        </div>

        {day.stops.length === 0 ? (
          <div className="bg-[#111827] rounded-2xl p-8 border border-dashed border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-950/60 text-blue-400 mx-auto flex items-center justify-center border border-blue-800/40">
              <MapPin className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-200 text-sm">
              Noch keine Orte für diesen Tag eingetragen
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Füge Sehenswürdigkeiten, Restaurants, Unterkünfte oder Aktivitäten hinzu, um deine Route optimal zu planen und mit den anderen Tagen zu verbinden.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              {prevDay && prevStop && (
                <button
                  onClick={handleAdoptStartPoint}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-xs hover:scale-[1.02] active:scale-[0.98]"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Mit Startpunkt aus Tag {prevDay.dayNumber} ({prevStop.title}) beginnen</span>
                </button>
              )}
              <button
                onClick={onAddStopClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Neuen Ort hinzufügen</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {day.stops.map((stop, index) => {
              const catConfig = CATEGORY_CONFIG[stop.category] || CATEGORY_CONFIG.sightseeing;
              const isFirst = index === 0;
              const isLast = index === day.stops.length - 1;
              const gmapsPlaceUrl = getGoogleMapsPlaceUrl(stop);

              // Calculate drive metrics to next stop if applicable
              const nextStopInDay = day.stops[index + 1];
              const driveToNext = nextStopInDay
                ? estimateDriveMetrics(stop.lat, stop.lng, nextStopInDay.lat, nextStopInDay.lng)
                : null;

              return (
                <React.Fragment key={stop.id}>
                  {/* Stop Card */}
                  <div
                    className={`group bg-[#111827] rounded-2xl p-4 sm:p-5 border transition-all duration-200 ${
                      stop.completed
                        ? 'border-slate-800/80 bg-slate-900/60 opacity-60'
                        : 'border-slate-800 hover:border-slate-700 hover:bg-[#151e30] shadow-xl'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Checkbox + Number + Title */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Checkbox toggle */}
                        <button
                          onClick={() => handleToggleStopCompleted(stop.id)}
                          className="mt-0.5 text-slate-500 hover:text-emerald-400 transition shrink-0"
                          title={stop.completed ? 'Als ungeplant markieren' : 'Als erledigt markieren'}
                        >
                          {stop.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-600 group-hover:text-slate-400" />
                          )}
                        </button>

                        {/* Number Badge with Category Color */}
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: dayColor }}
                        >
                          {index + 1}
                        </div>

                        {/* Stop Image Thumbnail */}
                        <div
                          onClick={() =>
                            setSelectedLightboxImage({
                              url: getStopImage(stop, trip.destination),
                              title: stop.title,
                              category: stop.category,
                              address: stop.address,
                            })
                          }
                          className="relative group/img shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden cursor-pointer border border-slate-700/70 shadow-sm hover:border-blue-500 transition hidden xs:block"
                        >
                          <img
                            src={getStopImage(stop, trip.destination)}
                            alt={stop.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-white">
                            <ZoomIn className="w-4 h-4 drop-shadow" />
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h4
                              className={`text-sm sm:text-base font-bold truncate ${
                                stop.completed ? 'line-through text-slate-500' : 'text-slate-100'
                              }`}
                            >
                              {stop.title}
                            </h4>

                            {/* Category Badge */}
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${catConfig.bg} ${catConfig.color} ${catConfig.border}`}
                            >
                              {getCategoryIcon(stop.category)}
                              <span>{catConfig.label}</span>
                            </span>

                            {/* Time & Duration badge */}
                            {stop.time && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {stop.time}
                                {stop.durationMinutes && (
                                   <span className="text-slate-400">
                                     ({formatMinutes(stop.durationMinutes)})
                                   </span>
                                )}
                              </span>
                            )}

                            {/* Cost badge */}
                            {stop.cost !== undefined && stop.cost > 0 && (
                              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                                {stop.cost} {trip.currency}
                              </span>
                            )}
                          </div>

                          {/* Address */}
                          {stop.address && (
                            <p className="text-xs text-slate-400 flex items-center gap-1 truncate mb-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate">{stop.address}</span>
                            </p>
                          )}

                          {/* Notes / Tips */}
                          {stop.notes && (
                            <div className="text-xs bg-slate-900 border-l-2 border-amber-400 px-3 py-1.5 rounded-r-xl text-slate-300 mb-2">
                              <span className="font-semibold text-amber-300">Tipp:</span> {stop.notes}
                            </div>
                          )}

                          {/* Booking Ref */}
                          {stop.bookingRef && (
                            <div className="text-[11px] text-indigo-300 bg-indigo-950/60 border border-indigo-800/40 px-2.5 py-0.5 rounded-lg inline-block font-mono">
                              Buchung: {stop.bookingRef}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Move Up */}
                        <button
                          onClick={() => handleMoveStop(index, 'up')}
                          disabled={isFirst}
                          className={`p-1.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition ${
                            isFirst ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                          title="Nach oben verschieben"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Move Down */}
                        <button
                          onClick={() => handleMoveStop(index, 'down')}
                          disabled={isLast}
                          className={`p-1.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition ${
                            isLast ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                          title="Nach unten verschieben"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Center on map */}
                        <button
                          onClick={() => onFocusStopOnMap(stop)}
                          className="p-1.5 rounded-xl border border-slate-800 text-blue-400 hover:bg-blue-950/50 hover:border-blue-800/60 transition"
                          title="Auf Karte zentrieren"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </button>

                        {/* Google Maps link */}
                        <a
                          href={gmapsPlaceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition"
                          title="In Google Maps öffnen"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {/* Edit */}
                        <button
                          onClick={() => onEditStopClick(stop)}
                          className="p-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                          title="Station bearbeiten"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteStop(day.id, stop.id)}
                          className="p-1.5 rounded-xl border border-rose-900/40 text-rose-400 hover:bg-rose-950/40 transition"
                          title="Station löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Route Leg Connector to next stop within day */}
                  {driveToNext && (
                    <div className="flex items-center justify-center my-1.5">
                      <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/90 text-slate-400 text-[11px] font-medium rounded-full border border-slate-800 shadow-2xs">
                        <Car className="w-3 h-3 text-blue-400" />
                        <span>
                          {driveToNext.distanceKm} km · ca. {formatMinutes(driveToNext.durationMinutes)} Fahrt
                        </span>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=${stop.lat},${stop.lng}&destination=${nextStopInDay.lat},${nextStopInDay.lng}&travelmode=driving`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline inline-flex items-center gap-0.5 ml-1 font-semibold"
                          title="Direkte Navigation zwischen diesen beiden Orten"
                        >
                          Maps <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* OUTGOING CONNECTION BANNER (to next day) */}
      {nextDay && (
        <div className="bg-gradient-to-r from-slate-900/80 via-slate-900/80 to-blue-950/40 rounded-2xl p-4 border border-blue-800/40 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                Weiterreise / Verbindung zu Tag {nextDay.dayNumber}
              </span>
              {nextStop ? (
                <div className="text-slate-200 font-semibold truncate">
                  Ziel: <span className="text-slate-100">{nextStop.title}</span>
                  {nextMetrics && (
                    <span className="text-slate-400 font-normal ml-1">
                      (ca. {nextMetrics.distanceKm} km · ~{formatMinutes(nextMetrics.durationMinutes)} Fahrt)
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-slate-400 italic">
                  Tag {nextDay.dayNumber} hat noch keine Stationen.
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {nextStop && (
              <button
                onClick={() => onFocusStopOnMap(nextStop!)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium rounded-xl border border-slate-700 transition"
                title="Auf der Karte anzeigen"
              >
                Ziel auf Karte
              </button>
            )}
            {onSelectDay && (
              <button
                onClick={() => onSelectDay(nextDay!.id)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-xl transition flex items-center gap-1 shadow-md shadow-blue-600/20"
              >
                <span>Zu Tag {nextDay.dayNumber}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Modal for enlarged photo viewing */}
      {selectedLightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedLightboxImage(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-72 sm:h-96 w-full bg-black flex items-center justify-center">
              <img
                src={selectedLightboxImage.url}
                alt={selectedLightboxImage.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedLightboxImage(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                  {selectedLightboxImage.category}
                </span>
                <h3 className="text-lg font-bold text-white">
                  {selectedLightboxImage.title}
                </h3>
                {selectedLightboxImage.address && (
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{selectedLightboxImage.address}</span>
                  </p>
                )}
              </div>

              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(
                  selectedLightboxImage.title + ' ' + (selectedLightboxImage.address || '')
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shrink-0"
              >
                <span>Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
