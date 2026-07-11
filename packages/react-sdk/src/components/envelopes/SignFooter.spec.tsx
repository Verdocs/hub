import userEvent from '@testing-library/user-event';
import type { IOrganization } from '@verdocs/js-sdk';
import { render, screen } from '@testing-library/react';
import SignFooter from './SignFooter';

const brandedOrganization: Partial<IOrganization> = {
  name: 'GreenPine Realty',
  powered_by_label: 'Powered by GreenPine Realty',
  powered_by_url: 'https://www.verdocs.com',
  terms_use_url: 'https://verdocs.com/en/eua',
  privacy_policy_url: 'https://verdocs.com/en/privacy-policy',
};

describe('SignFooter', () => {
  it('fires the decline and finish-later callbacks', async () => {
    const user = userEvent.setup();
    const onDecline = vi.fn();
    const onFinishLater = vi.fn();
    render(<SignFooter onDecline={onDecline} onFinishLater={onFinishLater} />);

    await user.click(screen.getByRole('button', { name: 'Decline Signing' }));
    expect(onDecline).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Finish Later' }));
    expect(onFinishLater).toHaveBeenCalledTimes(1);
  });

  it('collects a question through the dialog and reports it', async () => {
    const user = userEvent.setup();
    const onAskQuestion = vi.fn();
    render(<SignFooter onAskQuestion={onAskQuestion} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ask Sender a Question' }));
    await user.type(screen.getByRole('textbox', { name: 'Question' }), 'What is the deadline?');
    await user.click(screen.getByRole('button', { name: 'OK' }));

    expect(onAskQuestion).toHaveBeenCalledWith('What is the deadline?');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cancelling the question dialog reports nothing', async () => {
    const user = userEvent.setup();
    const onAskQuestion = vi.fn();
    render(<SignFooter onAskQuestion={onAskQuestion} />);

    await user.click(screen.getByRole('button', { name: 'Ask Sender a Question' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onAskQuestion).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('hides the action buttons once the recipient is done', () => {
    render(<SignFooter organization={brandedOrganization} isDone />);

    expect(screen.queryByRole('button', { name: 'Ask Sender a Question' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Decline Signing' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Finish Later' })).not.toBeInTheDocument();

    // Branding stays visible for completed recipients.
    expect(screen.getByRole('link', { name: 'Terms of Use' })).toBeInTheDocument();
  });

  it('renders organization branding links', () => {
    render(<SignFooter organization={brandedOrganization} />);

    expect(screen.getByRole('link', { name: 'Powered by GreenPine Realty' })).toHaveAttribute('href', 'https://www.verdocs.com');
    expect(screen.getByRole('link', { name: 'Terms of Use' })).toHaveAttribute('href', 'https://verdocs.com/en/eua');
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', 'https://verdocs.com/en/privacy-policy');
  });

  it('renders the powered-by label as plain text when it has no URL', () => {
    render(<SignFooter organization={{ powered_by_label: 'Powered by GreenPine Realty' }} />);

    expect(screen.getByText('Powered by GreenPine Realty')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Powered by GreenPine Realty' })).not.toBeInTheDocument();
  });

  it('renders no branding without an organization', () => {
    render(<SignFooter />);

    expect(screen.queryByText(/Powered by/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
