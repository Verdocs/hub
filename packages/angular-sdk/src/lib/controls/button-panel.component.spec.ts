import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { VerdocsButtonPanelComponent } from './button-panel.component';

describe('VerdocsButtonPanelComponent', () => {
  @Component({
    imports: [ VerdocsButtonPanelComponent ],
    template: `
      <verdocs-button-panel label="Field settings">
        <svg icon data-icon="gear"></svg>
        <div class="panel-body">Settings Body</div>
      </verdocs-button-panel>
      <button class="outside">Outside</button>
    `,
  })
  class HostComponent {}

  it('renders the trigger icon with the panel hidden', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-haspopup="dialog"]');
    expect(trigger.querySelector('svg[data-icon="gear"]')).not.toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('opens the anchored panel on click and closes it on an outside click', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-haspopup="dialog"]');
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('Settings Body');
    expect(dialog.getAttribute('aria-label')).toBe('Field settings');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    // The panel renders through the portal, so it lives in document.body, not the host.
    expect(fixture.nativeElement.contains(dialog)).toBe(false);

    (fixture.nativeElement.querySelector('.outside') as HTMLElement).click();
    fixture.detectChanges();

    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});
