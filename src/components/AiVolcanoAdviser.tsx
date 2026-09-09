import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  FileText,
  Compass,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Volcano, PVMBGReport } from '../types';

interface AiVolcanoAdviserProps {
  volcanoes: Volcano[];
  selectedVolcano: Volcano;
  onSelectVolcano: (v: Volcano) => void;
  recentReports: PVMBGReport[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AiVolcanoAdviser: React.FC<AiVolcanoAdviserProps> = ({
  volcanoes,
  selectedVolcano,
  onSelectVolcano,
  recentReports,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Halo! Saya adalah Asisten Pakar Vulkanologi & Mitigasi Kebencanaan VulkanoTrack AI. 

Saya menganalisis data telemetri seismik real-time, grafik tremor, dan buletin resmi PVMBG / MAGMA Indonesia. Saat ini fokus analisis: **${selectedVolcano.name} (${selectedVolcano.status})**.

Silakan ajukan pertanyaan seputar:
1. **Analisis bahaya tremor saat ini** untuk ${selectedVolcano.name}
2. **Evaluasi radius evakuasi dan bahaya awan panas**
3. **Prakiraan ancaman lahar dingin dan sebaran abu vulkanik**
4. **Kesiapsiagaan masyarakat dan mitigasi risiko jalur penerbangan (VONA)**`,
      timestamp: 'Baru saja',
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const samplePrompts = [
    `Analisis risiko tremor dan potensi letusan ${selectedVolcano.name}`,
    `Apakah desa dalam radius ${selectedVolcano.dangerRadiusKm} km harus dievakuasi?`,
    `Bagaimana bahaya lahar dingin ${selectedVolcano.name} jika terjadi hujan lebat?`,
    `Evaluasi dampak kode penerbangan VONA untuk rute sekitar ${selectedVolcano.province}`,
  ];

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      // Call backend API /api/ai-advisory
      const response = await fetch('/api/ai-advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          volcano: selectedVolcano,
          recentReport: recentReports.find(r => r.volcanoId === selectedVolcano.id),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.reply,
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        throw new Error('API server unavailable');
      }
    } catch {
      // Fallback expert volcanology response generator
      setTimeout(() => {
        let aiAdvice = '';
        const v = selectedVolcano;

        if (textToSend.toLowerCase().includes('tremor') || textToSend.toLowerCase().includes('seismik')) {
          aiAdvice = `### Analisis Pakar Kegempaan Tremor: ${v.name}
Berdasarkan data sensor PVMBG terkini:
- **Amplitudo Tremor Dominan:** ${v.seismicity24h.tremorMenerusDominanMm} mm (Maksimum ${v.seismicity24h.tremorMenerusMaxMm} mm)
- **Frekuensi Dominan:** ${v.dominantFrequencyHz} Hz
- **RSAM Index:** ${v.rsamValue} counts (${v.rsamValue > 800 ? 'Tinggi - Suplai magma intensif' : 'Moderat'})

**Interpretasi Vulkanologi:**
Frekuensi di kisaran ${v.dominantFrequencyHz} Hz mengindikasikan resonansi fluida magmatik di pipa kepundan utama. ${
            v.status === 'LEVEL_4'
              ? 'Tingkat tremor kontinu yang tinggi ini menandakan erupsi sedang berlangsung secara berulang atau pelepasan energi magmatik permukaan berskala besar. Waspadai lontaran bom vulkanik dan aliran lava pijar.'
              : v.status === 'LEVEL_3'
              ? 'Terlihat adanya akumulasi tekanan gas dan pergerakan fluida ke arah permukaan. Risiko erupsi eksplosif atau efusif sewaktu-waktu tetap tinggi.'
              : 'Karakteristik tremor masih berada dalam fase mikro-tremor dan pelepasan gas fumarol normal.'
          }`;
        } else if (textToSend.toLowerCase().includes('evakuasi') || textToSend.toLowerCase().includes('radius')) {
          aiAdvice = `### Evaluasi Zona Bahaya & Evakuasi: ${v.name}
- **Status Resmi:** ${v.status}
- **Radius Steril Mutlak:** **${v.dangerRadiusKm} Kilometer** dari kawah aktif (${v.craterName}).

**Rekomendasi Tindakan Segera:**
1. **Zona Merah (${v.dangerRadiusKm} km):** Tidak boleh ada warga, pendaki, penambang pasir, atau wisatawan yang beraktivitas. Seluruh pemukiman di dalam radius radial ini wajib dikosongkan.
2. **Jalur Aliran Sungai:** Waspadai daerah aliran sungai yang berhulu di ${v.name}. Material awan panas guguran dapat meluncur dengan kecepatan > 100 km/jam.
3. **Evakuasi Lansia & Anak:** Prioritaskan kelompok rentan ke tempat penampungan sementara (TPS) yang telah ditetapkan BPBD ${v.province}.`;
        } else if (textToSend.toLowerCase().includes('lahar')) {
          aiAdvice = `### Mitigasi Bahaya Lahar Dingin / Lahar Hujan: ${v.name}
Endapan material erupsi berupa abu vulkanik, kerikil, dan pasir di sekitar lereng atas puncak ${v.name} mencapai volume signifikan.
- Jika curah hujan melebihi ambang batas **50 mm/jam**, endapan tersebut berpotensi besar berubah menjadi banjir lahar sekunder berkepadatan tinggi.
- Warga di sepanjang bantaran sungai diminta segera menjauhi bibir sungai minimal 500 meter saat cuaca mendung gelap atau hujan di puncak.`;
        } else {
          aiAdvice = `### Briefing Keselamatan & Mitigasi: ${v.name}
- **Status Vulkanik:** ${v.status}
- **Pengamatan Visual:** Kolom abu setinggi ${v.visualObservation.smokeHeightMeters} m berwarna ${v.visualObservation.smokeColor} condong ke arah ${v.visualObservation.smokeDirection}.
- **Kode VONA Aviasi:** ${v.vonaColor}

Masyarakat dihimbau untuk selalu mengenakan masker pelindung hidung dan mulut (minimal N95 atau masker medis rangkap) saat terjadi hujan abu, mengamankan penampungan air bersih, serta mematuhi seluruh arahan Pos PGA ${v.name} dan BPBD.`;
        }

        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: aiAdvice,
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setIsLoading(false);
      }, 700);
      return;
    }

    setIsLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* AI Assistant Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-rose-950/60 border border-amber-500/40 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/40 text-amber-400">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                Analisis AI Pakar Vulkanologi & Penanggulangan Bencana
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                GEMINI AI VOLCANO INTELLIGENCE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Analisis cerdas berdasarkan kompilasi sensor tremor, RSAM, observasi visual kawah, dan buletin MAGMA PVMBG.
            </p>
          </div>
        </div>

        {/* Selected Volcano Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Fokus Analisis:</span>
          <select
            value={selectedVolcano.id}
            onChange={(e) => {
              const v = volcanoes.find(item => item.id === e.target.value);
              if (v) onSelectVolcano(v);
            }}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 border border-slate-700 text-amber-300 focus:outline-none focus:border-amber-500"
          >
            {volcanoes.map(v => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Suggested Quick Questions */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          Rekomendasi Pertanyaan Analisis:
        </span>
        <div className="flex flex-wrap gap-2">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition active:scale-95 text-left"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl min-h-[380px] max-h-[520px] overflow-y-auto space-y-4 scrollbar-thin">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-rose-600 text-white rounded-tr-none'
                  : 'bg-slate-800/80 border border-slate-700 text-slate-100 rounded-tl-none'
              }`}
            >
              {msg.content}
              <div
                className={`text-[10px] mt-2 opacity-70 ${
                  msg.role === 'user' ? 'text-rose-200 text-right' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 items-center text-slate-400 text-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <span className="animate-pulse">Sedang mengkalkulasi analisis seismik & buletin PVMBG...</span>
          </div>
        )}
      </div>

      {/* Input Message Form */}
      <div className="relative">
        <input
          type="text"
          id="ai-query-input"
          placeholder={`Tanyakan analisis aktivitas vulkanik ${selectedVolcano.name}, potensi bahaya, atau panduan evakuasi...`}
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          className="w-full pl-4 pr-12 py-3.5 text-xs sm:text-sm rounded-2xl bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-xl"
        />
        <button
          id="ai-send-btn"
          onClick={() => handleSendMessage()}
          disabled={isLoading || !inputQuery.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold transition active:scale-95"
          title="Kirim pertanyaan"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
