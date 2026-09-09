import React, { useEffect, useRef, useState } from 'react';
import { 
  Activity, 
  Sliders, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  Flame, 
  Zap, 
  BarChart2, 
  Play, 
  Pause, 
  RotateCcw,
  ShieldAlert,
  Radio,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { Volcano, AlertLevel } from '../types';
import { ALERT_LEVELS_INFO } from '../data/indonesiaVolcanoes';
import { soundManager } from '../utils/audioAlert';

interface SeismicMonitorProps {
  volcanoes: Volcano[];
  selectedVolcano: Volcano;
  onSelectVolcano: (v: Volcano) => void;
  onTriggerAlert: (volcano: Volcano, eventType: string, amplitude: number) => void;
}

export const SeismicMonitor: React.FC<SeismicMonitorProps> = ({
  volcanoes,
  selectedVolcano,
  onSelectVolcano,
  onTriggerAlert,
}) => {
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Audio & Simulation States
  const [isRunning, setIsRunning] = useState(true);
  const [gain, setGain] = useState<number>(1.5);
  const [filterMode, setFilterMode] = useState<'TREMOR' | 'WIDEBAND' | 'HIGH_FREQ'>('TREMOR');
  const [thresholdMm, setThresholdMm] = useState<number>(12);
  const [isAlarmTriggered, setIsAlarmTriggered] = useState(false);

  // Live Telemetry States
  const [currentAmplitudeMm, setCurrentAmplitudeMm] = useState<number>(0);
  const [currentRsam, setCurrentRsam] = useState<number>(selectedVolcano.rsamValue);
  const [dominantFreq, setDominantFreq] = useState<number>(selectedVolcano.dominantFrequencyHz);
  const [tremorType, setTremorType] = useState<string>(selectedVolcano.tremorStatus);

  // Audio alert on threshold
  const [audioAlertEnabled, setAudioAlertEnabled] = useState(true);

  // Simulated burst trigger state
  const [burstActive, setBurstActive] = useState(false);
  const burstEndTimeRef = useRef(0);

  // Historical waveform buffer
  const waveformBufferRef = useRef<number[]>([]);
  const maxBufferSize = 400; // number of points across canvas width

  // Initialize buffer
  useEffect(() => {
    waveformBufferRef.current = new Array(maxBufferSize).fill(0);
    setCurrentRsam(selectedVolcano.rsamValue);
    setDominantFreq(selectedVolcano.dominantFrequencyHz);
    setTremorType(selectedVolcano.tremorStatus);
  }, [selectedVolcano.id]);

  // Main 60FPS Seismograph Animation Loop
  useEffect(() => {
    if (!isRunning) return;

    let t = 0;

    const render = () => {
      t += 0.05;
      const now = Date.now();

      // Check if manual burst is active
      const isBursting = burstActive && now < burstEndTimeRef.current;
      if (burstActive && now >= burstEndTimeRef.current) {
        setBurstActive(false);
      }

      // Base intensity derived from volcano status
      let baseNoise = 0.5;
      let tremorFrequency = selectedVolcano.dominantFrequencyHz;
      let tremorAmp = selectedVolcano.seismicity24h.tremorMenerusDominanMm;

      if (selectedVolcano.status === 'LEVEL_4') {
        baseNoise = 2.5;
        tremorAmp = 16.0;
      } else if (selectedVolcano.status === 'LEVEL_3') {
        baseNoise = 1.4;
        tremorAmp = 8.5;
      } else if (selectedVolcano.status === 'LEVEL_2') {
        baseNoise = 0.8;
        tremorAmp = 3.0;
      }

      // If active burst simulation
      if (isBursting) {
        baseNoise = 6.0;
        tremorAmp = 28.0;
      }

      // Synthetic seismic waveform formula:
      // Combines primary tremor harmonic wave + secondary microseisms + broadband ground noise
      const harmonic1 = Math.sin(t * tremorFrequency * Math.PI * 2) * (tremorAmp * 0.7);
      const harmonic2 = Math.sin(t * (tremorFrequency * 2.1) * Math.PI * 2 + 1.2) * (tremorAmp * 0.3);
      const noise = (Math.random() - 0.5) * baseNoise * 4;

      // Filter simulation
      let sample = harmonic1 + harmonic2 + noise;
      if (filterMode === 'TREMOR') {
        // Bandpass 0.8 - 2.5 Hz emphasis
        sample = harmonic1 * 1.2 + noise * 0.3;
      } else if (filterMode === 'HIGH_FREQ') {
        sample = noise * 1.5 + harmonic2 * 0.5;
      }

      const calculatedMm = Math.abs(sample * gain);

      // Push to waveform buffer
      waveformBufferRef.current.push(sample * gain);
      if (waveformBufferRef.current.length > maxBufferSize) {
        waveformBufferRef.current.shift();
      }

      // Live RSAM Calculation
      const rsamCalc = Math.round(
        (selectedVolcano.rsamValue * 0.9) + (calculatedMm * 38) + (Math.random() * 20)
      );

      // Check tremor threshold
      if (calculatedMm > thresholdMm) {
        setIsAlarmTriggered(true);
        if (audioAlertEnabled && Math.random() < 0.05) {
          soundManager.playTremorWarning();
        }
      } else {
        setIsAlarmTriggered(false);
      }

      // Update React state throttled
      if (Math.floor(t * 10) % 5 === 0) {
        setCurrentAmplitudeMm(parseFloat(calculatedMm.toFixed(1)));
        setCurrentRsam(rsamCalc);

        if (calculatedMm > 20 || selectedVolcano.status === 'LEVEL_4') {
          setTremorType('Tremor Menerus Kuat');
        } else if (calculatedMm > 10) {
          setTremorType('Tremor Harmonik');
        } else if (calculatedMm > 4) {
          setTremorType('Tremor Spasmodik');
        } else if (calculatedMm > 1.5) {
          setTremorType('Mikro-Tremor');
        } else {
          setTremorType('Normal / Latar Belakang');
        }
      }

      // DRAW SEISMOGRAM CANVAS
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          const midY = h / 2;

          // Background
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, w, h);

          // Grid lines & Helicorder lines
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;

          // Vertical 1-second grid markers
          for (let x = 0; x < w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
          }

          // Horizontal baseline and amplitude markers
          [-30, -15, 0, 15, 30].forEach(offsetMm => {
            const y = midY - (offsetMm * 2.5);
            ctx.strokeStyle = offsetMm === 0 ? '#334155' : '#1e293b';
            ctx.setLineDash(offsetMm === 0 ? [] : [4, 4]);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
            ctx.setLineDash([]);

            if (offsetMm !== 0) {
              ctx.fillStyle = '#64748b';
              ctx.font = '9px monospace';
              ctx.fillText(`${offsetMm > 0 ? '+' : ''}${offsetMm} mm`, 5, y - 2);
            }
          });

          // Threshold warning boundary lines
          const threshYPos = midY - (thresholdMm * 2.5);
          const threshYNeg = midY + (thresholdMm * 2.5);
          ctx.strokeStyle = '#ef444466';
          ctx.setLineDash([6, 3]);
          ctx.beginPath();
          ctx.moveTo(0, threshYPos);
          ctx.lineTo(w, threshYPos);
          ctx.moveTo(0, threshYNeg);
          ctx.lineTo(w, threshYNeg);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#ef4444';
          ctx.font = '10px sans-serif';
          ctx.fillText(`Threshold Bahaya (${thresholdMm} mm)`, w - 165, threshYPos - 4);

          // DRAW MAIN SEISMIC WAVE TRACE
          ctx.beginPath();
          ctx.lineWidth = 1.8;
          ctx.strokeStyle = calculatedMm > thresholdMm ? '#ef4444' : '#38bdf8'; // red when over threshold, else sky-400

          const buffer = waveformBufferRef.current;
          const step = w / maxBufferSize;

          for (let i = 0; i < buffer.length; i++) {
            const x = i * step;
            const y = midY - (buffer[i] * 2.5);
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();

          // Pen needle highlight at front
          if (buffer.length > 0) {
            const lastX = (buffer.length - 1) * step;
            const lastY = midY - (buffer[buffer.length - 1] * 2.5);
            ctx.fillStyle = calculatedMm > thresholdMm ? '#ef4444' : '#38bdf8';
            ctx.beginPath();
            ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // DRAW FREQUENCY SPECTRUM (FFT / SPECTROGRAM BAR)
      const specCanvas = spectrumCanvasRef.current;
      if (specCanvas) {
        const sCtx = specCanvas.getContext('2d');
        if (sCtx) {
          const sw = specCanvas.width;
          const sh = specCanvas.height;
          sCtx.fillStyle = '#0f172a';
          sCtx.fillRect(0, 0, sw, sh);

          const barCount = 20;
          const barWidth = sw / barCount;

          for (let b = 0; b < barCount; b++) {
            const freqVal = 0.5 + (b * 0.45); // 0.5 to 9.5 Hz
            // Resonance peak around dominantFreq
            const diff = Math.abs(freqVal - dominantFreq);
            const peakFactor = Math.max(0.1, 1 - diff * 0.6);
            const randomJitter = Math.random() * 0.15;
            const barHeight = Math.min(sh - 10, (sh * peakFactor * (calculatedMm / 15 + 0.3)) + (randomJitter * 20));

            // Color: Red if tremor peak in 1.0 - 2.5 Hz, else cyan/slate
            const isTremorPeakZone = freqVal >= 1.0 && freqVal <= 2.5;
            sCtx.fillStyle = isTremorPeakZone ? '#f97316' : '#0284c7';
            sCtx.fillRect(b * barWidth + 1, sh - barHeight, barWidth - 2, barHeight);

            // Frequency label below
            if (b % 4 === 0) {
              sCtx.fillStyle = '#64748b';
              sCtx.font = '8px monospace';
              sCtx.fillText(`${freqVal.toFixed(1)}Hz`, b * barWidth + 2, sh - 2);
            }
          }
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    animationFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isRunning, gain, filterMode, thresholdMm, selectedVolcano, burstActive, audioAlertEnabled]);

  const handleSimulateBurst = () => {
    setBurstActive(true);
    burstEndTimeRef.current = Date.now() + 15000; // 15 seconds burst
    soundManager.playTremorWarning();
    onTriggerAlert(
      selectedVolcano,
      'LONJAKAN_SEISMIK',
      29.6
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Volcano Selector & Live Station Meta */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                Stasiun Seismik: Pos PGA {selectedVolcano.name}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                {selectedVolcano.id.toUpperCase()}-SEIS-01
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sensor: Broadband Triaxial Seismometer & Titik Deformasi PVMBG • Koordinat: [{selectedVolcano.latitude}, {selectedVolcano.longitude}]
            </p>
          </div>
        </div>

        {/* Volcano Switcher Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400">Pilih Gunung:</label>
          <select
            id="seismic-volcano-selector"
            value={selectedVolcano.id}
            onChange={(e) => {
              const found = volcanoes.find(v => v.id === e.target.value);
              if (found) onSelectVolcano(found);
            }}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
          >
            {volcanoes.map(v => (
              <option key={v.id} value={v.id}>
                {v.name} ({ALERT_LEVELS_INFO[v.status].englishName}) - {v.province}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Monitoring Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Real-time Seismograph Screen (Takes 3 columns) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-xl space-y-3">
            {/* Seismogram Header & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-bold text-slate-200">REALTIME HELICORDER FEED (60 FPS)</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400 font-mono">Sample Rate: 100 Hz</span>
              </div>

              {/* Toolbar Controls */}
              <div className="flex items-center gap-2">
                {/* Filter Mode */}
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                  <button
                    onClick={() => setFilterMode('TREMOR')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                      filterMode === 'TREMOR' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Filter pita frekuensi tremor vulkanik 0.8 - 2.5 Hz"
                  >
                    Tremor (0.8-2.5Hz)
                  </button>
                  <button
                    onClick={() => setFilterMode('WIDEBAND')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                      filterMode === 'WIDEBAND' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Wideband
                  </button>
                  <button
                    onClick={() => setFilterMode('HIGH_FREQ')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                      filterMode === 'HIGH_FREQ' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    High (VB)
                  </button>
                </div>

                {/* Gain / Sensitivity */}
                <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 text-slate-300">
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px]">Gain:</span>
                  <select
                    value={gain}
                    onChange={(e) => setGain(parseFloat(e.target.value))}
                    className="bg-transparent text-amber-400 font-bold text-[11px] focus:outline-none cursor-pointer"
                  >
                    <option value="0.5">0.5x</option>
                    <option value="1.0">1.0x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2.5">2.5x</option>
                    <option value="5.0">5.0x</option>
                  </select>
                </div>

                {/* Play/Pause */}
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  title={isRunning ? 'Jeda tampilan' : 'Lanjutkan tampilan'}
                >
                  {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Canvas Seismogram Box */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#090d16]">
              <canvas
                ref={canvasRef}
                width={840}
                height={280}
                className="w-full h-64 sm:h-72 block"
              />

              {/* Real-time Indicator Overlays */}
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Amplitudo Saat Ini:</span>
                  <span className={`font-bold ${currentAmplitudeMm > thresholdMm ? 'text-rose-400 animate-pulse' : 'text-sky-300'}`}>
                    {currentAmplitudeMm.toFixed(1)} mm
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">RSAM Telemetri:</span>
                  <span className="font-bold text-amber-400">{currentRsam} counts</span>
                </div>
              </div>

              {/* Threshold Alarm Indicator */}
              {isAlarmTriggered && (
                <div className="absolute top-3 right-3 bg-rose-600/90 text-white px-3 py-1.5 rounded-lg border border-rose-400 shadow-lg text-xs font-bold flex items-center gap-1.5 animate-bounce">
                  <AlertTriangle className="w-4 h-4" />
                  <span>TREMOR MELEBIHI AMBANG BATAS!</span>
                </div>
              )}
            </div>

            {/* Action Bar Under Seismograph */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
              <div className="flex items-center gap-3">
                {/* Audio alarm toggle */}
                <button
                  onClick={() => setAudioAlertEnabled(!audioAlertEnabled)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition ${
                    audioAlertEnabled
                      ? 'bg-rose-950/50 border-rose-600 text-rose-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {audioAlertEnabled ? <Volume2 className="w-3.5 h-3.5 text-rose-400" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>Alert Audio Sensor {audioAlertEnabled ? 'AKTIF' : 'OFF'}</span>
                </button>

                {/* Threshold Slider */}
                <div className="flex items-center gap-2 text-slate-400">
                  <span>Batas Alarm:</span>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={thresholdMm}
                    onChange={(e) => setThresholdMm(parseInt(e.target.value))}
                    className="w-24 accent-rose-500 cursor-pointer"
                  />
                  <span className="font-mono text-white font-bold">{thresholdMm} mm</span>
                </div>
              </div>

              {/* Simulate Spike Button */}
              <button
                id="simulate-burst-btn"
                onClick={handleSimulateBurst}
                disabled={burstActive}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold transition shadow active:scale-95 disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>{burstActive ? 'Simulasi Tremor Berlangsung...' : 'Simulasikan Gempa Tremor Erupsi'}</span>
              </button>
            </div>
          </div>

          {/* Daily Seismicity Breakdown (24h Counts) */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-amber-400" />
              <span>Rekapitulasi Kegempaan 24 Jam Terakhir (PVMBG MAGMA)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 text-center">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Gempa Letusan</span>
                <span className="text-lg font-bold text-rose-400 font-mono">
                  {selectedVolcano.seismicity24h.letusan}
                </span>
                <span className="text-[9px] text-slate-500 block">kali</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Guguran Lava</span>
                <span className="text-lg font-bold text-orange-400 font-mono">
                  {selectedVolcano.seismicity24h.guguran}
                </span>
                <span className="text-[9px] text-slate-500 block">kali</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Hembusan Gas</span>
                <span className="text-lg font-bold text-amber-300 font-mono">
                  {selectedVolcano.seismicity24h.hembusan}
                </span>
                <span className="text-[9px] text-slate-500 block">kali</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Vulkanik Dangkal</span>
                <span className="text-lg font-bold text-sky-400 font-mono">
                  {selectedVolcano.seismicity24h.vulkanikDangkal}
                </span>
                <span className="text-[9px] text-slate-500 block">VB</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Vulkanik Dalam</span>
                <span className="text-lg font-bold text-indigo-400 font-mono">
                  {selectedVolcano.seismicity24h.vulkanikDalam}
                </span>
                <span className="text-[9px] text-slate-500 block">VA</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Tremor Harmonik</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {selectedVolcano.seismicity24h.harmonik}
                </span>
                <span className="text-[9px] text-slate-500 block">kali</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Tremor Max</span>
                <span className="text-lg font-bold text-purple-400 font-mono">
                  {selectedVolcano.seismicity24h.tremorMenerusMaxMm}
                </span>
                <span className="text-[9px] text-slate-500 block">mm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tremor Diagnostics & Spectral Analysis (Takes 1 column) */}
        <div className="space-y-4">
          {/* Tremor Classification Box */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider border-b border-slate-800 pb-2">
              <ShieldAlert className="w-4 h-4" />
              <span>Diagnosis Deteksi Tremor Akurat</span>
            </div>

            {/* Tremor Status Pill */}
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Klasifikasi Tremor Saat Ini:</span>
              <div className="text-base font-black text-amber-400 flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>{tremorType}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {tremorType.includes('Menerus')
                  ? 'Migrasi magma aktif menuju permukaan kawah dengan desakan gas bertekanan tinggi.'
                  : tremorType.includes('Harmonik')
                    ? 'Resonansi fluida magma di pipa kepundan vulkanik terdeteksi konstan.'
                    : 'Getaran tanah masih berada dalam kisaran baseline seismik wajar.'}
              </p>
            </div>

            {/* RSAM Gauge Metric */}
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">RSAM Index:</span>
                <span className="font-mono font-bold text-white text-sm">{currentRsam} Counts</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    currentRsam > 1000 ? 'bg-rose-500' : currentRsam > 500 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, (currentRsam / 1500) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0 (Tenang)</span>
                <span>800 (Siaga)</span>
                <span>1500+ (Kritis)</span>
              </div>
            </div>

            {/* FFT Frequency Spectrum Graph */}
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-bold">Spektrum Frekuensi (FFT)</span>
                <span className="font-mono text-amber-400 text-xs">Dominan: {dominantFreq} Hz</span>
              </div>
              <div className="rounded-lg overflow-hidden border border-slate-700">
                <canvas
                  ref={spectrumCanvasRef}
                  width={240}
                  height={90}
                  className="w-full h-24 block"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Pita 1.0 - 2.5 Hz (Oranye) merupakan ciri khas gelombang tremor vulkanik dan pergerakan fluida magma.
              </p>
            </div>

            {/* Station Operator Details */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Petugas Pos Pengamatan:</span>
              <p className="font-semibold text-slate-200">{selectedVolcano.posPengamatan.officer}</p>
              <p className="text-slate-400 text-[11px]">{selectedVolcano.posPengamatan.location}</p>
              <p className="text-slate-400 text-[11px]">Telp: {selectedVolcano.posPengamatan.contact}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
