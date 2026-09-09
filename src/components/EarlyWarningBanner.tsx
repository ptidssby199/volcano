import React from 'react';
import { AlertTriangle, ChevronRight, ShieldAlert, X } from 'lucide-react';
import { EarlyWarningAlert } from '../types';

interface EarlyWarningBannerProps {
  alert: EarlyWarningAlert | null;
  onOpenDetails: (alert: EarlyWarningAlert) => void;
  onDismiss: () => void;
}

export const EarlyWarningBanner: React.FC<EarlyWarningBannerProps> = ({
  alert,
  onOpenDetails,
  onDismiss,
}) => {
  if (!alert) return null;

  const isLevel4 = alert.level === 'LEVEL_4';

  return (
    <div 
      id="early-warning-banner"
      className={`relative border-b shadow-lg px-4 py-3 sm:px-6 transition-all z-20 ${
        isLevel4
          ? 'bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 border-rose-600 text-white animate-pulse'
          : 'bg-gradient-to-r from-amber-950 via-orange-900 to-amber-950 border-orange-500 text-orange-100'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center p-2 rounded-lg bg-black/40 border border-white/20">
            <ShieldAlert className={`w-5 h-5 ${isLevel4 ? 'text-rose-400 animate-bounce' : 'text-amber-400'}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 text-xs font-black uppercase tracking-wider rounded bg-red-600 text-white">
                PERINGATAN DINI AKTIVITAS BERBAHAYA
              </span>
              <span className="font-bold text-sm sm:text-base tracking-wide text-white">
                {alert.volcanoName}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-black/40 border border-white/20 font-mono">
                Radius Bahaya: {alert.dangerRadiusKm} KM
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 truncate mt-0.5">
              {alert.headline} - {alert.actionUrgent}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="view-warning-details-btn"
            onClick={() => onOpenDetails(alert)}
            className="flex items-center gap-1 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg bg-white text-rose-900 hover:bg-slate-100 active:scale-95 transition shadow-sm"
          >
            <span>Prosedur Darurat</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            id="dismiss-warning-btn"
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-black/30 transition"
            title="Tutup banner peringatan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
