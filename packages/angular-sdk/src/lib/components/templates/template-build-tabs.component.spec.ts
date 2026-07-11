import { TestBed } from '@angular/core/testing';
import type { ITemplate } from '@verdocs/js-sdk';
import { Component, signal } from '@angular/core';
import { VerdocsTemplateBuildTabsComponent, type TVerdocsBuildStep } from './template-build-tabs.component';

const sampleTemplate = (overrides: Partial<ITemplate> = {}): ITemplate =>
  ({
    id: 'tpl-1',
    name: 'Test Template',
    documents: [ { id: 'doc-1' } ],
    roles: [ { name: 'Recipient 1' } ],
    fields: [ { name: 'textboxP1-1' } ],
    ...overrides,
  }) as ITemplate;

describe('VerdocsTemplateBuildTabsComponent', () => {
  @Component({
    imports: [ VerdocsTemplateBuildTabsComponent ],
    template: `<verdocs-template-build-tabs [selectedStep]="step()" [template]="template()" (selectStep)="selected.push($event)" />`,
  })
  class HostComponent {
    selected: TVerdocsBuildStep[] = [];
    step = signal<TVerdocsBuildStep>('attachments');
    template = signal<ITemplate | null>(null);
  }

  const tabByLabel = (fixture: { nativeElement: HTMLElement }, label: string) =>
    Array.from(fixture.nativeElement.querySelectorAll<HTMLButtonElement>('[role="tab"]')).find(
      tab => tab.textContent?.trim() === label);

  it('renders the four builder steps with the selected one marked', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.step.set('fields');
    fixture.componentInstance.template.set(sampleTemplate());
    fixture.detectChanges();

    expect(tabByLabel(fixture, 'Attachments')?.getAttribute('aria-selected')).toBe('false');
    expect(tabByLabel(fixture, 'Workflow')?.disabled).toBe(false);
    expect(tabByLabel(fixture, 'Fields')?.getAttribute('aria-selected')).toBe('true');
    expect(tabByLabel(fixture, 'Preview & Send')?.disabled).toBe(false);
  });

  it('leaves only Attachments enabled without a template', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(tabByLabel(fixture, 'Attachments')?.disabled).toBe(false);
    expect(tabByLabel(fixture, 'Workflow')?.disabled).toBe(true);
    expect(tabByLabel(fixture, 'Fields')?.disabled).toBe(true);
    expect(tabByLabel(fixture, 'Preview & Send')?.disabled).toBe(true);
  });

  it('unlocks steps as the template gains documents, roles, and fields', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.template.set(sampleTemplate({ roles: [], fields: [] }));
    fixture.detectChanges();

    expect(tabByLabel(fixture, 'Workflow')?.disabled).toBe(false);
    expect(tabByLabel(fixture, 'Fields')?.disabled).toBe(true);
    expect(tabByLabel(fixture, 'Preview & Send')?.disabled).toBe(true);

    fixture.componentInstance.template.set(sampleTemplate({ fields: [] }));
    fixture.detectChanges();

    expect(tabByLabel(fixture, 'Fields')?.disabled).toBe(false);
    expect(tabByLabel(fixture, 'Preview & Send')?.disabled).toBe(true);
  });

  it('fires selectStep with the step id and ignores disabled steps', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.template.set(sampleTemplate({ fields: [] }));
    fixture.detectChanges();

    tabByLabel(fixture, 'Workflow')?.click();
    expect(fixture.componentInstance.selected).toEqual([ 'roles' ]);

    tabByLabel(fixture, 'Preview & Send')?.click();
    expect(fixture.componentInstance.selected).toEqual([ 'roles' ]);
  });
});
