import { Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { ScoringRulesTable } from '../components/scoring/ScoringRulesTable';

export function HomePage() {
  return (
    <PageContainer width="narrow">
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-badge">⚽ 2026 FIFA World Cup</div>
        <h1 className="home-hero-title">Technomics 2026<br />World Cup Challenge</h1>
        <p className="home-hero-subtitle">
          Pick 6 teams. Stay under $100. Follow your portfolio from group stage to the final.
        </p>
        <div className="home-hero-actions">
          <Link to="/pick" className="btn btn--primary btn--lg">
            Build Portfolio
          </Link>
          <Link to="/teams" className="btn btn--secondary btn--lg">
            View Teams &amp; Costs
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="home-section">
        <h2>How It Works</h2>
        <div className="home-rules-grid">
          <div className="home-rule-card">
            <span className="home-rule-icon">📧</span>
            <h3>Sign In</h3>
            <p>Use your Technomics email to sign in and claim your entry.</p>
          </div>
          <div className="home-rule-card">
            <span className="home-rule-icon">🛒</span>
            <h3>Pick 6 Teams</h3>
            <p>Choose exactly 6 teams from all 48 World Cup nations. Stay under the $100 budget.</p>
          </div>
          <div className="home-rule-card">
            <span className="home-rule-icon">🔒</span>
            <h3>Lock at Kickoff</h3>
            <p>All picks lock at the opening match. Edit freely until then.</p>
          </div>
          <div className="home-rule-card">
            <span className="home-rule-icon">🏆</span>
            <h3>Track Your Score</h3>
            <p>Earn points as your teams win matches, advance in groups, and survive the knockouts.</p>
          </div>
        </div>
      </section>

      {/* Budget explained */}
      <section className="home-section">
        <h2>The Budget</h2>
        <p style={{ marginBottom: '1rem' }}>
          Each team has a cost based on their strength and title odds. The best squads cost more — you'll need to
          balance elite picks with value buys to stay under $100.
        </p>
        <div className="home-budget-examples">
          <div className="budget-example">
            <span className="budget-example-flag">🇫🇷</span>
            <span className="budget-example-name">France</span>
            <span className="budget-example-cost">$34</span>
          </div>
          <div className="budget-example">
            <span className="budget-example-flag">🇺🇸</span>
            <span className="budget-example-name">USA</span>
            <span className="budget-example-cost">$16</span>
          </div>
          <div className="budget-example">
            <span className="budget-example-flag">🇯🇵</span>
            <span className="budget-example-name">Japan</span>
            <span className="budget-example-cost">$16</span>
          </div>
          <div className="budget-example">
            <span className="budget-example-flag">🇸🇦</span>
            <span className="budget-example-name">Saudi Arabia</span>
            <span className="budget-example-cost">$6</span>
          </div>
          <div className="budget-example">
            <span className="budget-example-flag">🇭🇹</span>
            <span className="budget-example-name">Haiti</span>
            <span className="budget-example-cost">$1</span>
          </div>
        </div>
        <p style={{ marginTop: '0.75rem', fontSize: 'var(--font-size-sm)' }}>
          <Link to="/teams" style={{ color: 'var(--color-teal-500)', fontWeight: 600 }}>
            View all 48 teams and costs →
          </Link>
        </p>
      </section>

      {/* Scoring */}
      <section className="home-section">
        <h2>Scoring Rules</h2>
        <ScoringRulesTable />
      </section>

      {/* CTA */}
      <section className="home-cta">
        <h2>Ready to compete?</h2>
        <p>Build your portfolio before the opening kickoff on June 11.</p>
        <Link to="/pick" className="btn btn--gold btn--lg">
          Start Picking →
        </Link>
      </section>
    </PageContainer>
  );
}
