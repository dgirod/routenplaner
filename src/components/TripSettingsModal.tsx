import React, { useState, useEffect } from 'react';
import { Trip, TransportMode, MotorcycleSettings } from '../types';
import {
  X,
  Calendar,
  MapPin,
  DollarSign,
  Car,
  Bus,
  Bike,
  Footprints,
  Flame,
  Gauge,
  Mountain,
  Fuel,
  Shield,
  Trash2,
  Route as RouteIcon,
  Compass,
} from 'lucide-react';

interface TripSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tripData: Partial<Trip>) => void;
  onDeleteTrip?: (tripId: string) => void;
  trip: Trip;
}

export const TripSettingsModal: React.FC<TripSettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDeleteTrip,
  trip,
}) => {
  const [title, setTitle] = useState(trip.title);
  const [destination, setDestination] = useState(trip.destination);
  const [startDate, setStartDate] = useState(trip.startDate);
  const [endDate, setEndDate] = useState(trip.endDate);
  const [description, setDescription] = useState(trip.description);
  const [transportMode, setTransportMode] = useState<TransportMode>(trip.transportMode);
  const [motorcycleSettings, setMotorcycleSettings] = useState<MotorcycleSettings>(
    trip.motorcycleSettings || {
      windingProfile: 'super_curvy',
      avoidHighways: true,
      avoidTolls: false,
      fuelRangeKm: 250,
      showBikerPOIs: true,
    }
  );
  const [currency, setCurrency] = useState(trip.currency);
  const [budgetGoal, setBudgetGoal] = useState<number | undefined>(trip.budgetGoal);

  useEffect(() => {
    setTitle(trip.title);
    setDestination(trip.destination);
    setStartDate(trip.startDate);
    setEndDate(trip.endDate);
    setDescription(trip.description);
    setTransportMode(trip.transportMode);
    setMotorcycleSettings(
      trip.motorcycleSettings || {
        windingProfile: 'super_curvy',
        avoidHighways: true,
        avoidTolls: false,
        fuelRangeKm: 250,
        showBikerPOIs: true,
      }
    );
    setCurrency(trip.currency);
    setBudgetGoal(trip.budgetGoal);
  }, [trip, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: title.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      description: description.trim(),
      transportMode,
      motorcycleSettings: motorcycleSettings,
      currency,
      budgetGoal: budgetGoal ? Number(budgetGoal) : undefined,
    });
    onClose();
  };

  const isMotorcycle = transportMode === 'motorcycle';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#111827] rounded-3xl shadow-2xl border border-slate-800 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-100">
        <div className="px-6 py-4 bg-[#0d121d] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-slate-100 font-['Outfit',sans-serif]">
              Reise- & Routen-Einstellungen
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Name der Reise *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Reiseziel / Region
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="z.B. Toskana, Schweizer Alpen, Schwarzwald"
              className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Startdatum
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Enddatum
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Fortbewegungsmittel & Routenart
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { id: 'motorcycle', label: 'Motorrad', desc: 'Calimoto Kurven', icon: Flame },
                { id: 'car', label: 'Auto', desc: 'PKW', icon: Car },
                { id: 'camper', label: 'Camper', desc: 'Wohnmobil', icon: Bus },
                { id: 'bike', label: 'Fahrrad', desc: 'Velo', icon: Bike },
                { id: 'walk', label: 'Zu Fuß', desc: 'Wandern', icon: Footprints },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = transportMode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTransportMode(item.id as TransportMode)}
                    className={`p-2.5 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1 transition ${
                      isSelected
                        ? item.id === 'motorcycle'
                          ? 'border-orange-500 bg-orange-950/60 text-orange-400 ring-2 ring-orange-500/30'
                          : 'border-blue-500 bg-blue-950/60 text-blue-400 ring-2 ring-blue-500/30'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${item.id === 'motorcycle' && isSelected ? 'text-orange-400' : ''}`} />
                    <span className="text-[11px] font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Route & Curve Settings Panel (Motorrad & Auto / Camper) */}
          <div
            className={`p-4 rounded-2xl border space-y-3 transition-all ${
              isMotorcycle
                ? 'bg-gradient-to-br from-orange-950/40 via-slate-900 to-slate-900 border-orange-500/40'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    isMotorcycle ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {isMotorcycle ? <Flame className="w-3.5 h-3.5" /> : <RouteIcon className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <span className={`text-xs font-bold ${isMotorcycle ? 'text-orange-300' : 'text-slate-200'}`}>
                    {isMotorcycle ? 'Calimoto Kurven- & Routenführung' : 'Routen-Präferenzen & Straßenwahl'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Reale Straßenführung (keine Luftlinien)
                  </span>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                  isMotorcycle
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                }`}
              >
                {isMotorcycle ? 'Calimoto Modus' : 'Straßen-Routing'}
              </span>
            </div>

            {/* Profile Selection */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                {isMotorcycle ? 'Kurvenprofil für Pässe & Nebenstraßen:' : 'Streckencharakteristik:'}
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  {
                    id: 'super_curvy',
                    label: isMotorcycle ? 'Superkurvig' : 'Sehr Landschaftlich',
                    desc: 'Pässe & Kurven',
                    icon: Mountain,
                  },
                  {
                    id: 'curvy',
                    label: isMotorcycle ? 'Kurvig' : 'Malerisch / Landstr.',
                    desc: 'Flüssige Kurven',
                    icon: Gauge,
                  },
                  {
                    id: 'direct',
                    label: 'Direkt / Schnell',
                    desc: 'Kürzeste Zeit',
                    icon: Car,
                  },
                ].map((prof) => {
                  const ProfIcon = prof.icon;
                  const isSelected = motorcycleSettings.windingProfile === prof.id;
                  return (
                    <button
                      key={prof.id}
                      type="button"
                      onClick={() =>
                        setMotorcycleSettings((prev) => ({
                          ...prev,
                          windingProfile: prof.id as any,
                        }))
                      }
                      className={`p-2 rounded-xl border text-center transition text-[11px] font-semibold flex flex-col items-center gap-0.5 ${
                        isSelected
                          ? isMotorcycle
                            ? 'border-orange-500 bg-orange-900/40 text-orange-200 ring-1 ring-orange-500/40'
                            : 'border-blue-500 bg-blue-900/40 text-blue-200 ring-1 ring-blue-500/40'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ProfIcon className={`w-3.5 h-3.5 ${isSelected ? (isMotorcycle ? 'text-orange-400' : 'text-blue-400') : 'text-slate-500'}`} />
                      <span className="font-bold">{prof.label}</span>
                      <span className="text-[9px] text-slate-500">{prof.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Avoid Highway & Avoid Tolls Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
              <label className="flex items-center gap-2 p-2 bg-slate-900/90 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={motorcycleSettings.avoidHighways}
                  onChange={(e) =>
                    setMotorcycleSettings((prev) => ({
                      ...prev,
                      avoidHighways: e.target.checked,
                    }))
                  }
                  className="rounded text-orange-500 focus:ring-orange-500 bg-slate-800 border-slate-700"
                />
                <div>
                  <span className="text-slate-200 font-semibold block">Autobahn meiden</span>
                  <span className="text-[10px] text-slate-400">Bevorzugt Land- & Passstraßen</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-900/90 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={motorcycleSettings.avoidTolls}
                  onChange={(e) =>
                    setMotorcycleSettings((prev) => ({
                      ...prev,
                      avoidTolls: e.target.checked,
                    }))
                  }
                  className="rounded text-blue-500 focus:ring-blue-500 bg-slate-800 border-slate-700"
                />
                <div>
                  <span className="text-slate-200 font-semibold block">Mautstraßen meiden</span>
                  <span className="text-[10px] text-slate-400">Gebührenpflichtige Abschnitte umfahren</span>
                </div>
              </label>
            </div>

            {/* Fuel Range */}
            <div className="flex items-center justify-between p-2 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Fuel className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold">Reichweite / Tankstopps alle:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={motorcycleSettings.fuelRangeKm}
                  onChange={(e) =>
                    setMotorcycleSettings((prev) => ({
                      ...prev,
                      fuelRangeKm: parseInt(e.target.value) || 250,
                    }))
                  }
                  className="bg-slate-800 text-slate-200 text-xs font-bold rounded-lg px-2 py-1 border border-slate-700 focus:outline-none"
                >
                  <option value="150">150 km</option>
                  <option value="200">200 km</option>
                  <option value="250">250 km (Standard)</option>
                  <option value="320">320 km</option>
                  <option value="400">400 km</option>
                  <option value="600">600 km</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Währung
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="€" className="bg-slate-900 text-slate-100">EUR (€)</option>
                <option value="CHF" className="bg-slate-900 text-slate-100">CHF (Schweizer Franken)</option>
                <option value="$" className="bg-slate-900 text-slate-100">USD ($)</option>
                <option value="£" className="bg-slate-900 text-slate-100">GBP (£)</option>
                <option value="¥" className="bg-slate-900 text-slate-100">JPY (¥)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Budgetziel ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={budgetGoal || ''}
                onChange={(e) => setBudgetGoal(parseFloat(e.target.value) || undefined)}
                placeholder="z.B. 1500"
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Beschreibung & Reisetraum
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kurze Zusammenfassung deiner Reise..."
              className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
            {onDeleteTrip ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteTrip(trip.id);
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/40 rounded-xl transition flex items-center gap-1.5"
                title="Ganze Reise löschen"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reise löschen</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-600/20"
              >
                Speichern
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
