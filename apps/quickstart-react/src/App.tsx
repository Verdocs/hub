import { Spinner, useSession } from '@verdocs/react-sdk';
import { Navigate, Outlet, Route, Routes } from 'react-router';
import DashboardView from './routes/DashboardView';
import LoginView from './routes/LoginView';

/**
 * Simple auth guard: wait for the initial session check, then either render
 * the protected routes or bounce to the login view.
 */
function RequireSession() {
  const { loaded, authenticated } = useSession();

  if (!loaded) {
    return (
      <div className="loading-wrap">
        <Spinner mode="dark" />
      </div>
    );
  }

  return authenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />
      <Route element={<RequireSession />}>
        <Route path="/dashboard" element={<DashboardView />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
