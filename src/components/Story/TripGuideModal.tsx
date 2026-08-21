import React, { useRef, useState } from 'react';
import { Trip, TripDay, TripStop } from '../../types';
import {
  calculateTripMetrics,
  calculateDayMetrics,
  formatMinutes,
  estimateDriveMetrics,
  getGoogleMapsPlaceUrl,
} from '../../utils/geoUtils';
import { getStopImage } from '../../utils/imageService';
import { CATEGORY_CONFIG, DAY_COLORS } from '../../data/sampleTrips';
import {
  X,
  Printer,
  Download,
  Calendar,
  Clock,
  Car,
  MapPin,
  CheckCircle2,
  Hotel,
  Landmark,
  Utensils,
  Ticket,
  Trees,
  Camera,
  Plane,
  ShoppingBag,
  ExternalLink,
  Wallet,
  Sparkles,
  Share2,
  FileText,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ArrowRight,
  Info,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface TripGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
}

export const TripGuideModal: React.FC<TripGuideModalProps> = ({
  isOpen,
  onClose,
  trip,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const tripMetrics = calculateTripMetrics(trip);

  // Group costs by category
  const costByCategory: Record<string, number> = {};
  trip.days.forEach((d) => {
    d.stops.forEach((s) => {
      if (s.cost) {
        costByCategory[s.category] = (costByCategory[s.category] || 0) + s.cost;
      }
    });
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    try {
      setIsExportingPdf(true);

      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / pdfWidth;
      const totalPdfHeight = imgHeight / ratio;

      let position = 0;

      while (position < totalPdfHeight) {
        if (position > 0) {
          pdf.addPage();
        }
        pdf.addImage(
          imgData,
          'JPEG',
          0,
          -position,
          pdfWidth,
          totalPdfHeight
        );
        position += pdfHeight;
      }

      const safeTitle = trip.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`Reiseplaner_${safeTitle}.pdf`);
    } catch (err) {
      console.error('PDF Generation failed, falling back to window.print', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCopySummary = () => {
    let summary = `✈️ ${trip.title}\n📍 Ziel: ${trip.destination}\n📅 ${trip.startDate} bis ${trip.endDate}\n🚗 Gesamtstrecke: ca. ${tripMetrics.totalDistanceKm} km · ${tripMetrics.totalStops} Stationen\n\n`;
    trip.days.forEach((d) => {
      summary += `--- TAG ${d.dayNumber}: ${d.title} ---\n`;
      if (d.accommodation) summary += `🏨 Hotel: ${d.accommodation}\n`;
      d.stops.forEach((s, idx) => {
        summary += `  ${idx + 1}. ${s.title} (${s.time || 'flexibel'}${s.cost ? ` · ${s.cost} ${trip.currency}` : ''})\n`;
      });
      summary += `\n`;
    });

    navigator.clipboard.writeText(summary);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sightseeing':
        return <Landmark className="w-3.5 h-3.5" />;
      case 'hotel':
        return <Hotel className="w-3.5 h-3.5" />;
      case 'restaurant':
        return <Utensils className="w-3.5 h-3.5" />;
      case 'activity':
        return <Ticket className="w-3.5 h-3.5" />;
      case 'nature':
        return <Trees className="w-3.5 h-3.5" />;
      case 'viewpoint':
        return <Camera className="w-3.5 h-3.5" />;
      case 'transit':
        return <Plane className="w-3.5 h-3.5" />;
      case 'shopping':
        return <ShoppingBag className="w-3.5 h-3.5" />;
      default:
        return <MapPin className="w-3.5 h-3.5" />;
    }
  };

  const displayedDays = trip.days;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:h-auto print:overflow-visible">
      {/* Container */}
      <div className="bg-[#0f172a] w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-800 flex flex-col max-h-[92vh] overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none print:bg-white">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="px-6 py-4 bg-[#090d16] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                Reiseführer & Präsentation
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 font-['Outfit',sans-serif] line-clamp-1">
                {trip.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy Summary */}
            <button
              onClick={handleCopySummary}
              className="p-2 sm:px-3 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
              title="Text-Zusammenfassung in Zwischenablage kopieren"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">
                {copiedLink ? 'Kopiert!' : 'Kopieren'}
              </span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="p-2 sm:px-3 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
              title="Drucken oder als PDF im Browser speichern"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Drucken</span>
            </button>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-600/25 flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? 'Erstelle PDF...' : 'PDF Exportieren'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable & Scrollable Guide Content */}
        <div className="overflow-y-auto p-4 sm:p-8 space-y-8 print:p-0 print:overflow-visible">
          <div
            ref={printRef}
            className="space-y-8 bg-white text-slate-900 p-6 sm:p-10 rounded-3xl print:p-0 print:rounded-none print:shadow-none print:bg-white shadow-xl"
          >
            {/* HERO COVER HEADER */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-slate-900 text-white min-h-[360px] flex flex-col justify-end p-6 sm:p-10 border border-slate-800 print:min-h-[260px] print:rounded-2xl">
              {/* Cover Background Photo */}
              <img
                src={
                  trip.coverImage ||
                  'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1400&auto=format&fit=crop&q=80'
                }
                alt={trip.title}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover opacity-45 mix-blend-luminosity scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

              {/* Cover Content */}
              <div className="relative z-10 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md">
                    Offizieller Reiseplan & Guide
                  </span>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-semibold rounded-full">
                    {trip.days.length} Tage Roadtrip
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold font-['Outfit',sans-serif] text-white tracking-tight leading-tight">
                  {trip.title}
                </h1>

                <p className="text-sm sm:text-base text-slate-200 max-w-2xl font-medium leading-relaxed">
                  {trip.description}
                </p>

                {/* Key Metrics Banner */}
                <div className="pt-4 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-black/30 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Reisezeitraum
                    </span>
                    <span className="font-semibold text-white">
                      {trip.startDate} – {trip.endDate}
                    </span>
                  </div>

                  <div className="bg-black/30 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Gesamtstrecke
                    </span>
                    <span className="font-semibold text-white">
                      ca. {tripMetrics.totalDistanceKm} km
                    </span>
                  </div>

                  <div className="bg-black/30 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Stationen & Orte
                    </span>
                    <span className="font-semibold text-white">
                      {tripMetrics.totalStops} Haltepunkte
                    </span>
                  </div>

                  <div className="bg-black/30 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Kalkulierte Kosten
                    </span>
                    <span className="font-semibold text-emerald-400">
                      {tripMetrics.totalCost.toLocaleString('de-DE')} {trip.currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SUMMARY OVERVIEW TABLE */}
            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/60 space-y-4">
              <h3 className="text-lg font-bold text-slate-900 font-['Outfit',sans-serif] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>Reiseübersicht auf einen Blick</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Tag</th>
                      <th className="py-2.5 px-3">Titel & Motto</th>
                      <th className="py-2.5 px-3">Unterkunft</th>
                      <th className="py-2.5 px-3 text-center">Orte</th>
                      <th className="py-2.5 px-3 text-right">Fahrstrecke</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {trip.days.map((day, idx) => {
                      const dMetrics = calculateDayMetrics(day.stops);
                      const color = DAY_COLORS[idx % DAY_COLORS.length];
                      return (
                        <tr key={day.id} className="hover:bg-slate-100/60 transition">
                          <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                            <span
                              className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] mr-2"
                              style={{ backgroundColor: color }}
                            >
                              {day.dayNumber}
                            </span>
                            Tag {day.dayNumber}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{day.title}</div>
                            {day.theme && (
                              <div className="text-[11px] text-slate-500 italic">{day.theme}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium">
                            {day.accommodation || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                            {day.stops.length}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-blue-700">
                            {dMetrics.distanceKm} km
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DETAILED DAY BY DAY ITINERARY WITH PHOTOS */}
            <div className="space-y-10">
              <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-slate-900 font-['Outfit',sans-serif] uppercase tracking-wide">
                  Detaillierter Tagesablauf & Stationen
                </h2>
                <span className="text-xs font-semibold text-slate-500">
                  {displayedDays.length} Tage dargestellt
                </span>
              </div>

              {displayedDays.map((day, dayIndex) => {
                const dayColor = DAY_COLORS[dayIndex % DAY_COLORS.length];
                const dMetrics = calculateDayMetrics(day.stops);

                return (
                  <div
                    key={day.id}
                    className="space-y-4 break-inside-avoid page-break-after"
                  >
                    {/* Day Banner */}
                    <div
                      className="p-5 rounded-2xl text-white shadow-md flex flex-wrap items-center justify-between gap-3"
                      style={{
                        background: `linear-gradient(135deg, ${dayColor} 0%, #0f172a 100%)`,
                      }}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase">
                            Tag {day.dayNumber} {day.date ? `· ${day.date}` : ''}
                          </span>
                          {day.theme && (
                            <span className="text-xs text-white/85 italic">
                              • {day.theme}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold font-['Outfit',sans-serif] text-white">
                          {day.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-semibold bg-black/25 px-3.5 py-2 rounded-xl backdrop-blur-sm">
                        <span>{day.stops.length} Stationen</span>
                        <span>{dMetrics.distanceKm} km</span>
                        <span>ca. {formatMinutes(dMetrics.driveMinutes)} Fahrzeit</span>
                      </div>
                    </div>

                    {/* Accommodation Note */}
                    {day.accommodation && (
                      <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 px-4 py-2 rounded-xl text-xs flex items-center gap-2 font-medium">
                        <Hotel className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>
                          <strong>Übernachtung:</strong> {day.accommodation}
                        </span>
                      </div>
                    )}

                    {/* Day Notes */}
                    {day.notes && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-xl text-xs font-medium">
                        💡 <strong>Tipp für Tag {day.dayNumber}:</strong> {day.notes}
                      </div>
                    )}

                    {/* Stop Cards with Images */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {day.stops.map((stop, sIdx) => {
                        const stopImg = getStopImage(stop, trip.destination);
                        const catConfig =
                          CATEGORY_CONFIG[stop.category] || CATEGORY_CONFIG.sightseeing;

                        return (
                          <div
                            key={stop.id}
                            className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between"
                          >
                            {/* Stop Image Header */}
                            <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                              <img
                                src={stopImg}
                                alt={stop.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                onError={(e) => {
                                  // Fallback to category default on broken link
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&auto=format&fit=crop&q=80';
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                              {/* Number Badge */}
                              <div
                                className="absolute top-3 left-3 w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-md"
                                style={{ backgroundColor: dayColor }}
                              >
                                {sIdx + 1}
                              </div>

                              {/* Category Badge */}
                              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-slate-800 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs flex items-center gap-1">
                                {getCategoryIcon(stop.category)}
                                <span>{catConfig.label}</span>
                              </div>

                              {/* Stop Title & Time Over Image */}
                              <div className="absolute bottom-3 left-3 right-3 text-white">
                                <h4 className="font-bold text-base leading-tight text-white drop-shadow-md">
                                  {stop.title}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-slate-200 mt-0.5">
                                  {stop.time && (
                                    <span className="flex items-center gap-1 font-semibold">
                                      <Clock className="w-3 h-3" />
                                      {stop.time}
                                    </span>
                                  )}
                                  {stop.durationMinutes && (
                                    <span>({formatMinutes(stop.durationMinutes)})</span>
                                  )}
                                  {stop.cost !== undefined && stop.cost > 0 && (
                                    <span className="text-emerald-300 font-bold ml-auto">
                                      {stop.cost} {trip.currency}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Stop Details */}
                            <div className="p-3.5 space-y-2 text-xs flex-1 flex flex-col justify-between">
                              <div className="space-y-1.5">
                                {stop.address && (
                                  <p className="text-slate-600 flex items-start gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                    <span className="line-clamp-2">{stop.address}</span>
                                  </p>
                                )}

                                {stop.notes && (
                                  <p className="bg-amber-50/80 border-l-2 border-amber-400 p-2 rounded-r-lg text-slate-700 text-[11px]">
                                    <span className="font-bold text-amber-800">Hinweis:</span>{' '}
                                    {stop.notes}
                                  </p>
                                )}

                                {stop.bookingRef && (
                                  <div className="text-[11px] font-mono bg-indigo-50 border border-indigo-200 text-indigo-800 px-2 py-0.5 rounded-md inline-block">
                                    Buchungs-Code: {stop.bookingRef}
                                  </div>
                                )}
                              </div>

                              {/* Google Maps link */}
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] print:hidden">
                                <a
                                  href={getGoogleMapsPlaceUrl(stop)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                                >
                                  <span>In Google Maps öffnen</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                                {stop.completed && (
                                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Erledigt
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FOOTER & TRAVEL NOTES */}
            <div className="pt-6 border-t-2 border-slate-200 text-center text-xs text-slate-500 space-y-1">
              <p className="font-bold text-slate-700">
                Gute Reise & unvergessliche Erlebnisse auf deinem Roadtrip!
              </p>
              <p>
                Erstellt mit dem Roadtrip & Reise-Routenplaner · Stand:{' '}
                {new Date().toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
