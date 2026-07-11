import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { VerdocsProgressBarComponent } from './progress-bar.component';

describe('VerdocsProgressBarComponent', () => {
  @Component({
    imports: [ VerdocsProgressBarComponent ],
    template: `<verdocs-progress-bar label="Uploading" [showPercent]="true" [percent]="percent()" />`,
  })
  class HostComponent {
    percent = signal(40);
  }

  it('renders the label, percentage, and bar width', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Uploading');
    expect(fixture.nativeElement.textContent).toContain('40%');

    const bar: HTMLElement = fixture.nativeElement.querySelector('[role="progressbar"]');
    expect(bar.getAttribute('aria-valuenow')).toBe('40');
    expect((bar.firstElementChild as HTMLElement).style.width).toBe('40%');
  });

  it('clamps out-of-range values to 0-100', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.percent.set(250);
    fixture.detectChanges();

    const bar: HTMLElement = fixture.nativeElement.querySelector('[role="progressbar"]');
    expect(bar.getAttribute('aria-valuenow')).toBe('100');

    fixture.componentInstance.percent.set(-10);
    fixture.detectChanges();
    expect(bar.getAttribute('aria-valuenow')).toBe('0');
  });
});
