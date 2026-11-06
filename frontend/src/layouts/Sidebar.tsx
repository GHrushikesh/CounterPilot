import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Receipt,
  ArrowLeftRight,
  Bot,
  Settings,
  Store,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Sales', path: '/sales', icon: Receipt },
    { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { name: 'AI Assistant', path: '/assistant', icon: Bot },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-full bg-white border-r border-slate-200 flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-slate-900">
              CounterPilot
            </div>
            <div className="text-[10px] uppercase font-semibold tracking-wider text-emerald-700">
              Retail OS
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-xs transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold border-l-2 border-emerald-600 pl-2.5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-slate-500" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Workspace Footer */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-2 px-2 py-2 rounded bg-slate-50 border border-slate-200/60">
          <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="overflow-hidden">
            <div className="text-[11px] font-medium text-slate-800 truncate">
              Phase 1: Foundation
            </div>
            <div className="text-[10px] text-slate-500">
              FastAPI + SQLite + React
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

