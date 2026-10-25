
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function Nav() {
    const [name, setName] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();

        async function loadUser() {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setName(null);
                return;
            }

            // First, try to get the name from the user's profile.
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .maybeSingle();

            // Fall back to the name saved during registration.
            const fullName =
                profile?.full_name ||
                user.user_metadata?.full_name ||
                user.email;

            // Display the first name in the navigation.
            setName(
                fullName
                    ? fullName.trim().split(/\s+/)[0]
                    : 'My Account'
            );
        }

        loadUser();

        // Update the navigation when the user signs in or out.
        const { data: { subscription } } =
            supabase.auth.onAuthStateChange((_event, session) => {
                if (!session?.user) {
                    setName(null);
                } else {
                    const fullName =
                        session.user.user_metadata?.full_name ||
                        session.user.email;

                    setName(
                        fullName
                            ? fullName.trim().split(/\s+/)[0]
                            : 'My Account'
                    );

                    // Refresh the profile name after authentication changes.
                    loadUser();
                }
            });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <header className="nav">
            <Link href="/" className="brand">
                Res<span>Link</span>
            </Link>

            <nav>
                <Link href="/search">Find accommodation</Link>
                <Link href="/provider">List your property</Link>

                {name ? (
                    <Link href="/dashboard" className="navButton">
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
