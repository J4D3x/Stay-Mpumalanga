'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  Building2,
  Check,
  ArrowLeft,
  ArrowRight,
  UserRound,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const AVATARS = [
  '/avatars/Avatar%20(1).jpeg',
  '/avatars/Avatar%20(2).jpeg',
  '/avatars/Avatar%20(3).jpeg',
  '/avatars/Avatar%20(4).jpeg',
];

export default function Register() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'provider'>('student');

  const [avatarUrl, setAvatarUrl] = useState('');
  const [phone, setPhone] = useState('');

  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function continueToProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError('');
    setMsg('');

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (password.length < 6) {
      setError('Your password must contain at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data: available, error: checkError } =
        await supabase.rpc('is_email_available', {
          p_email: email.trim().toLowerCase(),
        });

      if (checkError) {
        throw checkError;
      }

      if (!available) {
        setError(
          'An account with this email address already exists. Please sign in or use another email address.'
        );
        return;
      }

      setStep(2);
    } catch (err) {
      console.error('Email availability check failed:', err);

      setError(
        'We could not verify your email address. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError('');
    setMsg('');

    if (!avatarUrl) {
      setError('Please select a profile picture.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role,
            avatar_url: avatarUrl,
            phone: phone.trim() || null,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user) {
        router.replace('/login?registered=true');
        return;
      }

      setError('Your account could not be created. Please try again.');
    } catch (err) {
      console.error('Registration failed:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create your account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth">
      <form
        onSubmit={step === 1 ? continueToProfile : submit}
        className="authCard registerCard"
      >
        <span className="eyebrow">GET STARTED</span>

        <div className="registerProgress">
          <div className="registerProgressTrack">
            <span className={step === 1 ? 'active' : 'complete'} />
            <span className={step === 2 ? 'active' : ''} />
          </div>

          <small>STEP {step} OF 2</small>
        </div>

        {step === 1 ? (
          <>
            <h1>Create account</h1>

            <p>
              Join ResLink to find or provide student accommodation.
            </p>

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
                onChange={(e) => setFullName(e.target.value)}
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
                onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </label>

            <label>
              Confirm Password

              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
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
              {loading ? 'Checking email...' : 'Continue'}
              {!loading && <ArrowRight size={18} />}
            </button>

            <p>
              Already registered? <Link href="/login">Sign in</Link>
            </p>
          </>
        ) : (
          <>
            <h1>Set up your profile</h1>

            <p>
              Choose a profile picture and add your contact number.
              You can change these details later.
            </p>

            <div className="registerAvatarSection">
              <span className="registerFieldLabel">
                Choose your profile picture
              </span>

              <div className="registerAvatarGrid">
                {AVATARS.map((avatar, index) => (
                  <button
                    type="button"
                    key={avatar}
                    className={`registerAvatarOption ${
                      avatarUrl === avatar ? 'selected' : ''
                    }`}
                    onClick={() => {
                      setAvatarUrl(avatar);
                      setError('');
                    }}
                    aria-label={`Choose profile picture ${index + 1}`}
                    aria-pressed={avatarUrl === avatar}
                  >
                    <img
                      src={avatar}
                      alt={`Avatar ${index + 1}`}
                    />

                    {avatarUrl === avatar && (
                      <span className="registerAvatarCheck">
                        <Check size={16} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <label>
              Phone Number <span className="optionalLabel">Optional</span>

              <input
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 071 234 5678"
              />
            </label>

            <div className="registerProfilePreview">
              <div className="registerPreviewAvatar">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Selected profile picture" />
                ) : (
                  <UserRound size={25} />
                )}
              </div>

              <div>
                <strong>{fullName}</strong>
                <small>
                  {role === 'student'
                    ? 'Student'
                    : 'Accommodation Provider'}
                </small>
              </div>
            </div>

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

            <div className="registerStepActions">
              <button
                type="button"
                className="registerBackButton"
                onClick={() => {
                  setStep(1);
                  setError('');
                  setMsg('');
                }}
                disabled={loading}
              >
                <ArrowLeft size={17} />
                Back
              </button>

              <button
                className="button"
                type="submit"
                disabled={loading || !!msg}
              >
                {loading ? 'Creating account...' : 'Complete profile'}
              </button>
            </div>

            <p className="registerPrivacyNote">
              Your phone number is optional. You can update your
              profile details at any time.
            </p>
          </>
        )}
      </form>
    </main>
  );
}
