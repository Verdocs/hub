import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { VerdocsSignatureDialogComponent } from './signature-dialog.component';
import type { IAdoptedSignature } from './adopt-signature-dialog.component';

describe('VerdocsSignatureDialogComponent', () => {
  @Component({
    imports: [ VerdocsSignatureDialogComponent ],
    template: `<verdocs-signature-dialog fullName="Paige Turner" (adopted)="adopted = $event" (cancel)="cancels = cancels + 1" />`,
  })
  class HostComponent {
    adopted: IAdoptedSignature | null = null;
    cancels = 0;
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

  it('hosts the signature adopt flow and returns the adopted image', async () => {
    const fixture = await createFixture();

    expect(document.body.textContent).toContain('Adopt Your Signature');
    const tabs = Array.from(document.querySelectorAll('[role="tab"]')).map(tab => tab.textContent?.trim());
    expect(tabs).toEqual([ 'Type', 'Draw' ]);

    buttonByLabel('Adopt & Sign')?.click();
    expect(fixture.componentInstance.adopted).toEqual({ type: 'typed', fullName: 'Paige Turner', dataUrl: 'data:image/png;base64,MOCK' });
  });

  it('fires cancel from the cancel button', async () => {
    const fixture = await createFixture();

    buttonByLabel('Cancel')?.click();
    expect(fixture.componentInstance.cancels).toBe(1);
  });
});
