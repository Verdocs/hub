import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { VerdocsAdoptSignatureDialogComponent, type IAdoptedSignature } from './adopt-signature-dialog.component';

// jsdom ships no canvas implementation (getContext returns null), so we stub the
// small slice of the 2D API the dialog touches. The metrics values don't matter:
// the font-fitting loop just needs numbers to compare.
function stubCanvas() {
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
}

// jsdom implements PointerEvent but not pointer capture, which the component
// already tolerates with optional calls, so plain dispatches draw a stroke.
function drawStroke(canvas: HTMLCanvasElement) {
  canvas.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: 20, clientY: 30, bubbles: true }));
  canvas.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 60, clientY: 40, bubbles: true }));
  canvas.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 90, clientY: 25, bubbles: true }));
}

describe('VerdocsAdoptSignatureDialogComponent', () => {
  @Component({
    imports: [ VerdocsAdoptSignatureDialogComponent ],
    template: `
      <verdocs-adopt-signature-dialog
        [fullName]="fullName()"
        [nameLocked]="nameLocked()"
        [variant]="variant()"
        (adopted)="adopted = $event"
        (cancel)="cancels = cancels + 1" />
    `,
  })
  class HostComponent {
    adopted: IAdoptedSignature | null = null;
    cancels = 0;
    fullName = signal('');
    nameLocked = signal(false);
    variant = signal<'signature' | 'initials'>('signature');
  }

  beforeEach(() => {
    stubCanvas();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function createFixture() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  const buttonByLabel = (label: string) =>
    Array.from(document.querySelectorAll('button')).find(button => button.textContent?.trim() === label) as HTMLButtonElement | undefined;
  const nameInput = () => document.querySelector('verdocs-text-input input') as HTMLInputElement;
  const canvas = () => document.querySelector('canvas') as HTMLCanvasElement;
  const drawTab = () =>
    Array.from(document.querySelectorAll('[role="tab"]')).find(tab => tab.textContent?.trim() === 'Draw') as HTMLButtonElement;

  it('enables adopt once a name is typed and returns a typed PNG', async () => {
    const fixture = await createFixture();

    const adopt = buttonByLabel('Adopt & Sign') as HTMLButtonElement;
    expect(adopt.disabled).toBe(true);

    nameInput().value = 'Paige Turner';
    nameInput().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(adopt.disabled).toBe(false);

    adopt.click();
    expect(fixture.componentInstance.adopted).toEqual({ type: 'typed', fullName: 'Paige Turner', dataUrl: 'data:image/png;base64,MOCK' });
  });

  it('seeds the name from the input and locks it when nameLocked is set', async () => {
    const fixture = await createFixture();
    fixture.componentInstance.fullName.set('Paige Turner');
    fixture.componentInstance.nameLocked.set(true);
    fixture.detectChanges();

    expect(nameInput().value).toBe('Paige Turner');
    expect(nameInput().disabled).toBe(true);
    expect(document.body.textContent).toContain('Your name has been set by the sender and cannot be changed.');
    expect((buttonByLabel('Adopt & Sign') as HTMLButtonElement).disabled).toBe(false);
  });

  it('requires a drawing in draw mode and returns a drawn PNG', async () => {
    const fixture = await createFixture();
    fixture.componentInstance.fullName.set('Paige Turner');
    fixture.detectChanges();

    drawTab().click();
    fixture.detectChanges();

    const adopt = buttonByLabel('Adopt & Sign') as HTMLButtonElement;
    expect(adopt.disabled).toBe(true);
    expect(canvas().getAttribute('aria-label')).toBe('Signature Preview');

    drawStroke(canvas());
    fixture.detectChanges();
    expect(adopt.disabled).toBe(false);

    adopt.click();
    expect(fixture.componentInstance.adopted).toEqual({ type: 'drawn', fullName: 'Paige Turner', dataUrl: 'data:image/png;base64,MOCK' });
  });

  it('clears the drawing and disables adopt again', async () => {
    const fixture = await createFixture();

    drawTab().click();
    fixture.detectChanges();

    const clear = buttonByLabel('Clear') as HTMLButtonElement;
    expect(clear.disabled).toBe(true);

    drawStroke(canvas());
    fixture.detectChanges();
    expect(clear.disabled).toBe(false);

    clear.click();
    fixture.detectChanges();
    expect(clear.disabled).toBe(true);
    expect((buttonByLabel('Adopt & Sign') as HTMLButtonElement).disabled).toBe(true);
  });

  it('cancels from the cancel button and the dialog close button', async () => {
    const fixture = await createFixture();

    buttonByLabel('Cancel')?.click();
    expect(fixture.componentInstance.cancels).toBe(1);

    (document.querySelector('button[aria-label="Close"]') as HTMLButtonElement).click();
    expect(fixture.componentInstance.cancels).toBe(2);
  });

  it('swaps copy and uppercases the seed for the initials variant', async () => {
    const fixture = await createFixture();
    fixture.componentInstance.variant.set('initials');
    fixture.componentInstance.fullName.set('pt');
    fixture.detectChanges();

    expect(document.body.textContent).toContain('Create Your Initial');
    expect(nameInput().value).toBe('PT');
    expect(canvas().getAttribute('aria-label')).toBe('Initials Preview');
  });
});
