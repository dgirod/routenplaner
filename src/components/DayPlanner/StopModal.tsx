import React, { useState, useEffect } from 'react';
import { TripStop, StopCategory } from '../../types';
import { CATEGORY_CONFIG } from '../../data/sampleTrips';
import { searchLocationsNominatim } from '../../utils/geoUtils';
import { getStopImage, fetchLivePlaceImage, getAlternativeImages } from '../../utils/imageService';
import {
  X,
  Search,
  MapPin,
  Clock,
  Wallet,
  FileText,
  ExternalLink,
  Sparkles,
  Loader2,
  Navigation,
  Compass,
  ImageIcon,
  RefreshCw,
} from 'lucide-react';

interface StopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stop: TripStop) => void;
  initialStop?: TripStop | null;
  dayNumber: number;
  currency: string;
}

export const StopModal: React.FC<StopModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialStop,
  dayNumber,
  currency,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<StopCategory>('sightseeing');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number>(43.7731);
  const [lng, setLng] = useState<number>(11.2560);
  const [time, setTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number | undefined>(60);
  const [cost, setCost] = useState<number | undefined>(0);
  const [notes, setNotes] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isFetchingImage, setIsFetchingImage] = useState(false);

  // Location search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (initialStop) {
      setTitle(initialStop.title || '');
      setCategory(initialStop.category || 'sightseeing');
      setAddress(initialStop.address || '');
      setLat(initialStop.lat || 43.7731);
      setLng(initialStop.lng || 11.2560);
      setTime(initialStop.time || '');
      setDurationMinutes(initialStop.durationMinutes || 60);
      setCost(initialStop.cost || 0);
      setNotes(initialStop.notes || '');
      setGoogleMapsUrl(initialStop.googleMapsUrl || '');
      setBookingRef(initialStop.bookingRef || '');
      setImageUrl(initialStop.image || '');
    } else {
      // Defaults for a new stop
      setTitle('');
      setCategory('sightseeing');
      setAddress('');
      setLat(43.7731);
      setLng(11.2560);
      setTime('10:00');
      setDurationMinutes(60);
      setCost(0);
      setNotes('');
      setGoogleMapsUrl('');
      setBookingRef('');
      setImageUrl('');
    }
    setSearchQuery('');
    setSearchResults([]);
  }, [initialStop, isOpen]);

  // Debounced geocoding search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchLocationsNominatim(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSelectSearchResult = async (res: any) => {
    setTitle(res.name);
    setAddress(res.address);
    setLat(res.lat);
    setLng(res.lng);
    setGoogleMapsUrl(`https://maps.google.com/?q=${encodeURIComponent(res.name + ' ' + res.address)}`);
    setSearchResults([]);
    setSearchQuery('');

    // Try to auto-fetch image for this location
    setIsFetchingImage(true);
    const liveImg = await fetchLivePlaceImage(res.name, res.address);
    if (liveImg) {
      setImageUrl(liveImg);
    }
    setIsFetchingImage(false);
  };

  const handleFetchImage = async () => {
    if (!title.trim()) return;
    setIsFetchingImage(true);
    const liveImg = await fetchLivePlaceImage(title.trim(), address.trim());
    if (liveImg) {
      setImageUrl(liveImg);
    } else {
      // Use standard curated resolver as fallback
      const fallback = getStopImage({ title, category, address } as any);
      setImageUrl(fallback);
    }
    setIsFetchingImage(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalImage = imageUrl.trim() || getStopImage({ title, category, address } as any);

    const newStop: TripStop = {
      id: initialStop?.id || `stop-${Date.now()}`,
      title: title.trim(),
      category,
      address: address.trim(),
      lat: Number(lat),
      lng: Number(lng),
      time: time || undefined,
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      cost: cost ? Number(cost) : 0,
      notes: notes.trim() || undefined,
      googleMapsUrl: googleMapsUrl.trim() || `https://maps.google.com/?q=${encodeURIComponent(title.trim() + ' ' + address.trim())}`,
      bookingRef: bookingRef.trim() || undefined,
      image: finalImage,
      completed: initialStop?.completed || false,
    };

    onSave(newStop);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#111827] rounded-3xl shadow-2xl border border-slate-800 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8 text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0d121d] border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
              Tag {dayNumber} Planung
            </span>
            <h3 className="text-lg font-bold text-slate-100 font-['Outfit',sans-serif]">
              {initialStop ? 'Station / Aktivität bearbeiten' : 'Neuen Ort / Aktivität hinzufügen'}
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
          {/* Quick Search Autocomplete */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-blue-400" />
              <span>Ort suchen (Google Maps / Weltweite Orte & Sehenswürdigkeiten):</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="z.B. Kolosseum Rom, Schloss Neuschwanstein, Zürich See..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 pl-9 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin absolute right-3 top-3" />
              )}
            </div>

            {/* Search Suggestions Dropdown */}
            {searchResults.length > 0 && (
              <div className="mt-1 bg-[#0d121d] border border-slate-800 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-800/80 max-h-48 overflow-y-auto">
                {searchResults.map((res, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full text-left p-2.5 hover:bg-slate-800/80 text-xs flex items-start gap-2.5 transition"
                  >
                    <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-200">{res.name}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{res.address}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800" />

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Name des Ortes / der Aktivität *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Duomo di Firenze"
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Kategorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as StopCategory)}
                className="w-full text-xs px-2.5 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key} className="bg-slate-900 text-slate-100">
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Adresse / genaue Lage
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="z.B. Piazza del Duomo, 50122 Florenz, Italien"
              className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600"
            />
          </div>

          {/* Coordinates (Latitude / Longitude) */}
          <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-0.5">
                Breitengrad (Lat)
              </label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-0.5">
                Längengrad (Lng)
              </label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Time, Duration & Cost */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Uhrzeit</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs px-2.5 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Dauer (Minuten)
              </label>
              <input
                type="number"
                min="0"
                step="15"
                value={durationMinutes || ''}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || undefined)}
                placeholder="60"
                className="w-full text-xs px-2.5 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-slate-500" />
                <span>Kosten ({currency})</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={cost || ''}
                onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full text-xs px-2.5 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Notes & Tips */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Notizen, Tipps & Wichtiges</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="z.B. Vorher online reservieren! Parkplatz am Bahnhof nutzen."
              className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600"
            />
          </div>

          {/* Image & Photo Section */}
          <div className="bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>Foto / Bild der Station</span>
              </label>
              <button
                type="button"
                onClick={handleFetchImage}
                disabled={isFetchingImage || !title.trim()}
                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition disabled:opacity-40"
              >
                {isFetchingImage ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                <span>Automatisch suchen</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Thumbnail Preview */}
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 border border-slate-700/80 shrink-0 relative">
                <img
                  src={
                    imageUrl ||
                    getStopImage({ title: title || 'Attraktion', category, address } as any)
                  }
                  alt={title || 'Preview'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... (oder leer für Automatik)"
                  className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Wird automatisch anhand von Name und Ort geladen oder aus der Galerie gewählt.
                </span>
              </div>
            </div>

            {/* Quick Suggested Images */}
            {(() => {
              const suggestions = getAlternativeImages({ title, category, address });
              if (suggestions.length === 0) return null;
              return (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-semibold text-slate-400 block">
                    Vorgeschlagene passende Bilder (anklicken zum Übernehmen):
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {suggestions.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImageUrl(url)}
                        className={`relative w-14 h-11 rounded-lg overflow-hidden shrink-0 border transition ${
                          imageUrl === url
                            ? 'border-blue-500 ring-2 ring-blue-500/40 scale-105'
                            : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Option ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Booking Ref & Google Maps URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Buchungsreferenz / Ticket-ID
              </label>
              <input
                type="text"
                value={bookingRef}
                onChange={(e) => setBookingRef(e.target.value)}
                placeholder="z.B. TKT-984214"
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Google Maps Link (Optional)
              </label>
              <input
                type="url"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Form Footer Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
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
              {initialStop ? 'Änderungen speichern' : 'Station hinzufügen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
