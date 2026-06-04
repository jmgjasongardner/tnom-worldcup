import { useState } from 'react';
import { Button } from '../ui/Button';
import { sendMagicLink } from '../../lib/auth';
import { EMAIL_DOMAIN } from '../../lib/validation';

export function SignInPanel() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);

    const { error } = await sendMagicLink(email);

    setSending(false);
    if (error) {
      setError(error);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="sign-in-panel card">
        <div className="card-body sign-in-sent">
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📬</div>
          <h2>Check your email</h2>
          <p>
            We sent a sign-in link to <strong>{email}</strong>. Click it to continue —
            you'll be brought back here automatically.
          </p>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => { setSent(false); setEmail(''); }}
            style={{ marginTop: '1rem' }}
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sign-in-panel card">
      <div className="card-header">
        <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Sign in to submit your portfolio</h2>
      </div>
      <div className="card-body">
        <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: '1.25rem' }}>
          Enter your Technomics email and we'll send you a magic link — no password needed.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label
              htmlFor="signin-email"
              style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}
            >
              Technomics Email
            </label>
            <input
              id="signin-email"
              type="email"
              className="input"
              placeholder={`yourname${EMAIL_DOMAIN}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          {error && (
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-error)' }}>
              ⚠ {error}
            </p>
          )}
          <Button type="submit" variant="primary" fullWidth disabled={sending || !email.trim()}>
            {sending ? 'Sending…' : 'Send Magic Link'}
          </Button>
        </form>
      </div>
    </div>
  );
}
