import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Package,
  Receipt,
  ArrowLeftRight,
  Bot,
  Settings,
  Store,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Point of Sale', path: '/sales', icon: Receipt },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Store AI', path: '/assistant', icon: Bot },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-full bg-white border-r border-slate-200/80 flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-2xs">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-slate-900">
              CounterPilot
            </div>
            <div className="text-[10px] font-medium tracking-tight text-slate-400">
              Retail Intelligence
            </div>
          </div>
        </div>

        {/* Navigation Links with Apple Fluid Spring Indicator */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-colors z-10 ${
                    isActive
                      ? 'text-orange-950 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute inset-0 bg-orange-500/10 border border-orange-500/20 rounded-xl -z-10 shadow-2xs"
                        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                      />
                    )}
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                    <span className="tracking-tight">{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-100">
        <NavLink
          to="/assistant"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 p-3 rounded-xl bg-orange-50/60 border border-orange-200/60 hover:bg-orange-50 transition-colors group cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-600">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-semibold text-orange-950 tracking-tight leading-tight group-hover:text-orange-600 transition-colors">
              BharatCode AI
            </div>
            <div className="text-[10px] text-orange-700/80 leading-tight">
              Retail analytics assistant
            </div>
          </div>
        </NavLink>
      </div>
    </aside>
  );
};
