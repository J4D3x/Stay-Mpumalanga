
'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    async function submit(e: FormEvent) {
        e.preventDefault();

        setError('');
        setLoading(true);

        try {
            const supabase = createClient();

            const { data, error: loginError } =
                await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password,
                });

            if (loginError) {
                setError(loginError.message);
                return;
            }

            if (!data.user) {
                setError('Unable to retrieve your account.');
                return;
            }

            const { data: profile, error: profileError } =
                await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .maybeSingle();

            if (profileError) {
                setError(
                    'Signed in, but we could not retrieve your account type. Please try again.'
                );
                await supabase.auth.signOut();
                return;
            }

            if (profile?.role === 'provider') {
                router.replace('/provider/dashboard');
                router.refresh();
                return;
            }

            if (profile?.role === 'student') {
                router.replace('/dashboard');
                router.refresh();
                return;
            }

            setError(
                'Your account type has not been configured correctly. Please contact support.'
            );

            await supabase.auth.signOut();
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth">
            <form onSubmit={submit} className="authCard">
                <span className="eyebrow">WELCOME BACK</span>
                <h1>Sign in</h1>

                <label>
                    Email
                    <input
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                    />
                </label>

                <label>
                    Password
                    <input
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter your password"
                    />
                </label>

                {error && (
                    <div className="error" role="alert">
                        {error}
                    </div>
                )}

                <button
                    className="button"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>

                <p>
                    Don't have an account?{' '}
                    <Link href="/register">Create account</Link>
                </p>
            </form>
        </main>
    );
}
