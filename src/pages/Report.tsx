import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, MapPin, Siren, Loader2, X, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, db, setDoc, doc, serverTimestamp, storage, ref, uploadBytes, getDownloadURL, handleFirestoreError, OperationType } from '../lib/firebase';
import { IncidentType, IncidentSeverity, Location } from '../types';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '../lib/utils';

// Leaflet marker icon fix
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const INCIDENT_TYPES: IncidentType[] = ['Fire', 'Crime', 'Accident', 'Flood', 'Medical', 'Explosion', 'Other'];
const SEVERITIES: { value: IncidentSeverity; color: string }[] = [
  { value: 'Low', color: 'bg-emerald-500' },
  { value: 'Medium', color: 'bg-yellow-500' },
  { value: 'High', color: 'bg-orange-500' },
  { value: 'Critical', color: 'bg-red-600' },
];

function LocationPicker({ location, setLocation, setAddress }: { location: Location; setLocation: (l: Location) => void; setAddress: (a: string) => void }) {
  const map = useMapEvents({
    click(e) {
      const newLoc = { lat: e.latlng.lat, lng: e.latlng.lng };
      setLocation(newLoc);
      reverseGeocode(newLoc);
    },
  });

  const reverseGeocode = async (loc: Location) => {
    try {
      const apiKey = (import.meta as any).env.VITE_OPENCAGE_API_KEY;
      if (!apiKey) return;
      const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${loc.lat}+${loc.lng}&key=${apiKey}`);
      const data = await response.json();
      if (data.results && data.results[0]) {
        setAddress(data.results[0].formatted);
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
    }
  };

  return <Marker position={[location.lat, location.lng]} />;
}

export default function Report() {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<IncidentType | ''>('');
  const [severity, setSeverity] = useState<IncidentSeverity | ''>('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<Location>({ lat: 9.082, lng: 8.6753 }); // Center of Nigeria
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [media, setMedia] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportId, setReportId] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Get current location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.warn("Geolocation failed", err)
      );
    }
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPreview(dataUrl);
      
      // Convert to file
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      setMedia(new File([blob], "capture.jpg", { type: "image/jpeg" }));
      
      // Stop camera
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCapturing(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      console.error("Camera access denied", error);
      alert("Camera access is required for live capture.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMedia(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!type || !severity || !description) return;
    setIsSubmitting(true);
    
    try {
      const id = `GS-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`;
      let photoUrl = '';

      if (media) {
        const storageRef = ref(storage, `incidents/${id}/${media.name}`);
        const uploadResult = await uploadBytes(storageRef, media);
        photoUrl = await getDownloadURL(uploadResult.ref);
      }

      const incidentData = {
        type,
        severity,
        description,
        location,
        address,
        reporterContact: contact,
        photoUrl,
        status: 'PENDING',
        createdAt: serverTimestamp(),
        reporterId: user?.uid || 'anonymous',
      };

      await setDoc(doc(db, 'incidents', id), incidentData);
      setReportId(id);
      setStep(4);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'incidents');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                step >= i ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" : "bg-white border-slate-200 text-slate-400"
              )}>
                {step > i ? <CheckCircle2 className="h-6 w-6" /> : <span>{i}</span>}
              </div>
              {i < 4 && <div className={cn("h-1 w-12 sm:w-20 lg:w-32", step > i ? "bg-blue-600" : "bg-slate-200")} />}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-black text-slate-900">Incident Details</h2>
              <p className="mt-2 text-slate-500">What happened? Be as specific as possible.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Incident Type</label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {INCIDENT_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={cn(
                        "rounded-2xl border-2 p-4 text-center transition-all",
                        type === t ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-100 bg-white hover:border-blue-200"
                      )}
                    >
                      <span className="text-sm font-bold">{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Severity Level</label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {SEVERITIES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSeverity(s.value)}
                      className={cn(
                        "rounded-2xl border-2 p-4 text-center transition-all",
                        severity === s.value ? `${s.color.replace('bg-', 'border-')} ${s.color.replace('bg-', 'bg-').replace('-500', '-50').replace('-600', '-50')} text-slate-900 border-2` : "border-slate-100 bg-white hover:border-slate-200"
                      )}
                    >
                      <div className={cn("mx-auto mb-2 h-2 w-full rounded-full", s.color)} />
                      <span className="text-sm font-bold">{s.value}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Description</label>
                <div className="relative">
                  <textarea
                    rows={4}
                    maxLength={500}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-white p-4 focus:border-blue-600 focus:outline-none"
                    placeholder="Provide details about the incident..."
                  />
                  <div className="absolute bottom-4 right-4 text-xs font-mono text-slate-400">
                    {description.length}/500
                  </div>
                </div>
              </div>
            </div>

            <button
              disabled={!type || !severity || !description}
              onClick={() => setStep(2)}
              className="group flex w-full items-center justify-center space-x-2 rounded-2xl bg-blue-600 py-4 text-lg font-bold text-white shadow-xl shadow-blue-100 transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              <span>Next: Set Location</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-black text-slate-900">Scene Location</h2>
              <p className="mt-2 text-slate-500">Pick the exact spot on the map.</p>
            </div>

            <div className="overflow-hidden rounded-3xl border-4 border-white bg-slate-100 shadow-xl shadow-slate-200">
              <div className="h-80 w-full">
                <MapContainer center={[location.lat, location.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationPicker location={location} setLocation={setLocation} setAddress={setAddress} />
                </MapContainer>
              </div>
              <div className="bg-white p-6">
                <div className="flex items-center space-x-3 text-slate-500">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">{address || 'Geocoding location...'}</span>
                </div>
                <div className="mt-2 text-xs font-mono text-slate-400">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setStep(1)}
                className="flex items-center space-x-2 rounded-2xl border-2 border-slate-100 bg-white px-6 py-4 font-bold text-slate-600 hover:bg-slate-50"
              >
                <ChevronLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex flex-1 items-center justify-center space-x-2 rounded-2xl bg-blue-600 py-4 text-lg font-bold text-white shadow-xl shadow-blue-100 hover:bg-blue-700"
              >
                <span>Next: Finalize</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-black text-slate-900">Evidence & Contact</h2>
              <p className="mt-2 text-slate-500">Add media and optional contact info.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Media Upload</label>
                {!preview ? (
                  <div className="space-y-3">
                    <button
                      onClick={startCamera}
                      className="flex w-full items-center justify-center space-x-3 rounded-2xl border-2 border-dashed border-slate-300 py-8 transition-colors hover:border-blue-400 hover:bg-blue-50"
                    >
                      <Camera className="h-8 w-8 text-slate-400" />
                      <span className="font-bold text-slate-500">Take Photo</span>
                    </button>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <button className="flex w-full items-center justify-center space-x-3 rounded-2xl border-2 border-slate-100 bg-white py-4 transition-colors hover:bg-slate-50">
                        <Upload className="h-5 w-5 text-slate-400" />
                        <span className="font-bold text-slate-500">Upload Media</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-2xl border-4 border-white shadow-lg">
                    <img src={preview} alt="Evidence" className="h-48 w-full object-cover" />
                    <button
                      onClick={() => { setPreview(null); setMedia(null); }}
                      className="absolute top-2 right-2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Contact Info (Optional)</label>
                <div className="flex h-12 w-full items-center rounded-2xl border-2 border-slate-100 bg-white px-4 focus-within:border-blue-600">
                  <Phone className="h-5 w-5 text-slate-400" />
                  <input
                    type="tel"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="ml-3 w-full bg-transparent focus:outline-none"
                    placeholder="Phone Number"
                  />
                </div>
                <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100">
                  <div className="flex space-x-3">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Your identity will be kept confidential. Providing a contact number helps responders reach you if more info is needed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {isCapturing && (
              <div className="fixed inset-0 z-[1001] flex flex-col items-center justify-center bg-black p-4">
                <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-slate-900 shadow-2xl">
                  <video ref={videoRef} autoPlay playsInline className="w-full" />
                  <div className="absolute bottom-8 left-0 flex w-full justify-center space-x-6">
                    <button
                      onClick={handleCapture}
                      className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-red-600 text-white shadow-2xl transition-transform active:scale-90"
                    >
                      <Camera className="h-8 w-8" />
                    </button>
                    <button
                      onClick={() => {
                        setIsCapturing(false);
                        const stream = videoRef.current?.srcObject as MediaStream;
                        stream?.getTracks().forEach(t => t.stop());
                      }}
                      className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/30"
                    >
                      <X className="h-8 w-8" />
                    </button>
                  </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => setStep(2)}
                disabled={isSubmitting}
                className="flex items-center space-x-2 rounded-2xl border-2 border-slate-100 bg-white px-6 py-4 font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="flex flex-1 items-center justify-center space-x-3 rounded-2xl bg-blue-600 py-4 text-lg font-bold text-white shadow-xl shadow-blue-200 transition-all hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Siren className="h-6 w-6" />
                    <span>Submit Emergency Report</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-xl shadow-emerald-50">
              <CheckCircle2 className="h-16 w-16" />
            </div>
            <h2 className="text-4xl font-black text-slate-900">Incident Reported!</h2>
            <p className="mx-auto mt-4 max-w-sm text-lg text-slate-500">
              Your report has been logged and sent to the relevant emergency units.
            </p>
            
            <div className="mt-10 rounded-3xl bg-slate-50 p-8 border border-slate-100">
              <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Incident ID</p>
              <p className="mt-1 text-3xl font-mono font-black text-slate-900">{reportId}</p>
              <div className="mt-6 inline-flex items-center space-x-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">
                <Siren className="h-4 w-4 animate-pulse" />
                <span>Estimated Response: 5-15 mins</span>
              </div>
            </div>

            <div className="mt-12 flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <button
                onClick={() => navigate('/')}
                className="flex-1 rounded-2xl bg-slate-900 py-4 text-lg font-bold text-white shadow-xl transition-all hover:bg-slate-800"
              >
                Return Home
              </button>
              <button
                onClick={() => navigate(`/incident/${reportId}`)}
                className="flex-1 rounded-2xl border-2 border-slate-200 bg-white py-4 text-lg font-bold text-slate-700 transition-all hover:bg-slate-50"
              >
                Track Progress
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
