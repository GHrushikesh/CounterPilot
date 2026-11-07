import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Store, Settings, ShoppingCart } from 'lucide-react';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { useStore } from '../context/StoreContext';

interface TopNavbarProps {
  onToggleMobileMenu: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onToggleMobileMenu }) => {
  const { shopName, settings } = useStore();

  // Generate 2-character initials for store avatar
  const initials = shopName
    ? shopName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('')
    : 'CP';

  return (
    <header className="h-16 apple-liquid-glass-nav px-4 md:px-8 flex items-center justify-between sticky top-0 z-20 transition-all border-b border-slate-200/50">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition-all"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Current Store Identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 flex items-center justify-center hidden sm:flex shadow-2xs">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-slate-900 line-clamp-1">
                {shopName}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-normal hidden sm:block">
              {settings?.tagline || 'Retail Counter & Point of Sale'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Live System Status */}
        <StatusIndicator />

        {/* Quick New Bill Action */}
        <Link
          to="/sales"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold apple-glass-button-primary active:scale-95 rounded-xl transition-all shadow-2xs cursor-pointer"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>New Bill</span>
        </Link>

        {/* Store Settings Shortcut Pill */}
        <Link
          to="/settings"
          title="Store Settings & Configuration"
          className="flex items-center gap-2 pl-2 sm:pl-3 py-1 sm:pr-2.5 rounded-xl hover:bg-slate-100/70 border border-transparent hover:border-slate-200/60 active:scale-95 transition-all cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-lg bg-orange-600 text-white font-semibold text-[11px] flex items-center justify-center shadow-2xs">
            {initials}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-slate-800 tracking-tight leading-tight group-hover:text-orange-600 transition-colors">
              Settings
            </div>
            <div className="text-[10px] text-slate-400 leading-tight">
              Store Profile
            </div>
          </div>
          <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors hidden sm:block" />
        </Link>
      </div>
    </header>
  );
};
