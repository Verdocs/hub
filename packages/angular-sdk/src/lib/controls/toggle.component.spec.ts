import { TestBed } from '@angular/core/testing';
import { Component, computed, signal, TemplateRef, viewChild } from '@angular/core';
import { IToggleButton, VerdocsToggleComponent } from './toggle.component';

describe('VerdocsToggleComponent', () => {
  @Component({
    imports: [ VerdocsToggleComponent ],
    template: `
      <ng-template #boldIcon><svg data-icon="bold"></svg></ng-template>
      <ng-template #italicIcon><svg data-icon="italic"></svg></ng-template>
      <verdocs-toggle label="Style" [buttons]="buttons()" [(selection)]="selection" />
    `,
  })
  class HostComponent {
    readonly boldIcon = viewChild<TemplateRef<unknown>>('boldIcon');
    readonly italicIcon = viewChild<TemplateRef<unknown>>('italicIcon');
    readonly selection = signal(0);

    readonly buttons = computed<IToggleButton[]>(() => {
      const bold = this.boldIcon();
      const italic = this.italicIcon();
      if (!bold || !italic) {
        return [];
      }

      return [
        { id: 'bold', label: 'Bold', icon: bold },
        { id: 'italic', label: 'Italic', icon: italic },
      ];
    });
  }

  async function createFixture() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders a button per entry with its icon and marks the selection', async () => {
    const fixture = await createFixture();

    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBe(2);
    expect(buttons.item(0).getAttribute('aria-pressed')).toBe('true');
    expect(buttons.item(1).getAttribute('aria-pressed')).toBe('false');
    expect(buttons.item(0).querySelector('svg[data-icon="bold"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Style');
  });

  it('updates the selection model when a button is clicked', async () => {
    const fixture = await createFixture();

    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    buttons.item(1).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selection()).toBe(1);
    expect(buttons.item(1).getAttribute('aria-pressed')).toBe('true');
    expect(buttons.item(0).getAttribute('aria-pressed')).toBe('false');
  });
});
