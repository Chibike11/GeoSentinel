/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HotlineWidget } from './components/HotlineWidget';
import Home from './pages/Home';
import Report from './pages/Report';
import Dashboard from './pages/Dashboard';
import IncidentDetail from './pages/IncidentDetail';
import Authority from './pages/Authority';
import Admin from './pages/Admin';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
          <Navbar />
          <main className="relative">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/report" element={<Report />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/incident/:id" element={<IncidentDetail />} />
              <Route path="/authority" element={<Authority />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
          <HotlineWidget />
        </div>
      </AuthProvider>
    </Router>
  );
}
