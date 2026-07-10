import type { Preview } from '@storybook/react-vite';
// Import the provider from the SDK source, not the built package: stories
// import components by relative path, and both sides must share one context
// module instance.
import { VerdocsProvider } from '../../../packages/react-sdk/src';
import './preview-styles.css';

const apiBase = import.meta.env.VITE_VERDOCS_API_BASE || 'https://stage-api.verdocs.com';

const preview: Preview = {
  decorators: [
    Story => (
      <VerdocsProvider baseUrl={apiBase}>
        <Story />
      </VerdocsProvider>
    ),
  ],
};

export default preview;
