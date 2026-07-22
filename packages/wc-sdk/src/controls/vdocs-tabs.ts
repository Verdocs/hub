import { html } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

export interface ITab {
  /** Identifier for the tab. */
  id?: string;
  /** The label to display. */
  label: string;
  /** Disabled tabs render dimmed and cannot be selected. */
  disabled?: boolean;
}

/** Carried by vdocs-select-tab events. */
export interface ITabSelectEvent {
  tab: ITab;
  index: number;
}

const nextEnabledIndex = (tabs: ITab[], from: number, step: 1 | -1) => {
  const count = tabs.length;

  for (let offset = 1; offset <= count; offset++) {
    const index = ((from + step * offset) % count + count) % count;
    const tab = tabs[index];
    if (tab && !tab.disabled) {
      return index;
    }
  }

  return from;
};

/**
 * Display a simple row of selectable tabs. This is a controlled element: the
 * host owns selected-tab and updates it as vdocs-select-tab fires. Arrow keys,
 * Home, and End move the selection, skipping disabled tabs.
 *
 * @fires vdocs-select-tab - Fired when the user selects a tab, with an ITabSelectEvent in detail.
 */
export class VdocsTabs extends VdocsElement {
  static override properties = {
    tabs: { attribute: false },
    selectedTab: { type: Number, attribute: 'selected-tab' },
  };

  /** The tabs to display. Property-only. */
  declare tabs: ITab[];
  /** The index of the tab to show selected. */
  declare selectedTab: number;

  constructor() {
    super();
    this.tabs = [];
    this.selectedTab = 0;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:block');
  }

  private selectTab(index: number) {
    const tab = this.tabs[index];
    if (!tab || tab.disabled) {
      return;
    }

    // Focus follows selection so the arrow keys keep working from the new tab.
    this.querySelectorAll<HTMLButtonElement>('[role="tab"]')[index]?.focus();
    this.emit<ITabSelectEvent>('vdocs-select-tab', { tab, index });
  }

  private handleKeyDown(e: KeyboardEvent, index: number) {
    switch (e.key) {
      case 'ArrowRight':
        this.selectTab(nextEnabledIndex(this.tabs, index, 1));
        break;
      case 'ArrowLeft':
        this.selectTab(nextEnabledIndex(this.tabs, index, -1));
        break;
      case 'Home':
        this.selectTab(nextEnabledIndex(this.tabs, -1, 1));
        break;
      case 'End':
        this.selectTab(nextEnabledIndex(this.tabs, this.tabs.length, -1));
        break;
      default:
        return;
    }

    e.preventDefault();
  }

  override render() {
    return html`
      <div role="tablist" class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:gap-2.5 vdocs:font-sans">
        ${this.tabs.map((tab, index) => html`
          <button
            type="button"
            role="tab"
            ?disabled=${tab.disabled}
            aria-selected=${index === this.selectedTab}
            tabindex=${index === this.selectedTab ? 0 : -1}
            @click=${() => this.selectTab(index)}
            @keydown=${(e: KeyboardEvent) => this.handleKeyDown(e, index)}
            class="vdocs:flex vdocs:items-center vdocs:justify-center vdocs:px-2.5 vdocs:py-[5px] vdocs:text-sm vdocs:text-ink vdocs:bg-transparent vdocs:cursor-pointer vdocs:border-0 vdocs:border-b-4 vdocs:border-solid vdocs:disabled:text-edge vdocs:disabled:cursor-default ${index === this.selectedTab ?
              'vdocs:font-medium vdocs:border-accent' :
              'vdocs:font-normal vdocs:border-transparent'}">
            ${tab.label}
          </button>`)}
      </div>`;
  }
}

register('vdocs-tabs', VdocsTabs);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-tabs': VdocsTabs;
  }

  interface GlobalEventHandlersEventMap {
    'vdocs-select-tab': CustomEvent<ITabSelectEvent>;
  }
}
