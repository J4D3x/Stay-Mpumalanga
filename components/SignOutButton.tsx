'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignOut() {
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) throw signOutError;

      router.replace('/login');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to sign out.'
      );
      setLoading(false);
    }
  }

  return (
    <div className="signOutWrapper">
      <button
        type="button"
        className="signOutButton"
        onClick={handleSignOut}
        disabled={loading}
      >
        <LogOut size={17} />
        {loading ? 'Signing out...' : 'Sign out'}
      </button>

      {error && <p className="signOutError" role="alert">{error}</p>}
    </div>
  );
}