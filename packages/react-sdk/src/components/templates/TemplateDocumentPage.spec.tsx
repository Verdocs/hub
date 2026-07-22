import { render, screen } from '@testing-library/react';
import TemplateDocumentPage from './TemplateDocumentPage';

class ResizeObserverStub {
  observe() {}

  unobserve() {}

  disconnect() {}
}

describe('TemplateDocumentPage', () => {
  beforeAll(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('renders the page image when a URI is provided', () => {
    render(<TemplateDocumentPage pageImageUri="https://fake.test/page-3.png" pageNumber={3} />);

    const image = screen.getByAltText('Page 3');
    expect(image).toHaveAttribute('src', 'https://fake.test/page-3.png');
    expect(screen.queryByTestId('page-placeholder')).not.toBeInTheDocument();
  });

  it('renders a placeholder while the page image is missing', () => {
    render(<TemplateDocumentPage pageNumber={1} />);

    expect(screen.getByTestId('page-placeholder')).toBeInTheDocument();
    expect(screen.queryByAltText('Page 1')).not.toBeInTheDocument();
  });

  it('sizes the container from the page dimensions', () => {
    const { container } = render(<TemplateDocumentPage pageImageUri="https://fake.test/page-1.png" virtualWidth={500} virtualHeight={1000} />);

    expect(container.firstElementChild).toHaveStyle({ aspectRatio: '500 / 1000' });
  });

  it('lays the field layer out at the virtual page size so children keep PDF coordinates', () => {
    render(
      <TemplateDocumentPage pageImageUri="https://fake.test/page-1.png">
        <div data-testid="field" style={{ position: 'absolute', left: 100, bottom: 200 }}>
          Field
        </div>
      </TemplateDocumentPage>,
    );

    const child = screen.getByTestId('field');
    expect(child).toHaveStyle({ left: '100px', bottom: '200px' });

    // jsdom reports zero widths, so the layer stays at the unmeasured 1:1 scale.
    const layer = child.parentElement;
    expect(layer).toHaveStyle({
      width: '612px',
      height: '792px',
      transform: 'scale(1)',
      transformOrigin: 'top left',
    });
  });
});
