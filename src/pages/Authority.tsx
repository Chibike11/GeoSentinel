import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, LogIn, Siren, ChevronRight, Activity, 
  Search, Filter, List, Grid, Send, MapPin, 
  ExternalLink, LogOut, CheckCircle2, Loader2,
  AlertCircle
} from 'lucide-react';
import { 
  auth, db, collection, query, where, onSnapshot, 
  doc, setDoc, orderBy, handleFirestoreError, OperationType
} from '../lib/firebase';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { Incident, AgencyType, AuthorityUser } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { cn, timeAgo, AGENCY_COLORS, SEVERITY_COLORS, formatTimestamp } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Authority() {
  const { user, authorityProfile, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'LIST' | 'MAP'>('LIST');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isSignUp, setIsSignUp] = useState(false);
  const [agency, setAgency] = useState<AgencyType>('Police');

  const navigate = useNavigate();

  // Fetch incidents relevant to the authority's agency
  useEffect(() => {
    if (!authorityProfile) return;

    let q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'));
    
    // Only filter if not admin
    if (authorityProfile.role !== 'ADMIN') {
      const agenciesMap: Record<AgencyType, string[]> = {
        'Police': ['Crime', 'Explosion', 'Other'],
        'Fire Service': ['Fire', 'Explosion'],
        'FRSC': ['Accident'],
        'NEMA': ['Flood', 'Medical', 'Explosion', 'Other'],
        'Medical': ['Medical']
      };
      
      const relevantTypes = agenciesMap[authorityProfile.agency] || [];
      if (relevantTypes.length > 0) {
        q = query(collection(db, 'incidents'), where('type', 'in', relevantTypes), orderBy('createdAt', 'desc'));
      }
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setIncidents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Incident)));
    });

    return () => unsubscribe();
  }, [authorityProfile]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        // Create profile
        const profile: AuthorityUser = {
          uid: userCred.user.uid,
          email: email,
          agency: agency,
          role: 'RESPONDER' // Default role
        };
        await setDoc(doc(db, 'authority_users', userCred.user.uid), profile);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || !authorityProfile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="rounded-3xl bg-white p-10 shadow-2xl border border-slate-100"
        >
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-100">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Authority Access</h1>
            <p className="mt-2 text-slate-500 font-medium">Mission Control & Tactical Deployment</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">Email Address</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 font-bold text-slate-700 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                placeholder="agency@geosentinel.gov.ng"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">Credential Token</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 font-bold text-slate-700 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">Assigned Agency</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Police', 'Fire Service', 'NEMA', 'FRSC', 'Medical'].map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAgency(a as AgencyType)}
                      className={cn(
                        "rounded-xl border-2 p-2 text-xs font-bold transition-all",
                        agency === a ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-100 bg-white"
                      )}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-2 rounded-xl bg-red-50 p-4 text-xs font-bold text-red-600 border border-red-100">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <button
              disabled={isAuthLoading}
              type="submit"
              className="group flex w-full items-center justify-center space-x-2 rounded-2xl bg-blue-600 py-4 text-lg font-bold text-white shadow-xl shadow-blue-200 transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              {isAuthLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
              <span>{isSignUp ? 'Create Authority Profile' : 'Authorize Session'}</span>
            </button>
          </form>

          <div className="mt-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
            {isSignUp ? (
              <p>Already have access? <button onClick={() => setIsSignUp(false)} className="text-blue-600 hover:underline">Login here</button></p>
            ) : (
              <p>New Agency? <button onClick={() => setIsSignUp(true)} className="text-blue-600 hover:underline">Apply for Access</button></p>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Dashboard Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-2xl">
            <Shield className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Authority Panel</h1>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase text-blue-600 tracking-widest">{authorityProfile.agency} UNIT</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span className="text-xs font-bold text-slate-400">Authenticated: {authorityProfile.email}</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Link to="/dashboard" className="flex items-center space-x-2 rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-slate-600 border-2 border-slate-100 hover:bg-slate-50">
            <Activity className="h-4 w-4" />
            <span>Field Map</span>
          </Link>
          <button 
            onClick={handleSignOut}
            className="flex items-center space-x-2 rounded-xl bg-red-50 px-6 py-2.5 text-sm font-bold text-red-600 border border-red-100 hover:bg-red-100"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4 mb-10">
        <StatCard 
          label="Relevant Events" 
          value={incidents.length} 
          icon={<List className="h-5 w-5 text-blue-500" />}
        />
        <StatCard 
          label="Pending Triage" 
          value={incidents.filter(i => i.status === 'PENDING').length} 
          icon={<Activity className="h-5 w-5 text-red-500" />}
          alert
        />
        <StatCard 
          label="Active Response" 
          value={incidents.filter(i => i.status === 'RESPONDING').length} 
          icon={<Siren className="h-5 w-5 text-blue-500" />}
        />
        <StatCard 
          label="Resolved Today" 
          value={incidents.filter(i => i.status === 'RESOLVED').length} 
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
        />
      </div>

      {/* Main List */}
      <div className="rounded-3xl bg-white shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-50 bg-slate-50/30">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Active Incident Feed</h3>
          <div className="flex space-x-2">
             {/* Filter/Search placeholders */}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/20 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4">Incident ID</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Time Reported</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-slate-400">
                    <Activity className="mx-auto h-12 w-12 opacity-10 mb-4" />
                    <p className="font-bold uppercase tracking-widest text-xs">No incidents flagged for your unit</p>
                  </td>
                </tr>
              ) : (
                incidents.map((idx) => (
                  <tr key={idx.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs font-bold text-slate-900">{idx.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: AGENCY_COLORS[idx.type] }} />
                        <span className="text-sm font-bold text-slate-700">{idx.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="max-w-xs truncate text-xs text-slate-500" title={idx.address}>
                        {idx.address}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase text-white shadow-sm",
                        idx.severity === 'Critical' ? 'bg-red-600' : 
                        idx.severity === 'High' ? 'bg-orange-500' :
                        idx.severity === 'Medium' ? 'bg-yellow-500' : 'bg-emerald-500'
                      )}>
                        {idx.severity}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{formatTimestamp(idx.createdAt)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex items-center space-x-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                        idx.status === 'PENDING' ? 'bg-red-50 text-red-600' :
                        idx.status === 'RESPONDING' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                      )}>
                        <div className={cn("h-1.5 w-1.5 rounded-full", idx.status === 'PENDING' ? 'bg-red-600 animate-pulse' : idx.status === 'RESPONDING' ? 'bg-blue-600' : 'bg-emerald-600')} />
                        <span>{idx.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/incident/${idx.id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-blue-600 hover:text-white"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, alert }: { label: string, value: number, icon: React.ReactNode, alert?: boolean }) {
  return (
    <div className={cn(
      "rounded-2xl p-6 border transition-all",
      alert ? "bg-red-50 border-red-100 shadow-xl shadow-red-50" : "bg-white border-slate-100 shadow-sm"
    )}>
      <div className="mb-4 flex items-center justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", alert ? "bg-red-100" : "bg-slate-50")}>
          {icon}
        </div>
        {alert && value > 0 && <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />}
      </div>
      <p className={cn("text-[10px] font-black uppercase tracking-widest", alert ? "text-red-400" : "text-slate-400")}>{label}</p>
      <p className={cn("text-3xl font-black mt-1", alert ? "text-red-600" : "text-slate-900")}>{value}</p>
    </div>
  );
}
