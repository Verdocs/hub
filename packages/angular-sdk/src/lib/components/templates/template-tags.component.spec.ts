import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { VerdocsTemplateTagsComponent } from './template-tags.component';

describe('VerdocsTemplateTagsComponent', () => {
  @Component({
    imports: [ VerdocsTemplateTagsComponent ],
    template: `<verdocs-template-tags [tags]="tags()" />`,
  })
  class HostComponent {
    tags = signal<string[]>([ 'onboarding', 'human-resources', 'signed-2026' ]);
  }

  it('renders a chip per tag', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const chips: NodeListOf<HTMLSpanElement> = fixture.nativeElement.querySelectorAll('span');
    expect(chips.length).toBe(3);

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('onboarding');
    expect(text).toContain('human-resources');
    expect(text).toContain('signed-2026');
  });

  it('renders an empty container when there are no tags', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.tags.set([]);
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement.querySelector('verdocs-template-tags');
    expect(host.children.length).toBe(0);
  });

  it('defaults to no tags when the input is omitted', () => {
    const fixture = TestBed.createComponent(VerdocsTemplateTagsComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.children.length).toBe(0);
  });
});
