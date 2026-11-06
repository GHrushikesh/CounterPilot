import React from 'react';
import { Menu, Store, User } from 'lucide-react';
import { StatusIndicator } from '../components/common/StatusIndicator';

interface TopNavbarProps {
  onToggleMobileMenu: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onToggleMobileMenu }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Current Shop Name */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 hidden sm:flex">
            <Store className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-slate-900">
                Ujjam Computers
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Sample Workspace
              </span>
            </div>
            <div className="text-[10px] text-slate-400 hidden sm:block">
              Retail Operating System
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Backend health status indicator */}
        <StatusIndicator />

        {/* Profile placeholder */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <User className="w-4 h-4 text-slate-500" />
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-slate-800">Shopkeeper</div>
            <div className="text-[10px] text-slate-400">Owner Access</div>
          </div>
        </div>
      </div>
    </header>
  );
};
