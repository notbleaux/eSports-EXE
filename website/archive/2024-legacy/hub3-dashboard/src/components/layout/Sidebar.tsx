import React from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  Calculator, 
  Award, 
  Settings,
  Users
} from 'lucide-react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-dash-teal/20 text-dash-teal border border-dash-teal/30' 
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

interface SidebarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeSection = 'dashboard',
  onSectionChange 
}) => {
  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { id: 'analytics', icon: <BarChart3 className="w-5 h-5" />, label: 'Analytics' },
    { id: 'players', icon: <Users className="w-5 h-5" />, label: 'Players' },
    { id: 'rar', icon: <Calculator className="w-5 h-5" />, label: 'RAR Calculator' },
    { id: 'grades', icon: <Award className="w-5 h-5" />, label: 'Grades' },
  ];

  return (
    <aside className="w-64 h-screen bg-dash-bg border-r border-dash-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-dash-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-dash-teal rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">SimRating™</h1>
            <p className="text-xs text-gray-400">Analytics Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeSection === item.id}
            onClick={() => onSectionChange?.(item.id)}
          />
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-dash-border">
        <NavItem
          icon={<Settings className="w-5 h-5" />}
          label="Settings"
        />
        
        <div className="mt-4 px-4 py-3 bg-dash-panel rounded-lg">
          <p className="text-xs text-gray-400">Version</p>
          <p className="text-sm font-medium text-white">2.1.0</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
