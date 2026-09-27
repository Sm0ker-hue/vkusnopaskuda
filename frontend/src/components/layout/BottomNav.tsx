import React, { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ListChecks, ShoppingCart, History, User } from 'lucide-react';
import { useRecipeStore } from '../../stores/recipeStore';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { activeRecipeId, setActiveRecipeId } = useRecipeStore();

  // Extract variation ID from URL if user is currently on an ingredients/shopping/recipe page
  const routeVariationId = useMemo(() => {
    const match = location.pathname.match(/^\/(?:ingredients|shopping|recipe)\/([^/]+)/);
    return match ? match[1] : null;
  }, [location.pathname]);

  // Keep store and localStorage in sync if user landed directly on a variation route
  useEffect(() => {
    if (routeVariationId && activeRecipeId !== routeVariationId) {
      setActiveRecipeId(routeVariationId);
    }
  }, [routeVariationId, activeRecipeId, setActiveRecipeId]);

  // The variation ID in the URL is the definitive source of truth, falling back to persisted store
  const currentRecipeId = routeVariationId || activeRecipeId;

  // Navigation items with static, unique IDs that never change across renders
  const navItems = useMemo(
    () => [
      {
        id: 'search',
        to: '/',
        icon: Home,
        label: 'Hledat',
        isActive: location.pathname === '/' || location.pathname.startsWith('/variations'),
        isDisabled: false,
        title: 'Hledat recepty',
      },
      {
        id: 'ingredients',
        to: currentRecipeId ? `/ingredients/${currentRecipeId}` : '#',
        icon: ListChecks,
        label: 'Suroviny',
        isActive: location.pathname.startsWith('/ingredients'),
        isDisabled: !currentRecipeId,
        title: currentRecipeId ? 'Suroviny receptu' : 'Nejprve vyberte recept',
      },
      {
        id: 'cart',
        to: currentRecipeId ? `/shopping/${currentRecipeId}` : '#',
        icon: ShoppingCart,
        label: 'Košík',
        isActive: location.pathname.startsWith('/shopping') || location.pathname.startsWith('/recipe'),
        isDisabled: !currentRecipeId,
        title: currentRecipeId ? 'Nákupní košík' : 'Nejprve vyberte recept',
      },
      {
        id: 'history',
        to: '/history',
        icon: History,
        label: 'Historie',
        isActive: location.pathname.startsWith('/history'),
        isDisabled: false,
        title: 'Historie vaření',
      },
      {
        id: 'profile',
        to: '/profile',
        icon: User,
        label: 'Profil',
        isActive: location.pathname.startsWith('/profile'),
        isDisabled: false,
        title: 'Můj profil',
      },
    ],
    [location.pathname, currentRecipeId]
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 pb-safe">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.isDisabled ? '#' : item.to}
            aria-label={item.label}
            aria-disabled={item.isDisabled}
            title={item.title}
            onClick={(e) => {
              if (item.isDisabled) {
                e.preventDefault();
              }
            }}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors select-none ${
              item.isDisabled
                ? 'text-zinc-600 opacity-40 cursor-not-allowed pointer-events-auto'
                : item.isActive
                ? 'text-amber-500 font-semibold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <item.icon className={`w-5 h-5 ${item.isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

