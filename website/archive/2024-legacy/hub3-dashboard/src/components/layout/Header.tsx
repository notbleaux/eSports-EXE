import React from 'react';
import { Search, Bell, RefreshCw, User } from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  title = 'Dashboard',
  subtitle = 'Welcome back to SimRating™ Analytics'
}) => {
  const { refreshData, isLoading } = useDashboardStore();

  return (
    <header className="h-16 border-b border-dash-border bg-dash-bg/80 backdrop-blur-md flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <p className="text-sm text-gray-400">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search players..."
            className="w-64 pl-10 pr-4 py-2 bg-dash-panel border border-dash-border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-dash-teal"
          />
        </div>

        {/* Refresh Button */}
        <button
          onClick={refreshData}
          disabled={isLoading}
          className={`p-2 rounded-lg hover:bg-white/5 transition-colors ${isLoading ? 'animate-spin' : ''}`}
          aria-label="Refresh data"
        >
          <RefreshCw className="w-5 h-5 text-gray-400" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
          <Bell className="w-5 h-5 text-gray-400" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-dash-teal rounded-full"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-dash-border">
          <div className="text-right">
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
          <div className="w-9 h-9 bg-dash-teal/20 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-dash-teal" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
