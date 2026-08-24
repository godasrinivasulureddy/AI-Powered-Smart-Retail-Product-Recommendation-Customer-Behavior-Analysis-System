import React from 'react';
import { ShoppingBag, Activity, Database, Sparkles, BrainCircuit, Terminal, Users, LogOut, UserCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemHealth: string;
  user: { email: string; role: string } | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, systemHealth, user, onLogout }) => {
  const tabs = [
    { id: 'dashboard', label: 'Executive Overview', icon: Activity },
    { id: 'customers', label: 'Customer Segmentation', icon: Users },
    { id: 'recommendations', label: 'AI Recommendations', icon: Sparkles },
    { id: 'predictions', label: 'Purchase Propensity', icon: BrainCircuit },
    { id: 'models', label: 'ML Model Registry', icon: Database },
    { id: 'api', label: 'API Console', icon: Terminal },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">RetailIQ</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 font-medium px-2 py-0.5 rounded-full border border-indigo-500/30">
                  AI & Analytics Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">Customer Behavior & Product Recommendation System</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
              <span className={`w-2 h-2 rounded-full ${systemHealth === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-slate-300">API Status:</span>
              <span className="font-semibold text-emerald-400 uppercase">{systemHealth}</span>
            </div>

            {user && (
              <div className="hidden sm:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs text-slate-300">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold text-indigo-400">{user.role}</span>
                <span className="text-slate-500">({user.email})</span>
              </div>
            )}

            {user && (
              <button
                onClick={onLogout}
                title="Sign Out"
                className="flex items-center space-x-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/30 text-xs font-semibold transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        {user && (
          <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/80 no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-btn-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
};

