import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { VerdocsPaginationComponent } from './pagination.component';
import { VerdocsTextInputComponent } from './text-input.component';
import { VerdocsButtonComponent } from './button.component';

describe('VerdocsButtonComponent', () => {
  @Component({
    imports: [ VerdocsButtonComponent ],
    template: `<verdocs-button label="Click Me" [disabled]="disabled()" (click)="clicks = clicks + 1" />`,
  })
  class HostComponent {
    clicks = 0;
    disabled = signal(false);
  }

  it('renders its label and handles clicks', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.textContent).toContain('Click Me');

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

describe('VerdocsTextInputComponent', () => {
  @Component({
    imports: [ VerdocsTextInputComponent ],
    template: `<verdocs-text-input label="Name" [clearable]="true" [(value)]="value" (cleared)="cleared = true" />`,
  })
  class HostComponent {
    value = signal('abc');
    cleared = false;
  }

  it('binds the value and clears via the clear button', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.value).toBe('abc');

    const clearButton: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-label="Clear"]');
    clearButton.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('');
    expect(fixture.componentInstance.cleared).toBe(true);
  });
});

describe('VerdocsPaginationComponent', () => {
  @Component({
    imports: [ VerdocsPaginationComponent ],
    template: `<verdocs-pagination [selectedPage]="0" [itemCount]="45" [perPage]="10" (selectPage)="selected = $event" />`,
  })
  class HostComponent {
    selected = -1;
  }

  it('renders pages and navigates to the last page', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const current = fixture.nativeElement.querySelector('button[aria-current="page"]');
    expect(current.textContent).toContain('1');

    const lastButton: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-label="Last page"]');
    lastButton.click();

    expect(fixture.componentInstance.selected).toBe(4);
  });
});
