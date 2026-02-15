import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './lib/theme-context';
import { AuthProvider } from './lib/auth-context';
import { LayoutShell } from './app/layout-shell';
import HomePage from './app/page';
import LoginPage from './app/login/page';
import LoginCallbackPage from './app/login/callback/page';
import DeliveryPage from './app/metrics/delivery/page';
import ActivityPage from './app/metrics/activity/page';
import AiToolsPage from './app/metrics/ai-tools/page';
import JiraPage from './app/metrics/jira/page';
import TeamsPage from './app/teams/page';
import TeamDetailPage from './app/teams/[teamId]/page';
import PeoplePage from './app/team/page';
import InsightsDashboardPage from './app/insights-dashboard/page';
import InsightsPage from './app/insights/page';
import ProficiencyPage from './app/proficiency/page';
import MarketplacePage from './app/marketplace/page';
import MentoringPage from './app/mentoring/page';
import SurveysPage from './app/surveys/page';
import CareerPathsPage from './app/career-paths/page';
import MePage from './app/me/page';
import IntegrationsPage from './app/integrations/page';
import HelpPage from './app/help/page';
import SettingsPage from './app/settings/page';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LayoutShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/login/callback" element={<LoginCallbackPage />} />
            <Route path="/metrics" element={<Navigate to="/metrics/delivery" replace />} />
            <Route path="/metrics/delivery" element={<DeliveryPage />} />
            <Route path="/metrics/activity" element={<ActivityPage />} />
            <Route path="/metrics/ai-tools" element={<AiToolsPage />} />
            <Route path="/metrics/jira" element={<JiraPage />} />
            <Route path="/flow" element={<Navigate to="/metrics/delivery" replace />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/:teamId" element={<TeamDetailPage />} />
            <Route path="/team" element={<PeoplePage />} />
            <Route path="/insights-dashboard" element={<InsightsDashboardPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/proficiency" element={<ProficiencyPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/mentoring" element={<MentoringPage />} />
            <Route path="/surveys" element={<SurveysPage />} />
            <Route path="/career-paths" element={<CareerPathsPage />} />
            <Route path="/me" element={<MePage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LayoutShell>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
