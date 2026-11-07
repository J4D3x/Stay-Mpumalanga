
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Building2,
  MapPin,
  Trash2,
  Loader2,
  RefreshCw,
  Home,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SignOutButton } from '@/components/SignOutButton';

type Property = {
  id: string;
  name: string;
  location: string;
  price: number;
  status: string;
  image_url: string | null;
  created_at: string;
};

export default function ManagePropertiesPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadProperties = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace('/login');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error('Could not verify your account.');
      }

      if (profile?.role !== 'provider') {
        router.replace('/dashboard');
        return;
      }

      const { data, error: listingError } = await supabase
        .from('accommodations')
        .select('id, name, location, price, status, image_url, created_at')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      if (listingError) {
        throw new Error(listingError.message);
      }

      setProperties((data ?? []) as Property[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load your properties.'
      );
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  async function deleteProperty(property: Property) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${property.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(property.id);
    setError('');

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      const { error: deleteError, count } = await supabase
        .from('accommodations')
        .delete({ count: 'exact' })
        .eq('id', property.id)
        .eq('provider_id', user.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      if (count === 0) {
        throw new Error(
          'The property was not deleted. Check your Supabase delete policy.'
        );
      }

      setProperties((current) =>
        current.filter((item) => item.id !== property.id)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete this property.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  function statusLabel(status: string) {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Awaiting review';
      case 'rejected':
        return 'Rejected';
      case 'draft':
        return 'Draft';
      case 'archived':
        return 'Archived';
      default:
        return status;
    }
  }

  return (
    <main className="managePropertiesPage">
      <div className="managePropertiesContainer">

        <header className="managePropertiesHeader">
          <div>
            <span className="manageEyebrow">PROVIDER PORTAL</span>
            <h1>Manage properties</h1>
            <p>
              Add new accommodation, view your existing properties
              or remove listings you no longer offer.
            </p>
          </div>

          <div className="manageHeaderActions">
            <Link href="/provider/new" className="manageAddButton">
              <Plus size={19} />
              Add property
            </Link>
            <SignOutButton />
          </div>
        </header>

        <section className="managePropertiesSummary">
          <div className="manageSummaryIcon">
            <Building2 size={23} />
          </div>
          <div>
            <span>Your properties</span>
            <strong>{loading ? '—' : properties.length}</strong>
          </div>
        </section>

        {error && (
          <div className="manageError">
            {error}
          </div>
        )}

        <div className="managePropertiesSectionHeader">
          <div>
            <h2>Your listings</h2>
            <p>Properties submitted through your provider account.</p>
          </div>

          <button
            type="button"
            className="manageRefreshButton"
            onClick={loadProperties}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="manageLoading">
            <Loader2 size={27} className="manageSpin" />
            <p>Loading your properties...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="manageEmptyState">
            <div className="manageEmptyIcon">
              <Home size={34} />
            </div>
            <h2>No properties yet</h2>
            <p>
              You haven't added any accommodation listings.
              Add your first property to start reaching students.
            </p>
            <Link href="/provider/new" className="manageAddButton">
              <Plus size={18} />
              Add your first property
            </Link>
          </div>
        ) : (
          <div className="managePropertiesList">
            {properties.map((property) => (
              <article className="managePropertyCard" key={property.id}>
                <div className="managePropertyImage">
                  {property.image_url ? (
                    <img
                      src={property.image_url}
                      alt={property.name}
                    />
                  ) : (
                    <div className="manageNoImage">
                      <Building2 size={30} />
                      <span>No photo</span>
                    </div>
                  )}
                </div>

                <div className="managePropertyInfo">
                  <div className="managePropertyTopline">
                    <span
                      className={`manageStatus status-${property.status}`}
                    >
                      {statusLabel(property.status)}
                    </span>
                  </div>

                  <h3>{property.name}</h3>

                  <p className="managePropertyLocation">
                    <MapPin size={15} />
                    {property.location}
                  </p>

                  <strong className="managePropertyPrice">
                    R{Number(property.price).toLocaleString('en-ZA')}
                    <small> / month</small>
                  </strong>
                </div>

                <div className="managePropertyActions">
                  <button
                    type="button"
                    className="manageDeleteButton"
                    onClick={() => deleteProperty(property)}
                    disabled={deletingId === property.id}
                  >
                    {deletingId === property.id ? (
                      <Loader2 size={17} className="manageSpin" />
                    ) : (
                      <Trash2 size={17} />
                    )}
                    {deletingId === property.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="managePropertiesFooter">
          <Link href="/provider/dashboard">
            Return to provider dashboard
          </Link>
        </div>

      </div>
    </main>
  );
}
