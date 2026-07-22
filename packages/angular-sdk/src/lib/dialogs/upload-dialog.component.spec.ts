import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { VerdocsUploadDialogComponent } from './upload-dialog.component';

const pdf = (name: string, content = '%PDF-1.4') => new File([ content ], name, { type: 'application/pdf' });

function pickFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  input.dispatchEvent(new Event('change'));
}

describe('VerdocsUploadDialogComponent', () => {
  @Component({
    imports: [ VerdocsUploadDialogComponent ],
    template: `<verdocs-upload-dialog [maxSize]="maxSize()" (upload)="uploaded = $event" (cancel)="cancels = cancels + 1" />`,
  })
  class HostComponent {
    uploaded: File[] | null = null;
    cancels = 0;
    maxSize = signal(20 * 1024 * 1024);
  }

  async function createFixture() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  const buttonByLabel = (label: string) =>
    Array.from(document.querySelectorAll('button')).find(button => button.textContent?.trim() === label);

  it('enables Upload once a file is chosen and hands the files to upload', async () => {
    const fixture = await createFixture();

    expect((document.querySelector('[role="dialog"]') as HTMLElement).textContent).toContain('Upload attachment');
    expect((buttonByLabel('Upload') as HTMLButtonElement).disabled).toBe(true);

    const file = pdf('contract.pdf');
    pickFiles(document.querySelector('input[type="file"]') as HTMLInputElement, [ file ]);
    fixture.detectChanges();

    const upload = buttonByLabel('Upload') as HTMLButtonElement;
    expect(upload.disabled).toBe(false);
    upload.click();
    expect(fixture.componentInstance.uploaded).toEqual([ file ]);
  });

  it('flags selections over the size limit and keeps Upload disabled', async () => {
    const fixture = await createFixture();
    fixture.componentInstance.maxSize.set(1024);
    fixture.detectChanges();

    pickFiles(document.querySelector('input[type="file"]') as HTMLInputElement, [ pdf('big.pdf', 'x'.repeat(2048)) ]);
    fixture.detectChanges();

    expect((document.querySelector('[role="dialog"]') as HTMLElement).textContent).toContain('Total file size must not exceed 1KB.');
    expect((buttonByLabel('Upload') as HTMLButtonElement).disabled).toBe(true);
    expect(fixture.componentInstance.uploaded).toBeNull();
  });

  it('cancels via the Cancel button and dialog dismissal', async () => {
    const fixture = await createFixture();

    buttonByLabel('Cancel')?.click();
    expect(fixture.componentInstance.cancels).toBe(1);

    (document.querySelector('button[aria-label="Close"]') as HTMLButtonElement).click();
    expect(fixture.componentInstance.cancels).toBe(2);
    expect(fixture.componentInstance.uploaded).toBeNull();
  });
});
