import React, { useEffect, useState, useRef } from 'react';
import {
  ExternalLink,
  Layers,
  MapPin,
  AlertCircle,
  Key,
  CheckCircle2,
  X,
  Compass,
  RotateCcw,
  Sparkles,
  Map as MapIcon,
  Globe,
} from 'lucide-react';
import L from 'leaflet';
import { ErrorBoundary } from './ErrorBoundary';

interface GoogleMapsPreciseViewProps {
  lat: number;
  lng: number;
  ip: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  isp: string;
  asn: string;
  isPrivate?: boolean;
}

export const GoogleMapsPreciseView: React.FC<GoogleMapsPreciseViewProps> = (props) => {
  return (
    <ErrorBoundary fallbackTitle="Geographic Map Recovery">
      <GoogleMapsPreciseInner {...props} />
    </ErrorBoundary>
  );
};

const GoogleMapsPreciseInner: React.FC<GoogleMapsPreciseViewProps> = ({
  lat,
  lng,
  ip,
  city,
  region,
  country,
  countryCode,
  isp,
  asn,
  isPrivate,
}) => {
  const safeLat = typeof lat === 'number' && !isNaN(lat) && isFinite(lat) ? lat : 37.7749;
  const safeLng = typeof lng === 'number' && !isNaN(lng) && isFinite(lng) ? lng : -122.4194;

  const [mapEngine, setMapEngine] = useState<'google' | 'leaflet'>('google');
  const [mapMode, setMapMode] = useState<'streets' | 'satellite' | 'dark'>('satellite');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [activeApiKey, setActiveApiKey] = useState<string>(() => {
    return (
      localStorage.getItem('netscope_google_maps_api_key') ||
      (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
      'AIzaSyDJAzYM2traIHfpsQfCKksvOEII0gTsMBE' // Default provided key
    );
  });
  const [keyStatusMessage, setKeyStatusMessage] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize or update Leaflet Map safely without memory leaks or "Map container is already initialized" crashes
  useEffect(() => {
    if (mapEngine !== 'leaflet') {
      // If switching to Google Maps, destroy leaflet instance
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      return;
    }

    if (!mapContainerRef.current) return;

    try {
      // Safely cleanup previous instance if needed
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      // Clear any remaining leaflet IDs on DOM container
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      // Create new Leaflet map instance
      const map = L.map(mapContainerRef.current, {
        center: [safeLat, safeLng],
        zoom: 11,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      leafletMapRef.current = map;

      // Select tile URL based on active mode
      let tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      let maxZoom = 19;

      if (mapMode === 'satellite') {
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        maxZoom = 18;
      } else if (mapMode === 'streets') {
        tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        maxZoom = 19;
      }

      const newLayer = L.tileLayer(tileUrl, { maxZoom, subdomains: 'abcd' });
      newLayer.addTo(map);
      tileLayerRef.current = newLayer;

      // Glowing custom beacon
      const customIcon = L.divIcon({
        className: 'custom-map-beacon',
        html: `
          <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 32px; height: 32px; background: rgba(59, 130, 246, 0.4); border-radius: 50%; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 16px; height: 16px; background: #2563eb; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 0 10px rgba(37,99,235,0.8); z-index: 2;"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([safeLat, safeLng], { icon: customIcon }).addTo(map);
      markerRef.current = marker;

      marker.bindPopup(
        `
        <div style="font-family: ui-sans-serif, system-ui, sans-serif; padding: 4px 6px; color: #0f172a; min-width: 190px;">
          <div style="font-weight: 800; font-size: 13px; color: #2563eb; margin-bottom: 2px;">${ip}</div>
          <div style="font-size: 12px; font-weight: 600;">${city || 'Location'}, ${region || ''}</div>
          <div style="font-size: 11px; color: #64748b;">${country || 'Global'} (${countryCode || ''})</div>
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 10px; font-family: monospace; color: #475569;">
            <strong>ISP:</strong> ${isp || 'Transit'}<br/>
            <strong>ASN:</strong> ${asn || 'BGP'}
          </div>
        </div>
        `,
        { offset: [0, -10] }
      );

      // Invalidate map size after DOM paints
      setTimeout(() => {
        if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
        }
      }, 150);
    } catch (err) {
      console.warn('Leaflet map error caught:', err);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [mapEngine, safeLat, safeLng, mapMode, ip, city, region, country, countryCode, isp, asn]);

  // Handle saving new Custom Google Maps API key ("dosri api dalni hai muje")
  const handleSaveCustomKey = () => {
    const trimmed = customKeyInput.trim();
    if (!trimmed) {
      localStorage.removeItem('netscope_google_maps_api_key');
      setActiveApiKey('');
      setKeyStatusMessage('Custom key cleared. Google Maps embed & satellite view remains available.');
      return;
    }

    localStorage.setItem('netscope_google_maps_api_key', trimmed);
    setActiveApiKey(trimmed);
    setKeyStatusMessage('New Google Maps API Key saved successfully! Active for high-precision maps.');
    setTimeout(() => setShowKeyModal(false), 1200);
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${safeLat},${safeLng}`;

  // Google Maps interactive iframe embed with direct satellite / street coordinates
  const googleEmbedUrl = activeApiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(
        activeApiKey
      )}&q=${safeLat},${safeLng}&zoom=13&maptype=${mapMode === 'satellite' ? 'satellite' : 'roadmap'}`
    : `https://maps.google.com/maps?q=${safeLat},${safeLng}&hl=en&z=13&t=${
        mapMode === 'satellite' ? 'k' : 'm'
      }&output=embed`;

  return (
    <div className="space-y-3">
      {/* Map Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-mono text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span className="text-[11px] text-slate-400">GPS Coordinates:</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {safeLat.toFixed(5)}°, {safeLng.toFixed(5)}°
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Map Engine Switcher (Google Maps vs Leaflet) */}
          <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-mono">
            <button
              onClick={() => setMapEngine('google')}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded transition-all ${
                mapEngine === 'google'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3 h-3" />
              <span>Google Maps</span>
            </button>
            <button
              onClick={() => setMapEngine('leaflet')}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded transition-all ${
                mapEngine === 'leaflet'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Satellite / Dark GIS</span>
            </button>
          </div>

          {/* Map Layer Switcher */}
          <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-mono">
            {(
              [
                { id: 'satellite', label: 'Satellite' },
                { id: 'streets', label: 'Streets' },
                ...(mapEngine === 'leaflet' ? [{ id: 'dark', label: 'Dark Grid' }] : []),
              ] as const
            ).map((layer) => (
              <button
                key={layer.id}
                onClick={() => setMapMode(layer.id as any)}
                className={`px-2 py-0.5 rounded transition-all ${
                  mapMode === layer.id
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {layer.label}
              </button>
            ))}
          </div>

          {/* Change / Enter API Key Button ("dosri api dalni hai muje") */}
          <button
            onClick={() => {
              setCustomKeyInput(activeApiKey);
              setKeyStatusMessage(null);
              setShowKeyModal(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 transition-colors text-[11px] font-mono"
            title="Configure / Change Google Maps API Key"
          >
            <Key className="w-3 h-3" />
            <span>{activeApiKey ? 'Google API Key' : 'Enter API Key'}</span>
          </button>

          {/* External Google Maps Button */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors text-[11px] font-mono"
            title="Open exact coordinate in Google Maps"
          >
            <span>Open in Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* API Key Modal / Dialog */}
      {showKeyModal && (
        <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-slate-900 shadow-md space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Google Maps API Key Configuration (Enter / Change API Key)
              </h4>
            </div>
            <button
              onClick={() => setShowKeyModal(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Aap apni nayi ya dosri Google Maps API key yahan enter karke <strong>Save & Apply</strong> kar sakte hain. The key is securely saved in your browser storage.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={customKeyInput}
              onChange={(e) => setCustomKeyInput(e.target.value)}
              placeholder="Paste Google Maps API key (e.g. AIzaSy...)"
              className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveCustomKey}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save & Apply</span>
              </button>
              {activeApiKey && (
                <button
                  onClick={() => {
                    localStorage.removeItem('netscope_google_maps_api_key');
                    setActiveApiKey('');
                    setCustomKeyInput('');
                    setKeyStatusMessage('Custom key cleared.');
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                >
                  Clear Key
                </button>
              )}
            </div>
          </div>

          {keyStatusMessage && (
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs border border-blue-200 dark:border-blue-900">
              {keyStatusMessage}
            </div>
          )}
        </div>
      )}

      {/* Main Interactive Map Viewport Container */}
      <div className="relative w-full h-[360px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-950 z-0">
        {mapEngine === 'google' ? (
          /* Real Google Maps Interactive Frame */
          <div className="w-full h-full relative">
            <iframe
              title="Google Maps Location"
              src={googleEmbedUrl}
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
            />
            {/* Center target crosshair overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-red-500/60 animate-ping absolute" />
                <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white shadow-lg z-10" />
              </div>
            </div>
          </div>
        ) : (
          /* Leaflet High-Definition Map */
          <div ref={mapContainerRef} className="w-full h-full z-0" />
        )}

        {/* Center Recenter Button */}
        <button
          onClick={() => {
            if (mapEngine === 'leaflet' && leafletMapRef.current) {
              leafletMapRef.current.setView([safeLat, safeLng], 12, { animate: true });
            }
          }}
          className="absolute top-3 right-3 z-[400] p-2 rounded-lg bg-slate-900/85 hover:bg-slate-900 text-white border border-slate-700 shadow-md transition-colors"
          title="Recenter on Target Coordinates"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Floating location card badge at bottom */}
        <div className="absolute bottom-3 left-3 pointer-events-none z-[400] px-3 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-800 text-xs font-mono text-white flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="truncate max-w-[260px] sm:max-w-none">
            {city || 'Region'}, {region || ''}, {country || ''} {countryCode ? `(${countryCode})` : ''}
          </span>
          <span className="text-slate-400 text-[10px]">·</span>
          <span className="text-emerald-400 text-[10px]">
            {safeLat.toFixed(4)}°, {safeLng.toFixed(4)}°
          </span>
        </div>
      </div>
    </div>
  );
};
