
'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { Listing } from '@/types';
import { ListingCard } from '@/components/ListingCard';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
});

type AccommodationRow = {
  id: string;
  name: string;
  description: string | null;
  location: string;
  institution: string | null;
  price: number | string;
  nsfas: boolean;
  room_type: string | null;
  available_rooms: number;
  amenities: string[] | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
};

export default function SearchPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [q, setQ] = useState('');
  const [nsfas, setNsfas] = useState(false);
  const [max, setMax] = useState(5000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadListings() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('accommodations')
        .select(
          'id, name, description, location, institution, price, nsfas, room_type, available_rooms, amenities, image_url, latitude, longitude'
        )
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        setError('Unable to load accommodation listings. Please try again.');
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as unknown as AccommodationRow[];

      const mapped: Listing[] = rows.map((row) => ({
        id: row.id,
        name: row.name,
        location: row.location,
        institution: row.institution ?? 'Not specified',
        price: Number(row.price),
        nsfas: row.nsfas,
        distanceKm: null,
        roomType: row.room_type ?? 'Not specified',
        availableRooms: row.available_rooms,
        amenities: row.amenities ?? [],
        imageUrl: row.image_url ?? '/placeholder-accommodation.jpg',
        lat: row.latitude ?? 0,
        lng: row.longitude ?? 0,
        description: row.description ?? '',
      }));

      setListings(mapped);
      setLoading(false);
    }

    loadListings();
  }, []);

  const filtered = useMemo(
    () =>
      listings.filter(
        (l) =>
          (!q ||
            `${l.name} ${l.location} ${l.institution}`
              .toLowerCase()
              .includes(q.toLowerCase())) &&
          l.price <= max &&
          (!nsfas || l.nsfas)
      ),
    [listings, q, max, nsfas]
  );

  const mappedListings = filtered.filter(
    (l) => l.lat !== 0 && l.lng !== 0
  );

  return (
    <main className="section searchPage">
      <div className="sectionHead">
        <div>
          <span className="eyebrow">DISCOVER</span>
          <h1>Find accommodation</h1>
          <p>
            {loading
              ? 'Loading accommodation options...'
              : `${filtered.length} accommodation options`}
          </p>
        </div>
      </div>

      <div className="searchLayout">
        <aside className="filters">
          <label>
            Search
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="eMalahleni, UMP..."
            />
          </label>

          <label>
            Maximum monthly price
            <input
              type="range"
              min="1500"
              max="6000"
              step="100"
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
            />
            <strong>R{max.toLocaleString()}</strong>
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={nsfas}
              onChange={(e) => setNsfas(e.target.checked)}
            />
            NSFAS accredited / information available
          </label>
        </aside>

        <div className="results">
          {loading && <p>Loading listings from the database...</p>}

          {!loading && error && (
            <p role="alert">{error}</p>
          )}

          {!loading && !error && filtered.length === 0 && (
            <p>No accommodation matches your filters.</p>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="grid">
              {filtered.map((l) => (
                <ListingCard key={l.id} l={l} />
              ))}
            </div>
          )}
        </div>
      </div>

      {!loading && !error && (
        <>
          {mappedListings.length > 0 ? (
            <Map listings={mappedListings} />
          ) : (
            <p>
              Map locations will appear when accommodation
              coordinates have been added.
            </p>
          )}
        </>
      )}
    </main>
  );
}