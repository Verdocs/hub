import type { Meta, StoryObj } from '@storybook/react-vite';
import EnvelopeDocumentPage from './EnvelopeDocumentPage';

// A stand-in letter-size page so the story has no backend dependency. Real callers
// resolve the image with getEnvelopeDocumentPageDisplayUri() in the JS SDK.
const placeholderPage = (label: string) => {
  const lines = Array.from({ length: 18 }, (_, i) => {
    const width = i % 4 === 3 ? 320 : 516;
    return `<rect x="48" y="${150 + i * 30}" width="${width}" height="10" rx="3" fill="#e4e6ee"/>`;
  }).join('');

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="612" height="792" viewBox="0 0 612 792">`
    + '<rect width="612" height="792" fill="#ffffff"/>'
    + `<rect x="48" y="56" width="280" height="22" rx="3" fill="#c6cad6"/>${lines}`
    + `<text x="48" y="740" font-family="sans-serif" font-size="14" fill="#9aa1b1">${label}</text>`
    + '</svg>';

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const meta = {
  title: 'Envelopes/Document Page',
  component: EnvelopeDocumentPage,
  args: {
    pageImageUri: placeholderPage('Page 1 of 2'),
    pageNumber: 1,
    onPageRendered: info => console.log('[EnvelopeDocumentPage] pageRendered', info),
  },
} satisfies Meta<typeof EnvelopeDocumentPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A bare page with no overlay content. Resize the canvas to see pageRendered logged. */
export const PageOnly: Story = {};

/** Children render in a layer over the page, absolutely positioned in rendered-page coordinates. */
export const WithFieldOverlay: Story = {
  render: args => (
    <EnvelopeDocumentPage {...args}>
      <div className="vdocs-signer-1 vdocs:absolute vdocs:left-[8%] vdocs:top-[75%] vdocs:flex vdocs:h-9 vdocs:w-40 vdocs:items-center vdocs:justify-center vdocs:font-sans vdocs:text-xs vdocs:opacity-90">
        Signature
      </div>
      <div className="vdocs-signer-2 vdocs:absolute vdocs:left-[55%] vdocs:top-[75%] vdocs:flex vdocs:h-9 vdocs:w-32 vdocs:items-center vdocs:justify-center vdocs:font-sans vdocs:text-xs vdocs:opacity-90">
        Date
      </div>
    </EnvelopeDocumentPage>
  ),
};

/** Pages scale with their container; field overlays keep their relative positions. */
export const NarrowContainer: Story = {
  args: { pageImageUri: placeholderPage('Page 2 of 2'), pageNumber: 2 },
  render: args => (
    <div className="vdocs:w-[320px]">
      <EnvelopeDocumentPage {...args}>
        <div className="vdocs-signer-1 vdocs:absolute vdocs:left-[8%] vdocs:top-[75%] vdocs:flex vdocs:h-7 vdocs:w-24 vdocs:items-center vdocs:justify-center vdocs:font-sans vdocs:text-[10px] vdocs:opacity-90">
          Signature
        </div>
      </EnvelopeDocumentPage>
    </div>
  ),
};
