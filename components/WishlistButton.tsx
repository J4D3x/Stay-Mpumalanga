
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function WishlistButton({
  accommodationId,
}: {
  accommodationId: string;
}) {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [isStudent, setIsStudent] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function loadWishlist() {
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

      if (profile?.role !== 'student') return;

      setIsStudent(true);

      const { data: saved } = await supabase
        .from('wishlists')
        .select('id')
        .eq('student_id', user.id)
        .eq('accommodation_id', accommodationId)
        .maybeSingle();

      if (active) setIsSaved(!!saved);
    }

    loadWishlist();

    return () => {
      active = false;
    };
  }, [accommodationId]);

  async function toggleWishlist() {
    if (loading) return;

    if (!userId) {
      router.push('/login');
      return;
    }

    if (!isStudent) {
      setMessage('Only student accounts can save accommodation.');
      return;
    }

    setLoading(true);
    setMessage('');

    const supabase = createClient();

    if (isSaved) {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('student_id', userId)
        .eq('accommodation_id', accommodationId);

      if (error) {
        setMessage('Unable to remove this listing. Please try again.');
      } else {
        setIsSaved(false);
      }
    } else {
      const { error } = await supabase
        .from('wishlists')
        .insert({
          student_id: userId,
          accommodation_id: accommodationId,
        });

      if (error) {
        setMessage('Unable to save this listing. Please try again.');
      } else {
        setIsSaved(true);
      }
    }

    setLoading(false);
  }

  return (
    <div className="detailWishlist">
      <button
        type="button"
        className={`detailWishlistButton ${isSaved ? 'saved' : ''}`}
        onClick={toggleWishlist}
        disabled={loading}
        aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart
          size={19}
          fill={isSaved ? 'currentColor' : 'none'}
        />

        <span>
          {loading
            ? 'Please wait...'
            : isSaved
              ? 'Saved to wishlist'
              : 'Save to wishlist'}
        </span>
      </button>

      {message && (
        <p className="wishlistNotice" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
