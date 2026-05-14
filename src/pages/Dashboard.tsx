import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, List, Layout as LayoutIcon, 
  Flame, Shield, AlertTriangle, Droplets, HeartPulse, 
  Activity, Layers, Maximize2, ChevronLeft, ChevronRight,
  TrendingUp, Clock, MapPin, ExternalLink, Loader2
} from 'lucide-react';
import { collection, db, onSnapshot, query, orderBy, limit as firestoreLimit } from '../lib/firebase';
import { Incident, IncidentType, IncidentSeverity, FIRMSHotspot } from '../types';
import { cn, timeAgo, AGENCY_COLORS, SEVERITY_COLORS } from '../lib/utils';
import { Link } from 'react-router-dom';

// Types for filtering
type StatusFilter = 'ALL' | 'PENDING' | 'RESPONDING' | 'RESOLVED';

// Custom Marker Icons
const createIcon = (type: IncidentType, severity: IncidentSeverity) => {
  const color = AGENCY_COLORS[type] || '#3B82F6';
  const isCritical = severity === 'Critical';
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex items-center justify-center">
        ${isCritical ? `<div class="absolute h-10 w-10 animate-ping rounded-full opacity-40" style="background-color: ${color}"></div>` : ''}
        <div class="z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-lg transition-transform hover:scale-125" style="background-color: ${color}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${getIconSVG(type)}</svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const getIconSVG = (type: IncidentType) => {
  switch (type) {
    case 'Fire': return '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.5 4 6.5 2 2 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>';
    case 'Crime': return '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>';
    case 'Accident': return '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>';
    case 'Flood': return '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path>';
    case 'Medical': return '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>';
    default: return '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';
  }
};

// Heatmap Layer Component
function HeatmapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();
  useEffect(() => {
    // @ts-ignore
    const heat = L.heatLayer(points, { 
      radius: 25, 
      blur: 15, 
      maxZoom: 10,
      gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
    });
    heat.addTo(map);
    return () => { map.removeLayer(heat); };
  }, [map, points]);
  return null;
}

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [firmsData, setFirmsData] = useState<FIRMSHotspot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFirms, setShowFirms] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite' | 'dark'>('street');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Real-time Incidents Fetch
  useEffect(() => {
    const q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'), firestoreLimit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Incident[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Incident));
      setIncidents(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // NASA FIRMS Fetch
  useEffect(() => {
    const fetchFirms = async () => {
      const apiKey = (import.meta as any).env.VITE_NASA_FIRMS_API_KEY;
      if (!apiKey) return;
      
      try {
        // Querying for Nigeria box: Approx 2.6 to 14.7 Lat, 2.7 to 14.7 Lng
        // For demo, we use a global slice if allowed or target West Africa
        const response = await fetch(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/VIIRS_SNPP_NRT/world/1`);
        const csv = await response.text();
        const rows = csv.split('\n').slice(1);
        const data: FIRMSHotspot[] = rows.map(row => {
          const cols = row.split(',');
          return {
            latitude: parseFloat(cols[0]),
            longitude: parseFloat(cols[1]),
            brightness: parseFloat(cols[2]),
            confidence: cols[8],
            acq_date: cols[5],
            frp: parseFloat(cols[11])
          } as FIRMSHotspot;
        }).filter(h => !isNaN(h.latitude));
        
        // Filter for Nigeria/West Africa region for performance
        const localFirms = data.filter(h => 
          h.latitude > 4 && h.latitude < 14 && 
          h.longitude > 3 && h.longitude < 15
        );
        setFirmsData(localFirms);
      } catch (err) {
        console.error("FIRMS fetch failed", err);
      }
    };
    fetchFirms();
  }, []);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(idx => {
      const matchesStatus = statusFilter === 'ALL' || idx.status === statusFilter;
      const matchesSearch = idx.id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            idx.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            idx.type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [incidents, statusFilter, searchQuery]);

  const heatmapPoints: [number, number, number][] = useMemo(() => {
    return filteredIncidents.map(idx => [idx.location.lat, idx.location.lng, idx.severity === 'Critical' ? 1.0 : 0.6]);
  }, [filteredIncidents]);

  const stats = useMemo(() => {
    return {
      total: incidents.length,
      active: incidents.filter(i => i.status !== 'RESOLVED').length,
      critical: incidents.filter(i => i.severity === 'Critical').length,
      resolved: incidents.filter(i => i.status === 'RESOLVED').length,
    };
  }, [incidents]);

  const mapURLs = {
    street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-900">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 400 : 0 }}
        className="relative flex h-full flex-col bg-white shadow-2xl z-40 overflow-hidden"
      >
        <div className="flex i-base flex-col h-full w-[400px]">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900">Live Incidents</h2>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <span className="text-xs font-bold">{stats.active}</span>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Today</p>
                <p className="text-xl font-black text-slate-900">{stats.total}</p>
              </div>
              <div className="rounded-2xl bg-red-50 p-3 border border-red-100">
                <p className="text-[10px] uppercase tracking-wider font-bold text-red-400">Critical</p>
                <p className="text-xl font-black text-red-600">{stats.critical}</p>
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ID or Location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex space-x-2 overflow-x-auto pb-2 custom-scrollbar">
                {(['ALL', 'PENDING', 'RESPONDING', 'RESOLVED'] as StatusFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={cn(
                      "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                      statusFilter === f ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Incident List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {isLoading ? (
              <div className="flex h-40 flex-col items-center justify-center space-y-4 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm font-medium">Syncing live feed...</p>
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Activity className="mx-auto h-12 w-12 opacity-20" />
                <p className="mt-4 text-sm font-medium">No results found</p>
              </div>
            ) : (
              filteredIncidents.map((incident) => (
                <Link
                  key={incident.id}
                  to={`/incident/${incident.id}`}
                  className="group flex flex-col rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
                        style={{ backgroundColor: AGENCY_COLORS[incident.type] }}
                      >
                        <IncidentIcon type={incident.type} className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 leading-tight">{incident.type}</h4>
                        <p className="text-[10px] font-mono text-slate-400 uppercase">{incident.id}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                      SEVERITY_COLORS[incident.severity] === '#E63946' ? 'bg-red-100 text-red-600' :
                      SEVERITY_COLORS[incident.severity] === '#F4A261' ? 'bg-orange-100 text-orange-600' :
                      SEVERITY_COLORS[incident.severity] === '#E9C46A' ? 'bg-yellow-100 text-yellow-600' : 'bg-emerald-100 text-emerald-600'
                    )}>
                      {incident.severity}
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-600 line-clamp-2">{incident.address}</p>
                  <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{timeAgo(incident.createdAt)}</span>
                    </div>
                    <div className={cn(
                      "px-2 py-0.5 rounded-full border",
                      incident.status === 'PENDING' ? 'border-red-200 text-red-500 bg-red-50' :
                      incident.status === 'RESPONDING' ? 'border-blue-200 text-blue-500 bg-blue-50' : 'border-emerald-200 text-emerald-500 bg-emerald-50'
                    )}>
                      {incident.status}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            "absolute top-1/2 z-50 flex h-12 w-6 items-center justify-center bg-white shadow-xl border border-slate-100 rounded-r-lg transition-all",
            sidebarOpen ? "-right-0" : "-right-6"
          )}
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </motion.aside>

      {/* Main Map Component */}
      <div className="relative flex-1 bg-slate-900">
        <MapContainer
          center={[9.082, 8.6753]}
          zoom={6}
          zoomControl={false}
          className="h-full w-full"
          style={{ background: '#0D1117' }}
        >
          <TileLayer url={mapURLs[mapStyle]} attribution='&copy; ESRI & OSM' />
          
          {/* Heatmap */}
          {showHeatmap && <HeatmapLayer points={heatmapPoints} />}

          {/* Incident Markers */}
          {filteredIncidents.map((idx) => (
            <Marker 
              key={idx.id} 
              position={[idx.location.lat, idx.location.lng]}
              icon={createIcon(idx.type, idx.severity)}
            >
              <Popup className="custom-popup">
                <div className="w-64 overflow-hidden rounded-xl bg-white p-0">
                  {idx.photoUrl && (
                    <img src={idx.photoUrl} alt="Thumbnail" className="h-32 w-full object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black uppercase text-slate-400">{idx.id}</span>
                       <span className={cn("rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase text-white", SEVERITY_COLORS[idx.severity] === '#E63946' ? 'bg-red-600' : 'bg-blue-600')}>
                         {idx.severity}
                       </span>
                    </div>
                    <h5 className="font-black text-slate-900">{idx.type}</h5>
                    <p className="mt-1 text-xs text-slate-500 leading-snug">{idx.address}</p>
                    <Link 
                      to={`/incident/${idx.id}`}
                      className="mt-4 flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700"
                    >
                      <Maximize2 className="h-3 w-3" />
                      <span>View Detailed Intel</span>
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* NASA FIRMS Hotspots */}
          {showFirms && firmsData.map((spot, i) => (
            <Circle
              key={`firms-${i}`}
              center={[spot.latitude, spot.longitude]}
              pathOptions={{
                color: 'red',
                fillColor: 'red',
                fillOpacity: 0.3,
                weight: 1
              }}
              radius={500} // ~500m radius
            >
              <Popup>
                <div className="text-xs">
                  <div className="flex items-center text-red-600 font-bold mb-1">
                    <Flame className="h-3 w-3 mr-1" />
                    NASA SAT DETECTION
                  </div>
                  <p><b>Lat/Lng:</b> {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}</p>
                  <p><b>Sat:</b> VIIRS SNPP</p>
                  <p><b>Confidence:</b> {spot.confidence}</p>
                  <p><b>Date:</b> {spot.acq_date}</p>
                </div>
              </Popup>
            </Circle>
          ))}
        </MapContainer>

        {/* Floating Map Controls */}
        <div className="absolute right-6 top-6 flex flex-col space-y-2 z-[500]">
          <div className="flex items-center space-x-2 rounded-2xl bg-white/90 p-1.5 shadow-2xl backdrop-blur-md border border-slate-100">
            {(['street', 'satellite', 'dark'] as const).map((style) => (
              <button
                key={style}
                onClick={() => setMapStyle(style)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-bold uppercase transition-all",
                  mapStyle === style ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                )}
              >
                {style}
              </button>
            ))}
          </div>

          <div className="flex flex-col space-y-2 rounded-2xl bg-white/90 p-2 shadow-2xl backdrop-blur-md border border-slate-100">
            <ToggleButton 
              label="NASA FIRMS" 
              active={showFirms} 
              onClick={() => setShowFirms(!showFirms)} 
              icon={<Flame className="h-4 w-4" />}
            />
            <ToggleButton 
              label="Heatmap" 
              active={showHeatmap} 
              onClick={() => setShowHeatmap(!showHeatmap)} 
              icon={<Layers className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-6 left-6 z-[500] pointer-events-none">
          <div className="rounded-2xl bg-slate-900/90 p-4 text-white shadow-2xl backdrop-blur-md border border-slate-800">
            <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Live Feed Status</h6>
            <div className="space-y-2">
              <LegendItem color={AGENCY_COLORS['Fire']} label="Fire Outbreak" />
              <LegendItem color={AGENCY_COLORS['Crime']} label="Security Threat" />
              <LegendItem color={AGENCY_COLORS['Accident']} label="Road Incident" />
              {showFirms && <LegendItem color="#FF0000" label="Satellite Fire Spot" dotted />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IncidentIcon({ type, className }: { type: IncidentType, className?: string }) {
  switch (type) {
    case 'Fire': return <Flame className={className} />;
    case 'Crime': return <Shield className={className} />;
    case 'Accident': return <AlertTriangle className={className} />;
    case 'Flood': return <Droplets className={className} />;
    case 'Medical': return <HeartPulse className={className} />;
    default: return <Activity className={className} />;
  }
}

function ToggleButton({ label, active, onClick, icon }: { label: string, active: boolean, onClick: () => void, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center space-x-2 rounded-xl px-3 py-2 text-xs font-bold transition-all",
        active ? "bg-red-100 text-red-600 shadow-inner" : "text-slate-600 hover:bg-slate-100"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function LegendItem({ color, label, dotted }: { color: string, label: string, dotted?: boolean }) {
  return (
    <div className="flex items-center space-x-3">
      <div 
        className={cn("h-3 w-3 rounded-full", dotted && "border border-white/20 opacity-50")} 
        style={{ backgroundColor: color }} 
      />
      <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
    </div>
  );
}
