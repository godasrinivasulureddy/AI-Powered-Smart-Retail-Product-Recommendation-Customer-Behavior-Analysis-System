import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { Login } from './components/Login.tsx';
import { ExecutiveDashboard } from './components/ExecutiveDashboard.tsx';
import { CustomerExplorer } from './components/CustomerExplorer.tsx';
import { RecommendationSandbox } from './components/RecommendationSandbox.tsx';
import { PurchasePredictor } from './components/PurchasePredictor.tsx';
import { ModelRegistryView } from './components/ModelRegistryView.tsx';
import { ApiConsole } from './components/ApiConsole.tsx';
import { api, getAuthToken } from './services/api.ts';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [healthStatus, setHealthStatus] = useState<string>('ok');
  
  // Auth state management
  const [user, setUser] = useState<{ email: string; role: string } | null>(() => {
    const token = getAuthToken();
    if (!token) return null;
    const storedEmail = localStorage.getItem('user_email') || 'analyst@retail-ai.internal';
    const storedRole = localStorage.getItem('user_role') || 'ANALYST';
    return { email: storedEmail, role: storedRole };
  });

  const handleLogout = () => {
    api.logout();
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_role');
    setUser(null);
    setActiveTab('dashboard');
  };

  const handleLoginSuccess = (token: string, userData: { email: string; role: string }) => {
    localStorage.setItem('user_email', userData.email);
    localStorage.setItem('user_role', userData.role);
    setUser(userData);
  };

  useEffect(() => {
    // Health status check
    api.getHealth()
      .then((res) => {
        if (res && res.status) setHealthStatus(res.status);
      })
      .catch(() => setHealthStatus('online'));

    // Global unauthorized event listener (clears stale/invalid tokens automatically)
    const handleUnauthorized = () => {
      handleLogout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemHealth={healthStatus}
        user={user}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user ? (
          <Login onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            {activeTab === 'dashboard' && <ExecutiveDashboard />}
            {activeTab === 'customers' && <CustomerExplorer />}
            {activeTab === 'recommendations' && <RecommendationSandbox />}
            {activeTab === 'predictions' && <PurchasePredictor />}
            {activeTab === 'models' && <ModelRegistryView />}
            {activeTab === 'api' && <ApiConsole />}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200/80 py-6 text-slate-500 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900">RetailIQ Analytics</span>
            <span>•</span>
            <span>AI-Powered Product Recommendation & Behavior Classification System</span>
          </div>
          <div className="flex items-center space-x-4 font-mono text-[11px] text-slate-400">
            <span>FastAPI Specification v0.1.0</span>
            <span>•</span>
            <span>Port 3000</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

