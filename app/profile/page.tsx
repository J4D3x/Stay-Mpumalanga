'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Bookmark,
    Check,
    ChevronRight,
    Loader2,
    MapPin,
    Pencil,
    Save,
    Trash2,
    UserRound,
    X,
    Mail,
    Phone,
    ShieldCheck,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

type WishlistListing = {
    id: string;
    name: string;
    location: string;
    institution: string;
    price: number;
    room_type: string | null;
    image_url: string | null;
    nsfas: boolean;
};

type WishlistRow = {
    id: string;
    accommodation_id: string;
    accommodation: WishlistListing | WishlistListing[] | null;
};

const AVATARS = [
    '/avatars/Avatar (1).jpeg',
    '/avatars/Avatar (2).jpeg',
    '/avatars/Avatar (3).jpeg',
    '/avatars/Avatar (4).jpeg',
];

export default function ProfilePage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);

    const [userId, setUserId] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(AVATARS[0]);

    const [wishlist, setWishlist] = useState<WishlistListing[]>([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadProfile() {
            const supabase = createClient();

            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                router.replace('/login');
                return;
            }

            setUserId(user.id);
            setEmail(user.email ?? '');

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('full_name, avatar_url, role, phone')
                .eq('id', user.id)
                .maybeSingle();

            if (profileError) {
                setError('Could not load your profile. Please try again.');
                setLoading(false);
                return;
            }

            setFullName(
                profile?.full_name ||
                user.user_metadata?.full_name ||
                ''
            );

            setPhone(profile?.phone ?? '');
            setRole(profile?.role ?? null);

            setAvatarUrl(
                profile?.avatar_url &&
                AVATARS.includes(profile.avatar_url)
                    ? profile.avatar_url
                    : AVATARS[0]
            );

            if (profile?.role === 'student') {
                const { data: savedListings, error: wishlistError } =
                    await supabase
                        .from('wishlists')
                        .select(`
                            id,
                            accommodation_id,
                            accommodation:accommodations (
                                id,
                                name,
                                location,
                                institution,
                                price,
                                room_type,
                                image_url,
                                nsfas
                            )
                        `)
                        .eq('student_id', user.id)
                        .order('created_at', { ascending: false });

                if (wishlistError) {
                    console.error('Wishlist error:', wishlistError.message);
                } else {
                    const rows = (savedListings ?? []) as unknown as WishlistRow[];

                    const listings = rows
                        .map((row) => {
                            return Array.isArray(row.accommodation)
                                ? row.accommodation[0]
                                : row.accommodation;
                        })
                        .filter(
                            (listing): listing is WishlistListing =>
                                listing !== null && listing !== undefined
                        );

                    setWishlist(listings);
                }
            }

            setLoading(false);
        }

        loadProfile();
    }, [router]);

    async function saveProfile(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!userId) return;

        const trimmedName = fullName.trim();
        const trimmedPhone = phone.trim();

        if (trimmedName.length < 2) {
            setError('Please enter a valid full name.');
            return;
        }

        setSaving(true);
        setError('');
        setMessage('');

        const supabase = createClient();

        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                full_name: trimmedName,
                phone: trimmedPhone || null,
                avatar_url: avatarUrl,
            })
            .eq('id', userId);

        if (updateError) {
            setError(updateError.message);
            setSaving(false);
            return;
        }

        setFullName(trimmedName);
        setPhone(trimmedPhone);
        setEditing(false);
        setMessage('Your profile has been updated successfully.');

        // Notify the navigation bar that the profile has changed.
        window.dispatchEvent(new Event('profile-updated'));

        setSaving(false);
        router.refresh();
    }

    function cancelEditing() {
        setEditing(false);
        setError('');
        setMessage('');
        // Reload saved values when cancelling.
        router.refresh();
        window.location.reload();
    }

    async function removeFromWishlist(accommodationId: string) {
        if (!userId) return;

        setRemovingId(accommodationId);
        setError('');

        const supabase = createClient();

        const { error: deleteError } = await supabase
            .from('wishlists')
            .delete()
            .eq('student_id', userId)
            .eq('accommodation_id', accommodationId);

        if (deleteError) {
            setError('Could not remove this listing from your wishlist.');
            setRemovingId(null);
            return;
        }

        setWishlist((current) =>
            current.filter((listing) => listing.id !== accommodationId)
        );

        setRemovingId(null);
    }

    if (loading) {
        return (
            <main className="profileLoading">
                <Loader2 className="spin" size={28} />
                <p>Loading your profile...</p>
            </main>
        );
    }

    return (
        <main className="profilePage">
            <div className="profileContainer">

                <Link href="/" className="profileBackLink">
                    <ArrowLeft size={17} />
                    Back to home
                </Link>

                <div className="profileHeading">
                    <div>
                        <span className="profileEyebrow">YOUR ACCOUNT</span>
                        <h1>My profile</h1>
                        <p>View and manage your ResLink account.</p>
                    </div>
                </div>

                {error && (
                    <div className="profileAlert profileAlertError">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="profileAlert profileAlertSuccess">
                        <Check size={17} />
                        {message}
                    </div>
                )}

                {/* PROFILE SUMMARY */}
                <section className="profileSection profileOverview">

                    <div className="profileOverviewTop">
                        <div className="profileIdentity">
                            <div className="profileAvatar">
                                <Image
                                    src={avatarUrl}
                                    alt="Your profile picture"
                                    width={120}
                                    height={120}
                                    loading="eager"
                                />
                            </div>

                            <div className="profileIdentityDetails">
                                <span className="profileEyebrow">
                                    {role === 'provider'
                                        ? 'PROVIDER ACCOUNT'
                                        : role === 'admin'
                                          ? 'ADMIN ACCOUNT'
                                          : 'STUDENT ACCOUNT'}
                                </span>

                                <h2>{fullName || 'Your name'}</h2>
                                <p>Your ResLink profile</p>
                            </div>
                        </div>

                        {!editing && (
                            <button
                                type="button"
                                className="profileEditButton"
                                onClick={() => {
                                    setEditing(true);
                                    setError('');
                                    setMessage('');
                                }}
                            >
                                <Pencil size={16} />
                                Edit profile
                            </button>
                        )}
                    </div>

                    {!editing ? (
                        /* VIEW MODE */
                        <div className="profileDetailsGrid">

                            <div className="profileDetail">
                                <span className="profileDetailIcon">
                                    <UserRound size={18} />
                                </span>

                                <div>
                                    <small>Full name</small>
                                    <strong>{fullName || 'Not provided'}</strong>
                                </div>
                            </div>

                            <div className="profileDetail">
                                <span className="profileDetailIcon">
                                    <Mail size={18} />
                                </span>

                                <div>
                                    <small>Email address</small>
                                    <strong>{email || 'Not available'}</strong>
                                </div>
                            </div>

                            <div className="profileDetail">
                                <span className="profileDetailIcon">
                                    <Phone size={18} />
                                </span>

                                <div>
                                    <small>Phone number</small>
                                    <strong>{phone || 'Not provided'}</strong>
                                </div>
                            </div>

                            <div className="profileDetail">
                                <span className="profileDetailIcon">
                                    <ShieldCheck size={18} />
                                </span>

                                <div>
                                    <small>Account type</small>
                                    <strong>
                                        {role
                                            ? role.charAt(0).toUpperCase() + role.slice(1)
                                            : 'Not available'}
                                    </strong>
                                </div>
                            </div>

                        </div>
                    ) : (
                        /* EDIT MODE */
                        <form onSubmit={saveProfile} className="profileForm">

                            <div className="avatarField">
                                <label className="profileFieldLabel">
                                    Choose a profile picture
                                </label>

                                <div className="avatarChoices">
                                    {AVATARS.map((avatar, index) => (
                                        <button
                                            key={avatar}
                                            type="button"
                                            className={`avatarChoice ${
                                                avatarUrl === avatar ? 'selected' : ''
                                            }`}
                                            onClick={() => setAvatarUrl(avatar)}
                                            aria-label={`Choose profile picture ${index + 1}`}
                                            aria-pressed={avatarUrl === avatar}
                                        >
                                            <Image
                                                src={avatar}
                                                alt={`Profile picture ${index + 1}`}
                                                width={88}
                                                height={88}
                                                className="avatarImage"
                                            />

                                            {avatarUrl === avatar && (
                                                <span className="avatarCheck">
                                                    <Check size={15} />
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="profileInputField">
                                <label htmlFor="fullName" className="profileFieldLabel">
                                    Full name
                                </label>

                                <input
                                    id="fullName"
                                    type="text"
                                    value={fullName}
                                    onChange={(event) =>
                                        setFullName(event.target.value)
                                    }
                                    placeholder="Enter your full name"
                                    required
                                    minLength={2}
                                    maxLength={100}
                                />
                            </div>

                            <div className="profileInputField">
                                <label htmlFor="phone" className="profileFieldLabel">
                                    Phone number
                                </label>

                                <input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(event) =>
                                        setPhone(event.target.value)
                                    }
                                    placeholder="e.g. 071 234 5678"
                                    maxLength={20}
                                />
                            </div>

                            <div className="profileInputField">
                                <label className="profileFieldLabel">
                                    Email address
                                </label>

                                <input
                                    type="email"
                                    value={email}
                                    disabled
                                    className="profileDisabledInput"
                                />

                                <span className="profileFieldHint">
                                    Email address is managed through your login account.
                                </span>
                            </div>

                            <div className="profileFormActions">
                                <button
                                    type="button"
                                    className="profileCancelButton"
                                    onClick={cancelEditing}
                                    disabled={saving}
                                >
                                    <X size={17} />
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="profileSaveButton"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 size={17} className="spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={17} />
                                            Save changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </section>

                {/* WISHLIST */}
                {role === 'student' && (
                    <section className="profileSection wishlistSection">

                        <div className="profileSectionHeading">
                            <div className="profileSectionIcon">
                                <Bookmark size={20} />
                            </div>

                            <div>
                                <h2>My wishlist</h2>
                                <p>Accommodation you've saved for later.</p>
                            </div>

                            <span className="wishlistCount">
                                {wishlist.length}
                            </span>
                        </div>

                        {wishlist.length === 0 ? (
                            <div className="emptyWishlist">
                                <div className="emptyWishlistIcon">
                                    <Bookmark size={26} />
                                </div>

                                <h3>Your wishlist is empty</h3>

                                <p>
                                    Save accommodation listings you like
                                    and they will appear here.
                                </p>

                                <Link
                                    href="/search"
                                    className="browseListingsButton"
                                >
                                    Browse accommodation
                                    <ChevronRight size={17} />
                                </Link>
                            </div>
                        ) : (
                            <div className="wishlistGrid">
                                {wishlist.map((listing) => (
                                    <article
                                        className="wishlistCard"
                                        key={listing.id}
                                    >
                                        <Link
                                            href={`/listing/${listing.id}`}
                                            className="wishlistImageLink"
                                        >
                                            {listing.image_url ? (
                                                <img
                                                    src={listing.image_url}
                                                    alt={listing.name}
                                                    className="wishlistImage"
                                                />
                                            ) : (
                                                <div className="wishlistImagePlaceholder">
                                                    <Bookmark size={28} />
                                                </div>
                                            )}

                                            {listing.nsfas && (
                                                <span className="wishlistNsfas">
                                                    NSFAS
                                                </span>
                                            )}
                                        </Link>

                                        <div className="wishlistCardContent">
                                            <div className="wishlistCardTop">
                                                <div>
                                                    <h3>
                                                        <Link href={`/listing/${listing.id}`}>
                                                            {listing.name}
                                                        </Link>
                                                    </h3>

                                                    <p className="wishlistInstitution">
                                                        {listing.institution}
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    className="wishlistRemoveButton"
                                                    onClick={() =>
                                                        removeFromWishlist(listing.id)
                                                    }
                                                    disabled={removingId === listing.id}
                                                    aria-label={`Remove ${listing.name} from wishlist`}
                                                >
                                                    {removingId === listing.id ? (
                                                        <Loader2
                                                            size={18}
                                                            className="spin"
                                                        />
                                                    ) : (
                                                        <Trash2 size={18} />
                                                    )}
                                                </button>
                                            </div>

                                            <p className="wishlistLocation">
                                                <MapPin size={15} />
                                                {listing.location}
                                            </p>

                                            <div className="wishlistCardFooter">
                                                <div>
                                                    <strong>
                                                        R{Number(listing.price).toLocaleString('en-ZA')}
                                                    </strong>
                                                    <span> / month</span>
                                                </div>

                                                <Link
                                                    href={`/listing/${listing.id}`}
                                                    className="wishlistViewLink"
                                                >
                                                    View listing
                                                    <ChevronRight size={16} />
                                                </Link>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                )}

            </div>
        </main>
    );
}