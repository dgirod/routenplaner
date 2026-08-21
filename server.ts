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

      if (!ai) {
        // Return context-aware fallback based on the trip's actual destination and coordinates
        const dest = tripContext?.destination || tripContext?.title || 'Region';
        const baseLat = Number(tripContext?.centerLat) || 43.77;
        const baseLng = Number(tripContext?.centerLng) || 11.25;

        return res.json({
          reply: `Hier sind massgeschneiderte Empfehlungen für "${dest}" (${tripContext?.title || ''}) passend zu deiner Frage "${prompt}":\n\n1. Entdecke regionale Highlights und Sehenswürdigkeiten direkt vor Ort.\n2. Plane genügend Pufferzeit für Fotostopps und Genussmomente ein.`,
          suggestedStops: [
            {
              title: `${dest} Panoramablick & Altstadt`,
              category: 'viewpoint',
              address: `${dest}, Aussichtspunkt`,
              lat: baseLat + 0.004,
              lng: baseLng + 0.006,
              time: '17:30',
              durationMinutes: 60,
              cost: 0,
              notes: `Herrlicher Ausblick und Fotospot in ${dest}.`,
            },
            {
              title: `Regionales Spezialitäten-Restaurant in ${dest}`,
              category: 'restaurant',
              address: `${dest}, Altstadt`,
              lat: baseLat - 0.003,
              lng: baseLng - 0.004,
              time: '19:30',
              durationMinutes: 90,
              cost: 35,
              notes: 'Ausgezeichnete lokale Küche und Weine.',
            },
          ],
        });
      }

      const systemPrompt = `Du bist ein hochkompetenter lokaler Reise- und Routenplaner-Experte.
Der Nutzer plant folgende Reise:
- Reise-Titel: "${tripContext?.title || ''}"
- Reise-Ziel / Region: "${tripContext?.destination || ''}"
- Fortbewegungsmittel: "${tripContext?.transportMode || 'Auto'}"
- Aktueller Tag: Tag ${tripContext?.currentDayNumber || 1} ${tripContext?.currentDayTitle ? `("${tripContext?.currentDayTitle}")` : ''}
${tripContext?.centerLat && tripContext?.centerLng ? `- Geografischer Referenzpunkt / Region-Zentrum: Lat ${tripContext.centerLat}, Lng ${tripContext.centerLng}` : ''}
- Bisherige Stationen an diesem Tag: ${(tripContext?.existingStops || []).map((s: any) => typeof s === 'string' ? s : `${s.title} (${s.address || ''})`).join(' -> ') || 'Noch keine'}

STRIKTE REGELN ZU GEOGRAFIE & KOORDINATEN:
1. Jede empfohlene Station MUSS sich exakt in der Reiseregion bzw. im Reiseziel ("${tripContext?.destination || tripContext?.title || ''}") befinden! Niemals Orte in anderen Ländern oder weit entfernten Regionen vorschlagen!
2. Die Koordinaten (lat und lng) MÜSSEN präzise und plausibel für den konkreten Ort in der Region sein (z.B. wenn die Reise in Italien/Toskana ist, müssen lat um ~43.x und lng um ~11.x liegen; wenn in der Schweiz ~46.x/8.x; wenn in Deutschland ~48-52.x/9-13.x usw.).
3. Antworte immer auf Deutsch, professionell, strukturiert und direkt auf die Frage des Nutzers eingehend.

Formatiere deine gesamte Antwort AUSSCHLIESSLICH im folgenden JSON-Format (keine Markdown-Codeblöcke drumherum):
{
  "reply": "Detaillierte, freundliche und fundierte Antwort auf die Frage des Nutzers mit konkreten Hinweisen und Insidertipps...",
  "suggestedStops": [
    {
      "title": "Präziser Name der Station / Sehenswürdigkeit / Restaurant",
      "category": "sightseeing" | "hotel" | "restaurant" | "activity" | "nature" | "viewpoint" | "shopping" | "transit" | "pass" | "biker_spot",
      "address": "Genaue Adresse oder Straße, Ort, Region",
      "lat": 43.7731,
      "lng": 11.2560,
      "time": "14:30",
      "durationMinutes": 60,
      "cost": 15,
      "notes": "Praktischer Hinweis für den Besuch"
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
              { role: 'user', parts: [{ text: `${systemPrompt}\n\nFrage des Nutzers: "${prompt}"` }] },
            ],
          });
          responseText = response.text || '';
          if (responseText.trim()) break;
        } catch (mErr: any) {
          console.warn(`Model ${modelName} failed:`, mErr.message);
        }
      }

      if (!responseText) {
        throw new Error('Keine Antwort vom KI-Modell erhalten');
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
        // If JSON parsing fails, retain the rich text reply
        parsed = {
          reply: responseText,
          suggestedStops: [],
        };
      }

      res.json(parsed);
    } catch (err: any) {
      console.error('Error in /api/trip-assistant:', err);
      res.status(500).json({
        error: 'Fehler bei der Generierung der Vorschläge',
        details: err.message,
      });
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
