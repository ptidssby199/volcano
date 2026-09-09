import React from 'react';
import { 
  X, 
  MapPin, 
  Mountain, 
  Activity, 
  Wind, 
  Thermometer, 
  Droplets, 
  Eye, 
  Compass, 
  PhoneCall, 
  ShieldAlert, 
  Radio, 
  History,
  Camera
} from 'lucide-react';
import { Volcano } from '../types';
import { ALERT_LEVELS_INFO } from '../data/indonesiaVolcanoes';

interface VolcanoDetailModalProps {
  volcano: Volcano | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenSeismic: (v: Volcano) => void;
}

export const VolcanoDetailModal: React.FC<VolcanoDetailModalProps> = ({
  volcano,
  isOpen,
  onClose,
  onOpenSeismic,
}) => {
  if (!isOpen || !volcano) return null;

  const statusInfo = ALERT_LEVELS_INFO[volcano.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        id="volcano-detail-modal"
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header Ribbon */}
        <div className="bg-slate-950 border-b border-slate-800 p-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-rose-400">
              <Mountain className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  {volcano.name}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  {volcano.elevationMeters} mdpl
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor}`}>
                  {statusInfo.indonesianName}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {volcano.province} • Tipe: {volcano.type} • Kawah: {volcano.craterName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 text-slate-200 text-sm max-h-[75vh] overflow-y-auto scrollbar-thin">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Radius Bahaya</span>
              <span className="text-lg font-bold text-rose-400 font-mono">{volcano.dangerRadiusKm} km</span>
              <span className="text-[10px] text-slate-500 block">zona steril</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">RSAM Seismik</span>
              <span className="text-lg font-bold text-amber-400 font-mono">{volcano.rsamValue} counts</span>
              <span className="text-[10px] text-slate-500 block">amplitudo kumulatif</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tremor Dominan</span>
              <span className="text-lg font-bold text-sky-400 font-mono">{volcano.seismicity24h.tremorMenerusDominanMm} mm</span>
              <span className="text-[10px] text-slate-500 block">frek {volcano.dominantFrequencyHz} Hz</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Kode VONA Aviasi</span>
              <span className={`text-lg font-bold font-mono ${
                volcano.vonaColor === 'RED' ? 'text-rose-400' : volcano.vonaColor === 'ORANGE' ? 'text-orange-400' : 'text-amber-400'
              }`}>
                {volcano.vonaColor}
              </span>
              <span className="text-[10px] text-slate-500 block">notis penerbangan</span>
            </div>
          </div>

          {/* Visual Observation & Simulated Crater Cam */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Pengamatan Visual Kawah & Cuaca (Pos PGA)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-mono">
                LIVE CAM AKTIF
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Kolom Hembusan Asap</span>
                <span className="font-bold text-white text-sm">
                  {volcano.visualObservation.smokeHeightMeters} meter
                </span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Warna {volcano.visualObservation.smokeColor} ({volcano.visualObservation.smokeIntensity}) ke arah {volcano.visualObservation.smokeDirection}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Sinar Api / Cahaya Lava</span>
                <span className={`font-bold text-sm ${volcano.visualObservation.craterGlow ? 'text-rose-400' : 'text-slate-400'}`}>
                  {volcano.visualObservation.craterGlow ? 'Teramati (Pijar Lava Aktif)' : 'Tidak Teramati'}
                </span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Cuaca: {volcano.visualObservation.weather}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Meteorologi Puncak</span>
                <div className="flex items-center gap-3 mt-1 text-slate-200">
                  <span className="flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                    <span>{volcano.visualObservation.temperatureCelsius}°C</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-sky-400" />
                    <span>{volcano.visualObservation.humidityPercent}%</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-slate-400" />
                    <span>{volcano.visualObservation.windSpeedKmph} km/j</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Seismicity 24h Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-500" />
              <span>Rincian Kejadian Seismik Terkini (24 Jam)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] text-slate-400 block">Gempa Letusan</span>
                <span className="font-bold text-rose-400 text-sm">{volcano.seismicity24h.letusan}x</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] text-slate-400 block">Guguran Lava</span>
                <span className="font-bold text-orange-400 text-sm">{volcano.seismicity24h.guguran}x</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] text-slate-400 block">Hembusan Gas</span>
                <span className="font-bold text-amber-300 text-sm">{volcano.seismicity24h.hembusan}x</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] text-slate-400 block">Vulkanik Dangkal (VB)</span>
                <span className="font-bold text-sky-400 text-sm">{volcano.seismicity24h.vulkanikDangkal}x</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] text-slate-400 block">Vulkanik Dalam (VA)</span>
                <span className="font-bold text-indigo-400 text-sm">{volcano.seismicity24h.vulkanikDalam}x</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] text-slate-400 block">Tektonik Lokal</span>
                <span className="font-bold text-emerald-400 text-sm">{volcano.seismicity24h.tektonikLokal}x</span>
              </div>
            </div>
          </div>

          {/* Geological History & Character */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs">
            <h4 className="font-bold text-slate-300 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Catatan Karakteristik Letusan & Sejarah</span>
            </h4>
            <p className="text-slate-400 leading-relaxed">
              {volcano.historyNotes}
            </p>
          </div>

          {/* Pos Pengamatan & Emergency Station */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Pos Pengamatan Gunung Api (PGA) PVMBG:
              </span>
              <p className="font-semibold text-white mt-0.5">{volcano.posPengamatan.name}</p>
              <p className="text-slate-400">{volcano.posPengamatan.location}</p>
              <p className="text-slate-400">Petugas Jaga: {volcano.posPengamatan.officer}</p>
            </div>
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span className="font-mono font-bold text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                {volcano.posPengamatan.contact}
              </span>
            </div>
          </div>

          {/* Official Recommendations */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Rekomendasi Resmi PVMBG</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {volcano.recommendations.map((rec, i) => (
                <li key={i} className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Sumber: Pusat Vulkanologi dan Mitigasi Bencana Geologi (PVMBG)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenSeismic(volcano);
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow"
            >
              <Activity className="w-4 h-4" />
              <span>Buka Monitor Seismik Gunung Ini</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
