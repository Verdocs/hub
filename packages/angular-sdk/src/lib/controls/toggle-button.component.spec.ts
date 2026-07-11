import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { VerdocsToggleButtonComponent } from './toggle-button.component';

describe('VerdocsToggleButtonComponent', () => {
  @Component({
    imports: [ VerdocsToggleButtonComponent ],
    template: `
      <div (click)="outerClicks = outerClicks + 1">
        <verdocs-toggle-button label="Messages" [(active)]="active" />
      </div>
    `,
  })
  class HostComponent {
    active = signal(false);
    outerClicks = 0;
  }

  @Component({
    imports: [ VerdocsToggleButtonComponent ],
    template: `<verdocs-toggle-button label="Messages" [(active)]="active"><svg data-icon="message"></svg></verdocs-toggle-button>`,
  })
  class IconHostComponent {
    active = signal(false);
  }

  it('renders the label face and toggles the active model', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.textContent).toContain('Messages');
    expect(button.getAttribute('aria-pressed')).toBe('false');

    button.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.active()).toBe(true);
    expect(button.getAttribute('aria-pressed')).toBe('true');

    button.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.active()).toBe(false);
  });

  it('does not surface toggle clicks to ancestors', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    button.click();

    expect(fixture.componentInstance.outerClicks).toBe(0);
  });

  it('renders projected icon content with the label as the accessible name', () => {
    const fixture = TestBed.createComponent(IconHostComponent);
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.querySelector('svg[data-icon="message"]')).not.toBeNull();
    expect(button.getAttribute('aria-label')).toBe('Messages');
  });
});
