import { useRef } from 'react';
import type { KeyboardEvent } from 'react';

export interface ITab {
  /** Identifier for the tab. Falls back to the label as the React key. */
  id?: string;
  /** The label to display. */
  label: string;
  /** Disabled tabs render dimmed and cannot be selected. */
  disabled?: boolean;
}

export interface TabsProps {
  /** The tabs to display. */
  tabs: ITab[];
  /** The index of the tab to show selected. */
  selectedTab?: number;
  /** Called when the user selects a tab. */
  onSelectTab?: (tab: ITab, index: number) => void;
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
 * Display a simple row of selectable tabs. This is a controlled component: the
 * parent owns selectedTab and updates it as onSelectTab fires. Arrow keys, Home,
 * and End move the selection, skipping disabled tabs.
 *
 * ```tsx
 * <Tabs tabs={tabs} selectedTab={selected} onSelectTab={(tab, index) => setSelected(index)} />
 * ```
 */
export default function Tabs({ tabs, selectedTab = 0, onSelectTab }: TabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectTab = (index: number) => {
    const tab = tabs[index];
    if (!tab || tab.disabled) {
      return;
    }

    // Focus follows selection so the arrow keys keep working from the new tab.
    tabRefs.current[index]?.focus();
    onSelectTab?.(tab, index);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (e.key) {
      case 'ArrowRight':
        selectTab(nextEnabledIndex(tabs, index, 1));
        break;
      case 'ArrowLeft':
        selectTab(nextEnabledIndex(tabs, index, -1));
        break;
      case 'Home':
        selectTab(nextEnabledIndex(tabs, -1, 1));
        break;
      case 'End':
        selectTab(nextEnabledIndex(tabs, tabs.length, -1));
        break;
      default:
        return;
    }

    e.preventDefault();
  };

  return (
    <div role="tablist" className="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:gap-2.5 vdocs:font-sans">
      {tabs.map((tab, index) => (
        <button
          key={tab.id ?? tab.label}
          ref={el => {
            tabRefs.current[index] = el;
          }}
          type="button"
          role="tab"
          disabled={tab.disabled}
          aria-selected={index === selectedTab}
          tabIndex={index === selectedTab ? 0 : -1}
          onClick={() => selectTab(index)}
          onKeyDown={e => handleKeyDown(e, index)}
          className={`vdocs:flex vdocs:items-center vdocs:justify-center vdocs:px-2.5 vdocs:py-[5px] vdocs:text-sm vdocs:text-ink vdocs:bg-transparent vdocs:cursor-pointer vdocs:border-0 vdocs:border-b-4 vdocs:border-solid vdocs:disabled:text-edge vdocs:disabled:cursor-default ${
            index === selectedTab
              ? 'vdocs:font-medium vdocs:border-accent'
              : 'vdocs:font-normal vdocs:border-transparent'
          }`}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
