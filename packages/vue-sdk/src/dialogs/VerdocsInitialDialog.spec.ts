import { DOMWrapper, mount } from '@vue/test-utils';
import VerdocsInitialDialog from './VerdocsInitialDialog.vue';

// The dialog teleports to document.body, so assertions and clicks go through a
// body wrapper rather than the mount wrapper.
const body = () => new DOMWrapper(document.body);

const buttonByLabel = (label: string) => body().findAll('button').find(button => button.text() === label)!;

describe('VerdocsInitialDialog', () => {
  beforeEach(() => {
    // jsdom has no canvas; stub just enough of the 2D API for the preview paint
    // and the adopt-time PNG capture.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      setTransform: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 } as TextMetrics)),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,MOCK');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the initials variant seeded with uppercased initials', async () => {
    const wrapper = mount(VerdocsInitialDialog, { props: { initials: 'pt' } });

    expect(body().get('[role="dialog"]').text()).toContain('Create Your Initial');
    expect(body().get<HTMLInputElement>('input').element.value).toBe('PT');

    await buttonByLabel('Adopt & Sign').trigger('click');
    expect(wrapper.emitted('adopted')).toEqual([ [ { type: 'typed', fullName: 'PT', dataUrl: 'data:image/png;base64,MOCK' } ] ]);

    wrapper.unmount();
  });

  it('disables adopt until initials are entered', async () => {
    const wrapper = mount(VerdocsInitialDialog);

    expect(buttonByLabel('Adopt & Sign').attributes('disabled')).toBeDefined();

    await body().get('input').setValue('PT');
    expect(buttonByLabel('Adopt & Sign').attributes('disabled')).toBeUndefined();

    wrapper.unmount();
  });

  it('fires cancel from the cancel button', async () => {
    const wrapper = mount(VerdocsInitialDialog);

    await buttonByLabel('Cancel').trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(1);

    wrapper.unmount();
  });
});
