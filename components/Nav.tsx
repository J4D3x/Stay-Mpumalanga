'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, UserRound, LayoutDashboard, LogOut, Home } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function Nav() {
    const router = useRouter();

    const [name, setName] = useState<string | null>(null);
    const [homeLink, setHomeLink] = useState('/');
    const [accountLink, setAccountLink] = useState('/login');
    const [menuOpen, setMenuOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        const supabase = createClient();

        async function loadUser() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                setName(null);
                setHomeLink('/');
                setAccountLink('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, role')
                .eq('id', user.id)
                .maybeSingle();

            const fullName =
                profile?.full_name ||
                user.user_metadata?.full_name ||
                user.email;

            setName(
                fullName
                    ? fullName.trim().split(/\s+/)[0]
                    : 'My Account'
            );

            // Route users to the dashboard matching their account role.
            const dashboard =
                profile?.role === 'admin'
                    ? '/admin/dashboard'
                    : profile?.role === 'provider'
                      ? '/provider/dashboard'
                      : '/dashboard';

            setHomeLink(dashboard);
            setAccountLink(dashboard);
        }

            loadUser();

        // Reload the name when the profile page saves changes.
        window.addEventListener('profile-updated', loadUser);

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(() => {
            loadUser();
});

return () => {
    window.removeEventListener('profile-updated', loadUser);
    subscription.unsubscribe();
};
    }, []);

    // Close the menu when the Escape key is pressed.
    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setMenuOpen(false);
            }
        }

        window.addEventListener('keydown', handleEscape);

        return () => {
            window.removeEventListener('keydown', handleEscape);
        };
    }, []);

    async function handleLogout() {
        setLoggingOut(true);

        const supabase = createClient();
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Logout failed:', error.message);
            setLoggingOut(false);
            return;
        }

        setMenuOpen(false);
        setName(null);
        router.push('/');
        router.refresh();
    }

    return (
        <>
            <header className="nav">
                <Link
                    href={homeLink}
                    className="brand"
                    onClick={() => setMenuOpen(false)}
                >
                    Res<span>Link</span>
                </Link>

                <nav className="navLinks">
                    <Link href="/search">
                        Find accommodation
                    </Link>

                    <Link href="/provider">
                        List your property
                    </Link>

                    {name ? (
                        <button
                            type="button"
                            className="navMenuButton"
                            onClick={() => setMenuOpen(true)}
                            aria-label="Open account menu"
                            aria-expanded={menuOpen}
                        >
                            <Menu size={21} />
                            <span>Menu</span>
                        </button>
                    ) : (
                        <Link href="/login" className="navButton">
                            Sign in
                        </Link>
                    )}
                </nav>
            </header>

            {/* Background overlay */}
            <div
                className={`accountOverlay ${menuOpen ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
            />

            {/* Sliding account menu */}
            <aside
                className={`accountDrawer ${menuOpen ? 'open' : ''}`}
                aria-hidden={!menuOpen}
            >
                <div className="accountDrawerHeader">
                    <div>
                        <span className="accountDrawerEyebrow">
                            RESLINK ACCOUNT
                        </span>
                        <h2>My account</h2>
                        <p>{name || 'Welcome back'}</p>
                    </div>

                    <button
                        type="button"
                        className="accountCloseButton"
                        onClick={() => setMenuOpen(false)}
                        aria-label="Close menu"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="accountMenuLinks">
                    <Link
                        href="/profile"
                        className="accountMenuItem"
                        onClick={() => setMenuOpen(false)}
                    >
                        <span className="accountMenuIcon">
                            <UserRound size={20} />
                        </span>

                        <span>
                            <strong>Profile</strong>
                            <small>Manage your personal details</small>
                        </span>
                    </Link>

                    <Link
                        href={accountLink}
                        className="accountMenuItem"
                        onClick={() => setMenuOpen(false)}
                    >
                        <span className="accountMenuIcon">
                            <LayoutDashboard size={20} />
                        </span>

                        <span>
                            <strong>Dashboard</strong>
                            <small>View your account activity</small>
                        </span>
                    </Link>

                    <Link
                        href="/"
                        className="accountMenuItem"
                        onClick={() => setMenuOpen(false)}
                    >
                        <span className="accountMenuIcon">
                            <Home size={20} />
                        </span>

                        <span>
                            <strong>Home</strong>
                            <small>Head back to the home page</small>
                        </span>
                    </Link>
                </div>

                <div className="accountDrawerFooter">
                    <button
                        type="button"
                        className="accountLogoutButton"
                        onClick={handleLogout}
                        disabled={loggingOut}
                    >
                        <LogOut size={19} />
                        {loggingOut ? 'Logging out...' : 'Logout'}
                    </button>

                    <p>ResLink · Student accommodation</p>
                </div>
            </aside>
        </>
    );
}