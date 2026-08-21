import React, { useState, useEffect } from 'react';
import { Trip, TripDay, TripStop, StopCategory } from './types';
import { SAMPLE_TRIPS, DAY_COLORS } from './data/sampleTrips';
import { TripMap } from './components/Map/TripMap';
import { OverallRouteOverview } from './components/Overview/OverallRouteOverview';
import { DayView } from './components/DayPlanner/DayView';
import { StopModal } from './components/DayPlanner/StopModal';
import { TripSettingsModal } from './components/TripSettingsModal';
import { CreateTripModal } from './components/CreateTripModal';
import { AIAssistantModal } from './components/AI/AIAssistantModal';
import { ConfirmModal } from './components/ConfirmModal';
import { TripGuideModal } from './components/Story/TripGuideModal';
import {
  getGoogleMapsDirectionsUrl,
  optimizeRouteOrder,
} from './utils/geoUtils';
import confetti from 'canvas-confetti';
import {
  Compass,
  MapPin,
  Calendar,
  Plus,
  Settings,
  Sparkles,
  Download,
  Share2,
  Navigation,
  ExternalLink,
  ChevronDown,
  Layers,
  Printer,
  CheckCircle,
  HelpCircle,
  FileText,
  SlidersHorizontal,
  Trash2,
  BookOpen,
} from 'lucide-react';

const STORAGE_KEY = 'user_saved_trips_v2';
const ACTIVE_TRIP_ID_KEY = 'user_active_trip_id_v2';

export default function App() {
  // Load saved trips or fallback to SAMPLE_TRIPS
  const [trips, setTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved trips', e);
      }
    }
    return SAMPLE_TRIPS;
  });

  const [activeTripId, setActiveTripId] = useState<string>(() => {
    const savedId = localStorage.getItem(ACTIVE_TRIP_ID_KEY);
    if (savedId && trips.some((t) => t.id === savedId)) return savedId;
    return trips[0]?.id || SAMPLE_TRIPS[0].id;
  });

  // Active Trip object
  const activeTrip = trips.find((t) => t.id === activeTripId) || trips[0] || SAMPLE_TRIPS[0];

  // Active view: 'all' for Gesamtübersicht, or dayId
  const [selectedDayId, setSelectedDayId] = useState<string | 'all'>('all');
  const [focusedStopId, setFocusedStopId] = useState<string | null>(null);

  // Modals state
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<TripStop | null>(null);
  const [targetDayForStop, setTargetDayForStop] = useState<TripDay | null>(null);

  const [isTripSettingsOpen, setIsTripSettingsOpen] = useState(false);
  const [isCreateTripOpen, setIsCreateTripOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isTripDropdownOpen, setIsTripDropdownOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Custom Confirm Modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Save trips to local storage whenever changed
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_TRIP_ID_KEY, activeTripId);
  }, [activeTripId]);

  // Current active day object
  const currentDay = selectedDayId !== 'all'
    ? activeTrip.days.find((d) => d.id === selectedDayId) || null
    : null;

  // Helper to update current trip
  const updateActiveTrip = (updater: (prevTrip: Trip) => Trip) => {
    setTrips((prevTrips) =>
      prevTrips.map((t) => {
        if (t.id === activeTrip.id) {
          const updated = updater(t);
          return { ...updated, updatedAt: new Date().toISOString() };
        }
        return t;
      })
    );
  };

  // Add new day with automatic starting point from previous day's endpoint
  const handleAddDay = () => {
    updateActiveTrip((trip) => {
      const newDayNum = trip.days.length + 1;
      const prevDay = trip.days[trip.days.length - 1];
      let initialStops: TripStop[] = [];

      if (prevDay && prevDay.stops.length > 0) {
        const validPrevStops = prevDay.stops.filter((s) => !isNaN(s.lat) && !isNaN(s.lng));
        const lastStop = validPrevStops[validPrevStops.length - 1] || prevDay.stops[prevDay.stops.length - 1];
        if (lastStop) {
          initialStops = [
            {
              id: `stop-${Date.now()}-start`,
              title: `Start: ${lastStop.title.replace(/^Start:\s*/i, '')}`,
              category: lastStop.category === 'hotel' ? 'hotel' : 'transit',
              address: lastStop.address,
              lat: lastStop.lat,
              lng: lastStop.lng,
              time: '09:00',
              durationMinutes: 30,
              cost: 0,
              notes: `Startpunkt automatisch übernommen vom Endpunkt an Tag ${prevDay.dayNumber}`,
              googleMapsUrl: lastStop.googleMapsUrl,
              image: lastStop.image,
              completed: false,
            },
          ];
        }
      }

      const newDay: TripDay = {
        id: `day-${Date.now()}`,
        dayNumber: newDayNum,
        title: `Tag ${newDayNum}: Neue Etappe`,
        theme: 'Erkundung & Aktivitäten',
        accommodation: prevDay?.accommodation || '',
        stops: initialStops,
      };
      return { ...trip, days: [...trip.days, newDay] };
    });

    // Auto switch to the new day
    setTimeout(() => {
      const lastDay = activeTrip.days[activeTrip.days.length - 1];
      if (lastDay) setSelectedDayId(lastDay.id);
    }, 50);
  };

  // Update specific day
  const handleUpdateDay = (updatedDay: TripDay) => {
    updateActiveTrip((trip) => ({
      ...trip,
      days: trip.days.map((d) => (d.id === updatedDay.id ? updatedDay : d)),
    }));
  };

  // Delete day via styled confirmation dialog
  const handleDeleteDay = (dayId: string) => {
    const dayToDelete = activeTrip.days.find((d) => d.id === dayId);
    const dayNum = dayToDelete?.dayNumber || '';
    const dayTitle = dayToDelete?.title || '';

    setConfirmState({
      isOpen: true,
      title: `Tag ${dayNum} löschen?`,
      message: `Möchtest du "${dayTitle}" (${dayToDelete?.stops.length || 0} Stopps) wirklich dauerhaft aus deiner Reise entfernen? Die nachfolgenden Tage werden automatisch neu nummeriert.`,
      confirmLabel: `Tag ${dayNum} löschen`,
      isDestructive: true,
      onConfirm: () => {
        updateActiveTrip((trip) => {
          const filtered = trip.days.filter((d) => d.id !== dayId);
          // Renumber remaining days
          const renumbered = filtered.map((d, idx) => ({
            ...d,
            dayNumber: idx + 1,
          }));
          return { ...trip, days: renumbered };
        });
        setSelectedDayId('all');
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Delete stop via styled confirmation dialog
  const handleDeleteStop = (dayId: string, stopId: string) => {
    const day = activeTrip.days.find((d) => d.id === dayId);
    const stopToDelete = day?.stops.find((s) => s.id === stopId);
    const stopTitle = stopToDelete?.title || 'diese Station';

    setConfirmState({
      isOpen: true,
      title: 'Station entfernen?',
      message: `Möchtest du "${stopTitle}" aus Tag ${day?.dayNumber || ''} (${day?.title || ''}) löschen? Die Streckenführung wird sofort neu berechnet.`,
      confirmLabel: 'Station löschen',
      isDestructive: true,
      onConfirm: () => {
        updateActiveTrip((trip) => ({
          ...trip,
          days: trip.days.map((d) =>
            d.id === dayId
              ? { ...d, stops: d.stops.filter((s) => s.id !== stopId) }
              : d
          ),
        }));
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Delete full trip
  const handleDeleteTrip = (tripId: string) => {
    const tripToDelete = trips.find((t) => t.id === tripId);
    if (trips.length <= 1) {
      setConfirmState({
        isOpen: true,
        title: 'Reise kann nicht gelöscht werden',
        message: 'Du musst mindestens eine Reise in deinem Planer behalten. Du kannst stattdessen eine neue Reise anlegen.',
        confirmLabel: 'Schließen',
        isDestructive: false,
        onConfirm: () => setConfirmState((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }

    setConfirmState({
      isOpen: true,
      title: `Reise "${tripToDelete?.title}" löschen?`,
      message: `Möchtest du die gesamte Reise nach ${tripToDelete?.destination} mit allen ${tripToDelete?.days.length} Reisetagen unwiderruflich löschen?`,
      confirmLabel: 'Ganze Reise löschen',
      isDestructive: true,
      onConfirm: () => {
        const remaining = trips.filter((t) => t.id !== tripId);
        setTrips(remaining);
        setActiveTripId(remaining[0].id);
        setSelectedDayId('all');
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Save stop from modal
  const handleSaveStop = (stop: TripStop) => {
    const dayToUpdate = targetDayForStop || currentDay || activeTrip.days[0];
    if (!dayToUpdate) return;

    updateActiveTrip((trip) => {
      const updatedDays = trip.days.map((d) => {
        if (d.id === dayToUpdate.id) {
          const exists = d.stops.some((s) => s.id === stop.id);
          const newStops = exists
            ? d.stops.map((s) => (s.id === stop.id ? stop : s))
            : [...d.stops, stop];
          return { ...d, stops: newStops };
        }
        return d;
      });
      return { ...trip, days: updatedDays };
    });

    setEditingStop(null);
    setTargetDayForStop(null);
  };

  // Add stop from map click directly
  const handleAddStopFromMap = (
    stopData: {
      lat: number;
      lng: number;
      title: string;
      address: string;
      category: StopCategory;
      time?: string;
    },
    dayId: string
  ) => {
    const newStop: TripStop = {
      id: `stop-${Date.now()}`,
      title: stopData.title || 'Ausgewählter Ort',
      address: stopData.address || '',
      lat: stopData.lat,
      lng: stopData.lng,
      category: stopData.category,
      time: stopData.time || '10:00',
      durationMinutes: 60,
      completed: false,
    };

    updateActiveTrip((trip) => ({
      ...trip,
      days: trip.days.map((d) =>
        d.id === dayId ? { ...d, stops: [...d.stops, newStop] } : d
      ),
    }));

    setSelectedDayId(dayId);
    setFocusedStopId(newStop.id);
    confetti({ particleCount: 35, spread: 55, origin: { y: 0.6 } });
  };

  // Open modal with location from map
  const handleOpenAddStopModalWithLocation = (
    location: {
      lat: number;
      lng: number;
      title: string;
      address: string;
      category: StopCategory;
    },
    dayId: string
  ) => {
    const targetDay = activeTrip.days.find((d) => d.id === dayId) || activeTrip.days[0];
    setTargetDayForStop(targetDay);
    setEditingStop({
      id: `stop-${Date.now()}`,
      title: location.title,
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      category: location.category,
      time: '10:00',
      durationMinutes: 60,
      completed: false,
    });
    setIsStopModalOpen(true);
  };

  // Add stop from AI assistant
  const handleAddStopToDay = (dayId: string, stop: TripStop) => {
    updateActiveTrip((trip) => ({
      ...trip,
      days: trip.days.map((d) =>
        d.id === dayId ? { ...d, stops: [...d.stops, stop] } : d
      ),
    }));
  };

  // Open modal to add stop
  const handleOpenAddStop = (day?: TripDay) => {
    setTargetDayForStop(day || currentDay || activeTrip.days[0]);
    setEditingStop(null);
    setIsStopModalOpen(true);
  };

  // Open modal to edit stop
  const handleOpenEditStop = (stop: TripStop, day?: TripDay) => {
    setTargetDayForStop(day || currentDay || activeTrip.days[0]);
    setEditingStop(stop);
    setIsStopModalOpen(true);
  };

  // Optimize day route
  const handleOptimizeDayRoute = () => {
    if (!currentDay) return;
    const optimized = optimizeRouteOrder(currentDay.stops);
    handleUpdateDay({ ...currentDay, stops: optimized });
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
  };

  // Handle creating a new trip via popup mask
  const handleOpenCreateTrip = () => {
    setIsTripDropdownOpen(false);
    setIsCreateTripOpen(true);
  };

  const handleCreateTripSuccess = (newTrip: Trip) => {
    setTrips((prev) => [newTrip, ...prev]);
    setActiveTripId(newTrip.id);
    setSelectedDayId('all');
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
  };

  // Export trip data as JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeTrip, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activeTrip.title.replace(/\s+/g, '_')}_Reiseplan.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-[#0a0f18] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white font-['Outfit',sans-serif]">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#0d121d]/95 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/10">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight font-['Outfit',sans-serif] text-slate-100">
                  Reiseplaner
                </h1>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-950/60 text-blue-400 rounded-full border border-blue-800/60">
                  Google Maps & Routen
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                Interaktive Tagesplanung, Aktivitäten & Streckenoptimierung
              </p>
            </div>
          </div>

          {/* Trip Selector Dropdown & Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Trip Selector */}
            <div className="relative">
              <button
                onClick={() => setIsTripDropdownOpen(!isTripDropdownOpen)}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl transition border border-slate-800 max-w-[200px] sm:max-w-[260px] truncate"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">{activeTrip.title}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-auto" />
              </button>

              {isTripDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#111827] rounded-2xl shadow-2xl border border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Reisen & Routen
                  </div>
                  {trips.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveTripId(t.id);
                        setSelectedDayId('all');
                        setIsTripDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition ${
                        t.id === activeTrip.id
                          ? 'bg-blue-950/50 text-blue-400 font-bold border-l-2 border-blue-500'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="truncate">
                        <div className="truncate">{t.title}</div>
                        <div className="text-[10px] text-slate-500 font-normal truncate">
                          {t.destination} · {t.days.length} Tage
                        </div>
                      </div>
                      {t.id === activeTrip.id && (
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                      )}
                    </button>
                  ))}

                  <div className="pt-2 mt-2 border-t border-slate-800 px-2">
                    <button
                      onClick={handleOpenCreateTrip}
                      className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-lg shadow-blue-600/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Neue Reise erstellen</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Reise ansehen / PDF Button */}
            <button
              onClick={() => setIsGuideModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-600/25 active:scale-95"
              title="Reiseführer öffnen, visuell anschauen & als PDF exportieren"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Reise ansehen & PDF</span>
            </button>

            {/* AI Assistant Button */}
            <button
              onClick={() => setIsAIAssistantOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-800/60 transition"
              title="KI-Reiseberater starten"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">KI-Berater</span>
            </button>

            {/* Trip Settings */}
            <button
              onClick={() => setIsTripSettingsOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition border border-slate-800"
              title="Reise-Details bearbeiten"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Export JSON / Print */}
            <button
              onClick={handleExportJSON}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition border border-slate-800 hidden sm:block"
              title="Reiseplan als JSON herunterladen"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs: Gesamtübersicht + All Days */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-2xl shrink-0 border border-slate-800/80">
            {/* Gesamtübersicht Tab */}
            <button
              onClick={() => {
                setSelectedDayId('all');
                setFocusedStopId(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedDayId === 'all'
                  ? 'bg-slate-800 text-slate-100 shadow-md border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span>Gesamtübersicht (Alle Tage)</span>
            </button>

            {/* Individual Day Tabs */}
            {activeTrip.days.map((day, idx) => {
              const isActive = selectedDayId === day.id;
              const color = DAY_COLORS[idx % DAY_COLORS.length];

              return (
                <button
                  key={day.id}
                  onClick={() => {
                    setSelectedDayId(day.id);
                    setFocusedStopId(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    isActive
                      ? 'bg-slate-800 text-slate-100 shadow-md border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span>Tag {day.dayNumber}</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    ({day.stops.length})
                  </span>
                </button>
              );
            })}

            {/* Add Day Button */}
            <button
              onClick={handleAddDay}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-blue-400 hover:bg-blue-950/40 transition flex items-center gap-1"
              title="Einen weiteren Reisetag hinzufügen"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tag hinzufügen</span>
            </button>
          </div>

          {/* Quick Guide Trigger */}
          <button
            onClick={() => setIsGuideModalOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-2xl border border-slate-800 transition shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Reiseführer & PDF</span>
          </button>
        </div>

        {/* Interactive Map Component with Google Maps place selection click support */}
        <TripMap
          trip={activeTrip}
          selectedDayId={selectedDayId}
          focusedStopId={focusedStopId}
          onSelectStop={(stop, dayId) => {
            setSelectedDayId(dayId);
            setFocusedStopId(stop.id);
          }}
          onSelectDay={(dayId) => setSelectedDayId(dayId)}
          onAddStopFromMap={handleAddStopFromMap}
          onOpenAddStopModalWithLocation={handleOpenAddStopModalWithLocation}
        />

        {/* View Switcher: Gesamtübersicht vs. Tagesplanung */}
        {selectedDayId === 'all' ? (
          <OverallRouteOverview
            trip={activeTrip}
            onSelectDay={(dayId) => setSelectedDayId(dayId)}
            onAddDay={handleAddDay}
            onOpenAssistant={() => setIsAIAssistantOpen(true)}
            onOpenGuide={() => setIsGuideModalOpen(true)}
          />
        ) : (
          currentDay && (
            <DayView
              trip={activeTrip}
              day={currentDay}
              dayIndex={activeTrip.days.findIndex((d) => d.id === currentDay.id)}
              onUpdateDay={handleUpdateDay}
              onDeleteDay={handleDeleteDay}
              onDeleteStop={handleDeleteStop}
              onAddStopClick={() => handleOpenAddStop(currentDay)}
              onEditStopClick={(stop) => handleOpenEditStop(stop, currentDay)}
              onFocusStopOnMap={(stop) => {
                setFocusedStopId(stop.id);
                window.scrollTo({ top: 120, behavior: 'smooth' });
              }}
              onOptimizeDayRoute={handleOptimizeDayRoute}
              onSelectDay={(dayId) => setSelectedDayId(dayId)}
            />
          )
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#0d121d] border-t border-slate-800/80 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Reiseplaner & Routenplaner</span>
            <span>·</span>
            <span>Optimale Streckenverwaltung & Google Maps Integration</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsAIAssistantOpen(true)}
              className="text-blue-400 hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-blue-400" /> KI-Assistent
            </button>
            <a
              href={getGoogleMapsDirectionsUrl(activeTrip.days.flatMap((d) => d.stops))}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline flex items-center gap-1"
            >
              <Navigation className="w-3 h-3" /> Gesamte Route in Google Maps
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <StopModal
        isOpen={isStopModalOpen}
        onClose={() => {
          setIsStopModalOpen(false);
          setEditingStop(null);
        }}
        onSave={handleSaveStop}
        initialStop={editingStop}
        dayNumber={targetDayForStop?.dayNumber || currentDay?.dayNumber || 1}
        currency={activeTrip.currency}
      />

      <TripSettingsModal
        isOpen={isTripSettingsOpen}
        onClose={() => setIsTripSettingsOpen(false)}
        onSave={(data) => updateActiveTrip((t) => ({ ...t, ...data }))}
        onDeleteTrip={handleDeleteTrip}
        trip={activeTrip}
      />

      <CreateTripModal
        isOpen={isCreateTripOpen}
        onClose={() => setIsCreateTripOpen(false)}
        onCreateTrip={handleCreateTripSuccess}
      />

      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        trip={activeTrip}
        currentDay={currentDay}
        onAddStopToDay={handleAddStopToDay}
      />

      <TripGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        trip={activeTrip}
      />

      {/* Styled Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        isDestructive={confirmState.isDestructive}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
