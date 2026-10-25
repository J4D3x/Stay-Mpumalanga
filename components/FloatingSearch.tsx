'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

export function FloatingSearch() {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 300);
    }

    handleScroll();

    window.addEventListener('scroll', handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="floatingSearch">
      <form
        className="floatingSearchInner"
        onSubmit={(e) => {
          e.preventDefault();
          window.location.href = `/search?q=${encodeURIComponent(query)}`;
        }}
      >
        <Search size={19} />

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search accommodation, location or institution..."
          aria-label="Search accommodation"
        />

        <button type="submit">Search</button>
      </form>
    </div>
  );
}