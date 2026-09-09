import React from 'react';
import { 
  AlertOctagon, 
  X, 
  MapPin, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  PhoneCall, 
  Radio, 
  Compass, 
  Layers
} from 'lucide-react';
import { EarlyWarningAlert } from '../types';
import { soundManager } from '../utils/audioAlert';

interface EarlyWarningModalProps {
  alert: EarlyWarningAlert | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EarlyWarningModal: React.FC<EarlyWarningModalProps> = ({
  alert,
  isOpen,
  onClose,
}) => {
  const [isPlayingSiren, setIsPlayingSiren] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && alert && alert.level === 'LEVEL_4') {
      soundManager.playEmergencySiren(4);
      setIsPlayingSiren(true);
      const t = setTimeout(() => setIsPlayingSiren(false), 4000);
      return () => clearTimeout(t);
    }
  }, [isOpen, alert]);

  if (!isOpen || !alert) return null;

  const handleToggleSiren = () => {
    if (isPlayingSiren) {
      soundManager.stopSiren();
      setIsPlayingSiren(false);
    } else {
      soundManager.playEmergencySiren(5);
      setIsPlayingSiren(true);
      setTimeout(() => setIsPlayingSiren(false), 5000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        id="early-warning-modal"
        className="relative w-full max-w-2xl bg-slate-900 border-2 border-rose-600 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 text-white p-4 sm:p-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-black/30 rounded-xl border border-white/30 animate-pulse">
              <AlertOctagon className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="inline-block text-[11px] font-black uppercase px-2 py-0.5 bg-black/40 rounded tracking-wider mb-1">
                SIAGA DARURAT BENCANA VULKANIK
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                {alert.volcanoName} - {alert.headline}
              </h3>
              <p className="text-xs text-rose-100 opacity-90">
                Waktu Deteksi: {alert.timestamp} • Sistem Deteksi Dini PVMBG
              </p>
            </div>
          </div>
          <button
            id="close-warning-modal-btn"
            onClick={onClose}
            className="p-2 rounded-lg bg-black/30 hover:bg-black/50 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 text-slate-200 text-sm">
          {/* Audio siren & urgent status */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-rose-950/50 border border-rose-700/60">
            <div className="flex items-center gap-2 text-rose-300">
              <Radio className="w-4 h-4 animate-spin" />
              <span className="font-semibold text-xs uppercase tracking-wide">
                Status Alarm Sirene Darurat
              </span>
            </div>
            <button
              id="modal-toggle-siren-btn"
              onClick={handleToggleSiren}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition active:scale-95 shadow"
            >
              {isPlayingSiren ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isPlayingSiren ? 'Matikan Sirene' : 'Bunyikan Sirene Evakuasi'}</span>
            </button>
          </div>

          {/* Core Alert Details */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Deskripsi Aktivitas Berbahaya</h4>
            <p className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 text-slate-100 leading-relaxed">
              {alert.details}
            </p>
          </div>

          {/* Danger Radius & Evacuation Boundary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-2">
                <Compass className="w-4 h-4" />
                <span>Radius Bahaya Wajib Kosong</span>
              </div>
              <div className="text-3xl font-black text-rose-500 font-mono">
                {alert.dangerRadiusKm} <span className="text-base font-normal text-slate-300">Kilometer</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Dilarang keras berada di dalam radius radial ini dari kawah aktif.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
                <Layers className="w-4 h-4" />
                <span>Rekomendasi Tindakan Segera</span>
              </div>
              <p className="text-xs text-slate-200 font-medium leading-relaxed">
                {alert.actionUrgent}
              </p>
            </div>
          </div>

          {/* Affected Villages / Sectors */}
          {alert.affectedVillages && alert.affectedVillages.length > 0 && (
            <div>
              <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>Wilayah / Desa Terdampak Langsung</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {alert.affectedVillages.map((village, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs text-slate-200">
                    {village}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Mitigation Checklist */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              Protokol Keselamatan Masyarakat
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Gunakan masker pelindung debu/kacamata pelindung untuk mencegah iritasi abu vulkanik pekat.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Jauhi lembah sungai yang berhulu di puncak untuk mengantisipasi banjir lahar hujan.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Siapkan dokumen penting, bekal air minum, senter, dan obat-obatan dalam Tas Siaga Bencana.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Ikuti instruksi resmi dari petugas Pos Pengamatan Gunung Api (PGA) dan BPBD setempat. Jangan percaya hoax.</span>
              </li>
            </ul>
          </div>

          {/* Emergency Contacts */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>Call Center BPBD / Basarnas: <strong>115 / 117</strong></span>
            </div>
            <button
              id="confirm-warning-acknowledged-btn"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition active:scale-95"
            >
              Saya Mengerti & Pantau Terus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
