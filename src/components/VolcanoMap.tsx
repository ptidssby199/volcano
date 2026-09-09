import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Filter, 
  Search, 
  Layers, 
  Flame, 
  AlertTriangle, 
  Activity, 
  Eye, 
  Compass, 
  Maximize2,
  Navigation,
  Wind,
  Key,
  ShieldCheck,
  CheckCircle2,
  X,
  Settings,
  RefreshCw,
  Globe
} from 'lucide-react';
import { Volcano, AlertLevel } from '../types';
import { ALERT_LEVELS_INFO } from '../data/indonesiaVolcanoes';

interface VolcanoMapProps {
  volcanoes: Volcano[];
  selectedVolcano: Volcano | null;
  onSelectVolcano: (volcano: Volcano) => void;
  onOpenSeismicForVolcano: (volcano: Volcano) => void;
  onOpenDetailsForVolcano: (volcano: Volcano) => void;
}

// Available zero-API-key basemap configurations
const TILE_PROVIDERS = {
  dark: {
    id: 'dark',
    name: 'Dark Vulkano (CARTO)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    fallbackUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; OpenStreetMap &copy; CARTO &copy; PVMBG',
    subdomains: 'abcd',
    description: 'Tema kontras tinggi khusus pemantauan malam hari & zona bahaya erupsi.',
    requiresKey: false,
  },
  satellite: {
    id: 'satellite',
    name: 'Citra Satelit Resolusi Tinggi (ESRI)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    fallbackUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    subdomains: '',
    description: 'Foto udara satelit detail kawah, lereng vulkanik, dan aliran sungai lahar.',
    requiresKey: false,
  },
  topo: {
    id: 'topo',
    name: 'Topografi & Elevasi (ESRI Topo)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    fallbackUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; Esri &copy; USGS, NOAA, PVMBG',
    subdomains: '',
    description: 'Peta kontur ketinggian lereng untuk memetakan arah luncuran awan panas.',
    requiresKey: false,
  },
  street: {
    id: 'street',
    name: 'OpenStreetMap Standar',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    fallbackUrl: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors',
    subdomains: 'abc',
    description: 'Peta jalan komunitas global dengan batas administrasi desa & jalur evakuasi.',
    requiresKey: false,
  },
};

export const VolcanoMap: React.FC<VolcanoMapProps> = ({
  volcanoes,
  selectedVolcano,
  onSelectVolcano,
  onOpenSeismicForVolcano,
  onOpenDetailsForVolcano,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const dangerCircleRef = useRef<L.Circle | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [islandFilter, setIslandFilter] = useState<string>('ALL');
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'topo' | 'street'>('dark');
  const [showRadiusAll, setShowRadiusAll] = useState(true);

  // Map API Key / Provider Diagnostics modal state
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [customTileUrl, setCustomTileUrl] = useState('');
  const [customTileActive, setCustomTileActive] = useState(false);
  const [tileStatusMessage, setTileStatusMessage] = useState('Semua penyedia peta aktif (Bebas Kunci API)');

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-2.5489, 118.0149], // Indonesia center
      zoom: 5,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial tile layer (CARTO Dark Matter)
    const provider = TILE_PROVIDERS.dark;
    const tileLayer = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      maxZoom: 19,
      subdomains: provider.subdomains || 'abc',
      crossOrigin: true,
    }).addTo(map);

    // Tile error fallback handling
    tileLayer.on('tileerror', () => {
      // If primary tile fails, switch to fallback
      if (provider.fallbackUrl && tileLayerRef.current) {
        tileLayerRef.current.setUrl(provider.fallbackUrl);
        setTileStatusMessage('Beralih otomatis ke server peta cadangan');
      }
    });

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when style changes or custom tile applied
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    let urlToUse: string;
    let attributionToUse: string;
    let subdomainsToUse: string = 'abc';

    if (customTileActive && customTileUrl.trim()) {
      urlToUse = customTileUrl.trim();
      attributionToUse = '&copy; Custom Map Layer';
    } else {
      const provider = TILE_PROVIDERS[mapStyle];
      urlToUse = provider.url;
      attributionToUse = provider.attribution;
      subdomainsToUse = provider.subdomains || 'abc';
    }

    const newLayer = L.tileLayer(urlToUse, {
      attribution: attributionToUse,
      maxZoom: 19,
      subdomains: subdomainsToUse,
      crossOrigin: true,
    }).addTo(mapInstanceRef.current);

    newLayer.on('tileerror', () => {
      const fallback = TILE_PROVIDERS[mapStyle]?.fallbackUrl;
      if (fallback) {
        newLayer.setUrl(fallback);
      }
    });

    tileLayerRef.current = newLayer;
  }, [mapStyle, customTileActive, customTileUrl]);

  // Filter volcanoes based on search and filters
  const filteredVolcanoes = volcanoes.filter(v => {
    const matchesSearch = 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.alias && v.alias.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    const matchesIsland = islandFilter === 'ALL' || v.island === islandFilter;
    return matchesSearch && matchesStatus && matchesIsland;
  });

  // Render / Update Markers on the map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old markers safely
    (Object.values(markersRef.current) as L.Marker[]).forEach(marker => {
      if (marker && typeof marker.remove === 'function') {
        marker.remove();
      }
    });
    markersRef.current = {};

    filteredVolcanoes.forEach(volcano => {
      const isSelected = selectedVolcano?.id === volcano.id;
      const isLevel4 = volcano.status === 'LEVEL_4';
      const isLevel3 = volcano.status === 'LEVEL_3';
      const isLevel2 = volcano.status === 'LEVEL_2';

      let markerColor = '#22c55e'; // green
      let markerBg = 'rgba(34, 197, 94, 0.25)';
      let pulseAnim = '';

      if (isLevel4) {
        markerColor = '#ef4444';
        markerBg = 'rgba(239, 68, 68, 0.35)';
        pulseAnim = 'animate-ping';
      } else if (isLevel3) {
        markerColor = '#f97316';
        markerBg = 'rgba(249, 115, 22, 0.3)';
        pulseAnim = 'animate-pulse';
      } else if (isLevel2) {
        markerColor = '#eab308';
        markerBg = 'rgba(234, 179, 8, 0.25)';
      }

      // Rich custom DivIcon
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group" style="width: 34px; height: 34px;">
          ${(isLevel4 || isLevel3) ? `
            <span class="${pulseAnim} absolute inline-flex h-full w-full rounded-full opacity-75" style="background-color: ${markerColor}"></span>
          ` : ''}
          <div class="relative flex items-center justify-center rounded-full shadow-lg transition-transform group-hover:scale-125 ${isSelected ? 'ring-4 ring-white scale-125 z-20' : ''}"
               style="width: ${isSelected ? '34px' : '28px'}; height: ${isSelected ? '34px' : '28px'}; background-color: #0f172a; border: 2.5px solid ${markerColor};">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${markerColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 15px; height: 15px;">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
          </div>
          <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-900/90 text-white text-[10px] font-semibold whitespace-nowrap pointer-events-none border border-slate-700 shadow hidden group-hover:block z-30">
            ${volcano.name}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'volcano-marker-custom',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([volcano.latitude, volcano.longitude], {
        icon: customIcon,
        title: volcano.name,
      });

      marker.on('click', () => {
        onSelectVolcano(volcano);
      });

      // Interactive Popup
      const statusInfo = ALERT_LEVELS_INFO[volcano.status];
      const popupContent = `
        <div class="p-3 text-slate-900 font-sans max-w-[270px]">
          <div class="flex items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-2">
            <h4 class="font-bold text-sm text-slate-900">${volcano.name}</h4>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded border ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor}">
              ${statusInfo.indonesianName}
            </span>
          </div>
          <p class="text-xs text-slate-600 mb-1"><strong>Wilayah:</strong> ${volcano.province}</p>
          <p class="text-xs text-slate-600 mb-1"><strong>Ketinggian:</strong> ${volcano.elevationMeters} mdpl</p>
          <p class="text-xs text-slate-600 mb-1"><strong>Radius Steril:</strong> <span class="text-rose-600 font-bold">${volcano.dangerRadiusKm} km</span></p>
          <p class="text-xs text-slate-600 mb-2"><strong>Asap Kawah:</strong> ${volcano.visualObservation.smokeHeightMeters}m (${volcano.visualObservation.smokeColor})</p>
          <div class="text-[11px] p-1.5 bg-slate-100 rounded text-slate-700 italic mb-2">
            "${volcano.recommendations[0]}"
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(map);
      markersRef.current[volcano.id] = marker;
    });
  }, [filteredVolcanoes, selectedVolcano, onSelectVolcano]);

  // Center on selected volcano with smooth flyTo & draw danger radius circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedVolcano) return;

    // Fly to selected volcano
    map.flyTo([selectedVolcano.latitude, selectedVolcano.longitude], 10, {
      duration: 1.2,
    });

    // Open popup for selected marker
    const marker = markersRef.current[selectedVolcano.id];
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 500);
    }

    // Draw Danger Radius Circle
    if (dangerCircleRef.current) {
      map.removeLayer(dangerCircleRef.current);
      dangerCircleRef.current = null;
    }

    if (showRadiusAll) {
      let color = '#22c55e';
      if (selectedVolcano.status === 'LEVEL_4') color = '#ef4444';
      else if (selectedVolcano.status === 'LEVEL_3') color = '#f97316';
      else if (selectedVolcano.status === 'LEVEL_2') color = '#eab308';

      const radiusInMeters = selectedVolcano.dangerRadiusKm * 1000;

      const circle = L.circle([selectedVolcano.latitude, selectedVolcano.longitude], {
        radius: radiusInMeters,
        color: color,
        weight: 2,
        opacity: 0.9,
        fillColor: color,
        fillOpacity: 0.18,
        dashArray: '6, 6',
      }).addTo(map);

      circle.bindTooltip(`Radius Bahaya ${selectedVolcano.dangerRadiusKm} KM (${selectedVolcano.name})`, {
        permanent: false,
        direction: 'top',
        className: 'bg-slate-900 text-white text-xs px-2 py-1 rounded shadow border border-slate-700',
      });

      dangerCircleRef.current = circle;
    }
  }, [selectedVolcano, showRadiusAll]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([-2.5489, 118.0149], 5, { duration: 1 });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-145px)] min-h-[550px] flex flex-col md:flex-row overflow-hidden bg-slate-950">
      {/* Sidebar List & Filter Controls */}
      <div className="w-full md:w-96 bg-slate-900/95 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col z-10 shrink-0 h-64 md:h-full backdrop-blur-md">
        {/* Search & Filter Header */}
        <div className="p-3.5 border-b border-slate-800 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="search-volcano-input"
              placeholder="Cari gunung (cth: Lewotobi, Semeru, Marapi)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          <div className="flex gap-2">
            {/* Status Filter */}
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Status Aktivitas
              </label>
              <select
                id="filter-status-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="ALL">Semua Tingkat Status</option>
                <option value="LEVEL_4">Level IV (Awas)</option>
                <option value="LEVEL_3">Level III (Siaga)</option>
                <option value="LEVEL_2">Level II (Waspada)</option>
                <option value="LEVEL_1">Level I (Normal)</option>
              </select>
            </div>

            {/* Island Filter */}
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Wilayah Kepulauan
              </label>
              <select
                id="filter-island-select"
                value={islandFilter}
                onChange={e => setIslandFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="ALL">Semua Kepulauan</option>
                <option value="Jawa">Jawa</option>
                <option value="Sumatera">Sumatera</option>
                <option value="Bali & Nusa Tenggara">Bali & Nusa Tenggara</option>
                <option value="Sulawesi">Sulawesi</option>
                <option value="Maluku">Maluku</option>
              </select>
            </div>
          </div>
        </div>

        {/* Volcanoes List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 p-2 space-y-1 scrollbar-thin">
          <div className="text-[11px] text-slate-400 px-2 py-1 flex justify-between items-center">
            <span>Daftar Gunung Berapi Aktif</span>
            <span className="font-mono text-slate-300 font-bold">{filteredVolcanoes.length} ditemukan</span>
          </div>

          {filteredVolcanoes.map(volcano => {
            const isSelected = selectedVolcano?.id === volcano.id;
            const statusInfo = ALERT_LEVELS_INFO[volcano.status];

            return (
              <div
                key={volcano.id}
                id={`volcano-item-${volcano.id}`}
                onClick={() => onSelectVolcano(volcano)}
                className={`p-3 rounded-xl transition cursor-pointer border ${
                  isSelected 
                    ? 'bg-slate-800/90 border-rose-500/80 shadow-md ring-1 ring-rose-500/30' 
                    : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {volcano.status === 'LEVEL_4' && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                      )}
                      {volcano.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {volcano.province} • {volcano.elevationMeters} mdpl
                    </p>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor}`}>
                    {statusInfo.indonesianName}
                  </span>
                </div>

                {/* Seismicity & Visual Mini Indicators */}
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-rose-400" />
                    <span>Tremor: <strong className="text-slate-200">{volcano.seismicity24h.tremorMenerusDominanMm} mm</strong></span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Wind className="w-3 h-3 text-slate-400" />
                    <span>Abu: <strong className="text-slate-200">{volcano.visualObservation.smokeHeightMeters}m</strong></span>
                  </span>
                  <span className="font-mono text-rose-400 font-bold">
                    R {volcano.dangerRadiusKm}km
                  </span>
                </div>

                {/* Quick Action buttons on selected item */}
                {isSelected && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSeismicForVolcano(volcano);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Grafik Seismik</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDetailsForVolcano(volcano);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detail Pos</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Map Display Canvas */}
      <div className="relative flex-1 h-full w-full">
        {/* Leaflet container */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Map Control Floating Toolbar (Top Left) */}
        <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Map Layer Switcher */}
          <div className="flex items-center bg-slate-900/90 backdrop-blur-md rounded-xl p-1 border border-slate-700 shadow-xl">
            <button
              onClick={() => { setMapStyle('dark'); setCustomTileActive(false); }}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                mapStyle === 'dark' && !customTileActive ? 'bg-rose-600 text-white shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              Dark Vulkano
            </button>
            <button
              onClick={() => { setMapStyle('satellite'); setCustomTileActive(false); }}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                mapStyle === 'satellite' && !customTileActive ? 'bg-rose-600 text-white shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              Satelit Citra
            </button>
            <button
              onClick={() => { setMapStyle('topo'); setCustomTileActive(false); }}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                mapStyle === 'topo' && !customTileActive ? 'bg-rose-600 text-white shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              Topografi
            </button>
            <button
              onClick={() => { setMapStyle('street'); setCustomTileActive(false); }}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                mapStyle === 'street' && !customTileActive ? 'bg-rose-600 text-white shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              OSM
            </button>
          </div>

          {/* Danger Radius Overlay Toggle */}
          <button
            onClick={() => setShowRadiusAll(!showRadiusAll)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium backdrop-blur-md border shadow-xl transition ${
              showRadiusAll 
                ? 'bg-rose-950/80 border-rose-600/70 text-rose-300' 
                : 'bg-slate-900/90 border-slate-700 text-slate-400'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Zona Radius {showRadiusAll ? 'ON' : 'OFF'}</span>
          </button>

          {/* Reset View Button */}
          <button
            onClick={handleResetView}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-xl transition"
            title="Pusatkan peta ke seluruh Indonesia"
          >
            <Navigation className="w-3.5 h-3.5 text-amber-400" />
            <span>Pusatkan RI</span>
          </button>

          {/* API Key Status & Diagnostic Button */}
          <button
            onClick={() => setIsApiKeyModalOpen(true)}
            id="map-api-key-status-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-500/50 shadow-xl transition backdrop-blur-md"
            title="Lihat status Kunci API & Konfigurasi Peta"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Peta:</span>
            <span>Bebas Kunci API (Aktif)</span>
          </button>
        </div>

        {/* Selected Volcano Floating Card (Bottom Center / Left) */}
        {selectedVolcano && (
          <div className="absolute bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:w-[420px] bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-rose-500/60 shadow-2xl z-10 animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    {selectedVolcano.name}
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {selectedVolcano.elevationMeters} mdpl
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedVolcano.province} • Kawah: {selectedVolcano.craterName}
                </p>
              </div>

              {/* Status Badge */}
              <div className="text-right">
                <span className={`text-xs font-bold px-2.5 py-1 rounded border inline-block ${ALERT_LEVELS_INFO[selectedVolcano.status].bgColor} ${ALERT_LEVELS_INFO[selectedVolcano.status].textColor} ${ALERT_LEVELS_INFO[selectedVolcano.status].borderColor}`}>
                  {ALERT_LEVELS_INFO[selectedVolcano.status].indonesianName}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                  Radius {selectedVolcano.dangerRadiusKm} km
                </span>
              </div>
            </div>

            {/* Real-time parameters row */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <span className="text-[10px] text-slate-400 block">Amplitudo Tremor</span>
                <span className="font-bold text-rose-400 text-sm">
                  {selectedVolcano.seismicity24h.tremorMenerusDominanMm} mm
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <span className="text-[10px] text-slate-400 block">RSAM Index</span>
                <span className="font-bold text-amber-400 text-sm">
                  {selectedVolcano.rsamValue} counts
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <span className="text-[10px] text-slate-400 block">Tinggi Asap</span>
                <span className="font-bold text-sky-400 text-sm">
                  {selectedVolcano.visualObservation.smokeHeightMeters} m
                </span>
              </div>
            </div>

            {/* Recommendations & Action */}
            <p className="text-xs text-slate-300 mt-2.5 line-clamp-2 italic">
              "{selectedVolcano.recommendations[0]}"
            </p>

            <div className="flex gap-2 mt-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => onOpenSeismicForVolcano(selectedVolcano)}
                className="flex-1 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Buka Sensor Seismik</span>
              </button>
              <button
                onClick={() => onOpenDetailsForVolcano(selectedVolcano)}
                className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Detail & Kontak PGA</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Map API Key & Provider Configuration Modal */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Status & Pengaturan Kunci API Peta
                  </h3>
                  <p className="text-xs text-emerald-400 font-medium">
                    Status: 100% Bebas Kunci API (No Key Required)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsApiKeyModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation Note */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 text-xs text-slate-300 leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-bold text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Peta VulkanoTrack Siap Digunakan Tanpa Perlu Kunci API</span>
              </div>
              <p>
                Aplikasi telah diatur menggunakan penyedia peta geospasial terbuka 
                (<strong>CARTO Dark Matter</strong>, <strong>ESRI World Imagery High-Res</strong>, 
                <strong>ESRI Topografi</strong>, dan <strong>OpenStreetMap</strong>).
              </p>
              <p className="text-slate-400 text-[11px]">
                Anda tidak perlu mendaftar akun Google Maps atau memasukkan token API berbayar. Seluruh peta satelit dan elevasi dapat diakses secara gratis dengan keandalan tinggi.
              </p>
            </div>

            {/* Free Providers List */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Penyedia Peta Terpasang (Semua Gratis & Tanpa Kunci):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.values(TILE_PROVIDERS).map(prov => (
                  <div
                    key={prov.id}
                    onClick={() => {
                      setMapStyle(prov.id as any);
                      setCustomTileActive(false);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      mapStyle === prov.id && !customTileActive
                        ? 'bg-rose-950/60 border-rose-500 text-white'
                        : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{prov.name}</span>
                      <span className="text-[10px] text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30">
                        Bebas Kunci
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {prov.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Custom Tile Layer URL */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">
                  Kustomisasi Tile / Kunci Peta Pribadi (Opsional)
                </span>
                <span className="text-[10px] text-slate-500">Khusus Mapbox / Tile Server Kustom</span>
              </div>
              <input
                type="text"
                placeholder="https://{s}.tile.example.com/{z}/{x}/{y}.png?access_token=YOUR_KEY"
                value={customTileUrl}
                onChange={e => setCustomTileUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <div className="flex justify-end gap-2 pt-1">
                {customTileActive && (
                  <button
                    onClick={() => {
                      setCustomTileActive(false);
                      setCustomTileUrl('');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                  >
                    Kembalikan ke Peta Bebas Kunci
                  </button>
                )}
                <button
                  onClick={() => {
                    if (customTileUrl.trim()) {
                      setCustomTileActive(true);
                      setIsApiKeyModalOpen(false);
                    }
                  }}
                  disabled={!customTileUrl.trim()}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold transition"
                >
                  Terapkan Layer Kustom
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                {tileStatusMessage}
              </span>
              <button
                onClick={() => setIsApiKeyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
