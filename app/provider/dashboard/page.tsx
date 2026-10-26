
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BedDouble,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  GraduationCap,
  MapPin,
  Plus,
  RefreshCw,
  Users,
  Wallet,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SignOutButton } from '@/components/SignOutButton';

type Listing = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  institution: string | null;
  address: string | null;
  price: number | string | null;
  nsfas: boolean | null;
  room_type: string | null;
  available_rooms: number | null;
  amenities: string[] | string | null;
  image_url: string | null;
};

type Application = {
  id: string;
  accommodation_id: string;
  student_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  institution: string | null;
  student_number: string | null;
  study_year: string | null;
  move_in_date: string | null;
  duration_months: number | null;
  status: string;
  message: string | null;
  created_at: string;
};

const statuses = [
  'submitted',
  'reviewing',
  'approved',
  'declined',
  'withdrawn',
] as const;

function formatDate(value: string | null) {
  if (!value) return 'Not specified';

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) return 'Not specified';

  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatPrice(value: number | string | null) {
  if (value === null || value === '') return 'Price not specified';

  const amount = Number(value);

  if (!Number.isFinite(amount)) return 'Price not specified';

  const formatted = amount
    .toFixed(2)
    .replace(/\.00$/, '')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return `R${formatted}/month`;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    submitted: 'Submitted',
    reviewing: 'Under review',
    approved: 'Approved',
    declined: 'Declined',
    withdrawn: 'Withdrawn',
  };

  return labels[status] ?? status;
}

function getAmenities(value: Listing['amenities']): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed: unknown = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.map(String).filter(Boolean);
      }
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [value.trim()];
  }

  return [];
}

export default function ProviderDashboard() {
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [providerName, setProviderName] = useState('Provider');
  const [isProvider, setIsProvider] = useState(true);

  const loadDashboard = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      setError('');
      setNotice('');

      try {
        const supabase = createClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          router.replace('/login?next=%2Fprovider%2Fdashboard');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        setProviderName(
          profile?.full_name ||
            user.user_metadata?.full_name ||
            user.email?.split('@')[0] ||
            'Provider'
        );

        if (profile?.role !== 'provider') {
          setIsProvider(false);
          setListings([]);
          setApplications([]);
          return;
        }

        setIsProvider(true);

        const { data: listingData, error: listingError } = await supabase
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
            image_url
          `)
          .eq('provider_id', user.id)
          .order('name', { ascending: true });

        if (listingError) throw listingError;

        const ownListings = (listingData ?? []) as unknown as Listing[];
        setListings(ownListings);

        if (ownListings.length === 0) {
          setApplications([]);
          return;
        }

        const listingIds = ownListings.map((listing) => listing.id);

        const { data: applicationData, error: applicationError } =
          await supabase
            .from('applications')
            .select(`
              id,
              accommodation_id,
              student_id,
              full_name,
              email,
              phone,
              institution,
              student_number,
              study_year,
              move_in_date,
              duration_months,
              status,
              message,
              created_at
            `)
            .in('accommodation_id', listingIds)
            .order('created_at', { ascending: false });

        if (applicationError) throw applicationError;

        setApplications((applicationData ?? []) as Application[]);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load the provider dashboard.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router]
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function updateStatus(
    application: Application,
    newStatus: string
  ) {
    if (!statuses.includes(newStatus as (typeof statuses)[number])) {
      return;
    }

    if (application.status === newStatus) return;

    setUpdatingId(application.id);
    setError('');
    setNotice('');

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error('Please sign in again.');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile?.role !== 'provider') {
        throw new Error('Only provider accounts can update applications.');
      }

      const { data: updatedRows, error: updateError } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', application.id)
        .eq('accommodation_id', application.accommodation_id)
        .select('id, status');

      if (updateError) throw updateError;

      if (!updatedRows || updatedRows.length === 0) {
        throw new Error(
          'The status was not changed. Check your provider permissions.'
        );
      }

      setApplications((current) =>
        current.map((item) =>
          item.id === application.id
            ? { ...item, status: newStatus }
            : item
        )
      );

      setNotice(`Application status changed to ${statusLabel(newStatus)}.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update the application.'
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const awaitingReview = applications.filter(
    (app) => app.status === 'submitted' || app.status === 'reviewing'
  ).length;

  const approved = applications.filter(
    (app) => app.status === 'approved'
  ).length;

  const visibleApplications =
    filter === 'all'
      ? applications
      : applications.filter((app) => app.status === filter);

  const getListing = (id: string) =>
    listings.find((listing) => listing.id === id);

  return (
    <main className="providerDashboard">
      <section className="providerWelcome">
        <div className="providerWelcomeText">
          <span className="providerEyebrow">RESLINK / PROVIDER PORTAL</span>
          <h1>Welcome back, {providerName}</h1>
          <p>
            Manage your accommodation properties, monitor student interest
            and keep track of applications from one place.
          </p>
        </div>

        <div className="providerWelcomeActions">
          <Link href="/provider" className="providerSecondaryButton">
            Manage listings <ArrowRight size={16} />
          </Link>
          <SignOutButton />
        </div>
      </section>

      {error && (
        <div className="providerFeedback providerFeedbackError" role="alert">
          <strong>Something went wrong</strong>
          <p>{error}</p>
          <button type="button" onClick={() => void loadDashboard(true)}>
            Try again
          </button>
        </div>
      )}

      {notice && !error && (
        <p className="providerFeedback providerFeedbackSuccess" role="status">
          {notice}
        </p>
      )}

      {!loading && !isProvider && (
        <div className="providerEmpty">
          <h3>Provider account required</h3>
          <p>
            This dashboard is only available to accounts registered as
            accommodation providers.
          </p>
          <Link href="/dashboard" className="providerSecondaryButton">
            Go to student dashboard
          </Link>
        </div>
      )}

      {(loading || isProvider) && (
        <>
          <section className="providerStats" aria-label="Dashboard overview">
            <article>
              <span className="providerStatIcon">
                <Building2 size={21} />
              </span>
              <span className="providerStatLabel">Your listings</span>
              <strong>{loading ? '—' : listings.length}</strong>
              <small>Properties linked to your account</small>
            </article>

            <article>
              <span className="providerStatIcon">
                <Users size={21} />
              </span>
              <span className="providerStatLabel">Total applications</span>
              <strong>{loading ? '—' : applications.length}</strong>
              <small>Across all your properties</small>
            </article>

            <article>
              <span className="providerStatIcon">
                <Clock3 size={21} />
              </span>
              <span className="providerStatLabel">Awaiting review</span>
              <strong>{loading ? '—' : awaitingReview}</strong>
              <small>Submitted or under review</small>
            </article>

            <article>
              <span className="providerStatIcon">
                <CheckCircle2 size={21} />
              </span>
              <span className="providerStatLabel">Approved</span>
              <strong>{loading ? '—' : approved}</strong>
              <small>Approved applications</small>
            </article>
          </section>

          <section className="providerListingsSection">
            <div className="providerSectionHeading">
              <div>
                <span className="providerEyebrow">YOUR PROPERTIES</span>
                <h2>Accommodation listings</h2>
                <p>
                  Review your properties, room availability and monthly
                  prices.
                </p>
              </div>

              <Link href="/provider" className="providerPrimaryButton">
                <Plus size={17} />
                Manage properties
              </Link>
            </div>

            {loading && (
              <div className="providerEmpty">Loading your properties...</div>
            )}

            {!loading && isProvider && listings.length === 0 && (
              <div className="providerEmpty">
                <Building2 size={32} />
                <h3>No accommodation listings yet</h3>
                <p>
                  Your properties will appear here after they have been
                  linked to your provider account.
                </p>
                <Link href="/provider" className="providerPrimaryButton">
                  Open listing management
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}

            {!loading && listings.length > 0 && (
              <div className="providerListingGrid">
                {listings.map((listing) => {
                  const listingApplications = applications.filter(
                    (app) => app.accommodation_id === listing.id
                  );

                  const amenities = getAmenities(listing.amenities);

                  return (
                    <article className="providerListingCard" key={listing.id}>
                      <Link
                        href={`/listing/${listing.id}`}
                        className="providerListingImageLink"
                        aria-label={`View ${listing.name}`}
                      >
                        {listing.image_url ? (
                          <img
                            className="providerListingImage"
                            src={listing.image_url}
                            alt={listing.name}
                          />
                        ) : (
                          <div className="providerListingPlaceholder">
                            <Building2 size={34} />
                            <span>No property image</span>
                          </div>
                        )}
                        <span className="providerImageOverlay">
                          View listing <ExternalLink size={14} />
                        </span>
                      </Link>

                      <div className="providerListingInfo">
                        <div className="providerListingTitleRow">
                          <div>
                            <span className="providerListingKicker">
                              ACCOMMODATION
                            </span>
                            <h3>{listing.name}</h3>
                          </div>
                          <span className="providerApplicationCount">
                            <Users size={14} />
                            {listingApplications.length}
                          </span>
                        </div>

                        <p className="providerListingLocation">
                          <MapPin size={15} />
                          {listing.location || 'Location not specified'}
                        </p>

                        {listing.institution && (
                          <p className="providerListingMeta">
                            <GraduationCap size={16} />
                            {listing.institution}
                          </p>
                        )}

                        {listing.address && (
                          <p className="providerListingAddress">
                            {listing.address}
                          </p>
                        )}

                        <div className="providerListingPrice">
                          <span>Monthly rental</span>
                          <strong>{formatPrice(listing.price)}</strong>
                        </div>

                        <div className="providerListingFacts">
                          <div>
                            <BedDouble size={17} />
                            <span>{listing.room_type || 'Room type unspecified'}</span>
                          </div>
                          <div>
                            <Building2 size={17} />
                            <span>
                              {listing.available_rooms == null
                                ? 'Rooms unspecified'
                                : `${listing.available_rooms} room${listing.available_rooms === 1 ? '' : 's'} available`}
                            </span>
                          </div>
                          <div>
                            <Wallet size={17} />
                            <span>
                              {listing.nsfas === true
                                ? 'NSFAS supported'
                                : listing.nsfas === false
                                  ? 'Not NSFAS supported'
                                  : 'NSFAS not specified'}
                            </span>
                          </div>
                        </div>

                        {listing.description && (
                          <p className="providerListingDescription">
                            {listing.description}
                          </p>
                        )}

                        {amenities.length > 0 && (
                          <div className="providerAmenities">
                            <span className="providerAmenitiesTitle">
                              Amenities
                            </span>
                            <div>
                              {amenities.slice(0, 5).map((amenity, index) => (
                                <span key={`${amenity}-${index}`}>
                                  {amenity}
                                </span>
                              ))}
                              {amenities.length > 5 && (
                                <span>+{amenities.length - 5} more</span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="providerListingFooter">
                          <span>
                            <FileText size={15} />
                            {listingApplications.length}{' '}
                            {listingApplications.length === 1
                              ? 'application'
                              : 'applications'}
                          </span>
                          <Link href={`/listing/${listing.id}`}>
                            View property <ArrowRight size={15} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="providerApplicationsSection">
            <div className="providerSectionHeading providerApplicationsHeading">
              <div>
                <span className="providerEyebrow">STUDENT ACTIVITY</span>
                <h2>Accommodation applications</h2>
                <p>
                  Review applicant details and update application statuses.
                </p>
              </div>

              <button
                type="button"
                className="providerRefreshButton"
                onClick={() => void loadDashboard(true)}
                disabled={loading || refreshing}
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? 'providerSpinning' : ''}
                />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {!loading && isProvider && applications.length === 0 && (
              <div className="providerEmpty">
                <FileText size={32} />
                <h3>No applications yet</h3>
                <p>
                  Applications will appear here when students apply to one
                  of your properties.
                </p>
              </div>
            )}

            {!loading && isProvider && applications.length > 0 && (
              <>
                <div className="providerFilters">
                  <label htmlFor="applicationStatusFilter">
                    Filter applications
                  </label>
                  <select
                    id="applicationStatusFilter"
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                  >
                    <option value="all">All applications</option>
                    <option value="submitted">Submitted</option>
                    <option value="reviewing">Under review</option>
                    <option value="approved">Approved</option>
                    <option value="declined">Declined</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                  <span>
                    Showing {visibleApplications.length} of{' '}
                    {applications.length}
                  </span>
                </div>

                {visibleApplications.length === 0 ? (
                  <div className="providerEmpty">
                    No applications match this status.
                  </div>
                ) : (
                  <div className="providerApplicationList">
                    {visibleApplications.map((application) => {
                      const listing = getListing(
                        application.accommodation_id
                      );

                      return (
                        <article
                          className="providerApplicationCard"
                          key={application.id}
                        >
                          <div className="providerApplicationTop">
                            <div>
                              <span className="providerApplicationReference">
                                APPLICATION{' '}
                                {application.id.slice(0, 8).toUpperCase()}
                              </span>
                              <h3>
                                {application.full_name || 'Student applicant'}
                              </h3>
                              <p className="providerAppliedDate">
                                Submitted {formatDate(application.created_at)}
                              </p>
                            </div>

                            <span
                              className={`providerStatus providerStatus-${application.status}`}
                            >
                              {statusLabel(application.status)}
                            </span>
                          </div>

                          <div className="providerApplicationListing">
                            <div>
                              <strong>
                                {listing?.name || 'Accommodation listing'}
                              </strong>
                              <span>
                                {listing?.location || 'Location not specified'}
                              </span>
                            </div>
                            <Link
                              href={`/listing/${application.accommodation_id}`}
                            >
                              View listing <ArrowRight size={14} />
                            </Link>
                          </div>

                          <div className="providerApplicantDetails">
                            <div>
                              <span>Email</span>
                              <strong>{application.email || 'Not provided'}</strong>
                            </div>
                            <div>
                              <span>Phone</span>
                              <strong>{application.phone || 'Not provided'}</strong>
                            </div>
                            <div>
                              <span>Institution</span>
                              <strong>
                                {application.institution || 'Not provided'}
                              </strong>
                            </div>
                            <div>
                              <span>Student number</span>
                              <strong>
                                {application.student_number || 'Not provided'}
                              </strong>
                            </div>
                            <div>
                              <span>Year of study</span>
                              <strong>
                                {application.study_year || 'Not provided'}
                              </strong>
                            </div>
                            <div>
                              <span>Preferred move-in</span>
                              <strong>
                                {formatDate(application.move_in_date)}
                              </strong>
                            </div>
                            <div>
                              <span>Length of stay</span>
                              <strong>
                                {application.duration_months
                                  ? `${application.duration_months} months`
                                  : 'Not specified'}
                              </strong>
                            </div>
                          </div>

                          {application.message && (
                            <details className="providerApplicantMessage">
                              <summary>Read student's message</summary>
                              <p>{application.message}</p>
                            </details>
                          )}

                          <div className="providerApplicationActions">
                            <label htmlFor={`status-${application.id}`}>
                              Update status
                            </label>
                            <select
                              id={`status-${application.id}`}
                              value={application.status}
                              disabled={updatingId === application.id}
                              onChange={(event) =>
                                void updateStatus(
                                  application,
                                  event.target.value
                                )
                              }
                            >
                              {statuses.map((status) => (
                                <option value={status} key={status}>
                                  {statusLabel(status)}
                                </option>
                              ))}
                            </select>

                            {updatingId === application.id && (
                              <span>Saving...</span>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}
    </main>
  );
}
