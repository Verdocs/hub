import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { VerdocsSwitchComponent } from './switch.component';

describe('VerdocsSwitchComponent', () => {
  @Component({
    imports: [ VerdocsSwitchComponent ],
    template: `<verdocs-switch label="Notifications" [disabled]="disabled()" [(checked)]="checked" />`,
  })
  class HostComponent {
    checked = signal(false);
    disabled = signal(false);
  }

  it('renders a switch input with its label', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Notifications');

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[role="switch"]');
    expect(input.checked).toBe(false);
  });

  it('updates the model when toggled', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[role="switch"]');
    input.click();
    expect(fixture.componentInstance.checked()).toBe(true);

    input.click();
    expect(fixture.componentInstance.checked()).toBe(false);
  });

  it('disables the native input', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[role="switch"]');
    expect(input.disabled).toBe(true);
  });
});
