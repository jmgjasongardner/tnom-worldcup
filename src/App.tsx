import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './routes/HomePage';
import { BuildPortfolioPage } from './routes/BuildPortfolioPage';
import { TeamsPage } from './routes/TeamsPage';
import { LeaderboardPage } from './routes/LeaderboardPage';
import { MyPortfolioPage } from './routes/MyPortfolioPage';
import { ParticipantPortfolioPage } from './routes/ParticipantPortfolioPage';
import { AdminPage } from './routes/AdminPage';
import { SchedulePage } from './routes/SchedulePage';

export function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pick" element={<BuildPortfolioPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/my-portfolio" element={<MyPortfolioPage />} />
          <Route path="/participants/:entryId" element={<ParticipantPortfolioPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
