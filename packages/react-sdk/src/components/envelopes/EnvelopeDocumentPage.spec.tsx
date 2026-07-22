import { act, render, screen } from '@testing-library/react';
import EnvelopeDocumentPage from './EnvelopeDocumentPage';

// A 1x1 transparent GIF; jsdom never actually decodes it.
const pageImageUri = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

class ResizeObserverStub {
  observe() {}

  unobserve() {}

  disconnect() {}
}

describe('EnvelopeDocumentPage', () => {
  beforeAll(() => {
    // jsdom has no ResizeObserver; the component only uses it for resize notifications.
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('renders the page image', () => {
    render(<EnvelopeDocumentPage pageImageUri={pageImageUri} pageNumber={3} />);

    const image = screen.getByRole('img', { name: 'Page 3' });
    expect(image).toHaveAttribute('src', pageImageUri);
  });

  it('overlays children in a layer positioned over the page', () => {
    render(
      <EnvelopeDocumentPage pageImageUri={pageImageUri}>
        <div>Signature field</div>
      </EnvelopeDocumentPage>,
    );

    const child = screen.getByText('Signature field');
    expect(child.parentElement).toHaveClass('vdocs:absolute', 'vdocs:inset-0');
    expect(child.parentElement?.parentElement).toHaveClass('vdocs:relative');
  });

  it('reports page geometry once the image loads', () => {
    const onPageRendered = vi.fn();
    render(
      <EnvelopeDocumentPage
        data-testid="page"
        pageImageUri={pageImageUri}
        pageNumber={2}
        onPageRendered={onPageRendered}
      />,
    );

    const container = screen.getByTestId('page');
    const image = screen.getByRole('img', { name: 'Page 2' });

    // jsdom does no layout, so supply the numbers the browser would: a 1224x1584
    // source image (letter at 144dpi) rendered into a 306px-wide container.
    Object.defineProperty(container, 'offsetWidth', { value: 306, configurable: true });
    Object.defineProperty(image, 'naturalWidth', { value: 1224, configurable: true });
    Object.defineProperty(image, 'naturalHeight', { value: 1584, configurable: true });

    expect(onPageRendered).not.toHaveBeenCalled();

    act(() => {
      image.dispatchEvent(new Event('load'));
    });

    expect(onPageRendered).toHaveBeenCalledTimes(1);
    expect(onPageRendered).toHaveBeenCalledWith({
      pageNumber: 2,
      virtualWidth: 612,
      virtualHeight: expect.closeTo(792),
      renderedWidth: 306,
      renderedHeight: expect.closeTo(396),
      naturalWidth: 1224,
      naturalHeight: 1584,
      aspectRatio: expect.closeTo(1224 / 1584),
      xScale: expect.closeTo(0.5),
      yScale: expect.closeTo(0.5),
    });
  });

  it('reports nothing for an image with no dimensions', () => {
    const onPageRendered = vi.fn();
    render(<EnvelopeDocumentPage pageImageUri={pageImageUri} onPageRendered={onPageRendered} />);

    act(() => {
      screen.getByRole('img').dispatchEvent(new Event('load'));
    });

    expect(onPageRendered).not.toHaveBeenCalled();
  });
});
