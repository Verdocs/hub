import { Navigate } from 'react-router';
import { useSession, VerdocsAuth } from '@verdocs/react-sdk';

export const LoginView = () => {
  const { loaded, authenticated } = useSession();

  // Session state drives routing: when VerdocsAuth completes a login, the
  // session change re-renders this view and the redirect below fires.
  if (loaded && authenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="login-wrap">
      <VerdocsAuth onSdkError={error => console.warn('SDK error', error)} />
    </div>
  );
};
