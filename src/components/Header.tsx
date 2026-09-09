import React from 'react';
import { 
  Flame, 
  Volume2, 
  VolumeX, 
  RotateCw, 
  Radio, 
  Clock, 
  MapPin, 
  Activity, 
  FileText, 
  Sparkles,
  Megaphone
} from 'lucide-react';
import { Volcano } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  volcanoes: Volcano[];
  currentTab: 'map' | 'seismic' | 'reports' | 'ai';
  onTabChange: (tab: 'map' | 'seismic' | 'reports' | 'ai') => void;
  secondsUntilUpdate: number;
  onManualRefresh: () => void;
  isRefreshing: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onTriggerTestAlarm: () => void;
  unreadAlertsCount: number;
  onOpenAlertsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  volcanoes,
  currentTab,
  onTabChange,
  secondsUntilUpdate,
  onManualRefresh,
  isRefreshing,
  isMuted,
  onToggleMute,
  onTriggerTestAlarm,
  unreadAlertsCount,
  onOpenAlertsModal,
}) => {
  const [timeStr, setTimeStr] = React.useState('');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const wibOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      const wibTime = new Intl.DateTimeFormat('id-ID', wibOptions).format(now);
      setTimeStr(`${wibTime} WIB`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const countL4 = volcanoes.filter(v => v.status === 'LEVEL_4').length;
  const countL3 = volcanoes.filter(v => v.status === 'LEVEL_3').length;
  const countL2 = volcanoes.filter(v => v.status === 'LEVEL_2').length;
  const countL1 = volcanoes.filter(v => v.status === 'LEVEL_1').length;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-lg">
      {/* Top Banner: Status & Quick Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold tracking-wide animate-pulse">
            <Radio className="w-3 h-3 text-rose-400 animate-spin" style={{ animationDuration: '3s' }} />
            <span>PVMBG LIVE SENTINEL</span>
          </div>
          <span className="hidden sm:inline text-slate-400">Pusat Vulkanologi dan Mitigasi Bencana Geologi</span>
        </div>

        <div className="flex items-center gap-3 text-slate-300">
          <div className="flex items-center gap-1.5 font-mono text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>{timeStr || 'Memuat...'}</span>
          </div>

          {/* Auto-update Countdown per Menit */}
          <button 
            id="refresh-btn"
            onClick={onManualRefresh}
            disabled={isRefreshing}
            title="Klik untuk sinkronisasi paksa data PVMBG"
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-slate-200 transition"
          >
            <RotateCw className={`w-3 h-3 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>
              Auto-sync: <strong className="text-emerald-400 font-mono">{secondsUntilUpdate}s</strong>
            </span>
          </button>

          {/* Audio Alarm Mute Toggle */}
          <button
            id="mute-toggle-btn"
            onClick={onToggleMute}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition ${
              isMuted 
                ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200' 
                : 'bg-rose-950/40 border-rose-700/50 text-rose-300 hover:bg-rose-900/40'
            }`}
            title={isMuted ? 'Suara alarm dibisukan' : 'Suara alarm aktif'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-rose-400 animate-pulse" />}
            <span className="hidden md:inline">{isMuted ? 'Alarm Senyap' : 'Alarm Aktif'}</span>
          </button>

          {/* Test Siren Button */}
          <button
            id="test-siren-btn"
            onClick={onTriggerTestAlarm}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-medium transition active:scale-95"
            title="Uji coba sirene evakuasi dini"
          >
            <Megaphone className="w-3 h-3 text-rose-400" />
            <span className="hidden lg:inline">Tes Sirene</span>
          </button>

          {/* Alerts Counter */}
          <button
            id="alerts-counter-btn"
            onClick={onOpenAlertsModal}
            className="relative flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-medium transition"
          >
            <span>Peringatan</span>
            {unreadAlertsCount > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 rounded-full animate-bounce">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* PWA Install & GitHub Deploy Guide */}
          <PWAInstallButton />
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 shadow-md shadow-rose-950/50">
            <Flame className="w-6 h-6 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                VulkanoTrack <span className="text-amber-400 font-semibold">Indonesia</span>
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                v2.6 REALTIME
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sistem Pemantauan Terpadu 127+ Gunung Api Aktif & Deteksi Tremor Sensorik
            </p>
          </div>
        </div>

        {/* Status Count Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs overflow-x-auto py-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/70 border border-rose-600/60 text-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="font-bold">{countL4}</span>
            <span className="hidden sm:inline">Level IV (Awas)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-950/70 border border-orange-500/60 text-orange-300">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            <span className="font-bold">{countL3}</span>
            <span className="hidden sm:inline">Level III (Siaga)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-500/60 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="font-bold">{countL2}</span>
            <span className="hidden sm:inline">Level II (Waspada)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-bold">{countL1}</span>
            <span className="hidden sm:inline">Level I (Normal)</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto scrollbar-none border-t border-slate-800/80">
        <button
          id="tab-map"
          onClick={() => onTabChange('map')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            currentTab === 'map'
              ? 'border-rose-500 text-rose-400 bg-rose-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Peta Interaktif Sebaran</span>
        </button>

        <button
          id="tab-seismic"
          onClick={() => onTabChange('seismic')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            currentTab === 'seismic'
              ? 'border-rose-500 text-rose-400 bg-rose-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Monitor Seismik & Deteksi Tremor</span>
          <span className="bg-rose-500/20 text-rose-300 text-[10px] px-1.5 py-0.2 rounded font-mono">LIVE</span>
        </button>

        <button
          id="tab-reports"
          onClick={() => onTabChange('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            currentTab === 'reports'
              ? 'border-rose-500 text-rose-400 bg-rose-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Laporan PVMBG & VONA</span>
        </button>

        <button
          id="tab-ai"
          onClick={() => onTabChange('ai')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            currentTab === 'ai'
              ? 'border-amber-500 text-amber-400 bg-amber-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Analisis AI Pakar Vulkanologi</span>
        </button>
      </div>
    </header>
  );
};
