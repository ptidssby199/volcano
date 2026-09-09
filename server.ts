import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { INDONESIA_VOLCANOES, INITIAL_PVMBG_REPORTS } from './src/data/indonesiaVolcanoes';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.error('Failed to initialize GoogleGenAI client:', e);
    }
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory data store for live synchronized volcano data
  let liveVolcanoes = JSON.parse(JSON.stringify(INDONESIA_VOLCANOES));
  let liveReports = JSON.parse(JSON.stringify(INITIAL_PVMBG_REPORTS));
  let lastSyncTimestamp = new Date().toISOString();

  // Background 60-second periodic jitter / simulated PVMBG updates
  setInterval(() => {
    lastSyncTimestamp = new Date().toISOString();
    liveVolcanoes = liveVolcanoes.map((v: any) => {
      // Slight realistic fluctuations in RSAM and tremor
      const rsamJitter = Math.floor((Math.random() - 0.48) * 15);
      const newRsam = Math.max(80, v.rsamValue + rsamJitter);

      const tremorJitter = (Math.random() - 0.48) * 0.4;
      const newTremorDominan = Math.max(0.2, parseFloat((v.seismicity24h.tremorMenerusDominanMm + tremorJitter).toFixed(1)));

      return {
        ...v,
        rsamValue: newRsam,
        lastUpdated: 'Baru saja diperbarui (Auto-sync)',
        seismicity24h: {
          ...v.seismicity24h,
          tremorMenerusDominanMm: newTremorDominan,
        },
      };
    });
  }, 60000);

  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'VulkanoTrack Indonesia Backend',
      lastSync: lastSyncTimestamp,
      totalVolcanoes: liveVolcanoes.length,
    });
  });

  // Volcanoes list endpoint
  app.get('/api/volcanoes', (req, res) => {
    res.json({
      success: true,
      lastSync: lastSyncTimestamp,
      data: liveVolcanoes,
    });
  });

  // Single volcano details & seismic data
  app.get('/api/volcanoes/:id', (req, res) => {
    const volcano = liveVolcanoes.find((v: any) => v.id === req.params.id);
    if (!volcano) {
      return res.status(404).json({ success: false, error: 'Volcano not found' });
    }
    res.json({ success: true, data: volcano });
  });

  // PVMBG reports endpoint
  app.get('/api/pvmbg-reports', (req, res) => {
    res.json({
      success: true,
      data: liveReports,
    });
  });

  // AI Volcanologist Advisory endpoint (Gemini Powered)
  app.post('/api/ai-advisory', async (req, res) => {
    const { prompt, volcano, recentReport } = req.body;

    const ai = getAiClient();
    if (!ai) {
      // Fallback rule-based expert volcanologist response
      return res.json({
        reply: `[PVMBG Automated Advisory] Untuk gunung ${volcano?.name || 'terkait'} (Status: ${volcano?.status || 'Aktif'}):
Tingkat kegempaan tremor dominan tercatat ${volcano?.seismicity24h?.tremorMenerusDominanMm || '0'} mm dengan RSAM ${volcano?.rsamValue || 'normal'} counts. 

Rekomendasi pencegahan bahaya:
1. Menjauhi zona prakiraan bahaya radius ${volcano?.dangerRadiusKm || 3} km dari pusat erupsi kawah aktif.
2. Mematuhi informasi resmi dari Pos Pengamatan Gunung Api setempat dan BPBD.
3. Menyiapkan masker dan pelindung mata untuk mengantisipasi sebaran abu vulkanik pekat.`,
      });
    }

    try {
      const systemInstruction = `Anda adalah Pakar Vulkanologi dan Mitigasi Bencana Geologi resmi (PVMBG/Badan Geologi Indonesia).
Gunakan bahasa Indonesia yang profesional, jelas, edukatif, dan menenangkan namun tegas terkait keselamatan evakuasi.
Gunakan data seismik (RSAM, amplitudo tremor, jenis gempa), observasi visual kawah, dan radius bahaya untuk menjawab pertanyaan pengguna dengan akurat.
Format jawaban dengan poin-poin terstruktur dan hindari spekulasi yang tidak berbasis data geologi.`;

      const userContext = `Data Gunung Api Saat Ini:
- Nama: ${volcano?.name} (${volcano?.province})
- Status Vulkanik: ${volcano?.status}
- Radius Bahaya Steril: ${volcano?.dangerRadiusKm} km
- Kawah: ${volcano?.craterName}
- RSAM: ${volcano?.rsamValue} counts
- Amplitudo Tremor: dominan ${volcano?.seismicity24h?.tremorMenerusDominanMm} mm, maks ${volcano?.seismicity24h?.tremorMenerusMaxMm} mm
- Frekuensi Dominan: ${volcano?.dominantFrequencyHz} Hz
- Gempa Letusan (24 jam): ${volcano?.seismicity24h?.letusan} kali
- Gempa Guguran (24 jam): ${volcano?.seismicity24h?.guguran} kali
- Visual Kawah: Asap ${volcano?.visualObservation?.smokeColor} setinggi ${volcano?.visualObservation?.smokeHeightMeters}m
- VONA Aviasi: ${volcano?.vonaColor}

Pertanyaan Pengguna:
${prompt}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\n${userContext}` }] },
        ],
      });

      const text = response.text || 'Tidak dapat memproses analisis AI saat ini.';
      res.json({ reply: text });
    } catch (err: any) {
      console.error('Gemini AI API Error:', err);
      res.status(500).json({
        reply: `Mohon maaf, terjadi gangguan koneksi ke layanan AI: ${err.message}. Tetap patuhi arahan resmi PVMBG dan hindari radius ${volcano?.dangerRadiusKm || 3} km.`,
      });
    }
  });

  // Vite middleware for development vs static production serving
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
