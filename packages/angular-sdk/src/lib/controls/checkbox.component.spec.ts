import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { VerdocsCheckboxComponent } from './checkbox.component';

describe('VerdocsCheckboxComponent', () => {
  @Component({
    imports: [ VerdocsCheckboxComponent ],
    template: `<verdocs-checkbox label="Remember me" name="remember" [disabled]="disabled()" [(checked)]="checked" />`,
  })
  class HostComponent {
    checked = signal(false);
    disabled = signal(false);
  }

  it('renders its label and reflects the checked model', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Remember me');

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    expect(input.checked).toBe(false);
    expect(input.name).toBe('remember');

    fixture.componentInstance.checked.set(true);
    fixture.detectChanges();
    expect(input.checked).toBe(true);
  });

  it('updates the model when the user toggles the box', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    input.click();

    expect(fixture.componentInstance.checked()).toBe(true);
  });

  it('disables the native input', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    expect(input.disabled).toBe(true);
  });
});
