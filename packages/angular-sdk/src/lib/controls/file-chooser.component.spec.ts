import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { VerdocsFileChooserComponent } from './file-chooser.component';

const pdf = (name: string) => new File([ '%PDF-1.4' ], name, { type: 'application/pdf' });

function pickFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  input.dispatchEvent(new Event('change'));
}

describe('VerdocsFileChooserComponent', () => {
  @Component({
    imports: [ VerdocsFileChooserComponent ],
    template: `<verdocs-file-chooser [multiple]="multiple()" (selectFiles)="selected = $event" />`,
  })
  class HostComponent {
    selected: File[] | null = null;
    multiple = signal(false);
  }

  it('reports a selected file and updates the prompt', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Drag a file here');
    expect(fixture.nativeElement.textContent).toContain('Select a file from your computer');

    const file = pdf('contract.pdf');
    pickFiles(fixture.nativeElement.querySelector('input[type="file"]'), [ file ]);
    fixture.detectChanges();

    expect(fixture.componentInstance.selected).toEqual([ file ]);
    expect(fixture.nativeElement.textContent).toContain('contract.pdf');
    expect(fixture.nativeElement.textContent).toContain('Select a different file');
  });

  it('clears the selection when the user goes to pick a different file', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    pickFiles(fixture.nativeElement.querySelector('input[type="file"]'), [ pdf('contract.pdf') ]);
    fixture.detectChanges();

    const browse: HTMLButtonElement = fixture.nativeElement.querySelector('verdocs-button button');
    browse.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selected).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('Drag a file here');
  });

  it('accepts several files when multiple is set', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="file"]');
    expect(input.multiple).toBe(true);

    const files = [ pdf('nda.pdf'), pdf('lease.pdf') ];
    pickFiles(input, files);
    fixture.detectChanges();

    expect(fixture.componentInstance.selected).toEqual(files);
    expect(fixture.nativeElement.textContent).toContain('nda.pdf, lease.pdf');
  });
});
