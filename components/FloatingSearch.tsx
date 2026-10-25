
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';

export function FloatingSearch() {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(true);
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
      {open && (
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

          <button
            type="button"
            className="floatingSearchToggle"
            onClick={() => setOpen(false)}
            aria-label="Hide floating search"
            title="Hide search"
          >
            <X size={18} />
          </button>
        </form>
      )}

      {!open && (
        <button
          type="button"
          className="floatingSearchReopen"
          onClick={() => setOpen(true)}
          aria-label="Show floating search"
        >
          <Search size={19} />
          <span>Search</span>
        </button>
      )}
    </div>
  );
}
