import { mount } from '@vue/test-utils';
import VerdocsEnvelopeDocumentPage, { type IDocumentPageInfo } from './VerdocsEnvelopeDocumentPage.vue';

// A 1x1 transparent GIF; jsdom never actually decodes it.
const pageImageUri = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

class ResizeObserverStub {
  observe() {}

  unobserve() {}

  disconnect() {}
}

describe('VerdocsEnvelopeDocumentPage', () => {
  beforeAll(() => {
    // jsdom has no ResizeObserver; the component only uses it for resize notifications.
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('renders the page image with its page-numbered alt text', () => {
    const wrapper = mount(VerdocsEnvelopeDocumentPage, { props: { pageImageUri, pageNumber: 3 } });

    const image = wrapper.get('img');
    expect(image.attributes('src')).toBe(pageImageUri);
    expect(image.attributes('alt')).toBe('Page 3');
  });

  it('overlays slotted children in an absolute layer over the relative page', () => {
    const wrapper = mount(VerdocsEnvelopeDocumentPage, {
      props: { pageImageUri },
      slots: { default: '<div>Signature field</div>' },
    });

    const overlay = wrapper.get('img').element.nextElementSibling as HTMLElement;
    expect(overlay.className).toContain('vdocs:absolute');
    expect(overlay.className).toContain('vdocs:inset-0');
    expect(overlay.textContent).toContain('Signature field');
    expect((overlay.parentElement as HTMLElement).className).toContain('vdocs:relative');
  });

  it('reports page geometry once the image loads', async () => {
    const wrapper = mount(VerdocsEnvelopeDocumentPage, { props: { pageImageUri, pageNumber: 2 } });

    const container = wrapper.element as HTMLElement;
    const image = wrapper.get('img');

    // jsdom does no layout, so supply the numbers the browser would: a 1224x1584
    // source image (letter at 144dpi) rendered into a 306px-wide container.
    Object.defineProperty(container, 'offsetWidth', { value: 306, configurable: true });
    Object.defineProperty(image.element, 'naturalWidth', { value: 1224, configurable: true });
    Object.defineProperty(image.element, 'naturalHeight', { value: 1584, configurable: true });

    expect(wrapper.emitted('pageRendered')).toBeUndefined();

    await image.trigger('load');

    const [ info ] = wrapper.emitted('pageRendered')![0] as [IDocumentPageInfo];
    expect(info.pageNumber).toBe(2);
    expect(info.virtualWidth).toBe(612);
    expect(info.renderedWidth).toBe(306);
    expect(info.naturalWidth).toBe(1224);
    expect(info.naturalHeight).toBe(1584);
    expect(info.virtualHeight).toBeCloseTo(792);
    expect(info.renderedHeight).toBeCloseTo(396);
    expect(info.aspectRatio).toBeCloseTo(1224 / 1584);
    expect(info.xScale).toBeCloseTo(0.5);
    expect(info.yScale).toBeCloseTo(0.5);
  });

  it('reports nothing for an image with no dimensions', async () => {
    const wrapper = mount(VerdocsEnvelopeDocumentPage, { props: { pageImageUri } });

    await wrapper.get('img').trigger('load');

    expect(wrapper.emitted('pageRendered')).toBeUndefined();
  });
});
