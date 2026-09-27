import React from 'react';
import { ChefHat, ArrowLeft, User } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isProfile = location.pathname === '/profile';

  return (
    <header className="sticky top-0 z-50 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {!isHome && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-1 text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors"
              title="Vrátit se o krok zpět"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Zpět</span>
            </button>
          )}

          <Link to="/" className="flex items-center space-x-2 text-amber-500">
            <ChefHat className="w-7 h-7" />
            <span className="font-bold text-xl tracking-tight text-white">
              Vkusno<span className="text-amber-500">Paskuda!</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-medium hidden sm:inline-block">
            🇨🇿 Česko
          </span>

          <Link
            to="/profile"
            className={`p-2 rounded-xl border transition-colors flex items-center justify-center ${
              isProfile
                ? 'bg-amber-500 text-zinc-950 border-amber-400'
                : 'bg-zinc-800/70 text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-600'
            }`}
            title="Můj profil a dietní preference"
          >
            <User className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
};
