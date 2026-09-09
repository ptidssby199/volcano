import React, { useState } from 'react';
import { 
  FileText, 
  Plane, 
  Calendar, 
  User, 
  AlertCircle, 
  Search, 
  Filter, 
  ExternalLink,
  ShieldCheck,
  Wind
} from 'lucide-react';
import { PVMBGReport, Volcano } from '../types';
import { ALERT_LEVELS_INFO } from '../data/indonesiaVolcanoes';

interface PVMBGReportFeedProps {
  reports: PVMBGReport[];
  volcanoes: Volcano[];
  onSelectVolcano: (volcano: Volcano) => void;
}

export const PVMBGReportFeed: React.FC<PVMBGReportFeedProps> = ({
  reports,
  volcanoes,
  onSelectVolcano,
}) => {
  const [filterVonaOnly, setFilterVonaOnly] = useState(false);
  const [selectedVolcanoFilter, setSelectedVolcanoFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReports = reports.filter(rep => {
    const matchesVolcano = selectedVolcanoFilter === 'ALL' || rep.volcanoId === selectedVolcanoFilter;
    const matchesVona = !filterVonaOnly || !!rep.vonaStatus;
    const matchesSearch = 
      rep.volcanoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.visualSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.seismicSummary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesVolcano && matchesVona && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Feed Header & Filters */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Buletin Laporan Aktivitas PVMBG & Notis Penerbangan (VONA)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Data terverifikasi langsung dari Pos Pengamatan Gunung Api (PGA) se-Indonesia via MAGMA Indonesia PVMBG.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterVonaOnly(!filterVonaOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                filterVonaOnly
                  ? 'bg-rose-950/60 border-rose-600 text-rose-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              <span>Hanya Kode VONA Penerbangan</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Volcano Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari laporan letusan, abu vulkanik, atau gempa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <select
              value={selectedVolcanoFilter}
              onChange={(e) => setSelectedVolcanoFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value="ALL">Semua Gunung Berapi</option>
              {volcanoes.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.province})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports Feed List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-500" />
            <p>Tidak ada laporan PVMBG yang sesuai dengan filter pencarian.</p>
          </div>
        ) : (
          filteredReports.map(rep => {
            const statusInfo = ALERT_LEVELS_INFO[rep.status];
            const matchingVolcano = volcanoes.find(v => v.id === rep.volcanoId);

            return (
              <div 
                key={rep.id} 
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-lg space-y-4"
              >
                {/* Report Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-white hover:text-rose-400 cursor-pointer"
                          onClick={() => matchingVolcano && onSelectVolcano(matchingVolcano)}>
                        {rep.volcanoName}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {rep.province}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor}`}>
                        {statusInfo.indonesianName}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Periode: {rep.period}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>Penyusun: {rep.reporter}</span>
                      </span>
                    </div>
                  </div>

                  {/* VONA Aviation Badge if present */}
                  {rep.vonaStatus && (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
                      <Plane className="w-4 h-4 text-amber-400" />
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">VONA Kode</span>
                        <span className={`font-black ${
                          rep.vonaStatus.code === 'RED' 
                            ? 'text-rose-400' 
                            : rep.vonaStatus.code === 'ORANGE' 
                              ? 'text-orange-400' 
                              : 'text-amber-400'
                        }`}>
                          {rep.vonaStatus.code} ({rep.vonaStatus.ashHeightMeters} m)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Observation Summaries */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800 space-y-1.5">
                    <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] block text-sky-400">
                      Pengamatan Visual Kawah
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {rep.visualSummary}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800 space-y-1.5">
                    <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] block text-rose-400">
                      Pengamatan Kegempaan / Sensorik
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {rep.seismicSummary}
                    </p>
                  </div>
                </div>

                {/* VONA Detail if available */}
                {rep.vonaStatus && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 text-xs flex items-start gap-2 text-amber-200">
                    <Wind className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-300">Dampak Koridor Aviasi Udara: </strong>
                      <span>{rep.vonaStatus.aviationImpact} Arah pergerakan abu ke {rep.vonaStatus.movementDirection}.</span>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                    Rekomendasi Resmi PVMBG:
                  </span>
                  <ul className="space-y-1 text-slate-300">
                    {rep.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
