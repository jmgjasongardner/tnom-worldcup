import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './routes/HomePage';
import { BuildPortfolioPage } from './routes/BuildPortfolioPage';
import { TeamsPage } from './routes/TeamsPage';
import { LeaderboardPage } from './routes/LeaderboardPage';
import { MyPortfolioPage } from './routes/MyPortfolioPage';
import { ParticipantPortfolioPage } from './routes/ParticipantPortfolioPage';
import { AdminPage } from './routes/AdminPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/pick" element={<BuildPortfolioPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/my-portfolio" element={<MyPortfolioPage />} />
            <Route path="/participants/:entryId" element={<ParticipantPortfolioPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </AppShell>
      </AuthProvider>
    </BrowserRouter>
  );
}
