import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import AudienceBuilder from './pages/AudienceBuilder';
import Campaigns from './pages/Campaigns';
import Analytics from './pages/Analytics';

const App: React.FC = () => {
  return (
    <div className="flex bg-background text-textPrimary min-h-screen">
      {/* Fixed Sidebar panel */}
      <Sidebar />

      {/* Main Content scrollable panel */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Header navbar panel */}
        <header className="h-16 border-b border-border bg-surface px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-textSecondary font-semibold uppercase tracking-wider bg-border px-3 py-1 rounded">
              Region: India (IN)
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-textPrimary">Admin Account</span>
              <span className="text-[10px] text-textSecondary">marketing@brand.in</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold text-[#111418] shadow shadow-primary/20">
              M
            </div>
          </div>
        </header>

        {/* Content routes container */}
        <main className="flex-1 bg-background">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/audience" element={<AudienceBuilder />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/analytics/:id" element={<Analytics />} />
            
            {/* Fallback & Redirect rules */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
