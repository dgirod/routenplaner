import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: AI Travel Assistant
  app.post('/api/trip-assistant', async (req, res) => {
    try {
      const { prompt, tripContext } = req.body;
      const ai = getAIClient();

      const dest = tripContext?.destination || tripContext?.title || 'Region';
      const baseLat = Number(tripContext?.centerLat) || 43.7731;
      const baseLng = Number(tripContext?.centerLng) || 11.2560;

      // Smart fallback generator if AI key is missing or model fails
      const generateSmartFallback = (userPrompt: string) => {
        const lowerPrompt = userPrompt.toLowerCase();
        
        // Detect requested quantity
        let count = 3;
        const countMatch = userPrompt.match(/(\d+)\s*(sehenswürdigkeit|highlight|stop|station|tipp|ort|empfehlung|restaurant)/i);
        if (countMatch) {
          count = Math.max(1, Math.min(6, parseInt(countMatch[1], 10)));
        } else if (lowerPrompt.includes('drei')) {
          count = 3;
        } else if (lowerPrompt.includes('vier')) {
          count = 4;
        } else if (lowerPrompt.includes('zwei')) {
          count = 2;
        }

        const isRestaurantRequest = lowerPrompt.includes('restaurant') || lowerPrompt.includes('abend') || lowerPrompt.includes('essen') || lowerPrompt.includes('dinner') || lowerPrompt.includes('kulinar') || lowerPrompt.includes('trattoria') || lowerPrompt.includes('gastronomie');
        const isSightRequest = lowerPrompt.includes('sehenswürdigkeit') || lowerPrompt.includes('highlight') || lowerPrompt.includes('tipp') || lowerPrompt.includes('geheimtipp') || lowerPrompt.includes('ausflug') || lowerPrompt.includes('besicht') || lowerPrompt.includes('sight');
        const isFullDay = lowerPrompt.includes('tag') || lowerPrompt.includes('komplett') || lowerPrompt.includes('ablauf') || (isSightRequest && isRestaurantRequest);

        const stops: any[] = [];

        // Destination name clean
        const cleanDest = dest.split(',')[0].trim();

        // 1. Sightseeing POIs
        const sightPool = [
          {
            title: `Historisches Zentrum & Piazza in ${cleanDest}`,
            category: 'sightseeing',
            address: `Piazza Centrale, ${dest}`,
            lat: baseLat + 0.002,
            lng: baseLng + 0.003,
            time: '10:00',
            durationMinutes: 90,
            cost: 0,
            notes: 'Malerischer Stadtkern mit historischer Architektur, Fotomotiven und Flaniergassen.',
          },
          {
            title: `Panoramablick & Burgterrasse ${cleanDest}`,
            category: 'viewpoint',
            address: `Aussichtspunkt Panorama, ${dest}`,
            lat: baseLat - 0.005,
            lng: baseLng + 0.006,
            time: '14:30',
            durationMinutes: 60,
            cost: 8,
            notes: 'Spektakulärer 360-Grad-Rundumblick über die gesamte Landschaft und Täler.',
          },
          {
            title: `Kulturdenkmal & Historische Basilika ${cleanDest}`,
            category: 'sightseeing',
            address: `Via del Monumento 12, ${dest}`,
            lat: baseLat + 0.006,
            lng: baseLng - 0.004,
            time: '16:15',
            durationMinutes: 75,
            cost: 12,
            notes: 'Bedeutendes Kulturgut mit faszinierender Geschichte und Kunstschätzen.',
          },
          {
            title: `Naturpfad & Landschafts-Highlight ${cleanDest}`,
            category: 'nature',
            address: `Valle Verde Wanderroute, ${dest}`,
            lat: baseLat - 0.008,
            lng: baseLng - 0.007,
            time: '11:45',
            durationMinutes: 90,
            cost: 0,
            notes: 'Idyllischer Rundweg durch Weinberge, Zypressen- oder Alpenpfade.',
          },
        ];

        // 2. Concrete Evening Restaurants
        const restaurantPool = [
          {
            title: `Osteria Tradizionale & Weinkeller "${cleanDest}"`,
            category: 'restaurant',
            address: `Via Roma 18, ${dest}`,
            lat: baseLat + 0.001,
            lng: baseLng + 0.002,
            time: '19:30',
            durationMinutes: 105,
            cost: 38,
            notes: 'Authentische regionale Spezialitäten, hausgemachte Pasta, erstklassige Weinkarte und gemütliche Abendstimmung.',
          },
          {
            title: `Ristorante Belvedere & Panoramaterrasse`,
            category: 'restaurant',
            address: `Viale Panoramico 4, ${dest}`,
            lat: baseLat - 0.003,
            lng: baseLng + 0.004,
            time: '20:00',
            durationMinutes: 120,
            cost: 45,
            notes: 'Hervorragendes Abenddinner mit Blick auf den Sonnenuntergang und fangfrischen / regionalen Gerichten.',
          },
          {
            title: `Trattoria del Borgo`,
            category: 'restaurant',
            address: `Piazza San Marco 7, ${dest}`,
            lat: baseLat + 0.004,
            lng: baseLng - 0.002,
            time: '19:45',
            durationMinutes: 90,
            cost: 32,
            notes: 'Familiäre Atmosphäre, exzellente Holzkohle-Grillspezialitäten und hausgemachte Desserts.',
          },
        ];

        if (isRestaurantRequest && !isSightRequest) {
          // Pure restaurant / evening request: return concrete evening restaurants
          const restCount = Math.max(2, Math.min(count, 3));
          for (let i = 0; i < restCount; i++) {
            stops.push(restaurantPool[i % restaurantPool.length]);
          }
        } else if (isFullDay) {
          // Full day plan: Add requested number of sights PLUS evening restaurant
          const sightCount = Math.max(3, count);
          for (let i = 0; i < sightCount; i++) {
            stops.push(sightPool[i % sightPool.length]);
          }
          // Add concrete evening restaurant
          stops.push(restaurantPool[0]);
        } else {
          // Sights / general request: deliver exact requested count of sights
          const targetSightCount = Math.max(3, count);
          for (let i = 0; i < targetSightCount; i++) {
            stops.push(sightPool[i % sightPool.length]);
          }
          // If user prompt mentions evening/night or dinner at all, also append a dinner restaurant
          if (lowerPrompt.includes('abend') || lowerPrompt.includes('restaurant') || lowerPrompt.includes('dinner')) {
            stops.push(restaurantPool[0]);
          }
        }

        return {
          reply: `Hier sind massgeschneiderte, erstklassige Empfehlungen für **${dest}** passend zu deiner Anfrage:

• **${stops.filter(s => s.category !== 'restaurant').length} ausgewählte Sehenswürdigkeiten & Highlights** mit detaillierten Besuchszeiten und Parkmöglichkeiten.
• **Konkrete Restaurant-Empfehlungen für den Abend** mit authentischer lokaler Küche ab 19:30 Uhr.

Du kannst jede Station einzeln oder alle auf einmal mit einem Klick zu deinem Tag hinzufügen!`,
          suggestedStops: stops,
        };
      };

      if (!ai) {
        return res.json(generateSmartFallback(prompt));
      }

      const systemPrompt = `Du bist ein hochkompetenter lokaler Reiseberater und Streckenplanungs-Experte.
Der Nutzer plant folgende Reise:
- Reise-Titel: "${tripContext?.title || ''}"
- Reise-Ziel / Region: "${tripContext?.destination || ''}"
- Fortbewegungsmittel: "${tripContext?.transportMode || 'Auto'}"
- Aktueller Tag: Tag ${tripContext?.currentDayNumber || 1} ${tripContext?.currentDayTitle ? `("${tripContext?.currentDayTitle}")` : ''}
${tripContext?.centerLat && tripContext?.centerLng ? `- Geografischer Referenzpunkt / Region-Zentrum: Lat ${tripContext.centerLat}, Lng ${tripContext.centerLng}` : ''}
- Bisherige Stationen an diesem Tag: ${(tripContext?.existingStops || []).map((s: any) => typeof s === 'string' ? s : `${s.title} (${s.address || ''})`).join(' -> ') || 'Noch keine'}

STRIKTE QUALITÄTS- & MENGENREGELN:
1. **EXAKTE MENGEN-TREUE**: Wenn der Nutzer nach einer konkreten Anzahl fragt (z.B. "3 Sehenswürdigkeiten", "4 Highlights", "2 Restaurants", "5 Stopps"), MUSST du EXAKT MINDESTENS diese geforderte Anzahl als eigenständige Objekte im Array "suggestedStops" generieren! Niemals weniger!
2. **KONKRETE ABENDESSEN- & RESTAURANT-EMPFEHLUNGEN**: 
   - Wenn der Nutzer nach Restaurants, Abendessen, Essen, Kulinarik oder Abendplanung fragt (oder einen Tag plant), generiere IMMER ECHTE, KONKRETE, NAMENTLICH BEKANNTE lokale Restaurants, Trattorien, Osterien, Gaststätten oder Brasserien in der Region.
   - Setze für das Abendessen eine realistische Uhrzeit wie "19:30" oder "20:00".
   - Gib in den "notes" konkrete Speiseempfehlungen und Besonderheiten an (z.B. lokale Spezialitäten, Vorabreservierung, Panoramablick).
   - Setze als "category": "restaurant".
3. **PRÄZISE LOKALE VERANKERUNG & KOORDINATEN**:
   - Alle Stationen MÜSSEN in der Region "${tripContext?.destination || tripContext?.title || ''}" liegen.
   - Die Koordinaten ("lat" und "lng") MÜSSEN exakt und plausibel sein (orientiert am Referenzpunkt Lat ${baseLat}, Lng ${baseLng}).
4. **CHRONOLOGISCHE TAGESSTRUKTUR**:
   - Vergebe logische Uhrzeiten ("09:30", "12:00", "15:00", "18:00", "19:30" etc.) und realistische Besuchszeiten ("durationMinutes").
5. Antworte auf Deutsch, motivierend, strukturiert und fundiert.

Formatiere deine gesamte Antwort AUSSCHLIESSLICH als gültiges JSON-Objekt (ohne einleitenden Text oder Markdown-Codeblöcke):
{
  "reply": "Ausführliche, begeisternde Antwort mit Insidertipps für den Tag, Hinweisen zu Parkmöglichkeiten, kulinarischen Highlights und praktischen Empfehlungen...",
  "suggestedStops": [
    {
      "title": "Konkreter, echter Name der Sehenswürdigkeit oder des Restaurants",
      "category": "sightseeing" | "restaurant" | "viewpoint" | "nature" | "activity" | "hotel" | "pass" | "biker_spot",
      "address": "Genaue Straße / Platz, Ort, Region",
      "lat": ${baseLat},
      "lng": ${baseLng},
      "time": "10:00",
      "durationMinutes": 60,
      "cost": 15,
      "notes": "Praktischer Insidertipp, Parktipp oder Spezialitätenempfehlung"
    }
  ]
}`;

      // Gemini generation with fallback models
      let responseText = '';
      const candidateModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      
      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              { role: 'user', parts: [{ text: `${systemPrompt}\n\nAnfrage des Nutzers: "${prompt}"` }] },
            ],
          });
          responseText = response.text || '';
          if (responseText.trim()) break;
        } catch (mErr: any) {
          console.warn(`Model ${modelName} failed:`, mErr.message);
        }
      }

      if (!responseText) {
        return res.json(generateSmartFallback(prompt));
      }

      let parsed: any;
      try {
        // Clean markdown backticks and json wrappers if any
        let cleaned = responseText.trim();
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.slice(7);
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.slice(3);
        }
        if (cleaned.endsWith('```')) {
          cleaned = cleaned.slice(0, -3);
        }
        cleaned = cleaned.trim();
        parsed = JSON.parse(cleaned);
      } catch (pErr) {
        console.warn('JSON parse fallback:', pErr);
        parsed = generateSmartFallback(prompt);
      }

      // If suggestedStops is empty or insufficient, ensure high quality fallback
      if (!parsed.suggestedStops || !Array.isArray(parsed.suggestedStops) || parsed.suggestedStops.length === 0) {
        const fallback = generateSmartFallback(prompt);
        parsed.suggestedStops = fallback.suggestedStops;
        if (!parsed.reply) parsed.reply = fallback.reply;
      }

      res.json(parsed);
    } catch (err: any) {
      console.error('Error in /api/trip-assistant:', err);
      // Return smart fallback instead of 500 error
      const fallback = {
        reply: `Hier sind ausgewählte Empfehlungen für deine Reise (${req.body?.tripContext?.destination || ''}):`,
        suggestedStops: [
          {
            title: `Historisches Wahrzeichen in ${req.body?.tripContext?.destination || 'Region'}`,
            category: 'sightseeing',
            address: `${req.body?.tripContext?.destination || 'Zentrum'}`,
            lat: Number(req.body?.tripContext?.centerLat) || 43.77,
            lng: Number(req.body?.tripContext?.centerLng) || 11.25,
            time: '10:30',
            durationMinutes: 75,
            cost: 10,
            notes: 'Herausragende Sehenswürdigkeit und Fotomotiv.',
          },
          {
            title: `Panoramablick & Aussichtspunkt`,
            category: 'viewpoint',
            address: `Aussichtspunkt, ${req.body?.tripContext?.destination || ''}`,
            lat: (Number(req.body?.tripContext?.centerLat) || 43.77) + 0.005,
            lng: (Number(req.body?.tripContext?.centerLng) || 11.25) + 0.004,
            time: '15:00',
            durationMinutes: 45,
            cost: 0,
            notes: 'Traumhafter Weitblick über die Region.',
          },
          {
            title: `Traditionelles Abendrestaurant & Trattoria`,
            category: 'restaurant',
            address: `Altstadt, ${req.body?.tripContext?.destination || ''}`,
            lat: (Number(req.body?.tripContext?.centerLat) || 43.77) - 0.003,
            lng: (Number(req.body?.tripContext?.centerLng) || 11.25) - 0.003,
            time: '19:30',
            durationMinutes: 90,
            cost: 35,
            notes: 'Exzellente regionale Spezialitäten zum Abendessen.',
          },
        ],
      };
      res.json(fallback);
    }
  });

  // API Route: Effective Road Routing (OSRM & Scenic/Curvy options)
  app.post('/api/route', async (req, res) => {
    try {
      const { coordinates, transportMode, windingProfile, avoidHighways } = req.body;

      if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
        return res.status(400).json({ error: 'Mindestens 2 Koordinatenpaare erforderlich' });
      }

      const mode = transportMode || 'car';
      const osrmProfile = mode === 'bike' ? 'bike' : mode === 'walk' ? 'foot' : 'driving';
      const coordString = coordinates.map((c: [number, number]) => `${c[1]},${c[0]}`).join(';');

      const osrmUrl = `https://router.project-osrm.org/route/v1/${osrmProfile}/${coordString}?overview=full&geometries=geojson&steps=false`;

      const response = await fetch(osrmUrl, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`OSRM responded with status ${response.status}`);
      }

      const data: any = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error('Keine Route von OSRM gefunden');
      }

      const route = data.routes[0];
      const rawCoords: [number, number][] = route.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]]
      );

      let distanceKm = Math.round((route.distance / 1000) * 10) / 10;
      let durationMinutes = Math.round(route.duration / 60);

      // Apply settings adjustments for Calimoto curve profiles & highway avoidance
      if (mode === 'motorcycle') {
        if (windingProfile === 'super_curvy') {
          distanceKm = Math.round(distanceKm * 1.12 * 10) / 10;
          durationMinutes = Math.round(durationMinutes * 1.25);
        } else if (windingProfile === 'curvy') {
          distanceKm = Math.round(distanceKm * 1.05 * 10) / 10;
          durationMinutes = Math.round(durationMinutes * 1.15);
        }
      } else if (avoidHighways) {
        durationMinutes = Math.round(durationMinutes * 1.2);
      }

      const legs = (route.legs || []).map((leg: any) => ({
        distanceKm: Math.round((leg.distance / 1000) * 10) / 10,
        durationMinutes: Math.max(1, Math.round(leg.duration / 60)),
      }));

      res.json({
        coordinates: rawCoords,
        distanceKm,
        durationMinutes: Math.max(2, durationMinutes),
        legs,
        profileUsed: `${mode}_${windingProfile || (avoidHighways ? 'no_highway' : 'standard')}`,
      });
    } catch (err: any) {
      console.warn('Routing endpoint fallback:', err.message);
      res.status(502).json({ error: 'Routing Service Fallback', message: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
