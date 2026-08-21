import React, { useState } from 'react';
import { Trip, TransportMode, MotorcycleSettings } from '../types';
import {
  X,
  MapPin,
  Calendar,
  DollarSign,
  Car,
  Bus,
  Bike,
  Footprints,
  Flame,
  Gauge,
  Mountain,
  Fuel,
  Sparkles,
  Plus,
  Compass,
} from 'lucide-react';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrip: (newTrip: Trip) => void;
}

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  isOpen,
  onClose,
  onCreateTrip,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(nextWeekStr);
  const [daysCount, setDaysCount] = useState(7);
  const [transportMode, setTransportMode] = useState<TransportMode>('car');
  const [currency, setCurrency] = useState('€');
  const [budgetGoal, setBudgetGoal] = useState<string>('1500');
  const [description, setDescription] = useState('');

  // Motorcycle / Calimoto settings
  const [motorcycleSettings, setMotorcycleSettings] = useState<MotorcycleSettings>({
    windingProfile: 'super_curvy',
    avoidHighways: true,
    avoidTolls: false,
    fuelRangeKm: 250,
    showBikerPOIs: true,
  });

  if (!isOpen) return null;

  // Calculate days if dates change
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (val && endDate && val <= endDate) {
      const diffTime = Math.abs(new Date(endDate).getTime() - new Date(val).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setDaysCount(Math.min(30, Math.max(1, diffDays)));
    }
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    if (startDate && val && startDate <= val) {
      const diffTime = Math.abs(new Date(val).getTime() - new Date(startDate).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setDaysCount(Math.min(30, Math.max(1, diffDays)));
    }
  };

  const handleDaysCountChange = (count: number) => {
    const num = Math.min(30, Math.max(1, count));
    setDaysCount(num);
    if (startDate) {
      const endD = new Date(new Date(startDate).getTime() + (num - 1) * 86400000);
      setEndDate(endD.toISOString().split('T')[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || `Reise nach ${destination.trim() || 'Neues Ziel'}`;
    const tripId = `trip-${Date.now()}`;

    // Generate initial days
    const days = Array.from({ length: daysCount }, (_, i) => {
      const dayNum = i + 1;
      let dayDate = '';
      if (startDate) {
        const d = new Date(new Date(startDate).getTime() + i * 86400000);
        dayDate = d.toISOString().split('T')[0];
      }
      return {
        id: `day-${Date.now()}-${dayNum}`,
        dayNumber: dayNum,
        title: dayNum === 1 
          ? `Tag 1: Anreise & Erste Erkundung` 
          : `Tag ${dayNum}: Routenprogramm & Highlights`,
        theme: dayNum === 1 ? 'Ankunft & Check-in' : 'Kultur & Sehenswürdigkeiten',
        date: dayDate,
        stops: [],
      };
    });

    const newTrip: Trip = {
      id: tripId,
      title: finalTitle,
      destination: destination.trim() || 'Reiseziel',
      startDate,
      endDate,
      description: description.trim() || 'Individuell geplante Reiseroute mit Tagesetappen und Sehenswürdigkeiten.',
      transportMode,
      motorcycleSettings: transportMode === 'motorcycle' ? motorcycleSettings : undefined,
      currency,
      budgetGoal: budgetGoal ? parseFloat(budgetGoal) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      days,
    };

    onCreateTrip(newTrip);
    onClose();
  };

  const quickDestinations = [
    { name: 'Alpenpässe & Dolomiten (Calimoto)', country: 'Schweiz / Italien', transport: 'motorcycle' as TransportMode },
    { name: 'Schwarzwald Kurventour', country: 'Deutschland', transport: 'motorcycle' as TransportMode },
    { name: 'Toskana & Florenz', country: 'Italien', transport: 'car' as TransportMode },
    { name: 'Schweizer Alpen & Seen', country: 'Schweiz', transport: 'car' as TransportMode },
    { name: 'Island Ringstraße', country: 'Island', transport: 'camper' as TransportMode },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#111827] rounded-3xl shadow-2xl border border-slate-800 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-6 text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0d121d] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-['Outfit',sans-serif]">
                Neue Reise erstellen
              </h3>
              <p className="text-[11px] text-slate-400">
                Gib die Eckdaten deiner Reise ein, um deine Route zu starten
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Quick inspiration chips */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Beliebte Inspirationen & Vorlagen:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickDestinations.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setTitle(`${d.name}`);
                    setDestination(d.country);
                    setTransportMode(d.transport);
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition"
                >
                  📍 {d.name}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-1 border-t border-slate-800/80" />

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Name / Titel der Reise *
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Dolomiten Kurvenrausch oder Toskana Roadtrip"
              className="w-full text-xs font-semibold px-3 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600"
            />
          </div>

          {/* Destination */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Reiseziel / Land / Region *
            </label>
            <input
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="z.B. Dolomiten, Trentino oder Schwarzwald"
              className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600"
            />
          </div>

          {/* Dates & Number of days */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Startdatum
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
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
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Anzahl Reisetage
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={daysCount}
                  onChange={(e) => handleDaysCountChange(parseInt(e.target.value) || 1)}
                  className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Tage</span>
              </div>
            </div>
          </div>

          {/* Transport Mode */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Haupt-Fortbewegungsmittel
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { id: 'motorcycle', label: 'Motorrad', desc: 'Calimoto Kurven', icon: Flame, highlight: true },
                { id: 'car', label: 'Auto', desc: 'Klassisch', icon: Car },
                { id: 'camper', label: 'Camper', desc: 'Wohnmobil', icon: Bus },
                { id: 'transit', label: 'Bahn / ÖV', desc: 'Transit', icon: Bus },
                { id: 'bike', label: 'Fahrrad', desc: 'Velo / Gravel', icon: Bike },
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
                          : 'border-blue-500 bg-blue-950/60 text-blue-400'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${item.id === 'motorcycle' && isSelected ? 'text-orange-400 animate-pulse' : ''}`} />
                    <span className="text-[11px] font-bold truncate">{item.label}</span>
                    <span className="text-[9px] text-slate-400 font-normal truncate">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calimoto Motorcycle Features Box (appears when motorcycle is selected) */}
          {transportMode === 'motorcycle' && (
            <div className="p-4 bg-gradient-to-br from-orange-950/40 via-slate-900 to-slate-900 border border-orange-500/40 rounded-2xl space-y-3.5 animate-in fade-in zoom-in-98 duration-200 shadow-lg shadow-orange-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                    <Flame className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-orange-300">
                      Calimoto Motorrad-Routing & Kurven-Features
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Streckenoptimierung nach Kurvigkeit, Pässen und Schräglagen-Fahrspaß
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 text-[10px] font-bold rounded-full border border-orange-500/30">
                  Calimoto Modus
                </span>
              </div>

              {/* Winding Profile Selector */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Kurvigkeits-Algorithmus (Calimoto Routing):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'super_curvy', label: 'Superkurvig', desc: 'Max. Pässe & Serpentinen', icon: Mountain },
                    { id: 'curvy', label: 'Kurvig', desc: 'Schöne Landstraßen', icon: Gauge },
                    { id: 'direct', label: 'Direkt', desc: 'Schnelle Verbindung', icon: Compass },
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
                        className={`p-2 rounded-xl border text-left transition ${
                          isSelected
                            ? 'border-orange-500 bg-orange-900/40 text-orange-200'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <ProfIcon className="w-3.5 h-3.5 text-orange-400" />
                          <span className="text-xs font-bold text-slate-200">{prof.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{prof.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggles & Fuel Range */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                <label className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-xl border border-slate-800/80 cursor-pointer hover:border-slate-700">
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
                  <span className="text-slate-300 text-[11px] font-medium">Autobahnen meiden</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-xl border border-slate-800/80 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={motorcycleSettings.avoidTolls}
                    onChange={(e) =>
                      setMotorcycleSettings((prev) => ({
                        ...prev,
                        avoidTolls: e.target.checked,
                      }))
                    }
                    className="rounded text-orange-500 focus:ring-orange-500 bg-slate-800 border-slate-700"
                  />
                  <span className="text-slate-300 text-[11px] font-medium">Mautstraßen meiden</span>
                </label>

                <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800/80 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-slate-300 text-[11px] font-medium">Tankreichweite:</span>
                  </div>
                  <select
                    value={motorcycleSettings.fuelRangeKm}
                    onChange={(e) =>
                      setMotorcycleSettings((prev) => ({
                        ...prev,
                        fuelRangeKm: parseInt(e.target.value) || 250,
                      }))
                    }
                    className="bg-slate-800 text-orange-300 text-[11px] font-bold rounded px-1.5 py-0.5 border border-slate-700 focus:outline-none"
                  >
                    <option value="180">180 km</option>
                    <option value="250">250 km</option>
                    <option value="320">320 km</option>
                    <option value="400">400 km</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Currency & Budget */}
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
                value={budgetGoal}
                onChange={(e) => setBudgetGoal(e.target.value)}
                placeholder="z.B. 1500"
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Reisebeschreibung & Reisemotto (optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="z.B. Motorrad-Pässetour mit Fokus auf kurvige Straßen, Aussichtspunkte und Biker-Treffs..."
              className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-600/25 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Reise anlegen & starten</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
