import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { ITab, VerdocsTabsComponent } from './tabs.component';

describe('VerdocsTabsComponent', () => {
  @Component({
    imports: [ VerdocsTabsComponent ],
    template: `<verdocs-tabs [tabs]="tabs" [(selectedTab)]="selected" />`,
  })
  class HostComponent {
    tabs: ITab[] = [
      { label: 'One' },
      { label: 'Two', disabled: true },
      { label: 'Three' },
    ];

    selected = signal(0);
  }

  it('renders the tabs and marks the selection', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const tabs: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(3);
    expect(tabs.item(0).getAttribute('aria-selected')).toBe('true');
    expect(tabs.item(1).disabled).toBe(true);
    expect(tabs.item(2).tabIndex).toBe(-1);
  });

  it('updates the selection model when a tab is clicked, ignoring disabled tabs', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const tabs: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('[role="tab"]');
    tabs.item(2).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selected()).toBe(2);
    expect(tabs.item(2).getAttribute('aria-selected')).toBe('true');

    tabs.item(1).dispatchEvent(new MouseEvent('click'));
    expect(fixture.componentInstance.selected()).toBe(2);
  });

  it('moves the selection with the arrow keys, skipping disabled tabs', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const tabs: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('[role="tab"]');
    tabs.item(0).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.selected()).toBe(2);
    expect(document.activeElement).toBe(tabs.item(2));

    tabs.item(2).dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    expect(fixture.componentInstance.selected()).toBe(0);
  });
});
