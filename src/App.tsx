import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { EarlyWarningBanner } from './components/EarlyWarningBanner';
import { EarlyWarningModal } from './components/EarlyWarningModal';
import { VolcanoMap } from './components/VolcanoMap';
import { SeismicMonitor } from './components/SeismicMonitor';
import { PVMBGReportFeed } from './components/PVMBGReportFeed';
import { VolcanoDetailModal } from './components/VolcanoDetailModal';
import { AiVolcanoAdviser } from './components/AiVolcanoAdviser';
import { INDONESIA_VOLCANOES, INITIAL_PVMBG_REPORTS } from './data/indonesiaVolcanoes';
import { Volcano, EarlyWarningAlert, PVMBGReport } from './types';
import { soundManager } from './utils/audioAlert';

export default function App() {
  const [volcanoes, setVolcanoes] = useState<Volcano[]>(INDONESIA_VOLCANOES);
  const [selectedVolcano, setSelectedVolcano] = useState<Volcano>(INDONESIA_VOLCANOES[0]); // default Lewotobi Laki-laki
  const [reports, setReports] = useState<PVMBGReport[]>(INITIAL_PVMBG_REPORTS);
  const [currentTab, setCurrentTab] = useState<'map' | 'seismic' | 'reports' | 'ai'>('map');

  // Auto-update 60s timer
  const [secondsUntilUpdate, setSecondsUntilUpdate] = useState<number>(60);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Audio mute state
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Early Warning Alert States
  const [activeAlert, setActiveAlert] = useState<EarlyWarningAlert | null>({
    id: 'alert-initial-01',
    volcanoId: 'lewotobi-laki-laki',
    volcanoName: 'G. Lewotobi Laki-laki',
    timestamp: 'Real-time Terkini',
    level: 'LEVEL_4',
    eventType: 'ERUPSI',
    headline: 'Erupsi Eksplosif & Tremor Menerus Amplitudo 29.6 mm Terus Berlangsung',
    details: 'Teramati kolom abu letusan setinggi 1800 m di atas puncak dengan lontaran lava pijar dan awan panas ke sektor barat daya. Potensi bahaya guguran kubah lava sangat tinggi.',
    dangerRadiusKm: 7.0,
    affectedVillages: ['Desa Dulipali', 'Desa Klatanlo', 'Desa Hokeng Jaya', 'Desa Nobo', 'Desa Nurabelen'],
    actionUrgent: 'Radius 7 km WAJIB KOSONG! Segera mengungsi ke posko pengungsian terdekat di luar zona bahaya.',
  });

  const [alertModalOpen, setAlertModalOpen] = useState<boolean>(false);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(1);

  // Fetch updated data from backend or local fallback
  const fetchVolcanoData = useCallback(async (isManual: boolean = false) => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/volcanoes');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setVolcanoes(json.data);
          // Update selected volcano reference
          setSelectedVolcano(prev => json.data.find((v: Volcano) => v.id === prev.id) || prev);
        }
      } else {
        // Local simulation fluctuation if backend route not ready
        setVolcanoes(prev =>
          prev.map(v => ({
            ...v,
            lastUpdated: '1 menit yang lalu',
            rsamValue: Math.max(80, v.rsamValue + Math.floor((Math.random() - 0.48) * 14)),
          }))
        );
      }

      // Fetch reports
      const repRes = await fetch('/api/pvmbg-reports');
      if (repRes.ok) {
        const repJson = await repRes.json();
        if (repJson.data) setReports(repJson.data);
      }

      if (isManual) {
        soundManager.playSyncPing();
      }
    } catch {
      // Offline fallback
      setVolcanoes(prev =>
        prev.map(v => ({
          ...v,
          lastUpdated: '1 menit yang lalu',
          rsamValue: Math.max(80, v.rsamValue + Math.floor((Math.random() - 0.48) * 14)),
        }))
      );
    } finally {
      setIsRefreshing(false);
      setSecondsUntilUpdate(60);
    }
  }, []);

  // 60-second periodic countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilUpdate(prev => {
        if (prev <= 1) {
          fetchVolcanoData(false);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchVolcanoData]);

  // Audio mute handler
  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    soundManager.setMuted(newMuted);
  };

  // Trigger test emergency siren
  const handleTriggerTestAlarm = () => {
    const testAlert: EarlyWarningAlert = {
      id: `test-alert-${Date.now()}`,
      volcanoId: selectedVolcano.id,
      volcanoName: selectedVolcano.name,
      timestamp: 'Uji Coba Siaga',
      level: selectedVolcano.status === 'LEVEL_4' ? 'LEVEL_4' : 'LEVEL_3',
      eventType: 'LONJAKAN_SEISMIK',
      headline: `UJI COBA ALARM: Deteksi Tremor Kuat & Aktivitas Vulkanik Meningkat`,
      details: `Uji coba sistem peringatan dini PVMBG Sentinel untuk ${selectedVolcano.name}. Sensor mendeteksi lonjakan tremor amplitudo > 25 mm. Warga dalam radius ${selectedVolcano.dangerRadiusKm} km diimbau waspada penuh.`,
      dangerRadiusKm: selectedVolcano.dangerRadiusKm,
      affectedVillages: ['Sektor Lereng Barat', 'Sektor Bantaran Sungai Utama', 'Kawasan Rawan Bencana II & III'],
      actionUrgent: `Tetap tenang, periksa Tas Siaga Bencana, dan siapkan masker pelindung abu vulkanik.`,
    };

    setActiveAlert(testAlert);
    setAlertModalOpen(true);
    setUnreadAlertsCount(prev => prev + 1);
  };

  // Trigger from Seismic Monitor burst simulation
  const handleSeismicTriggerAlert = (v: Volcano, eventType: string, amplitude: number) => {
    const newAlert: EarlyWarningAlert = {
      id: `alert-burst-${Date.now()}`,
      volcanoId: v.id,
      volcanoName: v.name,
      timestamp: 'Baru Saja',
      level: v.status === 'LEVEL_4' ? 'LEVEL_4' : 'LEVEL_3',
      eventType: 'LONJAKAN_SEISMIK',
      headline: `LONJAKAN TREMOR AKUT: Amplitudo Mencapai ${amplitude} mm`,
      details: `Sensor seismik stasiun ${v.name} mendeteksi anomali gempa vulkanik beruntun dan pelepasan tremor bertekanan tinggi. Potensi erupsi eksplosif atau awan panas meningkat secara signifikan.`,
      dangerRadiusKm: v.dangerRadiusKm,
      affectedVillages: ['Radius ${v.dangerRadiusKm} km dari kawah aktif ${v.craterName}'],
      actionUrgent: `Kosongkan area dalam radius ${v.dangerRadiusKm} km dan amankan diri dari potensi lontaran material pijar!`,
    };

    setActiveAlert(newAlert);
    setUnreadAlertsCount(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-rose-500/30 selection:text-rose-200">
      {/* Persistent Early Warning Banner if active threat */}
      <EarlyWarningBanner
        alert={activeAlert}
        onOpenDetails={(alert) => {
          setActiveAlert(alert);
          setAlertModalOpen(true);
        }}
        onDismiss={() => setActiveAlert(null)}
      />

      {/* Main Header with Navigation & Live Clock */}
      <Header
        volcanoes={volcanoes}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        secondsUntilUpdate={secondsUntilUpdate}
        onManualRefresh={() => fetchVolcanoData(true)}
        isRefreshing={isRefreshing}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onTriggerTestAlarm={handleTriggerTestAlarm}
        unreadAlertsCount={unreadAlertsCount}
        onOpenAlertsModal={() => setAlertModalOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1">
        {currentTab === 'map' && (
          <VolcanoMap
            volcanoes={volcanoes}
            selectedVolcano={selectedVolcano}
            onSelectVolcano={(v) => setSelectedVolcano(v)}
            onOpenSeismicForVolcano={(v) => {
              setSelectedVolcano(v);
              setCurrentTab('seismic');
            }}
            onOpenDetailsForVolcano={(v) => {
              setSelectedVolcano(v);
              setDetailModalOpen(true);
            }}
          />
        )}

        {currentTab === 'seismic' && (
          <SeismicMonitor
            volcanoes={volcanoes}
            selectedVolcano={selectedVolcano}
            onSelectVolcano={(v) => setSelectedVolcano(v)}
            onTriggerAlert={handleSeismicTriggerAlert}
          />
        )}

        {currentTab === 'reports' && (
          <PVMBGReportFeed
            reports={reports}
            volcanoes={volcanoes}
            onSelectVolcano={(v) => {
              setSelectedVolcano(v);
              setCurrentTab('map');
            }}
          />
        )}

        {currentTab === 'ai' && (
          <AiVolcanoAdviser
            volcanoes={volcanoes}
            selectedVolcano={selectedVolcano}
            onSelectVolcano={(v) => setSelectedVolcano(v)}
            recentReports={reports}
          />
        )}
      </main>

      {/* Early Warning Emergency Modal */}
      <EarlyWarningModal
        alert={activeAlert}
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
      />

      {/* Volcano Deep-Dive Detail Modal */}
      <VolcanoDetailModal
        volcano={selectedVolcano}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onOpenSeismic={(v) => {
          setSelectedVolcano(v);
          setCurrentTab('seismic');
        }}
      />
    </div>
  );
}
