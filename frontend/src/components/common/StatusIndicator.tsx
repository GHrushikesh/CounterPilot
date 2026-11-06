import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { Activity, AlertCircle } from 'lucide-react';

export const StatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [backendApp, setBackendApp] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const check = async () => {
      try {
        const res = await apiService.getHealth();
        if (isMounted) {
          if (res.status === 'ok') {
            setStatus('online');
            setBackendApp(res.application);
          } else {
            setStatus('offline');
          }
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
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-500 bg-slate-100 rounded-full border border-slate-200">
        <Activity className="w-3.5 h-3.5 animate-pulse text-slate-400" />
        <span>Connecting API</span>
      </div>
    );
  }

  if (status === 'online') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 rounded-full border border-emerald-200">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>{backendApp || 'API Connected'}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-rose-800 bg-rose-50 rounded-full border border-rose-200">
      <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
      <span>Backend Offline</span>
    </div>
  );
};
