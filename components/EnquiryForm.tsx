
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type EnquiryFormProps = {
  accommodationId: string;
  accommodationName: string;
};

export function EnquiryForm({
  accommodationId,
  accommodationName,
}: EnquiryFormProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user }, error: authError } =
        await supabase.auth.getUser();

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
        .single();

      if (profileError) {
        throw new Error('Could not verify your account role.');
      }

      if (profile.role !== 'student') {
        throw new Error('Only student accounts can apply or enquire.');
      }

      const { error } = await supabase
        .from('enquiries')
        .insert({
          student_id: user.id,
          accommodation_id: accommodationId,
          message: message.trim(),
          status: 'pending',
        });

      if (error) {
        throw new Error(error.message);
      }

      setFeedback('Your enquiry has been submitted successfully!');
      setMessage('');
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="enquiryForm">
      <h2>Enquire about {accommodationName}</h2>

      <label htmlFor="enquiryMessage">
        Message to the accommodation provider
      </label>

      <textarea
        id="enquiryMessage"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Introduce yourself and ask about availability, requirements or viewing arrangements..."
        rows={5}
        minLength={10}
        maxLength={2000}
        required
      />

      <button
        className="button"
        type="submit"
        disabled={loading}
      >
        {loading ? 'Submitting...' : 'Submit enquiry'}
      </button>

      {feedback && <p role="status">{feedback}</p>}
    </form>
  );
}
