'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  Clock3,
  Building2,
  MapPin,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SignOutButton } from '@/components/SignOutButton';

type Listing = {
  id: string;
  name: string;
  description: string | null;
  location: string;
  institution: string | null;
  address: string | null;
  price: number;
  nsfas: boolean;
  room_type: string | null;
  available_rooms: number | null;
  amenities: string[] | null;
  image_url: string | null;
  images: string[] | null;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';
  created_at: string;
  provider_id: string;
};

type Filter = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminDashboard() {
  const supabase = useMemo(() => createClient(), []);

  const [listings, setListings] = useState<Listing[]>([]);
  const [filter, setFilter] = useState<Filter>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError('');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError('Please sign in with an administrator account.');
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      setIsAdmin(false);
      setError('Access denied. This page is only available to administrators.');
      setLoading(false);
      return;
    }

    setIsAdmin(true);

    const { data, error: listingsError } = await supabase
      .from('accommodations')
      .select(`
        id,
        name,
        description,
        location,
        institution,
        address,
        price,
        nsfas,
        room_type,
        available_rooms,
        amenities,
        image_url,
        images,
        status,
        created_at,
        provider_id
      `)
      .in('status', ['pending', 'approved', 'rejected'])
      .order('created_at', { ascending: false });

    if (listingsError) {
      setError(listingsError.message);
      setListings([]);
    } else {
      setListings((data ?? []) as Listing[]);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const updateStatus = async (
    listingId: string,
    newStatus: 'approved' | 'rejected',
  ) => {
    const action = newStatus === 'approved' ? 'approve' : 'reject';

    if (!window.confirm(`Are you sure you want to ${action} this listing?`)) {
      return;
    }

    setUpdatingId(listingId);
    setError('');
    setMessage('');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError('Your session has expired. Please sign in again.');
      setUpdatingId(null);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      setError('You do not have permission to update listings.');
      setUpdatingId(null);
      return;
    }

    const { error: updateError } = await supabase
      .from('accommodations')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', listingId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setListings((current) =>
        current.map((listing) =>
          listing.id === listingId
            ? { ...listing, status: newStatus }
            : listing,
        ),
      );

      setMessage(
        newStatus === 'approved'
          ? 'Accommodation approved successfully.'
          : 'Accommodation rejected successfully.',
      );
    }

    setUpdatingId(null);
  };

  const filteredListings =
    filter === 'all'
      ? listings
      : listings.filter((listing) => listing.status === filter);

  const pendingCount = listings.filter(
    (listing) => listing.status === 'pending',
  ).length;

  const approvedCount = listings.filter(
    (listing) => listing.status === 'approved',
  ).length;

  const rejectedCount = listings.filter(
    (listing) => listing.status === 'rejected',
  ).length;

  if (loading) {
    return (
      <main className="adminPage">
        <div className="adminLoading">
          <RefreshCw size={24} className="adminSpin" />
          <p>Loading admin dashboard...</p>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="adminPage">
        <div className="adminAccessDenied">
          <ShieldCheck size={42} />
          <h1>Administrator access required</h1>
          <p>{error || 'You do not have permission to view this page.'}</p>
          <Link href="/login" className="adminPrimaryButton">
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="adminPage">
      <header className="adminHeader">
        <Link href="/" className="adminBrand">
          
          <small>ADMIN</small>
        </Link>

        <div className="adminHeaderRight">
          <span className="adminHeaderLabel">
            <ShieldCheck size={17} />
            Administrator
          </span>
          <SignOutButton />
        </div>
      </header>

      <section className="adminContent">
        <div className="adminIntro">
          <div>
            <span className="adminEyebrow">ADMINISTRATION</span>
            <h1>Accommodation approvals</h1>
            <p>
              Review accommodation submissions and decide which listings can
              appear on ResLink.
            </p>
          </div>

          <button
            className="adminRefreshButton"
            onClick={loadListings}
            type="button"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error && <div className="adminAlert adminAlertError">{error}</div>}
        {message && (
          <div className="adminAlert adminAlertSuccess">{message}</div>
        )}

        <section className="adminStats">
          <div className="adminStatCard">
            <span className="adminStatIcon pending">
              <Clock3 size={20} />
            </span>
            <div>
              <p>Awaiting review</p>
              <strong>{pendingCount}</strong>
            </div>
          </div>

          <div className="adminStatCard">
            <span className="adminStatIcon approved">
              <CheckCircle2 size={20} />
            </span>
            <div>
              <p>Approved</p>
              <strong>{approvedCount}</strong>
            </div>
          </div>

          <div className="adminStatCard">
            <span className="adminStatIcon rejected">
              <XCircle size={20} />
            </span>
            <div>
              <p>Rejected</p>
              <strong>{rejectedCount}</strong>
            </div>
          </div>

          <div className="adminStatCard">
            <span className="adminStatIcon total">
              <Building2 size={20} />
            </span>
            <div>
              <p>Total reviewed listings</p>
              <strong>{listings.length}</strong>
            </div>
          </div>
        </section>

        <section className="adminListingsSection">
          <div className="adminListingsHeading">
            <div>
              <h2>Submitted accommodations</h2>
              <p>Review the details before approving a listing.</p>
            </div>

            <div className="adminFilters">
              {(['pending', 'approved', 'rejected', 'all'] as Filter[]).map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    className={filter === item ? 'active' : ''}
                    onClick={() => setFilter(item)}
                  >
                    {item === 'all'
                      ? 'All'
                      : item.charAt(0).toUpperCase() + item.slice(1)}
                  </button>
                ),
              )}
            </div>
          </div>

          {filteredListings.length === 0 ? (
            <div className="adminEmpty">
              <Building2 size={38} />
              <h3>No listings found</h3>
              <p>There are no accommodations in this category.</p>
            </div>
          ) : (
            <div className="adminListingGrid">
              {filteredListings.map((listing) => (
                <article className="adminListingCard" key={listing.id}>
                  <div className="adminListingImage">
                    {listing.image_url ? (
                      <img src={listing.image_url} alt={listing.name} />
                    ) : (
                      <div className="adminNoImage">
                        <Building2 size={34} />
                        <span>No image provided</span>
                      </div>
                    )}

                    <span className={`adminStatus ${listing.status}`}>
                      {listing.status}
                    </span>
                  </div>

                  <div className="adminListingBody">
                    <div className="adminListingTitle">
                      <div>
                        <h3>{listing.name}</h3>
                        <p className="adminLocation">
                          <MapPin size={14} />
                          {listing.location}
                        </p>
                      </div>

                      <strong className="adminPrice">
                        R{Number(listing.price).toLocaleString('en-ZA')}
                        <small>/ month</small>
                      </strong>
                    </div>

                    <p className="adminDescription">
                      {listing.description || 'No description provided.'}
                    </p>

                    <div className="adminDetails">
                      {listing.institution && (
                        <span>
                          <strong>Institution:</strong> {listing.institution}
                        </span>
                      )}
                      {listing.room_type && (
                        <span>
                          <strong>Room type:</strong> {listing.room_type}
                        </span>
                      )}
                      <span>
                        <strong>Available rooms:</strong>{' '}
                        {listing.available_rooms ?? 0}
                      </span>
                      <span>
                        <strong>NSFAS:</strong>{' '}
                        {listing.nsfas ? 'Accepted' : 'Not accepted'}
                      </span>
                      <span>
                        <strong>Submitted:</strong>{' '}
                        {new Date(listing.created_at).toLocaleDateString(
                          'en-ZA',
                        )}
                      </span>
                    </div>

                    {listing.amenities && listing.amenities.length > 0 && (
                      <div className="adminAmenities">
                        {listing.amenities.map((amenity) => (
                          <span key={amenity}>{amenity}</span>
                        ))}
                      </div>
                    )}

                    {listing.images && listing.images.length > 0 && (
                      <p className="adminImageCount">
                        {listing.images.length} gallery image
                        {listing.images.length === 1 ? '' : 's'} uploaded
                      </p>
                    )}

                    <div className="adminCardActions">
                      {listing.status === 'approved' ? (
                        <Link
                          href={`/listing/${listing.id}`}
                          target="_blank"
                          className="adminViewButton"
                        >
                          View public listing <ExternalLink size={15} />
                        </Link>
                      ) : (
                        <span className="adminViewButton">
                          Admin review preview
                        </span>
                      )}

                      {listing.status === 'pending' && (
                        <div className="adminDecisionButtons">
                          <button
                            type="button"
                            className="adminRejectButton"
                            disabled={updatingId === listing.id}
                            onClick={() =>
                              updateStatus(listing.id, 'rejected')
                            }
                          >
                            <XCircle size={16} />
                            Reject
                          </button>

                          <button
                            type="button"
                            className="adminApproveButton"
                            disabled={updatingId === listing.id}
                            onClick={() =>
                              updateStatus(listing.id, 'approved')
                            }
                          >
                            <CheckCircle2 size={16} />
                            {updatingId === listing.id
                              ? 'Updating...'
                              : 'Approve'}
                          </button>
                        </div>
                      )}

                      {listing.status === 'rejected' && (
                        <button
                          type="button"
                          className="adminApproveButton"
                          disabled={updatingId === listing.id}
                          onClick={() => updateStatus(listing.id, 'approved')}
                        >
                          <CheckCircle2 size={16} />
                          Approve listing
                        </button>
                      )}

                      {listing.status === 'approved' && (
                        <button
                          type="button"
                          className="adminRejectButton"
                          disabled={updatingId === listing.id}
                          onClick={() => updateStatus(listing.id, 'rejected')}
                        >
                          <XCircle size={16} />
                          Revoke approval
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}