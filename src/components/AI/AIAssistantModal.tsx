import React, { useState } from 'react';
import { Trip, TripDay, TripStop } from '../../types';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Plus,
  Loader2,
  Check,
  MapPin,
  Clock,
  Compass,
  AlertCircle,
} from 'lucide-react';
import { searchLocationsNominatim } from '../../utils/geoUtils';
import { getStopImage } from '../../utils/imageService';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  currentDay?: TripDay | null;
  onAddStopToDay: (dayId: string, stop: TripStop) => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  suggestedStops?: Array<{
    title: string;
    category: any;
    address: string;
    lat: number;
    lng: number;
    time?: string;
    durationMinutes?: number;
    cost?: number;
    notes?: string;
  }>;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  trip,
  currentDay,
  onAddStopToDay,
}) => {
  // Compute geographic center or reference point for the active day / trip
  const allStops = trip.days.flatMap((d) => d.stops);
  const currentDayStops = currentDay?.stops || [];
  const referenceStop = currentDayStops[0] || allStops[0];

  const centerLat = referenceStop?.lat || 43.7731;
  const centerLng = referenceStop?.lng || 11.2560;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hallo! Ich bin dein KI-Reiseberater für "${trip.title}" (${trip.destination}). Wie kann ich dir bei deiner Routen- und Tagesplanung helfen?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [addedStops, setAddedStops] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || isLoading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/trip-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          tripContext: {
            title: trip.title,
            destination: trip.destination,
            transportMode: trip.transportMode,
            currentDayNumber: currentDay?.dayNumber,
            currentDayTitle: currentDay?.title,
            centerLat,
            centerLng,
            existingStops: (currentDay?.stops || []).map((s) => ({
              title: s.title,
              address: s.address,
            })),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler bei der Serveranfrage');
      }

      const data = await response.json();
      let rawStops = data.suggestedStops || [];

      // Validate coordinates for each suggested stop
      const validatedStops = await Promise.all(
        rawStops.map(async (s: any) => {
          let stopLat = s.lat;
          let stopLng = s.lng;

          // Check if coordinates seem completely out of range (e.g. 0, 0 or far off destination)
          const isFarOff =
            !stopLat ||
            !stopLng ||
            isNaN(stopLat) ||
            isNaN(stopLng) ||
            (Math.abs(stopLat - centerLat) > 8 && Math.abs(stopLng - centerLng) > 8);

          if (isFarOff) {
            // Attempt to geocode precisely in the region of the trip
            try {
              const query = `${s.title}, ${s.address || ''}, ${trip.destination}`;
              const geoResults = await searchLocationsNominatim(query);
              if (geoResults && geoResults.length > 0) {
                stopLat = geoResults[0].lat;
                stopLng = geoResults[0].lng;
              } else {
                // Ground within 2-5km of the current day center
                const offsetLat = (Math.random() - 0.5) * 0.04;
                const offsetLng = (Math.random() - 0.5) * 0.04;
                stopLat = centerLat + offsetLat;
                stopLng = centerLng + offsetLng;
              }
            } catch {
              stopLat = centerLat;
              stopLng = centerLng;
            }
          }

          return {
            ...s,
            lat: stopLat,
            lng: stopLng,
          };
        })
      );

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'Hier sind passende Vorschläge für deine Reise.',
        suggestedStops: validatedStops,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      // High quality local fallback directly centered on the trip's destination
      const fallbackMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `Hier sind hervorragende Empfehlungen für ${trip.destination || 'deine Reise'} passend zu deiner Anfrage:`,
        suggestedStops: [
          {
            title: `Regionale Trattoria & Spezialitäten in ${trip.destination}`,
            category: 'restaurant',
            address: `${trip.destination}, Altstadt`,
            lat: centerLat + 0.003,
            lng: centerLng + 0.004,
            time: '19:30',
            durationMinutes: 90,
            cost: 35,
            notes: 'Exzellente regionale Küche mit authentischen Spezialitäten.',
          },
          {
            title: `Panoramablick & Aussichtspunkt ${trip.destination}`,
            category: 'viewpoint',
            address: `${trip.destination}, Panoramastraße`,
            lat: centerLat - 0.004,
            lng: centerLng - 0.003,
            time: '18:15',
            durationMinutes: 45,
            cost: 0,
            notes: 'Perfekter Fotospot mit weitem Rundumblick bei Sonnenuntergang.',
          },
          {
            title: `Historisches Wahrzeichen & Rundgang`,
            category: 'sightseeing',
            address: `${trip.destination}, Historisches Zentrum`,
            lat: centerLat + 0.001,
            lng: centerLng + 0.002,
            time: '15:00',
            durationMinutes: 75,
            cost: 15,
            notes: 'Malerische Gassen und geschichtsträchtige Bauwerke.',
          },
        ],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSuggestedStop = (s: any, index: number) => {
    const targetDayId = currentDay?.id || trip.days[0]?.id;
    if (!targetDayId) return;

    const stopLat = typeof s.lat === 'number' && !isNaN(s.lat) ? s.lat : centerLat;
    const stopLng = typeof s.lng === 'number' && !isNaN(s.lng) ? s.lng : centerLng;

    const newStop: TripStop = {
      id: `stop-ai-${Date.now()}-${index}`,
      title: s.title,
      category: s.category || 'sightseeing',
      address: s.address || `${trip.destination}`,
      lat: stopLat,
      lng: stopLng,
      time: s.time || '14:00',
      durationMinutes: s.durationMinutes || 60,
      cost: s.cost || 0,
      notes: s.notes,
      googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(s.title + ' ' + (s.address || trip.destination))}`,
    };

    onAddStopToDay(targetDayId, newStop);
    setAddedStops((prev) => ({ ...prev, [`${s.title}-${index}`]: true }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#111827] rounded-3xl shadow-2xl border border-slate-800 max-w-2xl w-full h-[680px] max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0d121d] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-100 font-['Outfit',sans-serif]">
                  KI-Reiseberater & Routenassistent
                </h3>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded-full border border-blue-500/30">
                  Region: {trip.destination || 'Lokal'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {currentDay ? `Für Tag ${currentDay.dayNumber}: ${currentDay.title}` : trip.title}
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

        {/* Quick Prompts */}
        <div className="px-6 py-2.5 bg-[#0d121d]/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
          <span className="text-slate-500 font-semibold text-[11px] shrink-0">Schnellauswahl:</span>
          <button
            onClick={() =>
              handleSend(
                `Bitte füge 3 konkrete, hochkarätige Sehenswürdigkeiten und Must-See Highlights in ${trip.destination} für heute hinzu.`
              )
            }
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full border border-slate-800 shrink-0 transition flex items-center gap-1"
          >
            🌟 3 Sehenswürdigkeiten
          </button>
          <button
            onClick={() =>
              handleSend(
                `Empfehle mir 2-3 konkrete, erstklassige Restaurants in ${trip.destination} für ein gemütliches Abendessen (ab 19:30 Uhr) mit authentischer regionaler Küche.`
              )
            }
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full border border-slate-800 shrink-0 transition flex items-center gap-1"
          >
            🍽️ Abendessen & Restaurants
          </button>
          <button
            onClick={() =>
              handleSend(
                `Erstelle mir einen perfekten Tagesplan für ${trip.destination} mit 3 Top-Sehenswürdigkeiten und einem konkreten Restaurant für das Abendessen.`
              )
            }
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full border border-slate-800 shrink-0 transition flex items-center gap-1"
          >
            ✨ 3 Highlights + Abendessen
          </button>
          <button
            onClick={() =>
              handleSend(
                `Wie kann ich die Fahrzeiten und Stationen für diesen Tag in ${trip.destination} optimal abstimmen?`
              )
            }
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full border border-slate-800 shrink-0 transition flex items-center gap-1"
          >
            ⏱️ Zeitplan optimieren
          </button>
        </div>

        {/* Message History */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-indigo-950/60 border border-indigo-800/60 text-indigo-400'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`space-y-3 max-w-[85%] ${m.sender === 'user' ? 'text-right' : ''}`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed inline-block whitespace-pre-line ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>

                {/* Suggested Stops cards */}
                {m.suggestedStops && m.suggestedStops.length > 0 && (
                  <div className="space-y-2 mt-2 text-left">
                    <div className="flex items-center justify-between gap-2 pb-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Vorgeschlagene Stationen ({m.suggestedStops.length}) in {trip.destination}:
                      </span>
                      {m.suggestedStops.length > 1 && (
                        <button
                          onClick={() => {
                            m.suggestedStops?.forEach((s, idx) => {
                              if (!addedStops[`${s.title}-${idx}`]) {
                                handleAddSuggestedStop(s, idx);
                              }
                            });
                          }}
                          className="text-[10px] font-bold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Alle {m.suggestedStops.length} zum Tag hinzufügen
                        </button>
                      )}
                    </div>
                    {m.suggestedStops.map((s, idx) => {
                      const isAdded = addedStops[`${s.title}-${idx}`];
                      const isRestaurant = s.category === 'restaurant';
                      const isViewpoint = s.category === 'viewpoint';
                      const isPass = s.category === 'pass' || s.category === 'biker_spot';

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border shadow-xs flex items-center justify-between gap-3 text-left transition ${
                            isRestaurant
                              ? 'bg-amber-950/20 border-amber-900/40 hover:border-amber-700/60'
                              : 'bg-[#0d121d] border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-slate-100">
                                {s.title}
                              </span>
                              {isRestaurant && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 font-bold rounded border border-amber-500/30 shrink-0">
                                  🍽️ Abendessen / Restaurant
                                </span>
                              )}
                              {isViewpoint && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded border border-emerald-500/30 shrink-0">
                                  🌄 Panorama & Aussicht
                                </span>
                              )}
                              {isPass && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-orange-500/20 text-orange-300 font-bold rounded border border-orange-500/30 shrink-0">
                                  🏍️ Pass & Kurven
                                </span>
                              )}
                              {s.time && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded flex items-center gap-0.5 shrink-0">
                                  <Clock className="w-2.5 h-2.5 text-blue-400" />
                                  {s.time}
                                </span>
                              )}
                              {s.cost !== undefined && s.cost > 0 && (
                                <span className="text-[10px] text-slate-400">
                                  ~{s.cost} {trip.currency || '€'}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                              <span className="truncate">{s.address || trip.destination}</span>
                              <span className="text-[10px] text-slate-500 shrink-0">
                                ({s.lat.toFixed(3)}, {s.lng.toFixed(3)})
                              </span>
                            </div>
                            {s.notes && (
                              <div className={`text-[10px] mt-1 ${isRestaurant ? 'text-amber-200/90' : 'text-slate-300'}`}>
                                💡 {s.notes}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleAddSuggestedStop(s, idx)}
                            disabled={isAdded}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition ${
                              isAdded
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                                : isRestaurant
                                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Hinzugefügt
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" /> Zur Reise
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span>KI-Berater analysiert Region und generiert passende Vorschläge...</span>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="p-4 bg-[#0d121d] border-t border-slate-800 flex items-center gap-2 shrink-0">
          <input
            type="text"
            placeholder={`Frage zu ${trip.destination}, Ausflugszielen, Restaurants oder Zeiten...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 text-xs px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
