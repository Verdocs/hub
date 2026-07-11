import type { IOrganization } from '@verdocs/js-sdk';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { showToast } from '../../utils/toast';
import SignFooter from './SignFooter';

const brandedOrganization: Partial<IOrganization> = {
  name: 'GreenPine Realty',
  powered_by_label: 'Powered by GreenPine Realty',
  powered_by_url: 'https://www.verdocs.com',
  terms_use_url: 'https://verdocs.com/en/eua',
  privacy_policy_url: 'https://verdocs.com/en/privacy-policy',
};

const meta = {
  title: 'Envelopes/Sign Footer',
  component: SignFooter,
  parameters: {
    // The footer is fixed to the bottom of the viewport, so give the canvas the full window.
    layout: 'fullscreen',
  },
  args: {
    onAskQuestion: question => showToast(`Question for the sender: ${question}`, { style: 'info' }),
    onDecline: () => showToast('Declined', { style: 'error' }),
    onFinishLater: () => showToast('Finishing later', { style: 'info' }),
  },
} satisfies Meta<typeof SignFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Mid-signing, no white-label branding: the action buttons center themselves. */
export const Signing: Story = {};

/** Mid-signing with organization branding on either side of the buttons. */
export const SigningWithBranding: Story = {
  args: { organization: brandedOrganization },
};

/** The recipient is done, so the action buttons are hidden and only branding remains. */
export const Done: Story = {
  args: { organization: brandedOrganization, isDone: true },
};

/** A powered-by label with no URL renders as plain text instead of a link. */
export const PoweredByWithoutLink: Story = {
  args: {
    organization: {
      name: 'GreenPine Realty',
      powered_by_label: 'Powered by GreenPine Realty',
    },
  },
};
