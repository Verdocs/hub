import { authenticate } from '@verdocs/js-sdk';
import type { Preview } from '@storybook/react-vite';
import { useEffect, useRef, type ReactNode } from 'react';
import { VerdocsProvider, useSession } from '../../../packages/react-sdk/src';
import './preview-styles.css';

const apiBase = import.meta.env.VITE_VERDOCS_API_BASE || 'https://stage-api.verdocs.com';
const testEmail = import.meta.env.VITE_VERDOCS_TEST_EMAIL;
const testPassword = import.meta.env.VITE_VERDOCS_TEST_PASSWORD;

// When .env supplies a test account and no session is persisted yet, sign in
// once on startup so live-data stories render without a manual login pass.
function EnvSessionBootstrap({ children }: { children: ReactNode }) {
  const { loaded, authenticated, endpoint } = useSession();
  const attempted = useRef(false);

  useEffect(() => {
    if (!loaded || authenticated || attempted.current || !testEmail || !testPassword) {
      return;
    }

    attempted.current = true;
    authenticate(endpoint, { username: testEmail, password: testPassword, grant_type: 'password' })
      .then(result => endpoint.setToken(result.access_token))
      .catch(error => console.warn('[storybook] .env login failed', error));
  }, [loaded, authenticated, endpoint]);

  return children;
}

const preview: Preview = {
  decorators: [
    Story => (
      <VerdocsProvider baseUrl={apiBase}>
        <EnvSessionBootstrap>
          <Story />
        </EnvSessionBootstrap>
      </VerdocsProvider>
    ),
  ],
};

export default preview;
