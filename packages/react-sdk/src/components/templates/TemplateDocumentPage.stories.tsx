import type { Meta, StoryObj } from '@storybook/react-vite';
import TemplateDocumentPage from './TemplateDocumentPage';

// A stand-in page image so the story needs no live document: a letter-size
// sheet with a few text-like bars, encoded as an SVG data URL.
const placeholderPage = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="612" height="792" viewBox="0 0 612 792">
    <rect width="612" height="792" fill="#ffffff"/>
    <rect x="60" y="60" width="300" height="18" fill="#d8dbe2"/>
    <rect x="60" y="110" width="492" height="10" fill="#e8eaef"/>
    <rect x="60" y="130" width="492" height="10" fill="#e8eaef"/>
    <rect x="60" y="150" width="420" height="10" fill="#e8eaef"/>
    <rect x="60" y="190" width="492" height="10" fill="#e8eaef"/>
    <rect x="60" y="210" width="380" height="10" fill="#e8eaef"/>
    <rect x="60" y="680" width="200" height="12" fill="#d8dbe2"/>
  </svg>`,
)}`;

const meta = {
  title: 'Templates/Document Page',
  component: TemplateDocumentPage,
  args: {
    pageImageUri: placeholderPage,
    virtualWidth: 612,
    virtualHeight: 792,
    pageNumber: 1,
  },
  parameters: {
    docs: {
      description: {
        component:
          'Renders one document page image with a field layer over it. Children position '
          + 'themselves in PDF points: left from the page left edge, bottom up from the page '
          + 'bottom edge, exactly as field x/y are stored.',
      },
    },
  },
} satisfies Meta<typeof TemplateDocumentPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const WithFieldLayerChildren: Story = {
  render: args => (
    <TemplateDocumentPage {...args}>
      <div
        className="vdocs-signer-1 vdocs:absolute vdocs:box-border vdocs:border vdocs:border-solid vdocs:border-edge vdocs:text-[11px] vdocs:font-sans vdocs:px-1"
        style={{ left: 60, bottom: 560, width: 150, height: 15 }}>
        x=60, y=560
      </div>
      <div
        className="vdocs-signer-2 vdocs:absolute vdocs:box-border vdocs:border vdocs:border-solid vdocs:border-edge vdocs:text-[11px] vdocs:font-sans vdocs:px-1"
        style={{ left: 380, bottom: 90, width: 170, height: 36 }}>
        x=380, y=90
      </div>
    </TemplateDocumentPage>
  ),
};

export const LoadingPlaceholder: Story = {
  args: { pageImageUri: undefined },
};
