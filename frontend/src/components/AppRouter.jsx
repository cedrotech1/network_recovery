import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';
import { Login } from '../pages/Login';
import DashboardPage from '../pages/DashboardPage';
import NodesPage from '../pages/NodesPage';
import FailuresPage from '../pages/FailuresPage';
import RecoveriesPage from '../pages/RecoveriesPage';
import ExperimentsPage from '../pages/ExperimentsPage';
import MetricsPage from '../pages/MetricsPage';
import SystemSettingsPage from '../pages/SystemSettingsPage';
import ProfilePage from '../pages/ProfilePage';
import UsersPage from '../pages/UsersPage';
import GuidePage from '../pages/GuidePage';
import LogsPage from '../pages/LogsPage';
import GeneralReportPage from '../pages/GeneralReportPage';
import { NotFound } from '../pages/NotFound';
import { appPath, loginPath, routerBasename } from '../utils/appPaths';

export const AppRouter = () => (
  <Router basename={routerBasename() === '/' ? undefined : routerBasename()}>
    <Routes>
      <Route path="/" element={<Navigate to={loginPath()} replace />} />

      <Route
        path={loginPath()}
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path={appPath()}
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={appPath('dashboard')} replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="guide" element={<GuidePage />} />
        <Route path="nodes" element={<NodesPage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="failures" element={<FailuresPage />} />
        <Route path="recoveries" element={<RecoveriesPage />} />
        <Route path="experiments" element={<ExperimentsPage />} />
        <Route path="metrics" element={<MetricsPage />} />
        <Route path="report" element={<GeneralReportPage />} />
        <Route path="settings" element={<SystemSettingsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  </Router>
);
