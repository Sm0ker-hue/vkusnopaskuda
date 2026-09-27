import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface DishSearchProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export const DishSearch: React.FC<DishSearchProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4 w-full">
      <Input
        icon={<Search className="w-5 h-5 text-zinc-500" />}
        placeholder="Co si dáte? (např. Svíčková na smetaně)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Button type="submit" disabled={!query.trim() || isLoading} className="w-full">
        {isLoading ? 'Hledáme recepty...' : 'Najít recepty'}
      </Button>
    </form>
  );
};
