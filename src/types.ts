export type AlertLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4';

export interface AlertLevelInfo {
  level: AlertLevel;
  indonesianName: string;
  englishName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
  recommendation: string;
}

export type VonaColor = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export interface SeismicEventCount {
  letusan: number;       // Eruption earthquakes
  guguran: number;       // Rockfall / Avalanche
  hembusan: number;      // Gas emissions / degassing
  harmonik: number;      // Harmonic tremor
  tornillo: number;      // Low frequency resonance
  vulkanikDangkal: number; // VB (Volcanic shallow)
  vulkanikDalam: number;   // VA (Volcanic deep)
  tektonikLokal: number;   // Local tectonic
  tektonikJauh: number;    // Regional / Distant tectonic
  tremorMenerusMaxMm: number; // Continuous tremor amplitude max
  tremorMenerusDominanMm: number; // Continuous tremor amplitude dominant
}

export interface Volcano {
  id: string;
  name: string;
  alias?: string;
  province: string;
  island: 'Sumatera' | 'Jawa' | 'Bali & Nusa Tenggara' | 'Sulawesi' | 'Maluku';
  latitude: number;
  longitude: number;
  elevationMeters: number;
  type: string; // Stratovolcano, Caldera, Complex, etc.
  status: AlertLevel;
  dangerRadiusKm: number; // e.g. 3, 5, 7 km
  craterName: string;
  vonaColor: VonaColor;
  lastUpdated: string;
  visualObservation: {
    smokeHeightMeters: number;
    smokeColor: 'Putih' | 'Kelabu' | 'Hitam' | 'Putih-Kelabu';
    smokeIntensity: 'Tipis' | 'Sedang' | 'Tebal';
    smokeDirection: string;
    craterGlow: boolean;
    weather: string;
    temperatureCelsius: number;
    humidityPercent: number;
    windSpeedKmph: number;
  };
  seismicity24h: SeismicEventCount;
  recentSeismicBurst?: {
    timestamp: string;
    type: string;
    amplitudeMm: number;
    durationSeconds: number;
    isDangerous: boolean;
  };
  rsamValue: number; // Real-time Seismic Amplitude Measurement (counts)
  tremorStatus: 'Normal' | 'Mikro-Tremor' | 'Tremor Spasmodik' | 'Tremor Harmonik' | 'Tremor Menerus Kuat';
  dominantFrequencyHz: number; // e.g. 1.8 Hz
  posPengamatan: {
    name: string;
    location: string;
    officer: string;
    contact: string;
  };
  recommendations: string[];
  historyNotes: string;
  webcamAvailable: boolean;
}

export interface LiveSeismicDataPoint {
  timestamp: number;
  amplitude: number; // normalized -1 to 1 or -50 to 50 mm
  rawMicroVolts: number;
  filteredValue: number;
  rsam: number;
  isTremorBurst: boolean;
}

export interface PVMBGReport {
  id: string;
  volcanoId: string;
  volcanoName: string;
  province: string;
  period: string; // e.g. "06:00 - 12:00 WIB"
  reportDate: string;
  reporter: string;
  status: AlertLevel;
  visualSummary: string;
  seismicSummary: string;
  recommendations: string[];
  vonaStatus?: {
    code: VonaColor;
    ashHeightMeters: number;
    movementDirection: string;
    aviationImpact: string;
  };
}

export interface EarlyWarningAlert {
  id: string;
  volcanoId: string;
  volcanoName: string;
  timestamp: string;
  level: AlertLevel;
  eventType: 'ERUPSI' | 'TREMOR_MENERUS_TINGGI' | 'GUGURAN_AWAN_PANAS' | 'LONJAKAN_SEISMIK' | 'STATUS_NAIK';
  headline: string;
  details: string;
  dangerRadiusKm: number;
  affectedVillages: string[];
  actionUrgent: string;
  acknowledged?: boolean;
}
