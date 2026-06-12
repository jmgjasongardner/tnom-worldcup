import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PageContainer } from '../components/layout/PageContainer';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AppSettings {
  picks_locked: boolean;
  bracket_lock_at: string | null;
  last_score_update_at: string | null;
}

interface ScoringEvent {
  id: string;
  team_id: string;
  event_type: string;
  stage: string;
  points: number;
  label: string;
  created_at: string;
}

interface UpdateResult {
  processed: string[];
  skipped: number;
  errors: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET as string | undefined;

function fmt(ts: string | null | undefined): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
    timeZoneName: 'short',
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminPage() {
  const [pin, setPin]               = useState('');
  const [unlocked, setUnlocked]     = useState(false);
  const [pinError, setPinError]     = useState('');

  const [settings, setSettings]     = useState<AppSettings | null>(null);
  const [events, setEvents]         = useState<ScoringEvent[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const [updating, setUpdating]     = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateResult | null>(null);
  const [updateError, setUpdateError]   = useState<string | null>(null);

  const [locking, setLocking]       = useState(false);
  const [lockMsg, setLockMsg]       = useState<string | null>(null);

  // Load data once unlocked
  useEffect(() => {
    if (unlocked) loadData();
  }, [unlocked]);

  async function loadData() {
    setDataLoading(true);
    const [{ data: s }, { data: e }] = await Promise.all([
      supabase.from('app_settings')
        .select('picks_locked, bracket_lock_at, last_score_update_at')
        .eq('id', true).single(),
      supabase.from('scoring_events')
        .select('id, team_id, event_type, stage, points, label, created_at')
        .order('created_at', { ascending: false }).limit(30),
    ]);
    if (s) setSettings(s as AppSettings);
    setEvents((e ?? []) as ScoringEvent[]);
    setDataLoading(false);
  }

  function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ADMIN_SECRET) {
      setPinError('VITE_ADMIN_SECRET is not configured.');
      return;
    }
    if (pin === ADMIN_SECRET) {
      setUnlocked(true);
      setPinError('');
    } else {
      setPinError('Incorrect PIN.');
      setPin('');
    }
  }

  async function handleUpdateScores() {
    setUpdating(true);
    setUpdateResult(null);
    setUpdateError(null);
    try {
      const res = await fetch('/.netlify/functions/update-scores', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as UpdateResult;
      setUpdateResult(data);
      await loadData();
    } catch (err) {
      setUpdateError(String(err));
    } finally {
      setUpdating(false);
    }
  }

  async function handleToggleLock() {
    if (!settings || !ADMIN_SECRET) return;
    setLocking(true);
    setLockMsg(null);
    const action = settings.picks_locked ? 'unlock' : 'lock';
    try {
      const res = await fetch('/.netlify/functions/admin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, secret: ADMIN_SECRET }),
      });
      const data = await res.json() as { ok: boolean; picks_locked?: boolean; error?: string };
      if (!data.ok) throw new Error(data.error ?? 'Unknown error');
      setSettings({ ...settings, picks_locked: data.picks_locked ?? !settings.picks_locked });
      setLockMsg(data.picks_locked ? 'Picks locked.' : 'Picks unlocked.');
    } catch (err) {
      setLockMsg(`Error: ${String(err)}`);
    } finally {
      setLocking(false);
    }
  }

  // ── PIN gate ─────────────────────────────────────────────────────────────────

  if (!unlocked) {
    return (
      <PageContainer width="narrow">
        <div className="page-header">
          <h1 className="page-title">Admin</h1>
          <p className="page-subtitle">Enter the admin PIN to continue.</p>
        </div>
        <div className="card" style={{ maxWidth: 360, padding: 'var(--space-6)' }}>
          <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <label htmlFor="admin-pin" style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>
              Admin PIN
            </label>
            <input
              id="admin-pin"
              type="password"
              className="input"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              autoFocus
            />
            {pinError && (
              <p style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                {pinError}
              </p>
            )}
            <button type="submit" className="btn btn--primary">
              Unlock
            </button>
          </form>
        </div>
      </PageContainer>
    );
  }

  // ── Admin UI ──────────────────────────────────────────────────────────────────

  return (
    <PageContainer>
      <div className="page-header">
        <h1 className="page-title">Admin</h1>
        <p className="page-subtitle">Manage lock status, scores, and results.</p>
      </div>

      {dataLoading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>
      ) : (
        <>
          <div className="admin-grid">

            {/* App Status */}
            <div className="card admin-card">
              <h2 className="admin-card-title">App Status</h2>
              <table className="admin-status-table">
                <tbody>
                  <tr>
                    <td>Picks</td>
                    <td>
                      <span className={`badge ${settings?.picks_locked ? 'badge--error' : 'badge--valid'}`}>
                        {settings?.picks_locked ? '🔒 Locked' : '🔓 Open'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>Bracket lock time</td>
                    <td>{fmt(settings?.bracket_lock_at)}</td>
                  </tr>
                  <tr>
                    <td>Last score update</td>
                    <td>{fmt(settings?.last_score_update_at)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Score Update */}
            <div className="card admin-card">
              <h2 className="admin-card-title">Score Updater</h2>
              <p className="admin-card-body">
                Pulls completed matches from ESPN and applies scoring.
                Safe to run any time — already-processed matches are skipped.
              </p>
              <button
                className="btn btn--primary"
                onClick={handleUpdateScores}
                disabled={updating}
              >
                {updating ? '⏳ Updating…' : '▶ Update Scores Now'}
              </button>
              {updateError && (
                <div className="admin-result admin-result--error">❌ {updateError}</div>
              )}
              {updateResult && (
                <div className="admin-result admin-result--success">
                  <div>✅ {updateResult.processed.length} new, {updateResult.skipped} skipped</div>
                  {updateResult.processed.length > 0 && (
                    <ul className="admin-processed-list">
                      {updateResult.processed.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  )}
                  {updateResult.errors.length > 0 && (
                    <div className="admin-result admin-result--error" style={{ marginTop: '0.5rem' }}>
                      {updateResult.errors.map((err, i) => <div key={i}>⚠ {err}</div>)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Lock Control */}
            <div className="card admin-card">
              <h2 className="admin-card-title">Lock Control</h2>
              <p className="admin-card-body">
                {settings?.picks_locked
                  ? 'Picks are locked. Participants cannot edit portfolios.'
                  : 'Picks are open. Lock at opening kickoff.'}
              </p>
              <button
                className={`btn ${settings?.picks_locked ? 'btn--secondary' : 'btn--danger'}`}
                onClick={handleToggleLock}
                disabled={locking}
              >
                {locking ? '⏳ Saving…' : settings?.picks_locked ? '🔓 Unlock Picks' : '🔒 Lock Picks Now'}
              </button>
              {lockMsg && (
                <div className="admin-lock-msg">{lockMsg}</div>
              )}
            </div>

          </div>

          {/* Scoring Events */}
          <div className="card" style={{ marginTop: 'var(--space-6)' }}>
            <h2 className="admin-card-title" style={{ padding: 'var(--space-4) var(--space-4) 0' }}>
              Recent Scoring Events
            </h2>
            {events.length === 0 ? (
              <div style={{ padding: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
                No scoring events yet.
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Team</th>
                      <th>Stage</th>
                      <th>Pts</th>
                      <th>Label</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => (
                      <tr key={ev.id}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                          {new Date(ev.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </td>
                        <td style={{ fontWeight: 'var(--font-weight-medium)' }}>{ev.team_id}</td>
                        <td style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>{ev.stage}</td>
                        <td><span className="badge badge--valid">+{ev.points}</span></td>
                        <td style={{ fontSize: 'var(--font-size-sm)' }}>{ev.label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </PageContainer>
  );
}
