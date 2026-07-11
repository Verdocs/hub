import { ChangeDetectionStrategy, Component, ElementRef, input, model, viewChildren } from '@angular/core';

export interface ITab {
  /** Identifier for the tab. Falls back to the label as the list identity. */
  id?: string;
  /** The label to display. */
  label: string;
  /** Disabled tabs render dimmed and cannot be selected. */
  disabled?: boolean;
}

function nextEnabledIndex(tabs: ITab[], from: number, step: 1 | -1) {
  const count = tabs.length;

  for (let offset = 1; offset <= count; offset++) {
    const index = ((from + step * offset) % count + count) % count;
    const tab = tabs[index];
    if (tab && !tab.disabled) {
      return index;
    }
  }

  return from;
}

/**
 * Display a simple row of selectable tabs. The selection is a two-way model
 * holding the selected index: bind with [(selectedTab)]. React's onSelectTab
 * callback is this component's selectedTabChange event (the tab itself is
 * tabs[index]). Arrow keys, Home, and End move the selection, skipping
 * disabled tabs.
 *
 * ```html
 * <verdocs-tabs [tabs]="tabs" [(selectedTab)]="selected" />
 * ```
 */
@Component({
  selector: 'verdocs-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.display]': `'block'` },
  template: `
    <div role="tablist" class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:gap-2.5 vdocs:font-sans">
      @for (tab of tabs(); track tab.id ?? tab.label) {
        <button
          #tabButton
          type="button"
          role="tab"
          [disabled]="tab.disabled || false"
          [attr.aria-selected]="$index === selectedTab()"
          [tabIndex]="$index === selectedTab() ? 0 : -1"
          [class]="tabClasses($index === selectedTab())"
          (click)="selectTab($index)"
          (keydown)="onKeydown($event, $index)">
          {{ tab.label }}
        </button>
      }
    </div>
  `,
})
export class VerdocsTabsComponent {
  /** The tabs to display. */
  readonly tabs = input.required<ITab[]>();
  /** The index of the selected tab. Two-way bindable with [(selectedTab)]. */
  readonly selectedTab = model(0);

  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  protected tabClasses(selected: boolean) {
    return (
      'vdocs:flex vdocs:items-center vdocs:justify-center vdocs:px-2.5 vdocs:py-[5px] vdocs:text-sm vdocs:text-ink vdocs:bg-transparent vdocs:cursor-pointer vdocs:border-0 vdocs:border-b-4 vdocs:border-solid vdocs:disabled:text-edge vdocs:disabled:cursor-default ' +
      (selected ? 'vdocs:font-medium vdocs:border-accent' : 'vdocs:font-normal vdocs:border-transparent')
    );
  }

  protected selectTab(index: number) {
    const tab = this.tabs()[index];
    if (!tab || tab.disabled) {
      return;
    }

    // Focus follows selection so the arrow keys keep working from the new tab.
    this.tabButtons()[index]?.nativeElement.focus();
    this.selectedTab.set(index);
  }

  protected onKeydown(event: KeyboardEvent, index: number) {
    const tabs = this.tabs();

    switch (event.key) {
      case 'ArrowRight':
        this.selectTab(nextEnabledIndex(tabs, index, 1));
        break;
      case 'ArrowLeft':
        this.selectTab(nextEnabledIndex(tabs, index, -1));
        break;
      case 'Home':
        this.selectTab(nextEnabledIndex(tabs, -1, 1));
        break;
      case 'End':
        this.selectTab(nextEnabledIndex(tabs, tabs.length, -1));
        break;
      default:
        return;
    }

    event.preventDefault();
  }
}
