import type { Metadata } from 'next';
import '@verdocs/react-sdk/styles.css';
import type { ReactNode } from 'react';
import Providers from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Verdocs Next.js Quickstart',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
