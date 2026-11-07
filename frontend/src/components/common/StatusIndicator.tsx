import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';

export const StatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    let isMounted = true;

    const check = async () => {
      try {
        const res = await apiService.getHealth();
        if (isMounted) {
          setStatus(res.status === 'ok' ? 'online' : 'offline');
        }
      } catch {
        if (isMounted) {
          setStatus('offline');
        }
      }
    };

    check();
    const interval = setInterval(check, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (status === 'checking') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-slate-400 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse"></span>
        <span>Connecting</span>
      </div>
    );
  }

  if (status === 'online') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-slate-600 apple-glass-button rounded-full shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span className="tracking-tight">System Live</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-rose-700 bg-rose-50/80 rounded-full border border-rose-200/80">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
      <span>Offline</span>
    </div>
  );
};
