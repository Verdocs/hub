import { nextTick } from 'vue';
import { DOMWrapper, mount } from '@vue/test-utils';
import VerdocsAdoptSignatureDialog from './VerdocsAdoptSignatureDialog.vue';

// jsdom ships no canvas implementation (getContext returns null), so we stub the
// small slice of the 2D API the dialog touches. The metrics values don't matter:
// the font-fitting loop just needs numbers to compare.
const stubCanvas = () => {
  const context = {
    setTransform: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 } as TextMetrics)),
  };

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,MOCK');
};

// The dialog teleports to document.body, so assertions and clicks go through a
// body wrapper rather than the mount wrapper.
const body = () => new DOMWrapper(document.body);

const buttonByLabel = (label: string) => body().findAll('button').find(button => button.text() === label)!;

const tabByLabel = (label: string) => body().findAll('[role="tab"]').find(tab => tab.text() === label)!;

// jsdom implements PointerEvent but not pointer capture, which the component
// already tolerates with optional calls, so plain dispatches draw a stroke.
// (test-utils trigger cannot carry clientX/clientY: they are readonly getters.)
const drawStroke = async () => {
  const canvas = body().get('canvas').element;
  canvas.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: 20, clientY: 30, bubbles: true }));
  canvas.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 60, clientY: 40, bubbles: true }));
  canvas.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 90, clientY: 25, bubbles: true }));
  await nextTick();
};

describe('VerdocsAdoptSignatureDialog', () => {
  beforeEach(() => {
    stubCanvas();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('enables adopt once a name is typed and returns a typed PNG', async () => {
    const wrapper = mount(VerdocsAdoptSignatureDialog);

    expect(buttonByLabel('Adopt & Sign').attributes('disabled')).toBeDefined();

    await body().get('input').setValue('Paige Turner');
    expect(buttonByLabel('Adopt & Sign').attributes('disabled')).toBeUndefined();

    await buttonByLabel('Adopt & Sign').trigger('click');
    expect(wrapper.emitted('adopted')).toEqual([ [ { type: 'typed', fullName: 'Paige Turner', dataUrl: 'data:image/png;base64,MOCK' } ] ]);

    wrapper.unmount();
  });

  it('seeds the name from props and locks it when nameLocked is set', () => {
    const wrapper = mount(VerdocsAdoptSignatureDialog, { props: { fullName: 'Paige Turner', nameLocked: true } });

    const input = body().get<HTMLInputElement>('input');
    expect(input.element.value).toBe('Paige Turner');
    expect(input.attributes('disabled')).toBeDefined();
    expect(body().get('[role="dialog"]').text()).toContain('Your name has been set by the sender and cannot be changed.');
    expect(buttonByLabel('Adopt & Sign').attributes('disabled')).toBeUndefined();

    wrapper.unmount();
  });

  it('requires a drawing in draw mode and returns a drawn PNG', async () => {
    const wrapper = mount(VerdocsAdoptSignatureDialog, { props: { fullName: 'Paige Turner' } });

    await tabByLabel('Draw').trigger('click');

    expect(body().get('canvas').attributes('aria-label')).toBe('Signature Preview');
    expect(buttonByLabel('Adopt & Sign').attributes('disabled')).toBeDefined();

    await drawStroke();
    expect(buttonByLabel('Adopt & Sign').attributes('disabled')).toBeUndefined();

    await buttonByLabel('Adopt & Sign').trigger('click');
    expect(wrapper.emitted('adopted')).toEqual([ [ { type: 'drawn', fullName: 'Paige Turner', dataUrl: 'data:image/png;base64,MOCK' } ] ]);

    wrapper.unmount();
  });

  it('clears the drawing and disables adopt again', async () => {
    const wrapper = mount(VerdocsAdoptSignatureDialog);

    await tabByLabel('Draw').trigger('click');

    expect(buttonByLabel('Clear').attributes('disabled')).toBeDefined();

    await drawStroke();
    expect(buttonByLabel('Clear').attributes('disabled')).toBeUndefined();

    await buttonByLabel('Clear').trigger('click');
    expect(buttonByLabel('Clear').attributes('disabled')).toBeDefined();
    expect(buttonByLabel('Adopt & Sign').attributes('disabled')).toBeDefined();

    wrapper.unmount();
  });

  it('cancels from the cancel button and the dialog close button', async () => {
    const wrapper = mount(VerdocsAdoptSignatureDialog);

    await buttonByLabel('Cancel').trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(1);

    await body().get('button[aria-label="Close"]').trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(2);

    wrapper.unmount();
  });

  it('swaps copy and uppercases the seed for the initials variant', () => {
    const wrapper = mount(VerdocsAdoptSignatureDialog, { props: { variant: 'initials', fullName: 'pt' } });

    expect(body().get('[role="dialog"]').text()).toContain('Create Your Initial');
    expect(body().get<HTMLInputElement>('input').element.value).toBe('PT');
    expect(body().get('canvas').attributes('aria-label')).toBe('Initials Preview');

    wrapper.unmount();
  });
});
