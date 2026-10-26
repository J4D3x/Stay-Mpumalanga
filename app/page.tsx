import Link from 'next/link';
import { SplashScreen } from '@/components/SplashScreen';
import { Search, ShieldCheck, MapPinned, FileCheck } from 'lucide-react';
import { ListingCard } from '@/components/ListingCard';
import { createClient } from '@/lib/supabase/server';
import type { Listing } from '@/types';
import { FloatingSearch } from '@/components/FloatingSearch';

export default async function Home() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('accommodations')
    .select(
      'id, name, description, location, institution, price, nsfas, room_type, available_rooms, amenities, image_url, latitude, longitude'
    )
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(3);

  const listings: Listing[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? '',
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
  }));

  return (
    <>
    <SplashScreen />
    <FloatingSearch />
    <main>
        <section className="hero">
          <div className="heroInner">
            <span className="eyebrow">
              STUDENT ACCOMMODATION · MPUMALANGA
            </span>

            <h1>Find a place you’ll be happy to call home.</h1>

            <p>
              Search student residences, compare prices and facilities,
              check NSFAS information and apply online.
            </p>

            <div className="heroSearch">
              <Search />
              <input placeholder="Search eMalahleni, UMP, TUT..." />
              <Link href="/search">Search</Link>
            </div>

            <div className="quick">
              <span>✓ Verified-style listings</span>
              <span>✓ NSFAS information</span>
              <span>✓ Online applications</span>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="sectionHead">
            <div>
              <span className="eyebrow">EXPLORE</span>
              <h2>Popular accommodation</h2>
            </div>

            <Link href="/search">View all →</Link>
          </div>

          {error ? (
            <p>Unable to load accommodation right now. Please try again later.</p>
          ) : listings.length > 0 ? (
            <div className="grid">
              {listings.map((l) => (
                <ListingCard key={l.id} l={l} />
              ))}
            </div>
          ) : (
            <p>No approved accommodation listings are available yet.</p>
          )}
        </section>

        <section className="features">
          <div>
            <ShieldCheck />
            <h3>Compare with confidence</h3>
            <p>
              See pricing, room types, amenities, distance and NSFAS
              information in one place.
            </p>
          </div>

          <div>
            <MapPinned />
            <h3>Search by location</h3>
            <p>
              Use a map-based view to understand where residences sit
              relative to campuses.
            </p>
          </div>

          <div>
            <FileCheck />
            <h3>Apply online</h3>
            <p>
              Submit accommodation applications and track their status
              from your dashboard.
            </p>
          </div>
        </section>

        <section className="providerCTA">
          <div>
            <span className="eyebrow">FOR PROPERTY OWNERS</span>
            <h2>Have student accommodation?</h2>
            <p>
              Reach students who are actively searching for a place to stay.
            </p>
          </div>

          <Link href="/provider" className="button">
            List your property
          </Link>
        </section>
      </main>
  
        </>
  );
}