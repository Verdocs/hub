import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { VerdocsLoaderComponent } from './loader.component';

describe('VerdocsLoaderComponent', () => {
  @Component({
    imports: [ VerdocsLoaderComponent ],
    template: `<verdocs-loader />`,
  })
  class HostComponent {}

  it('renders an accessible spinner with its ring of dots', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const status: HTMLElement = fixture.nativeElement.querySelector('[role="status"]');
    expect(status.getAttribute('aria-label')).toBe('Loading');

    const ring = status.querySelector('div');
    expect(ring?.children.length).toBe(8);
  });
});
