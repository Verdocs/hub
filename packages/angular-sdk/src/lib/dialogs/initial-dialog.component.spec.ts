import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import type { IAdoptedSignature } from './adopt-signature-dialog.component';
import { VerdocsInitialDialogComponent } from './initial-dialog.component';

describe('VerdocsInitialDialogComponent', () => {
  @Component({
    imports: [ VerdocsInitialDialogComponent ],
    template: `<verdocs-initial-dialog [initials]="initials()" (adopted)="adopted = $event" (cancel)="cancels = cancels + 1" />`,
  })
  class HostComponent {
    adopted: IAdoptedSignature | null = null;
    cancels = 0;
    initials = signal('');
  }

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

  async function createFixture() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  const buttonByLabel = (label: string) =>
    Array.from(document.querySelectorAll('button')).find(button => button.textContent?.trim() === label) as HTMLButtonElement | undefined;
  const initialsInput = () => document.querySelector('verdocs-text-input input') as HTMLInputElement;

  it('renders the initials variant seeded with uppercased initials', async () => {
    const fixture = await createFixture();
    fixture.componentInstance.initials.set('pt');
    fixture.detectChanges();

    expect(document.body.textContent).toContain('Create Your Initial');
    expect(initialsInput().value).toBe('PT');

    buttonByLabel('Adopt & Sign')?.click();
    expect(fixture.componentInstance.adopted).toEqual({ type: 'typed', fullName: 'PT', dataUrl: 'data:image/png;base64,MOCK' });
  });

  it('disables adopt until initials are entered', async () => {
    const fixture = await createFixture();

    const adopt = buttonByLabel('Adopt & Sign') as HTMLButtonElement;
    expect(adopt.disabled).toBe(true);

    initialsInput().value = 'PT';
    initialsInput().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(adopt.disabled).toBe(false);
  });

  it('fires cancel from the cancel button', async () => {
    const fixture = await createFixture();

    buttonByLabel('Cancel')?.click();
    expect(fixture.componentInstance.cancels).toBe(1);
  });
});
