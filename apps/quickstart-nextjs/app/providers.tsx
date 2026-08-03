'use client';

import type { ReactNode } from 'react';
import { VerdocsProvider } from '@verdocs/react-sdk';

interface ProvidersProps {
  children: ReactNode;
}

const apiBase = process.env.NEXT_PUBLIC_VERDOCS_API_BASE || 'https://stage-api.verdocs.com';

export default function Providers({ children }: ProvidersProps) {
  return <VerdocsProvider baseUrl={apiBase}>{children}</VerdocsProvider>;
}
