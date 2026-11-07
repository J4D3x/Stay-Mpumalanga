
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Listing } from '@/types';

export function ListingCard({ l }: { l: Listing }) {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [isStudent, setIsStudent] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function checkWishlist() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active || !user) return;

      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (!active) return;

      const student = profile?.role === 'student';
      setIsStudent(student);

      if (!student) return;

      const { data: wishlist } = await supabase
        .from('wishlists')
        .select('id')
        .eq('student_id', user.id)
        .eq('accommodation_id', l.id)
        .maybeSingle();

      if (active) {
        setIsSaved(!!wishlist);
      }
    }

    checkWishlist();

    return () => {
      active = false;
    };
  }, [l.id]);

  async function toggleWishlist() {
    if (loading) return;

    if (!userId) {
      router.push('/login');
      return;
    }

    if (!isStudent) {
      setNotice('Only student accounts can save accommodation.');
      return;
    }

    setLoading(true);
    setNotice('');

    const supabase = createClient();

    if (isSaved) {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('student_id', userId)
        .eq('accommodation_id', l.id);

      if (error) {
        setNotice('Could not remove this listing. Please try again.');
      } else {
        setIsSaved(false);
      }
    } else {
      const { error } = await supabase
        .from('wishlists')
        .insert({
          student_id: userId,
          accommodation_id: l.id,
        });

      if (error) {
        setNotice('Could not save this listing. Please try again.');
      } else {
        setIsSaved(true);
      }
    }

    setLoading(false);
  }

  return (
    <article className="card listingCard">
      <button
        type="button"
        className={`wishlistToggle ${isSaved ? 'saved' : ''}`}
        onClick={toggleWishlist}
        disabled={loading}
        aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
        title={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart
          size={20}
          fill={isSaved ? 'currentColor' : 'none'}
        />
      </button>

      <img src={l.imageUrl} alt={l.name} />

      <div className="cardBody">
        <div className="badges">
          {l.nsfas && (
            <span className="badge green">NSFAS</span>
          )}

          {l.distanceKm !== null && (
            <span className="badge">
              {l.distanceKm} km away
            </span>
          )}
        </div>

        <h3>{l.name}</h3>
        <p>{l.location} · {l.institution}</p>

        <div className="cardBottom">
          <strong>
            R{l.price.toLocaleString()}
            <small>/month</small>
          </strong>

          <Link href={`/listing/${l.id}`}>View</Link>
        </div>

        {notice && (
          <p className="wishlistNotice" role="status">
            {notice}
          </p>
        )}
      </div>
    </article>
  );
}
