import React, { useState } from 'react';
import { Trip, TripStop, StopCategory } from '../../types';
import { LeafletMapRenderer } from './LeafletMapRenderer';
import { GoogleMapRenderer } from './GoogleMapRenderer';
import { getGoogleMapsDirectionsUrl, reverseGeocodeNominatim } from '../../utils/geoUtils';
import { CATEGORY_CONFIG, DAY_COLORS } from '../../data/sampleTrips';
import {
  Map as MapIcon,
  Layers,
  Key,
  ExternalLink,
  Maximize2,
  Minimize2,
  Navigation,
  Sparkles,
  MapPin,
  Plus,
  X,
  Loader2,
  Edit2,
  Check,
  Calendar,
  Landmark,
  Utensils,
  Hotel,
  Ticket,
  Trees,
  Camera,
  Compass,
} from 'lucide-react';

interface TripMapProps {
  trip: Trip;
  selectedDayId: string | 'all';
  focusedStopId?: string | null;
  onSelectStop?: (stop: TripStop, dayId: string) => void;
  onSelectDay?: (dayId: string | 'all') => void;
  onAddStopFromMap?: (
    stopData: {
      lat: number;
      lng: number;
      title: string;
      address: string;
      category: StopCategory;
      time?: string;
    },
    dayId: string
  ) => void;
  onOpenAddStopModalWithLocation?: (
    location: {
      lat: number;
      lng: number;
      title: string;
      address: string;
      category: StopCategory;
    },
    dayId: string
  ) => void;
}

interface SelectedPointState {
  lat: number;
  lng: number;
  title: string;
  address: string;
  category: StopCategory;
  isGeocoding: boolean;
}

export const TripMap: React.FC<TripMapProps> = ({
  trip,
  selectedDayId,
  focusedStopId,
  onSelectStop,
  onSelectDay,
  onAddStopFromMap,
  onOpenAddStopModalWithLocation,
}) => {
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [userApiKey, setUserApiKey] = useState<string>(() => {
    return localStorage.getItem('gmaps_api_key') || envKey;
  });
  const [mapEngine, setMapEngine] = useState<'leaflet' | 'google'>(() => {
    return userApiKey ? 'google' : 'leaflet';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [keyInputValue, setKeyInputValue] = useState(userApiKey);
  const [isExpanded, setIsExpanded] = useState(false);

  // Selected map location state (clicked like in Google Maps)
  const [selectedPoint, setSelectedPoint] = useState<SelectedPointState | null>(null);
  const [targetDayId, setTargetDayId] = useState<string>(() => {
    return selectedDayId !== 'all' ? selectedDayId : trip.days[0]?.id || '';
  });

  const activeStops = selectedDayId === 'all'
    ? trip.days.flatMap((d) => d.stops)
    : trip.days.find((d) => d.id === selectedDayId)?.stops || [];

  const handleSaveApiKey = () => {
    setUserApiKey(keyInputValue.trim());
    localStorage.setItem('gmaps_api_key', keyInputValue.trim());
    if (keyInputValue.trim()) {
      setMapEngine('google');
    } else {
      setMapEngine('leaflet');
    }
    setIsSettingsOpen(false);
  };

  const selectedDayObj = selectedDayId !== 'all' 
    ? trip.days.find((d) => d.id === selectedDayId)
    : null;

  // Handle map click
  const handleMapClick = async (lat: number, lng: number) => {
    // Determine default target day
    const defaultDay = selectedDayId !== 'all' ? selectedDayId : (trip.days[0]?.id || '');
    setTargetDayId(defaultDay);

    setSelectedPoint({
      lat,
      lng,
      title: 'Ort wird ermittelt...',
      address: `Koordinaten: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      category: 'sightseeing',
      isGeocoding: true,
    });

    try {
      const geoResult = await reverseGeocodeNominatim(lat, lng);
      setSelectedPoint({
        lat,
        lng,
        title: geoResult.title,
        address: geoResult.address,
        category: (geoResult.category as StopCategory) || 'sightseeing',
        isGeocoding: false,
      });
    } catch {
      setSelectedPoint((prev) =>
        prev
          ? {
              ...prev,
              title: `Ausgewählter Ort (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
              isGeocoding: false,
            }
          : null
      );
    }
  };

  // Quick add clicked point
  const handleQuickAdd = () => {
    if (!selectedPoint || !onAddStopFromMap) return;
    const destDayId = targetDayId || trip.days[0]?.id;
    if (!destDayId) return;

    onAddStopFromMap(
      {
        lat: selectedPoint.lat,
        lng: selectedPoint.lng,
        title: selectedPoint.title || 'Ausgewählter Ort',
        address: selectedPoint.address || '',
        category: selectedPoint.category,
        time: '11:00',
      },
      destDayId
    );

    setSelectedPoint(null);
  };

  // Open in full modal for customization
  const handleOpenDetailedModal = () => {
    if (!selectedPoint || !onOpenAddStopModalWithLocation) return;
    const destDayId = targetDayId || trip.days[0]?.id;
    onOpenAddStopModalWithLocation(
      {
        lat: selectedPoint.lat,
        lng: selectedPoint.lng,
        title: selectedPoint.title,
        address: selectedPoint.address,
        category: selectedPoint.category,
      },
      destDayId
    );
    setSelectedPoint(null);
  };

  const getCategoryIcon = (cat: StopCategory) => {
    switch (cat) {
      case 'sightseeing': return <Landmark className="w-3.5 h-3.5" />;
      case 'restaurant': return <Utensils className="w-3.5 h-3.5" />;
      case 'hotel': return <Hotel className="w-3.5 h-3.5" />;
      case 'activity': return <Ticket className="w-3.5 h-3.5" />;
      case 'nature': return <Trees className="w-3.5 h-3.5" />;
      case 'viewpoint': return <Camera className="w-3.5 h-3.5" />;
      default: return <MapPin className="w-3.5 h-3.5" />;
    }
  };

  const categories: { key: StopCategory; label: string }[] = [
    { key: 'sightseeing', label: 'Sehenswürdigkeit' },
    { key: 'restaurant', label: 'Restaurant / Café' },
    { key: 'hotel', label: 'Unterkunft' },
    { key: 'viewpoint', label: 'Aussichtspunkt' },
    { key: 'nature', label: 'Natur & Park' },
    { key: 'activity', label: 'Aktivität' },
  ];

  return (
    <div
      className={`relative bg-[#111827] rounded-2xl shadow-xl border border-slate-800/90 overflow-hidden flex flex-col transition-all duration-300 ${
        isExpanded
          ? 'fixed inset-4 z-50 shadow-2xl h-[calc(100vh-2rem)]'
          : 'h-[460px] lg:h-[540px]'
      }`}
    >
      {/* Top Map Bar */}
      <div className="px-4 py-2.5 bg-[#0d121d] border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <MapIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-1.5 font-['Outfit',sans-serif]">
              {selectedDayId === 'all' ? (
                <>Gesamtübersicht der Route</>
              ) : (
                <>Tag {selectedDayObj?.dayNumber}: {selectedDayObj?.title}</>
              )}
              <span className="text-xs font-normal text-slate-400">
                ({activeStops.length} {activeStops.length === 1 ? 'Stopp' : 'Stopps'})
              </span>
            </h3>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Day selection pills */}
          <div className="hidden sm:flex items-center bg-slate-900/90 p-0.5 rounded-xl border border-slate-800 text-xs font-medium text-slate-400">
            <button
              onClick={() => onSelectDay && onSelectDay('all')}
              className={`px-2.5 py-1 rounded-lg transition ${
                selectedDayId === 'all'
                  ? 'bg-slate-800 text-blue-400 font-bold shadow-xs'
                  : 'hover:text-slate-200'
              }`}
            >
              Gesamte Reise
            </button>
            {trip.days.map((d) => (
              <button
                key={d.id}
                onClick={() => onSelectDay && onSelectDay(d.id)}
                className={`px-2 py-1 rounded-lg transition ${
                  selectedDayId === d.id
                    ? 'bg-slate-800 text-blue-400 font-bold shadow-xs'
                    : 'hover:text-slate-200'
                }`}
              >
                Tag {d.dayNumber}
              </button>
            ))}
          </div>

          {/* Open Route in Google Maps External */}
          {activeStops.length > 0 && (
            <a
              href={getGoogleMapsDirectionsUrl(activeStops)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 hover:text-blue-300 text-xs font-semibold rounded-xl border border-blue-500/30 transition shadow-2xs"
              title="Öffnet diese Streckenführung direkt in Google Maps für Turn-by-Turn Navigation"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">In Google Maps öffnen</span>
              <span className="md:hidden">Google Maps</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          )}

          {/* Map Layer Switcher / Settings */}
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-xl transition border border-slate-800"
            title="Karten-Ansicht & Google Maps API Konfiguration"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Fullscreen Expand toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-xl transition border border-slate-800"
            title={isExpanded ? 'Karte verkleinern' : 'Karte vergrößern'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Settings Popover */}
      {isSettingsOpen && (
        <div className="absolute top-14 right-4 z-30 bg-[#111827]/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-800 w-80 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Karten-Einstellungen
            </h4>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Karten-Ebene wählen:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMapEngine('leaflet')}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border text-center transition ${
                    mapEngine === 'leaflet'
                      ? 'border-blue-500/50 bg-blue-600/20 text-blue-400'
                      : 'border-slate-800 text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  🗺️ Standard (Google Stil)
                </button>
                <button
                  onClick={() => setMapEngine('google')}
                  disabled={!userApiKey}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border text-center transition ${
                    mapEngine === 'google'
                      ? 'border-blue-500/50 bg-blue-600/20 text-blue-400'
                      : !userApiKey
                      ? 'border-slate-800 text-slate-600 bg-slate-900/50 cursor-not-allowed'
                      : 'border-slate-800 text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  📍 Google Maps JS
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1 mb-1">
                <Key className="w-3 h-3 text-slate-500" /> Google Maps API Key (Optional):
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={keyInputValue}
                onChange={(e) => setKeyInputValue(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 placeholder:text-slate-600"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveApiKey}
                  className="flex-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded-xl transition"
                >
                  Speichern
                </button>
                {userApiKey && (
                  <button
                    onClick={() => {
                      setKeyInputValue('');
                      setUserApiKey('');
                      localStorage.removeItem('gmaps_api_key');
                      setMapEngine('leaflet');
                    }}
                    className="text-xs text-rose-400 hover:bg-rose-950/40 px-2 py-1.5 rounded-xl border border-rose-900/40 transition"
                  >
                    Entfernen
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                Hinweis: Die interaktive Karte und alle Google Maps Navigation-Links funktionieren direkt und ohne zusätzlichen Key.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Map Canvas */}
      <div className="flex-1 relative w-full h-full min-h-[300px]">
        {mapEngine === 'google' && userApiKey ? (
          <GoogleMapRenderer
            apiKey={userApiKey}
            trip={trip}
            selectedDayId={selectedDayId}
            focusedStopId={focusedStopId}
            selectedCustomPoint={selectedPoint}
            onSelectStop={onSelectStop}
            onMapClick={handleMapClick}
          />
        ) : (
          <LeafletMapRenderer
            trip={trip}
            selectedDayId={selectedDayId}
            focusedStopId={focusedStopId}
            selectedCustomPoint={selectedPoint}
            onSelectStop={onSelectStop}
            onMapClick={handleMapClick}
          />
        )}

        {/* Selected Place Overlay Card (Google Maps Style Selection) */}
        {selectedPoint && (
          <div className="absolute bottom-12 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-30 bg-[#111827]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-500/40 p-4 animate-in slide-in-from-bottom-4 duration-200 text-slate-100">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
                  <MapPin className="w-3.5 h-3.5" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                  Ort auf Karte ausgewählt
                </span>
              </div>
              <button
                onClick={() => setSelectedPoint(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Place Title & Address */}
            <div className="mb-3">
              {selectedPoint.isGeocoding ? (
                <div className="flex items-center gap-2 py-2 text-xs text-blue-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Ermittle Standort & Details...</span>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={selectedPoint.title}
                    onChange={(e) =>
                      setSelectedPoint((prev) => (prev ? { ...prev, title: e.target.value } : null))
                    }
                    className="w-full font-bold text-sm bg-slate-900/90 border border-slate-700/80 text-slate-100 px-2.5 py-1.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none mb-1"
                    placeholder="Name des Ortes..."
                  />
                  <p className="text-[11px] text-slate-400 line-clamp-2 px-1">
                    {selectedPoint.address}
                  </p>
                </>
              )}
            </div>

            {/* Category selection */}
            <div className="mb-3">
              <span className="text-[10px] font-semibold text-slate-400 block mb-1.5">
                Kategorie:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() =>
                      setSelectedPoint((prev) => (prev ? { ...prev, category: c.key } : null))
                    }
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition ${
                      selectedPoint.category === c.key
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {getCategoryIcon(c.key)}
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Day Selector */}
            <div className="mb-4">
              <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                Zu welchem Reisetag hinzufügen?
              </label>
              <select
                value={targetDayId}
                onChange={(e) => setTargetDayId(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {trip.days.map((d) => (
                  <option key={d.id} value={d.id}>
                    Tag {d.dayNumber}: {d.title} ({d.stops.length} Stopps)
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleQuickAdd}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Station hinzufügen</span>
              </button>

              <button
                type="button"
                onClick={handleOpenDetailedModal}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition border border-slate-700 flex items-center justify-center gap-1"
                title="Mit Zeiten, Budget und Notizen öffnen"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Details</span>
              </button>
            </div>
          </div>
        )}

        {/* Legend / Hint Overlay at bottom left */}
        <div className="absolute bottom-3 left-3 z-10 bg-[#0d121d]/90 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-slate-800 text-xs hidden sm:flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-blue-500 inline-block" />
            <span className="text-slate-300 font-medium text-[11px]">Tagesrouten</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-sky-400 inline-block" />
            <span className="text-sky-300 font-medium text-[11px]">Tagesübergang (Etappe)</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] inline-block" />
            <span className="text-slate-400 text-[11px]">Klick auf Karte: Ort hinzufügen</span>
          </div>
        </div>
      </div>
    </div>
  );
};
