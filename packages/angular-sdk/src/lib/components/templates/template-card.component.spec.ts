import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import type { IOrganization, ITemplate, ITemplateDocument } from '@verdocs/js-sdk';
import { VerdocsTemplateCardComponent } from './template-card.component';

const sampleTemplate = {
  id: 't-1',
  name: 'Onboarding Packet',
  counter: 12,
  star_counter: 4,
  organization: { id: 'o-1', name: 'Acme Document Co' } as IOrganization,
  documents: [ { id: 'd-1', pages: 3 } as ITemplateDocument ],
} as ITemplate;

describe('VerdocsTemplateCardComponent', () => {
  @Component({
    imports: [ VerdocsTemplateCardComponent ],
    template: `<verdocs-template-card [template]="template()" (selectTemplate)="selected = $event" />`,
  })
  class HostComponent {
    selected: ITemplate | null = null;
    template = signal(sampleTemplate);
  }

  it('renders the name, organization, and counts', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Onboarding Packet');
    expect(text).toContain('Acme Document Co');
    expect(text).toContain('4');
    expect(text).toContain('3');
    expect(text).toContain('12');
  });

  it('falls back to Public and one page when relations are missing', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.template.set({ ...sampleTemplate, organization: undefined, documents: undefined } as ITemplate);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Public');
    expect(text).toContain('1');
  });

  it('fires selectTemplate with the template when the card is clicked', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('verdocs-template-card') as HTMLElement).click();

    expect(fixture.componentInstance.selected).toEqual(sampleTemplate);
  });
});
