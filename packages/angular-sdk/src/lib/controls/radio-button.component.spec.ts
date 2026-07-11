import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { VerdocsRadioButtonComponent } from './radio-button.component';

describe('VerdocsRadioButtonComponent', () => {
  @Component({
    imports: [ VerdocsRadioButtonComponent ],
    template: `<verdocs-radio-button label="Blue" name="color" value="blue" [disabled]="disabled()" [(checked)]="checked" />`,
  })
  class HostComponent {
    checked = signal(false);
    disabled = signal(false);
  }

  it('renders a named radio input with its label', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Blue');

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="radio"]');
    expect(input.name).toBe('color');
    expect(input.value).toBe('blue');
    expect(input.checked).toBe(false);
  });

  it('updates the model when selected', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="radio"]');
    input.click();

    expect(fixture.componentInstance.checked()).toBe(true);
  });

  it('disables the native input', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="radio"]');
    expect(input.disabled).toBe(true);
  });
});
