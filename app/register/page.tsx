'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function Register() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    async function submit(e: FormEvent) {
        e.preventDefault();

        setError('');
        setMsg('');

        const supabase = createClient();

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName.trim(),
                },
            },
        });

        if (error) {
            setError(error.message);
        } else {
            setMsg(
                'Account created. Check your email if confirmation is enabled.'
            );
        }
    }

    return (
        <main className="auth">
            <form onSubmit={submit} className="authCard">
                <span className="eyebrow">GET STARTED</span>
                <h1>Create account</h1>

                <label>
                    Full Name
                    <input
                        type="text"
                        required
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                    />
                </label>

                <label>
                    Email
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </label>

                <label>
                    Password
                    <input
                        type="password"
                        minLength={6}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </label>

                {error && <div className="error">{error}</div>}

                {msg && <div className="success">{msg}</div>}

                <button className="button" type="submit">
                    Create account
                </button>

                <p>
                    Already registered? <Link href="/login">Sign in</Link>
                </p>
            </form>
        </main>
    );
}
