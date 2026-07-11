import { mount } from '@vue/test-utils';
import VerdocsTemplateDocumentPage from './VerdocsTemplateDocumentPage.vue';

describe('VerdocsTemplateDocumentPage', () => {
  it('renders the page image when a URI is provided', () => {
    const wrapper = mount(VerdocsTemplateDocumentPage, { props: { pageImageUri: 'https://fake.test/page-3.png', pageNumber: 3 } });

    const image = wrapper.find('img');
    expect(image.attributes('src')).toBe('https://fake.test/page-3.png');
    expect(image.attributes('alt')).toBe('Page 3');
    expect(wrapper.find('[data-testid="page-placeholder"]').exists()).toBe(false);
  });

  it('renders a placeholder while the page image is missing', () => {
    const wrapper = mount(VerdocsTemplateDocumentPage, { props: { pageNumber: 1 } });

    expect(wrapper.find('[data-testid="page-placeholder"]').exists()).toBe(true);
    expect(wrapper.find('img').exists()).toBe(false);
  });

  it('sizes the container from the page dimensions', () => {
    const wrapper = mount(VerdocsTemplateDocumentPage, {
      props: { pageImageUri: 'https://fake.test/page-1.png', virtualWidth: 500, virtualHeight: 1000 },
    });

    expect((wrapper.element as HTMLElement).style.aspectRatio).toBe('500 / 1000');
  });

  it('lays the field layer out at the virtual page size so children keep PDF coordinates', () => {
    const wrapper = mount(VerdocsTemplateDocumentPage, {
      props: { pageImageUri: 'https://fake.test/page-1.png' },
      slots: { default: '<div data-testid="field" style="position:absolute;left:100px;bottom:200px">Field</div>' },
    });

    const child = wrapper.find('[data-testid="field"]').element as HTMLElement;
    expect(child.style.left).toBe('100px');
    expect(child.style.bottom).toBe('200px');

    // jsdom reports zero widths, so the layer stays at the unmeasured 1:1 scale.
    const layer = child.parentElement!;
    expect(layer.style.width).toBe('612px');
    expect(layer.style.height).toBe('792px');
    expect(layer.style.transform).toBe('scale(1)');
    expect(layer.style.transformOrigin).toBe('top left');
  });
});
