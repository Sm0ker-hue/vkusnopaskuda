import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ListChecks, ShoppingCart, History, User } from 'lucide-react';
import { useRecipeStore } from '../../stores/recipeStore';

export const BottomNav: React.FC = () => {
  const { activeRecipeId } = useRecipeStore();

  const navItems = [
    { to: '/', icon: Home, label: 'Hledat' },
    { to: activeRecipeId ? `/ingredients/${activeRecipeId}` : '/', icon: ListChecks, label: 'Suroviny' },
    { to: activeRecipeId ? `/shopping/${activeRecipeId}` : '/', icon: ShoppingCart, label: 'Košík' },
    { to: '/history', icon: History, label: 'Historie' },
    { to: '/profile', icon: User, label: 'Profil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 pb-safe">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
