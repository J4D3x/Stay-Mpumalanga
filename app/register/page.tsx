
'use client';

import { FormEvent, useState } from 'react';
import { GraduationCap, Building2, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function Register() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'student' | 'provider'>('student');
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function submit(e: FormEvent) {
        e.preventDefault();

        setError('');
        setMsg('');
        setLoading(true);

        try {
            const supabase = createClient();

            const { error } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: {
                        full_name: fullName.trim(),
                        role: role,
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
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth">
            <form onSubmit={submit} className="authCard">
                <span className="eyebrow">GET STARTED</span>
                <h1>Create account</h1>
                <p>Join ResLink to find or provide student accommodation.</p>

                <div className="accountTypeField">
                    <span className="accountTypeLabel">
                        I want to join ResLink as
                    </span>

                    <div className="accountTypeOptions">
                        <button
                            type="button"
                            className={`accountTypeCard ${
                                role === 'student' ? 'selected' : ''
                            }`}
                            onClick={() => setRole('student')}
                            aria-pressed={role === 'student'}
                        >
                            <span className="accountTypeIcon">
                                <GraduationCap size={24} />
                            </span>

                            <span className="accountTypeText">
                                <strong>Student</strong>
                                <small>Find your next home</small>
                            </span>

                            <span className="accountTypeCheck">
                                {role === 'student' && <Check size={16} />}
                            </span>
                        </button>

                        <button
                            type="button"
                            className={`accountTypeCard ${
                                role === 'provider' ? 'selected' : ''
                            }`}
                            onClick={() => setRole('provider')}
                            aria-pressed={role === 'provider'}
                        >
                            <span className="accountTypeIcon">
                                <Building2 size={24} />
                            </span>

                            <span className="accountTypeText">
                                <strong>Accommodation Provider</strong>
                                <small>Manage your properties</small>
                            </span>

                            <span className="accountTypeCheck">
                                {role === 'provider' && <Check size={16} />}
                            </span>
                        </button>
                    </div>
                </div>

                <label>
                    Full Name
                    <input
                        type="text"
                        required
                        autoComplete="name"
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
                        autoComplete="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                    />
                </label>

                <label>
                    Password
                    <input
                        type="password"
                        minLength={6}
                        required
                        autoComplete="new-password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                    />
                </label>

                {error && (
                    <div className="error" role="alert">
                        {error}
                    </div>
                )}

                {msg && (
                    <div className="success" role="status">
                        {msg}
                    </div>
                )}

                <button
                    className="button"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? 'Creating account...' : 'Create account'}
                </button>

                <p>
                    Already registered? <Link href="/login">Sign in</Link>
                </p>
            </form>
        </main>
    );
}
