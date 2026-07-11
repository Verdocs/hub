import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { VerdocsDateInputComponent } from './date-input.component';

describe('VerdocsDateInputComponent', () => {
  @Component({
    imports: [ VerdocsDateInputComponent ],
    template: `<verdocs-date-input label="Due date" [disabled]="disabled()" [(value)]="value" />`,
  })
  class HostComponent {
    value = signal('2026-07-10');
    disabled = signal(false);
  }

  it('renders a date input bound to the value', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Due date');

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="date"]');
    expect(input.value).toBe('2026-07-10');
  });

  it('updates the model when the user picks a date', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="date"]');
    input.value = '2026-08-01';
    input.dispatchEvent(new Event('input'));

    expect(fixture.componentInstance.value()).toBe('2026-08-01');
  });

  it('disables the native input', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="date"]');
    expect(input.disabled).toBe(true);
  });
});
