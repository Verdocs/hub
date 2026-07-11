import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { VerdocsSelectInputComponent } from './select-input.component';

describe('VerdocsSelectInputComponent', () => {
  @Component({
    imports: [ VerdocsSelectInputComponent ],
    template: `<verdocs-select-input label="Color" [options]="options" [disabled]="disabled()" [(value)]="value" />`,
  })
  class HostComponent {
    options = [
      { label: 'Red', value: 'red' },
      { label: 'Blue', value: 'blue' },
    ];

    value = signal('blue');
    disabled = signal(false);
  }

  it('renders the label and options with the bound value selected', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Color');

    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    expect(select.options.length).toBe(2);
    expect(select.value).toBe('blue');
  });

  it('updates the model when the user picks an option', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    select.value = 'red';
    select.dispatchEvent(new Event('change'));

    expect(fixture.componentInstance.value()).toBe('red');
  });

  it('disables the native select', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    expect(select.disabled).toBe(true);
  });
});
