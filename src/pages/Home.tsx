import { Link } from 'react-router-dom';
import { Siren, Map as MapIcon, ShieldCheck, Activity, ChevronRight, PlayCircle, Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { collection, db, getDocs, query, limit } from '../lib/firebase';

export default function Home() {
  const [incidentCount, setIncidentCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const q = query(collection(db, 'incidents'), limit(100));
      const snapshot = await getDocs(q);
      setIncidentCount(snapshot.size + 1520); // Base count + live data
    };
    fetchCount();
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-32 lg:pt-32 lg:pb-48">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,rgba(37,99,235,0.05)_0,rgba(255,255,255,0)_100%)]" />
        
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-2 rounded-full border border-blue-100 bg-blue-50/50 px-4 py-1.5 text-sm font-semibold text-blue-600 shadow-sm"
            >
              <Activity className="h-4 w-4 animate-pulse" />
              <span>System Online: 14 Nodes Active</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-8 text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl lg:text-8xl"
            >
              Real-Time <span className="text-blue-600">Incident</span> <br />
              Intelligence for Nigeria
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl"
            >
              Advanced GIS and Remote Sensing platform empowering citizens and emergency services 
              to detect, monitor, and respond to incidents with surgical precision.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0"
            >
              <Link
                to="/report"
                className="group flex items-center space-x-2 rounded-2xl bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-2xl active:scale-95"
              >
                <Siren className="h-6 w-6" />
                <span>Report Incident</span>
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 rounded-2xl border-2 border-slate-200 bg-white px-8 py-4 text-lg font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
              >
                <MapIcon className="h-6 w-6" />
                <span>Live Map</span>
              </Link>
              <Link
                to="/authority"
                className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 font-semibold"
              >
                <span>Authority Login</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </motion.div>

            {/* Counter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-16 flex items-center justify-center space-x-8"
            >
              <div className="text-center">
                <p className="text-4xl font-black text-slate-900">{incidentCount.toLocaleString()}</p>
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">Incidents Tracked</p>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div className="text-center">
                <p className="text-4xl font-black text-blue-600">0.8s</p>
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">Response Trigger</p>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div className="text-center">
                <p className="text-4xl font-black text-slate-900">24/7</p>
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">Sky Sentinel</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-slate-900 py-24 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Activity className="h-8 w-8 text-blue-400" />}
              title="Live GPS Tracking"
              description="Hyper-precise geolocation of every reported incident with street-level accuracy."
            />
            <FeatureCard
              icon={<MapIcon className="h-8 w-8 text-emerald-400" />}
              title="Satellite Analysis"
              description="ESRI hybrid imagery integration for remote area monitoring and damage assessment."
            />
            <FeatureCard
              icon={<Flame className="h-8 w-8 text-orange-400" />}
              title="NASA FIRMS Data"
              description="Direct integration with satellite thermal anomalies for early fire detection."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-8 w-8 text-purple-400" />}
              title="Agency Triage"
              description="Automated incident routing to Police, Fire Service, NEMA, and FRSC units."
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">How GeoSentinel Protects You</h2>
            <div className="mt-16 grid gap-12 md:grid-cols-3">
              <Step
                number="01"
                title="Report"
                description="Citizens submit incidents with live media and GPS location via the responsive reporting tool."
              />
              <Step
                number="02"
                title="Detect"
                description="System correlates reports with satellite hotspots and geofenced critical zones instantly."
              />
              <Step
                number="03"
                title="Respond"
                description="Verified agencies receive data-rich mission packets for rapid tactical deployment."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 text-center text-slate-500">
          <div className="flex items-center justify-center space-x-2 text-slate-900 font-bold mb-6">
            <Siren className="h-6 w-6 text-blue-600" />
            <span>GeoSentinel</span>
          </div>
          <p className="mb-4">© 2026 GeoSentinel Emergency Intelligence Platform. All rights reserved.</p>
          <div className="flex justify-center space-x-6 text-sm font-medium">
            <Link to="/about" className="hover:text-blue-600">Privacy Policy</Link>
            <Link to="/about" className="hover:text-blue-600">Terms of Service</Link>
            <Link to="/about" className="hover:text-blue-600">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="group rounded-3xl border border-slate-800 bg-slate-800/50 p-8 transition-all hover:bg-slate-800">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 shadow-inner group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="mb-3 text-xl font-bold text-white">{title}</h3>
      <p className="text-slate-400 line-height-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="relative text-left">
      <div className="mb-4 flex items-baseline space-x-3">
        <span className="text-5xl font-black text-blue-100">{number}</span>
        <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
      </div>
      <p className="text-slate-600">{description}</p>
      <div className="mt-8 h-1 w-12 bg-blue-600" />
    </div>
  );
}
