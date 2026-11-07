import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { X } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 shrink-0 h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer with Apple Fluid Spring Slide */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-64 max-w-[80vw] h-full bg-white z-10 shadow-2xl flex flex-col border-r border-slate-200/60"
            >
              <div className="absolute top-4 right-4 z-20">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 active:scale-95 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

