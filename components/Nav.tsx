
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function Nav() {
    const [name, setName] = useState<string | null>(null);
    const [homeLink, setHomeLink] = useState('/');
    const [accountLink, setAccountLink] = useState('/login');

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

            // Send each account to the correct dashboard.
            const dashboard =
                profile?.role === 'provider'
                    ? '/provider/dashboard'
                    : '/dashboard';

            setHomeLink(dashboard);
            setAccountLink(dashboard);
        }

        loadUser();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(() => {
            loadUser();
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <header className="nav">
            <Link href={homeLink} className="brand">
                Res<span>Link</span>
            </Link>

            <nav>
                <Link href="/search">
                    Find accommodation
                </Link>

                <Link href="/provider">
                    List your property
                </Link>

                {name ? (
                    <Link href={accountLink} className="navButton">
                        {name}
                    </Link>
                ) : (
                    <Link href="/login" className="navButton">
                        Sign in
                    </Link>
                )}
            </nav>
        </header>
    );
}
