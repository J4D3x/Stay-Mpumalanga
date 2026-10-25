'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type UserRole = 'student' | 'provider' | 'admin';

export default function Dashboard() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      const supabase = createClient();

      const { data, error: authError } =
        await supabase.auth.getUser();

      if (!active) return;

      if (authError || !data.user) {
        router.replace('/login');
        return;
      }

      setEmail(data.user.email ?? '');

      const { data: profile, error: profileError } =
        await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

      if (!active) return;

      if (profileError) {
        setError('Unable to load your profile. Please try again.');
        setLoading(false);
        return;
      }

      if (!profile) {
        setError(
          'Your profile could not be found. Please contact support.'
        );
        setLoading(false);
        return;
      }

      setRole(profile.role as UserRole);
      setLoading(false);
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setError('Unable to sign out. Please try again.');
      return;
    }

    router.replace('/login');
  }

  if (loading) {
    return (
      <main className="section dashboard">
        <p>Loading your dashboard...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="section dashboard">
        <h1>Dashboard unavailable</h1>
        <p role="alert">{error}</p>
        <Link href="/search">Browse accommodation</Link>
      </main>
    );
  }

  return (
    <main className="section dashboard">
      <div className="sectionHead">
        <div>
          <span className="eyebrow">
            {role === 'student'
              ? 'STUDENT DASHBOARD'
              : role === 'provider'
                ? 'PROVIDER ACCOUNT'
                : 'ADMIN ACCOUNT'}
          </span>

          <h1>Welcome back</h1>
          <p>{email || 'Your account'}</p>
        </div>

        <button
          className="button"
          type="button"
          onClick={handleLogout}
        >
          Sign out
        </button>
      </div>

      {role === 'student' ? (
        <div className="dashGrid">
          <div className="dashCard">
            <h3>Saved accommodation</h3>
            <strong>0</strong>
            <p>Listings you want to revisit.</p>
            <Link href="/search">
              Find accommodation →
            </Link>
          </div>

          <div className="dashCard">
            <h3>Applications</h3>
            <strong>0</strong>
            <p>
              Track your accommodation applications.
            </p>
            <Link href="/search">
              Start an application →
            </Link>
          </div>

          <div className="dashCard">
            <h3>Profile</h3>
            <strong>—</strong>
            <p>
              Complete your student profile later.
            </p>
          </div>
        </div>
      ) : (
        <div className="dashCard">
          <h3>
            {role === 'provider'
              ? 'Accommodation management'
              : 'Administration'}
          </h3>
          <p>
            Your account is recognised as a {role}.
            The relevant dashboard features will be
            connected as we develop them.
          </p>
        </div>
      )}
    </main>
  );
}