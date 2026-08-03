'use client';

import { redirect } from 'next/navigation';
import { useSession, VerdocsAuth } from '@verdocs/react-sdk';

export default function LoginPage() {
  const { loaded, authenticated } = useSession();

  // Session state drives routing: when VerdocsAuth completes a login, the
  // session change re-renders this view and the redirect below fires.
  if (loaded && authenticated) {
    redirect('/dashboard');
  }

  return (
    <div className="login-wrap">
      <VerdocsAuth onSdkError={error => console.warn('SDK error', error)} />
    </div>
  );
}
