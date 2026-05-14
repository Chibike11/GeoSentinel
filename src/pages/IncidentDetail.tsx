import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Clock, Shield, AlertCircle, 
  CheckCircle2, Loader2, Download, Siren, Phone,
  Camera, MessageSquare, UserCheck, Send, Activity
} from 'lucide-react';
import { doc, db, getDoc, updateDoc, serverTimestamp, handleFirestoreError, OperationType } from '../lib/firebase';
import { Incident, IncidentStatus, AgencyType } from '../types';
import { useAuth } from '../context/AuthContext';
import { cn, formatTimestamp, AGENCY_COLORS, SEVERITY_COLORS } from '../lib/utils';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import jsPDF from 'jspdf';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authorityProfile } = useAuth();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [assignedUnit, setAssignedUnit] = useState('');

  useEffect(() => {
    const fetchIncident = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'incidents', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setIncident({ id: docSnap.id, ...docSnap.data() } as Incident);
        } else {
          console.error("Incident not found");
        }
      } catch (error) {
        console.error("Error fetching incident:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchIncident();
  }, [id]);

  const updateStatus = async (newStatus: IncidentStatus) => {
    if (!id || !incident) return;
    setIsUpdating(true);
    try {
      const docRef = doc(db, 'incidents', id);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        assignedUnit: assignedUnit || incident.assignedUnit || 'UNASSIGNED'
      });
      setIncident({ ...incident, status: newStatus, assignedUnit: assignedUnit || incident.assignedUnit });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `incidents/${id}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const exportPDF = () => {
    if (!incident) return;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('GeoSentinel Emergency Incident Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Incident ID: ${incident.id}`, 20, 35);
    doc.text(`Type: ${incident.type}`, 20, 45);
    doc.text(`Severity: ${incident.severity}`, 20, 55);
    doc.text(`Location: ${incident.address}`, 20, 65);
    doc.text(`Coordinates: ${incident.location.lat}, ${incident.location.lng}`, 20, 75);
    doc.text(`Reported At: ${formatTimestamp(incident.createdAt)}`, 20, 85);
    doc.text(`Status: ${incident.status}`, 20, 95);
    doc.text('Description:', 20, 105);
    doc.text(incident.description, 20, 115, { maxWidth: 170 });
    doc.save(`GeoSentinel-Report-${incident.id}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <AlertCircle className="h-16 w-16 text-slate-300" />
        <h2 className="mt-4 text-2xl font-black text-slate-900">Incident Not Found</h2>
        <p className="mt-2 text-slate-500">The incident ID you are looking for does not exist or has been removed.</p>
        <button onClick={() => navigate('/')} className="mt-8 text-blue-600 font-bold hover:underline">Return Home</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 font-bold">
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Feed</span>
        </button>
        <div className="flex space-x-3">
          <button
            onClick={exportPDF}
            className="flex items-center space-x-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Card */}
          <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-100 border border-slate-100">
            <div className="relative h-64 sm:h-96 w-full bg-slate-900">
              {incident.photoUrl ? (
                <img src={incident.photoUrl} alt="Incident Scene" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Camera className="h-20 w-20 text-white/20" />
                  <span className="absolute bottom-6 text-white/50 font-bold uppercase tracking-widest text-xs">No media provided</span>
                </div>
              )}
              <div className="absolute top-6 left-6 flex space-x-3">
                <div 
                  className="rounded-full px-4 py-1.5 text-xs font-black uppercase text-white shadow-xl"
                  style={{ backgroundColor: AGENCY_COLORS[incident.type] }}
                >
                  {incident.type}
                </div>
                <div className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-black uppercase text-white shadow-xl",
                  incident.severity === 'Critical' ? 'bg-red-600' : 'bg-slate-900'
                )}>
                  {incident.severity} SEVERITY
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-8 mb-8">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Live Intelligence Log</p>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">{incident.id}</h1>
                </div>
                <div className="flex flex-col items-end">
                  <div className={cn(
                    "flex items-center space-x-2 rounded-full px-4 py-2 border-2",
                    incident.status === 'PENDING' ? 'border-red-100 bg-red-50 text-red-600' :
                    incident.status === 'RESPONDING' ? 'border-blue-100 bg-blue-50 text-blue-600' : 'border-emerald-100 bg-emerald-50 text-emerald-600'
                  )}>
                    <div className={cn("h-2 w-2 rounded-full", incident.status === 'PENDING' ? 'bg-red-600 animate-pulse' : incident.status === 'RESPONDING' ? 'bg-blue-600' : 'bg-emerald-600')} />
                    <span className="text-sm font-black uppercase tracking-wider">{incident.status}</span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-400">{formatTimestamp(incident.createdAt)}</p>
                </div>
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <h4 className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                      <MapPin className="h-4 w-4" />
                      <span>Verified Location</span>
                    </h4>
                    <p className="text-lg font-bold text-slate-700 leading-snug">{incident.address}</p>
                    <p className="mt-1 text-xs font-mono text-slate-400">{incident.location.lat.toFixed(6)}, {incident.location.lng.toFixed(6)}</p>
                  </div>

                  <div>
                    <h4 className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                      <Phone className="h-4 w-4" />
                      <span>Reporter Contact</span>
                    </h4>
                    <p className="text-lg font-bold text-slate-700">{incident.reporterContact || 'Stay Anonymous'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest text-slate-400">
                    <Activity className="h-4 w-4" />
                    <span>Description</span>
                  </h4>
                  <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                    <p className="text-slate-600 leading-relaxed italic">"{incident.description}"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-100 border border-slate-100">
            <h3 className="mb-8 text-xl font-black text-slate-900 uppercase tracking-tight">Mission Timeline</h3>
            <div className="space-y-8">
              <TimelineItem 
                title="Incident Logged" 
                time={formatTimestamp(incident.createdAt)} 
                description="System created mission folder and geotagged incident coordinates."
                active 
              />
              {incident.status !== 'PENDING' && (
                <TimelineItem 
                  title="Agency Acknowledged" 
                  time={formatTimestamp(incident.updatedAt || incident.createdAt)} 
                  description={`Response unit ${incident.assignedUnit || ''} deployed to scene.`}
                  active 
                />
              )}
              {incident.status === 'RESOLVED' && (
                <TimelineItem 
                  title="Closed / Resolved" 
                  time={formatTimestamp(incident.updatedAt)} 
                  description="On-scene units confirmed resolution and mission extraction."
                  active 
                  last
                />
              )}
              {!incident.updatedAt && incident.status === 'PENDING' && (
                <TimelineItem 
                  title="Awaiting Response" 
                  time="---" 
                  description="Incident is currently in triage queue for closest agency unit."
                  last
                />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-8">
          {/* Authority Panel */}
          {authorityProfile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-slate-900 p-8 text-white shadow-2xl"
            >
              <div className="mb-6 flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black">Authority Control</h3>
                  <p className="text-[10px] uppercase font-bold text-slate-400">{authorityProfile.agency} Panel</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Assign Tactical Unit</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="e.g. ALPHA-1, FRSC-6"
                      value={assignedUnit}
                      onChange={(e) => setAssignedUnit(e.target.value)}
                      className="flex-1 rounded-xl bg-black/40 border border-white/10 px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    disabled={isUpdating || incident.status === 'RESPONDING'}
                    onClick={() => updateStatus('RESPONDING')}
                    className="flex items-center justify-center space-x-2 rounded-xl bg-blue-600 py-3 font-bold transition-all hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                    <span>Deploy Response</span>
                  </button>
                  <button
                    disabled={isUpdating || incident.status === 'RESOLVED'}
                    onClick={() => updateStatus('RESOLVED')}
                    className="flex items-center justify-center space-x-2 rounded-xl bg-emerald-600 py-3 font-bold transition-all hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    <span>Mark Resolved</span>
                  </button>
                </div>
                
                <p className="text-[10px] text-center text-slate-500">
                  All authority actions are logged and timestamped for accountability.
                </p>
              </div>
            </motion.div>
          )}

          {/* Mini Map */}
          <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-100 border border-slate-100">
            <div className="h-64 w-full">
              <MapContainer 
                center={[incident.location.lat, incident.location.lng]} 
                zoom={14} 
                className="h-full w-full"
                zoomControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[incident.location.lat, incident.location.lng]} />
              </MapContainer>
            </div>
            <div className="p-6 text-center">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Geospatial Fix</p>
              <h4 className="font-bold text-slate-900">{incident.location.lat.toFixed(4)}, {incident.location.lng.toFixed(4)}</h4>
              <Link 
                to="/dashboard" 
                className="mt-4 flex items-center justify-center space-x-2 text-sm font-bold text-blue-600 hover:underline"
              >
                <Siren className="h-4 w-4" />
                <span>View in Field Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ title, time, description, active, last }: { title: string, time: string, description: string, active?: boolean, last?: boolean }) {
  return (
    <div className="relative flex space-x-6">
      {!last && <div className="absolute left-3 top-8 h-full w-0.5 bg-slate-100" />}
      <div className={cn(
        "z-10 flex h-6 w-6 items-center justify-center rounded-full border-2",
        active ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-300"
      )}>
        <div className="h-2 w-2 rounded-full bg-current" />
      </div>
      <div className="flex-1 pb-2">
        <div className="flex items-center justify-between mb-1">
          <h4 className={cn("font-bold", active ? "text-slate-900" : "text-slate-400")}>{title}</h4>
          <span className="text-[10px] font-bold text-slate-400">{time}</span>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
