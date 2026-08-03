'use client';

import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { Spinner, useSession } from '@verdocs/react-sdk';

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * Simple auth guard: wait for the initial session check, then either render
 * the protected route or bounce to the login page.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { loaded, authenticated } = useSession();

  if (!loaded) {
    return (
      <div className="loading-wrap">
        <Spinner mode="dark" />
      </div>
    );
  }

  if (!authenticated) {
    redirect('/login');
  }

  return <>{children}</>;
}
