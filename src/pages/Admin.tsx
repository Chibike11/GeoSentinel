import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, Users, Clock, CheckCircle2, TrendingUp, AlertTriangle, 
  Map as MapIcon, Shield, Loader2, Download, Search, Filter, Siren,
  ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import { 
  db, collection, getDocs, query, orderBy, onSnapshot, 
  handleFirestoreError, OperationType
} from '../lib/firebase';
import { Incident, AuthorityUser } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn, AGENCY_COLORS } from '../lib/utils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { motion } from 'motion/react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

import { seedDemoData } from '../lib/seed';

export default function Admin() {
  const { authorityProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [authUsers, setAuthUsers] = useState<AuthorityUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData();
      alert("Demo data seeded! 15 incidents added.");
    } catch (error) {
      console.error("Seeding failed:", error);
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    if (authorityProfile && authorityProfile.role !== 'ADMIN') {
      navigate('/authority');
    }
  }, [authorityProfile, navigate]);

  useEffect(() => {
    // Real-time incidents
    const incidentsUnsubscribe = onSnapshot(query(collection(db, 'incidents'), orderBy('createdAt', 'desc')), (snapshot) => {
      setIncidents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Incident)));
    });

    // Authority users
    const usersUnsubscribe = onSnapshot(collection(db, 'authority_users'), (snapshot) => {
      setAuthUsers(snapshot.docs.map(d => d.data() as AuthorityUser));
    });

    setIsLoading(false);
    return () => {
      incidentsUnsubscribe();
      usersUnsubscribe();
    };
  }, []);

  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    incidents.forEach(i => {
      counts[i.type] = (counts[i.type] || 0) + 1;
    });

    return {
      labels: Object.keys(counts),
      datasets: [
        {
          label: 'Incidents by Type',
          data: Object.values(counts),
          backgroundColor: Object.keys(counts).map(t => AGENCY_COLORS[t] || '#ccc'),
          borderWidth: 0,
        },
      ],
    };
  }, [incidents]);

  const severityData = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    incidents.forEach(i => {
      counts[i.severity]++;
    });

    return {
      labels: Object.keys(counts),
      datasets: [
        {
          label: 'Severity Distribution',
          data: Object.values(counts),
          backgroundColor: ['#2A9D8F', '#E9C46A', '#F4A261', '#E63946'],
          borderRadius: 8,
        },
      ],
    };
  }, [incidents]);

  const stats = useMemo(() => {
    const total = incidents.length;
    const resolved = incidents.filter(i => i.status === 'RESOLVED').length;
    const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;
    
    return {
      total,
      resolved,
      resolutionRate: resolutionRate.toFixed(1),
      activeResponders: authUsers.length,
      avgResponseTime: '12.4m' // Placeholder for real calc
    };
  }, [incidents, authUsers]);

  if (isLoading || loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-2xl">
            <BarChart3 className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Analytics</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Platform Overview</p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button 
            onClick={handleSeed}
            disabled={isSeeding}
            className="flex items-center space-x-2 rounded-xl bg-orange-50 px-6 py-2.5 text-sm font-bold text-orange-600 border border-orange-100 hover:bg-orange-100 transition-all disabled:opacity-50"
          >
            {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
            <span>Seed 15 Incidents</span>
          </button>
          <button className="flex items-center space-x-2 rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-slate-600 border-2 border-slate-100 hover:bg-slate-50 transition-all">
            <Download className="h-4 w-4" />
            <span>Generate PDF Report</span>
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <AdminStatCard 
          label="Cumulative Incidents" 
          value={stats.total} 
          trend="+12%" 
          trendUp 
          icon={<Siren className="text-blue-600" />}
        />
        <AdminStatCard 
          label="Resolution Rate" 
          value={`${stats.resolutionRate}%`} 
          trend="+2.4%" 
          trendUp 
          icon={<CheckCircle2 className="text-emerald-600" />}
        />
        <AdminStatCard 
          label="Active Authorities" 
          value={stats.activeResponders} 
          icon={<Shield className="text-purple-600" />}
        />
        <AdminStatCard 
          label="Avg Response Time" 
          value={stats.avgResponseTime} 
          trend="-4%" 
          trendUp={false} 
          icon={<Clock className="text-orange-600" />}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2 mb-10">
        {/* Incident Type Dist */}
        <div className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-100 border border-slate-100">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-8">Classification Analytics</h3>
          <div className="h-64 flex items-center justify-center">
            <Pie 
              data={typeData} 
              options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} 
            />
          </div>
        </div>

        {/* Severity */}
        <div className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-100 border border-slate-100">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-8">Intensity Distribution</h3>
          <div className="h-64">
            <Bar 
              data={severityData} 
              options={{ 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
              }} 
            />
          </div>
        </div>
      </div>

      {/* User Management */}
      <div className="rounded-3xl bg-white shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between p-8 border-b border-slate-50">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Personnel Directory</h3>
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
            <Users className="h-4 w-4" />
            <span>{authUsers.length} Registered Responders</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-8 py-4">UID Token</th>
                <th className="px-8 py-4">Agency</th>
                <th className="px-8 py-4">Email Channel</th>
                <th className="px-8 py-4">Rank / Role</th>
                <th className="px-8 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {authUsers.map((u) => (
                <tr key={u.uid} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-8 py-4">
                    <p className="font-mono text-[10px] text-slate-400">{u.uid}</p>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-blue-600" />
                      <span className="font-bold text-slate-700 text-sm">{u.agency}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-sm font-medium text-slate-600">{u.email}</p>
                  </td>
                  <td className="px-8 py-4">
                    <span className={cn(
                      "rounded-full px-3 py-1 text-[10px] font-black uppercase",
                      u.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'
                    )}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center space-x-1.5 text-emerald-600">
                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                       <span className="text-[10px] font-bold uppercase">Online</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminStatCard({ label, value, trend, trendUp, icon }: { label: string, value: string | number, trend?: string, trendUp?: boolean, icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl shadow-slate-100 border border-slate-100">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "flex items-center space-x-1 rounded-full px-3 py-1 text-xs font-bold",
            trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
            {trendUp ? <TrendingUp className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
            <span>{trend}</span>
          </div>
        )}
      </div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <h4 className="text-4xl font-black text-slate-900 tracking-tight">{value}</h4>
    </div>
  );
}
