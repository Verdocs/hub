import userEvent from '@testing-library/user-event';
import { authenticate, getMyUser } from '@verdocs/js-sdk';
import { render, screen, waitFor } from '@testing-library/react';
import { VerdocsProvider } from '../../provider/VerdocsProvider';
import { VerdocsAuth } from './VerdocsAuth';

vi.mock('@verdocs/js-sdk', async importOriginal => {
  const actual = await importOriginal<typeof import('@verdocs/js-sdk')>();
  return {
    ...actual,
    authenticate: vi.fn(),
    getMyUser: vi.fn(),
    createProfile: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
    resetPassword: vi.fn(),
  };
});

const renderAuth = (props = {}) =>
  render(
    <VerdocsProvider baseUrl="https://stage-api.verdocs.com">
      <VerdocsAuth {...props} />
    </VerdocsProvider>,
  );

describe('VerdocsAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the login form by default', () => {
    renderAuth();

    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('fires onAuthenticated(false) after the initial session check finds nothing', async () => {
    const onAuthenticated = vi.fn();
    renderAuth({ onAuthenticated });

    await waitFor(() => {
      expect(onAuthenticated).toHaveBeenCalledWith({ authenticated: false, session: null, profile: null });
    });
  });

  it('starts in the requested mode', () => {
    renderAuth({ initialMode: 'forgot' });

    expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request Code' })).toBeInTheDocument();
  });

  it('switches to signup mode and enforces password complexity', async () => {
    renderAuth();

    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
    expect(screen.getByText('Sign up for a free account')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/First Name/), 'Test');
    await userEvent.type(screen.getByLabelText(/Last Name/), 'User');
    await userEvent.type(screen.getByLabelText(/Email Address/), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/^Password/), 'weakling');
    await userEvent.type(screen.getByLabelText(/Confirm Password/), 'weakling');
    await userEvent.type(screen.getByLabelText(/Phone Number/), '+15551234567');
    await userEvent.type(screen.getByLabelText(/Organization Name/), 'Test Org');

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => {
      expect(document.querySelector('.vdocs-toast')?.textContent).toContain('Password must be at least 8 characters');
    });
  });

  it('routes unverified logins to the verification step', async () => {
    vi.mocked(authenticate).mockResolvedValue({ access_token: 'tok' } as never);
    vi.mocked(getMyUser).mockResolvedValue({ email_verified: false } as never);

    renderAuth();

    await userEvent.type(screen.getByLabelText(/Email/), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/Password/), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Verification Code/)).toBeInTheDocument();
    });

    expect(vi.mocked(authenticate)).toHaveBeenCalledWith(
      expect.anything(),
      { username: 'test@example.com', password: 'Password1!', grant_type: 'password' },
    );
  });

  it('shows a toast on failed logins', async () => {
    vi.mocked(authenticate).mockRejectedValue(new Error('bad credentials'));

    renderAuth();

    await userEvent.type(screen.getByLabelText(/Email/), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/Password/), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(document.querySelector('.vdocs-toast')?.textContent).toContain('Login failed');
    });
  });

  it('renders nothing when visible is false', () => {
    const { container } = renderAuth({ visible: false });

    expect(container.querySelector('form')).not.toBeInTheDocument();
  });
});
