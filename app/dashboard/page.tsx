
'use client';
import { SignOutButton } from '@/components/SignOutButton';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Accommodation = {
  id: string;
  name: string;
  location: string | null;
  institution: string | null;
  price: number | string | null;
  image_url: string | null;
};

type Application = {
  id: string;
  accommodation_id: string;
  student_id: string;
  status: string;
  message: string | null;
  created_at: string;
  move_in_date: string | null;
  duration_months: number | null;
  accommodations: Accommodation | Accommodation[] | null;
};

const statusDetails: Record<
  string,
  { label: string; className: string }
> = {
  submitted: {
    label: 'Submitted',
    className: 'statusSubmitted',
  },
  reviewing: {
    label: 'Under review',
    className: 'statusReviewing',
  },
  approved: {
    label: 'Approved',
    className: 'statusApproved',
  },
  declined: {
    label: 'Declined',
    className: 'statusDeclined',
  },
  withdrawn: {
    label: 'Withdrawn',
    className: 'statusWithdrawn',
  },
};

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
  if (value === null || value === '') return 'Price unavailable';

  const amount = Number(value);

  if (!Number.isFinite(amount)) return 'Price unavailable';

  return `R${amount.toLocaleString('en-ZA')}/month`;
}

export default function Dashboard() {
  const router = useRouter();

  const [applications, setApplications] = useState<Application[]>([]);
  const [studentName, setStudentName] = useState('Student');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isStudent, setIsStudent] = useState(true);

  async function loadApplications(showRefresh = false) {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        router.replace('/login?next=%2Fdashboard');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      setStudentName(
        profile?.full_name ||
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'Student'
      );

      if (profile?.role !== 'student') {
        setIsStudent(false);
        setApplications([]);
        return;
      }

      setIsStudent(true);

      const { data, error: applicationError } = await supabase
        .from('applications')
        .select(`
          id,
          accommodation_id,
          student_id,
          status,
          message,
          created_at,
          move_in_date,
          duration_months,
          accommodations (
            id,
            name,
            location,
            institution,
            price,
            image_url
          )
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (applicationError) throw applicationError;

      setApplications((data ?? []) as unknown as Application[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load your applications.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadApplications();
  }, []);

  const submittedCount = applications.filter(
    (app) => app.status === 'submitted'
  ).length;

  const reviewingCount = applications.filter(
    (app) => app.status === 'reviewing'
  ).length;

  const approvedCount = applications.filter(
    (app) => app.status === 'approved'
  ).length;

  const declinedCount = applications.filter(
    (app) => app.status === 'declined'
  ).length;

  return (
    <main className="studentDashboard">
      <section className="dashboardWelcome">
        <div>
          <span className="dashboardEyebrow">STUDENT PORTAL</span>
          <h1>Welcome back, {studentName}</h1>
          <p>
            Keep track of your accommodation applications
            and stay up to date with their progress.
          </p>
          <SignOutButton />
        </div>

        <Link href="/search" className="dashboardBrowseButton">
          Find accommodation
          <ArrowRight size={17} />
        </Link>
      </section>

      <section className="applicationStats">
        <article className="applicationStat">
          <div className="statIcon">
            <FileText size={20} />
          </div>
          <span>Total applications</span>
          <strong>{loading ? '—' : applications.length}</strong>
          <small>All your applications</small>
        </article>

        <article className="applicationStat">
          <div className="statIcon">
            <Clock3 size={20} />
          </div>
          <span>Awaiting review</span>
          <strong>
            {loading ? '—' : submittedCount + reviewingCount}
          </strong>
          <small>Submitted or being reviewed</small>
        </article>

        <article className="applicationStat">
          <div className="statIcon">
            <CheckCircle2 size={20} />
          </div>
          <span>Approved</span>
          <strong>{loading ? '—' : approvedCount}</strong>
          <small>Applications approved</small>
        </article>

        <article className="applicationStat">
          <div className="statIcon">
            <XCircle size={20} />
          </div>
          <span>Declined</span>
          <strong>{loading ? '—' : declinedCount}</strong>
          <small>Applications declined</small>
        </article>
      </section>

      <section className="dashboardApplications">
        <div className="applicationsHeading">
          <div>
            <span className="dashboardEyebrow">YOUR ACTIVITY</span>
            <h2>My applications</h2>
            <p>View your application details and current status.</p>
          </div>

          <button
            type="button"
            className="dashboardRefreshButton"
            onClick={() => void loadApplications(true)}
            disabled={loading || refreshing}
            aria-label="Refresh applications"
          >
            <RefreshCw
              size={16}
              className={refreshing ? 'refreshSpinning' : ''}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="dashboardMessage dashboardError" role="alert">
            <strong>Unable to load applications</strong>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void loadApplications(true)}
            >
              Try again
            </button>
          </div>
        )}

        {!error && loading && (
          <div className="dashboardMessage">
            Loading your applications...
          </div>
        )}

        {!loading && !error && !isStudent && (
          <div className="dashboardEmpty">
            <FileText size={36} />
            <h3>This dashboard is for students</h3>
            <p>
              Sign in with a student account to manage your
              accommodation applications.
            </p>
            <Link href="/search" className="dashboardBrowseButton">
              Browse accommodation
              <ArrowRight size={17} />
            </Link>
          </div>
        )}

        {!loading &&
          !error &&
          isStudent &&
          applications.length === 0 && (
            <div className="dashboardEmpty">
              <div className="emptyIcon">
                <FileText size={30} />
              </div>
              <h3>No applications yet</h3>
              <p>
                When you apply for accommodation, your applications
                will appear here so you can follow their progress.
              </p>
              <Link href="/search" className="dashboardBrowseButton">
                Explore accommodation
                <ArrowRight size={17} />
              </Link>
            </div>
          )}

        {!loading && !error && isStudent && applications.length > 0 && (
          <div className="applicationList">
            {applications.map((application) => {
              const accommodation = Array.isArray(
                application.accommodations
              )
                ? application.accommodations[0]
                : application.accommodations;

              const status =
                statusDetails[application.status] ?? {
                  label: application.status,
                  className: 'statusUnknown',
                };

              return (
                <article
                  className="applicationCard"
                  key={application.id}
                >
                  <div className="applicationCardImage">
                    {accommodation?.image_url ? (
                      <img
                        src={accommodation.image_url}
                        alt={accommodation.name}
                      />
                    ) : (
                      <div className="applicationImagePlaceholder">
                        <MapPin size={30} />
                        <span>ResLink accommodation</span>
                      </div>
                    )}
                  </div>

                  <div className="applicationCardContent">
                    <div className="applicationCardTop">
                      <span className="applicationReference">
                        APPLICATION
                      </span>
                      <span className={`applicationStatus ${status.className}`}>
                        {status.label}
                      </span>
                    </div>

                    <h3>
                      {accommodation?.name ?? 'Accommodation listing'}
                    </h3>

                    <p className="applicationLocation">
                      <MapPin size={15} />
                      {accommodation?.location ?? 'Location not specified'}
                    </p>

                    {accommodation?.institution && (
                      <p className="applicationInstitution">
                        {accommodation.institution}
                      </p>
                    )}

                    <div className="applicationDetails">
                      <div>
                        <span>Monthly price</span>
                        <strong>
                          {formatPrice(accommodation?.price ?? null)}
                        </strong>
                      </div>

                      <div>
                        <span>Applied on</span>
                        <strong>
                          {formatDate(application.created_at)}
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
                      <details className="applicationMessageDetails">
                        <summary>View your submitted message</summary>
                        <p>{application.message}</p>
                      </details>
                    )}

                    <div className="applicationCardFooter">
                      <span className="applicationId">
                        Reference: {application.id.slice(0, 8).toUpperCase()}
                      </span>

                      <Link
                        href={`/listing/${application.accommodation_id}`}
                        className="applicationViewLink"
                      >
                        View listing
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="dashboardHelp">
        <CalendarDays size={22} />
        <div>
          <h3>Keep your accommodation plans moving</h3>
          <p>
            Check your application status regularly. An application
            marked as submitted has been received; the provider may
            still need to review it.
          </p>
        </div>
        <Link href="/search">Find more accommodation</Link>
      </section>
    </main>
  );
}
