
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type ApplicationFormProps = {
  accommodationId: string;
  accommodationName: string;
};

export function ApplicationForm({
  accommodationId,
  accommodationName,
}: ApplicationFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [studyYear, setStudyYear] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [duration, setDuration] = useState('12');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadStudentDetails() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setEmail(user.email ?? '');
      setFullName(user.user_metadata?.full_name ?? '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        if (profile.full_name) setFullName(profile.full_name);
        if (profile.phone) setPhone(profile.phone);
      }
    }

    loadStudentDetails();
  }, []);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setLoading(true);
    setFeedback('');
    setSuccess(false);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        window.location.href =
          `/login?next=${encodeURIComponent(
            `/listing/${accommodationId}`
          )}`;
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error('Could not verify your account.');
      }

      if (profile?.role !== 'student') {
        throw new Error(
          'Only student accounts can apply for accommodation.'
        );
      }

      const { error } = await supabase
        .from('applications')
        .insert({
          student_id: user.id,
          accommodation_id: accommodationId,
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          institution: institution.trim(),
          student_number: studentNumber.trim() || null,
          study_year: studyYear,
          move_in_date: moveInDate,
          duration_months: Number(duration),
          message: message.trim() || null,
          status: 'submitted',
        });

      if (error) {
        throw new Error(error.message);
      }

      setSuccess(true);
      setFeedback(
        'Your application has been submitted successfully!'
      );
      setMessage('');
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : 'Unable to submit your application. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      id="application"
      className="enquiryForm applicationForm"
      onSubmit={handleSubmit}
    >
      <h2>Accommodation application</h2>
      <p>
        Applying for <strong>{accommodationName}</strong>
      </p>
      <p>
        Complete the details below. Your application will be sent
        for review.
      </p>

      <h3>Personal details</h3>

      <label htmlFor="appFullName">Full name *</label>
      <input
        id="appFullName"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        autoComplete="name"
        required
        maxLength={120}
      />

      <label htmlFor="appEmail">Email address *</label>
      <input
        id="appEmail"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
        maxLength={254}
      />

      <label htmlFor="appPhone">Phone number *</label>
      <input
        id="appPhone"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        autoComplete="tel"
        required
        maxLength={30}
      />

      <h3>Academic details</h3>

      <label htmlFor="appInstitution">
        Institution you attend or will attend *
      </label>
      <input
        id="appInstitution"
        value={institution}
        onChange={(e) => setInstitution(e.target.value)}
        placeholder="e.g. Tshwane University of Technology"
        required
        maxLength={150}
      />

      <label htmlFor="appStudentNumber">
        Student number (if available)
      </label>
      <input
        id="appStudentNumber"
        value={studentNumber}
        onChange={(e) => setStudentNumber(e.target.value)}
        maxLength={50}
      />

      <label htmlFor="appStudyYear">Year of study *</label>
      <select
        id="appStudyYear"
        value={studyYear}
        onChange={(e) => setStudyYear(e.target.value)}
        required
      >
        <option value="">Select your year</option>
        <option value="First year">First year</option>
        <option value="Second year">Second year</option>
        <option value="Third year">Third year</option>
        <option value="Fourth year">Fourth year</option>
        <option value="Postgraduate">Postgraduate</option>
        <option value="Other">Other</option>
      </select>

      <h3>Accommodation requirements</h3>

      <label htmlFor="appMoveIn">Preferred move-in date *</label>
      <input
        id="appMoveIn"
        type="date"
        value={moveInDate}
        onChange={(e) => setMoveInDate(e.target.value)}
        min={new Date().toLocaleDateString('en-CA')}
        required
      />

      <label htmlFor="appDuration">Length of stay *</label>
      <select
        id="appDuration"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        required
      >
        <option value="3">3 months</option>
        <option value="6">6 months</option>
        <option value="9">9 months</option>
        <option value="12">12 months</option>
        <option value="18">18 months</option>
        <option value="24">24 months</option>
      </select>

      <label htmlFor="appMessage">
        Additional information (optional)
      </label>
      <textarea
        id="appMessage"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Tell the provider anything else they should know..."
        rows={4}
        maxLength={2000}
      />

      <button
        className="button"
        type="submit"
        disabled={loading || success}
      >
        {loading ? 'Submitting application...' : 'Submit application'}
      </button>

      {feedback && (
        <p role="status" aria-live="polite">
          {feedback}
        </p>
      )}
    </form>
  );
}
