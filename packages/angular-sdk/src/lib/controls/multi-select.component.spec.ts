import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { VerdocsMultiSelectComponent } from './multi-select.component';

describe('VerdocsMultiSelectComponent', () => {
  @Component({
    imports: [ VerdocsMultiSelectComponent ],
    template: `<verdocs-multi-select label="Tags" placeholder="Pick some..." [options]="options" [(selectedOptions)]="selected" />`,
  })
  class HostComponent {
    options = [
      { label: 'Red', value: 'red' },
      { label: 'Blue', value: 'blue' },
    ];

    selected = signal<string[]>([]);
  }

  function openPanel(fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>) {
    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-expanded]');
    trigger.click();
    fixture.detectChanges();
  }

  it('shows the placeholder and opens the option list', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Pick some...');
    expect(fixture.nativeElement.querySelector('[role="group"]')).toBeNull();

    openPanel(fixture);

    const panel: HTMLElement = fixture.nativeElement.querySelector('[role="group"]');
    expect(panel.textContent).toContain('Red');
    expect(panel.textContent).toContain('Blue');
  });

  it('updates the model and chips as options are toggled', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    openPanel(fixture);

    const boxes: NodeListOf<HTMLInputElement> = fixture.nativeElement.querySelectorAll('[role="group"] input[type="checkbox"]');
    boxes.item(0).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selected()).toEqual([ 'red' ]);

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-expanded]');
    expect(trigger.textContent).toContain('Red');
    expect(trigger.textContent).not.toContain('Pick some...');

    boxes.item(0).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toEqual([]);
  });

  it('closes on an outside click or Escape', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    openPanel(fixture);
    document.body.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="group"]')).toBeNull();

    openPanel(fixture);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="group"]')).toBeNull();
  });
});
