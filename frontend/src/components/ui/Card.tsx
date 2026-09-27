import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  className = '', 
  hoverable = false, 
  children, 
  ...props 
}) => {
  return (
    <div 
      className={`bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden ${hoverable ? 'transition-transform hover:-translate-y-1 hover:shadow-lg hover:shadow-black/50' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
