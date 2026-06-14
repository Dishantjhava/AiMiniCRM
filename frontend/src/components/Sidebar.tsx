import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Sparkles,
  Megaphone,
  BarChart3,
  Flame,
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Orders', path: '/orders', icon: ShoppingBag },
    { name: 'AI Audience Builder', path: '/audience', icon: Sparkles },
    { name: 'Campaigns', path: '/campaigns', icon: Megaphone },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-cardbg border-r border-borderbg flex flex-col h-screen sticky top-0">
      {/* Branding Header */}
      <div className="p-6 border-b border-borderbg flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <Flame className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
            XENO
          </h1>
          <p className="text-[10px] text-textsecondary font-semibold uppercase tracking-widest">
            AI-Native CRM
          </p>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/20 border-r-4 border-success'
                    : 'text-textsecondary hover:bg-borderbg hover:text-textprimary'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / System Status */}
      <div className="p-4 border-t border-borderbg">
        <div className="bg-borderbg/50 rounded-lg p-3 flex items-center justify-between">
          <span className="text-xs text-textsecondary">Engine Status</span>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse"></span>
            <span className="text-[10px] font-bold text-success uppercase">Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
