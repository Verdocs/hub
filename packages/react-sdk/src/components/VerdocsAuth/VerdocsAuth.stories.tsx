import axios from 'axios';
import { useEffect, useState } from 'react';
import MockAdapter from 'axios-mock-adapter';
import { VerdocsEndpoint } from '@verdocs/js-sdk';
import type { Meta, StoryObj } from '@storybook/react-vite';
import VerdocsAuth, { type VerdocsAuthProps } from './VerdocsAuth';

const meta = {
  title: 'Embeds/VerdocsAuth',
  component: VerdocsAuth,
  parameters: {
    docs: {
      description: {
        component:
          'Runs live against the beta API. Log in here and the session persists for the '
          + 'VerdocsTemplatesList story. Use a beta test account; the signup flow creates real accounts. '
          + 'The two-factor and provider stories below are scripted instead, so they never touch the API.',
      },
    },
  },
} satisfies Meta<typeof VerdocsAuth>;

export default meta;
type Story = StoryObj<typeof meta>;

interface MockedAuthProps extends VerdocsAuthProps {
  /** Route stubs for this story, applied before the story's endpoint is created. */
  configure: (mock: MockAdapter) => void;
}

// Scripted stories get their own endpoint, built after the mock adapter is installed so it
// inherits the mocked transport. The live stories keep using the preview's real endpoint.
function MockedAuth({ configure, ...props }: MockedAuthProps) {
  const [ { endpoint, mock } ] = useState(() => {
    const installed = new MockAdapter(axios);
    installed.onGet('/v2/profiles').reply(200, []);
    configure(installed);
    return { endpoint: new VerdocsEndpoint({ persist: false }), mock: installed };
  });

  useEffect(() => () => mock.restore(), [ mock ]);

  return <VerdocsAuth {...props} endpoint={endpoint} />;
}

export const LiveLogin: Story = {
  args: {
    onAuthenticated: status => console.log('[story] Authenticated', status),
    onSdkError: error => console.log('[story] SDK error', error),
  },
};

export const ForgotPassword: Story = {
  args: { initialMode: 'forgot' },
};

export const Signup: Story = {
  args: { initialMode: 'signup' },
};

export const LoginWithProviders: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Both providers reported as enabled. Clicking one starts a real redirect to the API, so it leaves Storybook.',
      },
    },
  },
  render: () => (
    <MockedAuth
      configure={mock => {
        mock.onGet('/v2/oauth2/social/providers').reply(200, { google: true, microsoft: true });
      }} />
  ),
};

export const SignupWithProviders: Story = {
  render: () => (
    <MockedAuth
      initialMode="signup"
      configure={mock => {
        mock.onGet('/v2/oauth2/social/providers').reply(200, { google: true, microsoft: true });
      }} />
  ),
};

export const MFAChallenge: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The step a user with two-factor authentication sees after their password. 123456 succeeds, anything else shows the retry error.',
      },
    },
  },
  render: () => (
    <MockedAuth
      initialMode="mfa"
      configure={mock => {
        mock.onGet('/v2/oauth2/social/providers').reply(200, { google: false, microsoft: false });
        mock.onGet('/v2/users/me').reply(200, { email_verified: true });
        mock.onPost('/v2/oauth2/token').reply(config => {
          const body = JSON.parse(String(config.data)) as { otp?: string; recovery_code?: string };
          return body.otp === '123456' || body.recovery_code === 'abcd-1234'
            ? [ 200, { access_token: 'story-token' } ]
            : [ 403, { error: 'mfa_required', mfa_token: 'story-mfa-token' } ];
        });
      }} />
  ),
};
