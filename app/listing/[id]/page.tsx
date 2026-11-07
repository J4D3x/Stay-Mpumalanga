'use'
import Link from 'next/link';
import { WishlistButton } from '@/components/WishlistButton';
import { notFound } from 'next/navigation';
import { MapPin, CheckCircle, ShieldCheck, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ApplicationForm } from '@/components/ApplicationForm';
import { ListingGallery } from '@/components/ListingGallery';

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: l, error } = await supabase
    .from('accommodations')
    .select(
      'id, name, description, location, institution, price, nsfas, room_type, available_rooms, amenities, image_url, images'
    )
    .eq('id', id)
    .eq('status', 'approved')
    .maybeSingle();

  if (error) {
    throw new Error('Unable to load this accommodation.');
  }

  if (!l) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  let applicationStatus: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    role = profile?.role ?? null;

    // Check whether this student has already applied
    if (role === 'student') {
      const { data: application, error: applicationError } =
        await supabase
          .from('applications')
          .select('status')
          .eq('accommodation_id', l.id)
          .eq('student_id', user.id)
          .maybeSingle();

      if (applicationError) {
        throw new Error('Unable to check your application status.');
      }

      applicationStatus = application?.status ?? null;
    }
  }

  const formattedStatus = applicationStatus
    ? applicationStatus.charAt(0).toUpperCase() +
      applicationStatus.slice(1)
    : null;

  return (
    <main>
      <section className="detailHero">
        <ListingGallery
          name={l.name}
          imageUrl={l.image_url}
          images={l.images}
        />

        <div>
          <div className="badges">
            {l.nsfas && <span className="badge green">NSFAS</span>}
            <span className="badge">
              {l.available_rooms} rooms available
            </span>
          </div>

          <h1>{l.name}</h1>

          <p>
            <MapPin size={17} /> {l.location} ·{' '}
            {l.institution || 'Not specified'}
          </p>
          <WishlistButton accommodationId={l.id} />
        </div>
      </section>

      <section className="detailGrid">
        <div>
          <h2>About this residence</h2>
          <p>{l.description || 'No description provided yet.'}</p>

          <h3>Facilities</h3>

          <div className="amenities">
            {(l.amenities ?? []).map((a: string) => (
              <span key={a}>
                <CheckCircle size={16} />
                {a}
              </span>
            ))}
          </div>

          <div className="notice">
            <ShieldCheck />
            <div>
              <strong>Before you apply</strong>
              <p>
                Confirm current pricing, availability, accreditation
                status and application requirements with the provider.
              </p>
            </div>
          </div>
        </div>

        <aside className="applyBox">
          <span>FROM</span>

          <strong>
            R{Number(l.price).toLocaleString()}
            <small>/month</small>
          </strong>

          <p>{l.room_type || 'Room type not specified'}</p>

          {!user ? (
            <Link
              className="button"
              href={`/login?next=${encodeURIComponent(
                `/listing/${l.id}`
              )}`}
            >
              Sign in to apply / enquire
            </Link>
          ) : role === 'student' ? (
            applicationStatus ? (
              <div className="applicationStatus">
                <Clock size={19} />
                <div>
                  <strong>Application status:</strong>
                  <span>{formattedStatus}</span>
                </div>
              </div>
            ) : (
              <a className="button" href="#application">
                Apply for accommodation
              </a>
            )
          ) : (
            <p>
              Student accounts are required to apply for accommodation.
            </p>
          )}
        </aside>
      </section>

      {user && role === 'student' && !applicationStatus && (
        <section className="enquirySection" id="application">
          <ApplicationForm
            accommodationId={l.id}
            accommodationName={l.name}
          />
        </section>
      )}
    </main>
  );
}
