import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { VerdocsToolbarIconComponent } from './toolbar-icon.component';

describe('VerdocsToolbarIconComponent', () => {
  @Component({
    imports: [ VerdocsToolbarIconComponent ],
    template: `
      <verdocs-toolbar-icon text="Preview" [disabled]="disabled()" (click)="clicks = clicks + 1">
        <svg data-icon="preview"></svg>
      </verdocs-toolbar-icon>
    `,
  })
  class HostComponent {
    clicks = 0;
    disabled = signal(false);
  }

  it('renders the projected icon and shows the tooltip on focus', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('svg[data-icon="preview"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[role="tooltip"]')).toBeNull();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Preview');

    button.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="tooltip"]')?.textContent).toContain('Preview');

    button.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('surfaces clicks through the host element', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    button.click();

    expect(fixture.componentInstance.clicks).toBe(1);
  });

  it('disables the native button', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(true);
  });
});
