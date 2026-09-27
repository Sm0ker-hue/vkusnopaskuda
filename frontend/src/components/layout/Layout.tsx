import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { OfflineBanner } from '../ui/OfflineBanner';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a1a] text-white">
      <Header />
      <OfflineBanner />
      <main className="flex-1 w-full max-w-md mx-auto pb-20 pt-4 px-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default Layout;
