import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { VerdocsHelpIconComponent } from './help-icon.component';

describe('VerdocsHelpIconComponent', () => {
  @Component({
    imports: [ VerdocsHelpIconComponent ],
    template: `<verdocs-help-icon text="Helpful tip" />`,
  })
  class HostComponent {}

  @Component({
    imports: [ VerdocsHelpIconComponent ],
    template: `<verdocs-help-icon text="Helpful tip"><svg data-icon="custom"></svg></verdocs-help-icon>`,
  })
  class CustomIconHostComponent {}

  it('shows the tooltip on hover and hides it on leave', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="tooltip"]')).toBeNull();

    const trigger: HTMLElement = fixture.nativeElement.querySelector('[role="img"]');
    trigger.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();

    const tooltip: HTMLElement = fixture.nativeElement.querySelector('[role="tooltip"]');
    expect(tooltip.textContent).toContain('Helpful tip');

    trigger.dispatchEvent(new Event('mouseleave'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('shows the tooltip on focus', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const trigger: HTMLElement = fixture.nativeElement.querySelector('[role="img"]');
    trigger.dispatchEvent(new Event('focus'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="tooltip"]')).not.toBeNull();
  });

  it('replaces the standard icon with projected content', () => {
    const fixture = TestBed.createComponent(CustomIconHostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('svg[data-icon="custom"]')).not.toBeNull();
  });
});
