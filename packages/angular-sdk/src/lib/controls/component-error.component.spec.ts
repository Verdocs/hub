import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { VerdocsComponentErrorComponent } from './component-error.component';

describe('VerdocsComponentErrorComponent', () => {
  @Component({
    imports: [ VerdocsComponentErrorComponent ],
    template: `<verdocs-component-error message="Something went wrong." />`,
  })
  class HostComponent {}

  it('renders the message as an alert', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const alert: HTMLElement = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert.textContent).toContain('Something went wrong.');
  });
});
