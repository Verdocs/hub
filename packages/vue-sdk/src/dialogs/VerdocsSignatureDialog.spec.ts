import { DOMWrapper, mount } from '@vue/test-utils';
import VerdocsSignatureDialog from './VerdocsSignatureDialog.vue';

// The dialog teleports to document.body, so assertions and clicks go through a
// body wrapper rather than the mount wrapper.
const body = () => new DOMWrapper(document.body);

const buttonByLabel = (label: string) => body().findAll('button').find(button => button.text() === label)!;

describe('VerdocsSignatureDialog', () => {
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

  it('hosts the signature adopt flow and returns the adopted image', async () => {
    const wrapper = mount(VerdocsSignatureDialog, { props: { fullName: 'Paige Turner' } });

    expect(body().get('[role="dialog"]').text()).toContain('Adopt Your Signature');
    expect(body().findAll('[role="tab"]').map(tab => tab.text())).toEqual([ 'Type', 'Draw' ]);

    await buttonByLabel('Adopt & Sign').trigger('click');
    expect(wrapper.emitted('adopted')).toEqual([ [ { type: 'typed', fullName: 'Paige Turner', dataUrl: 'data:image/png;base64,MOCK' } ] ]);

    wrapper.unmount();
  });

  it('fires cancel from the cancel button', async () => {
    const wrapper = mount(VerdocsSignatureDialog);

    await buttonByLabel('Cancel').trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(1);

    wrapper.unmount();
  });
});
