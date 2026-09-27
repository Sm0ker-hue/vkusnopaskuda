import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CheckCircle2 } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setShowReconnected(false), 3500);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
      if (timer) clearTimeout(timer);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (showReconnected) {
    return (
      <aside aria-label="Stav připojení" className="fixed top-16 left-0 right-0 z-40 bg-emerald-500/90 text-zinc-950 px-4 py-1.5 text-xs font-semibold backdrop-blur-md flex items-center justify-center space-x-2 shadow-md transition-all">
        <Wifi className="w-3.5 h-3.5" />
        <span>Připojení k internetu obnoveno. Data synchronizována.</span>
      </aside>
    );
  }

  if (!isOffline) {
    return null;
  }

  return (
    <aside aria-label="Stav připojení" className="fixed top-16 left-0 right-0 z-40 bg-amber-500/95 text-zinc-950 px-4 py-2 text-xs font-semibold backdrop-blur-md flex items-center justify-between shadow-lg border-b border-amber-600/40 animate-fade-in">
      <div className="flex items-center space-x-2">
        <WifiOff className="w-4 h-4 text-zinc-950 animate-pulse" />
        <span>Režim offline: Recepty, suroviny i nákupní seznam jsou dostupné z mezipaměti.</span>
      </div>
      <span className="hidden sm:inline-flex items-center text-[11px] bg-zinc-950/15 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3 mr-1" /> Uloženo lokálně
      </span>
    </aside>
  );
};
