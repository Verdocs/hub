import { html } from 'lit';
import { page } from 'vitest/browser';
import type { IOrganization } from '@verdocs/js-sdk';
import type { ITab, ITabSelectEvent } from './vdocs-tabs.js';
import type { ITableColumn } from './vdocs-table.js';
import { mount } from '../test/helpers.js';
import './vdocs-organization-card.js';
import './vdocs-toggle-button.js';
import './vdocs-button-panel.js';
import './vdocs-menu-panel.js';
import './vdocs-portal.js';
import './vdocs-table.js';
import './vdocs-tabs.js';

beforeAll(() => {
  // The compiled stylesheet is not loaded in specs, and the portal's position
  // math reads the wrapper's offsetWidth. A plain block div would report the
  // full body width, so give wrappers the one rule the math depends on: fixed
  // elements shrink-wrap to their content.
  const style = document.createElement('style');
  style.textContent = '.vdocs-portal { position: fixed; }';
  document.head.appendChild(style);
});

afterEach(() => {
  document.body.replaceChildren();
});

const makeButton = (label: string, cssText = '') => {
  const button = document.createElement('button');
  button.textContent = label;
  button.style.cssText = cssText;
  document.body.appendChild(button);
  return button;
};

describe('vdocs-portal', () => {
  it('moves its content into a wrapper appended to document.body', async () => {
    const anchor = makeButton('Anchor');

    const el = document.createElement('vdocs-portal');
    el.anchor = anchor;
    const content = document.createElement('div');
    content.textContent = 'Floating content';
    el.appendChild(content);
    await mount(el);

    const wrapper = content.closest('.vdocs-portal');
    expect(wrapper?.parentElement).toBe(document.body);
    expect(el.contains(content)).toBe(false);
  });

  it('positions the wrapper from the anchor rect, via the property or anchor-id', async () => {
    const anchor = makeButton('Anchor', 'position: fixed; top: 80px; left: 50px; width: 40px; height: 20px; margin: 0;');
    anchor.id = 'portal-anchor';

    const byProperty = document.createElement('vdocs-portal');
    byProperty.anchor = anchor;
    const tip = document.createElement('div');
    tip.textContent = 'Tip';
    byProperty.appendChild(tip);
    await mount(byProperty);

    const first = document.querySelectorAll<HTMLElement>('.vdocs-portal')[0];
    expect(first?.style.top).toBe('100px');
    expect(first?.style.left).toBe('50px');

    const byId = document.createElement('vdocs-portal');
    byId.setAttribute('anchor-id', 'portal-anchor');
    const tip2 = document.createElement('div');
    tip2.textContent = 'Tip 2';
    byId.appendChild(tip2);
    await mount(byId);

    const second = document.querySelectorAll<HTMLElement>('.vdocs-portal')[1];
    expect(second?.style.top).toBe('100px');
    expect(second?.style.left).toBe('50px');
  });

  it('emits vdocs-click-away only for clicks outside the content and anchor', async () => {
    const clickAway = vi.fn();
    const anchor = makeButton('Anchor', 'position: fixed; top: 10px; left: 10px; width: 60px; height: 20px;');
    makeButton('Outside', 'position: fixed; top: 10px; left: 300px;');

    const el = document.createElement('vdocs-portal');
    el.anchor = anchor;
    const content = document.createElement('div');
    content.textContent = 'Floating content';
    el.appendChild(content);
    el.addEventListener('vdocs-click-away', clickAway);
    await mount(el);

    await page.getByText('Floating content').click();
    await page.getByRole('button', { name: 'Anchor' }).click();
    expect(clickAway).not.toHaveBeenCalled();

    await page.getByRole('button', { name: 'Outside' }).click();
    expect(clickAway).toHaveBeenCalledOnce();
  });

  it('removes the wrapper and restores its content on disconnect', async () => {
    const el = document.createElement('vdocs-portal');
    const content = document.createElement('div');
    content.textContent = 'Floating content';
    el.appendChild(content);
    await mount(el);

    expect(document.body.querySelector('.vdocs-portal')).not.toBeNull();

    el.remove();
    expect(document.body.querySelector('.vdocs-portal')).toBeNull();
    expect(el.contains(content)).toBe(true);
  });

  it('ignores the click that connected it, so an opener toggle does not immediately close it', async () => {
    const clickAway = vi.fn();
    const opener = makeButton('Open');

    // Mimics a host that mounts the portal synchronously from a click handler:
    // that click is still bubbling toward the document when we connect and
    // must not count as a click-away.
    opener.addEventListener('click', () => {
      const el = document.createElement('vdocs-portal');
      const content = document.createElement('div');
      content.textContent = 'Opened content';
      el.appendChild(content);
      el.addEventListener('vdocs-click-away', clickAway);
      document.body.appendChild(el);
    });

    await page.getByRole('button', { name: 'Open' }).click();
    expect(clickAway).not.toHaveBeenCalled();

    await page.getByRole('button', { name: 'Open' }).click();
    expect(clickAway).toHaveBeenCalledOnce();
  });
});

describe('vdocs-menu-panel', () => {
  it('moves its content into a dialog in document.body at the requested width', async () => {
    const el = document.createElement('vdocs-menu-panel');
    el.width = 280;
    const content = document.createElement('div');
    content.textContent = 'Panel Content';
    el.appendChild(content);
    await mount(el);

    const panel = document.body.querySelector<HTMLElement>('.vdocs-menu-panel');
    expect(panel?.parentElement).toBe(document.body);
    expect(panel?.getAttribute('role')).toBe('dialog');
    expect(panel?.getAttribute('aria-modal')).toBe('true');
    expect(panel?.style.width).toBe('280px');
    expect(panel?.contains(content)).toBe(true);
    expect(el.contains(content)).toBe(false);
    expect(document.body.querySelector('.vdocs-menu-panel-overlay')).not.toBeNull();
  });

  it('omits the overlay when disabled and slides from the requested side', async () => {
    const el = document.createElement('vdocs-menu-panel');
    el.overlay = false;
    el.side = 'left';
    await mount(el);

    const panel = document.body.querySelector<HTMLElement>('.vdocs-menu-panel');
    expect(document.body.querySelector('.vdocs-menu-panel-overlay')).toBeNull();
    expect(panel?.classList.contains('vdocs:left-0')).toBe(true);
    expect(panel?.getAttribute('aria-modal')).toBe('false');
  });

  it('emits vdocs-close for outside clicks but not inside ones', async () => {
    const closed = vi.fn();
    const el = document.createElement('vdocs-menu-panel');
    const inside = document.createElement('button');
    inside.textContent = 'Inside';
    el.appendChild(inside);
    el.addEventListener('vdocs-close', closed);
    await mount(el);

    await page.getByRole('button', { name: 'Inside' }).click();
    expect(closed).not.toHaveBeenCalled();

    const overlay = document.body.querySelector<HTMLElement>('.vdocs-menu-panel-overlay');
    expect(overlay).not.toBeNull();
    overlay?.click();
    expect(closed).toHaveBeenCalledOnce();
  });

  it('removes the panel and overlay and restores its content on disconnect', async () => {
    const el = document.createElement('vdocs-menu-panel');
    const content = document.createElement('div');
    content.textContent = 'Panel Content';
    el.appendChild(content);
    await mount(el);

    el.remove();
    expect(document.body.querySelector('.vdocs-menu-panel')).toBeNull();
    expect(document.body.querySelector('.vdocs-menu-panel-overlay')).toBeNull();
    expect(el.contains(content)).toBe(true);
  });
});

describe('vdocs-tabs', () => {
  const tabs: ITab[] = [
    { id: 'one', label: 'One' },
    { id: 'two', label: 'Two' },
    { id: 'three', label: 'Three', disabled: true },
    { id: 'four', label: 'Four' },
  ];

  it('renders a tablist with aria-selected and a roving tabindex', async () => {
    const el = document.createElement('vdocs-tabs');
    el.tabs = tabs;
    el.selectedTab = 1;
    await mount(el);

    expect(el.querySelector('[role="tablist"]')).not.toBeNull();

    const rendered = Array.from(el.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    expect(rendered).toHaveLength(4);
    expect(rendered.map(tab => tab.getAttribute('aria-selected'))).toEqual([ 'false', 'true', 'false', 'false' ]);
    expect(rendered.map(tab => tab.tabIndex)).toEqual([ -1, 0, -1, -1 ]);
    expect(rendered[2]?.disabled).toBe(true);
  });

  it('emits vdocs-select-tab on click and ignores disabled tabs', async () => {
    const selections: ITabSelectEvent[] = [];
    const el = document.createElement('vdocs-tabs');
    el.tabs = tabs;
    el.addEventListener('vdocs-select-tab', e => selections.push(e.detail));
    await mount(el);

    await page.getByRole('tab', { name: 'Two' }).click();
    expect(selections).toEqual([ { tab: tabs[1], index: 1 } ]);

    // A programmatic click on a disabled native button is a no-op, and real
    // pointer clicks are blocked by the disabled state.
    el.querySelectorAll<HTMLButtonElement>('[role="tab"]')[2]?.click();
    expect(selections).toHaveLength(1);
  });

  it('moves focus and selection with the keyboard, skipping disabled tabs and wrapping', async () => {
    const selections: ITabSelectEvent[] = [];
    const el = document.createElement('vdocs-tabs');
    el.tabs = tabs;
    el.selectedTab = 1;
    el.addEventListener('vdocs-select-tab', e => selections.push(e.detail));
    await mount(el);

    const rendered = Array.from(el.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    rendered[1]?.focus();

    rendered[1]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(selections[selections.length - 1]).toEqual({ tab: tabs[3], index: 3 });
    expect(document.activeElement).toBe(rendered[3]);

    rendered[3]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    expect(selections[selections.length - 1]).toEqual({ tab: tabs[0], index: 0 });
    expect(document.activeElement).toBe(rendered[0]);

    rendered[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(selections[selections.length - 1]).toEqual({ tab: tabs[3], index: 3 });
    expect(selections).toHaveLength(3);
  });

  it('is controlled: selection follows the selected-tab property, not clicks', async () => {
    const el = document.createElement('vdocs-tabs');
    el.tabs = tabs;
    await mount(el);

    await page.getByRole('tab', { name: 'Two' }).click();
    const rendered = el.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    expect(rendered[1]?.getAttribute('aria-selected')).toBe('false');

    el.selectedTab = 1;
    await el.updateComplete;
    expect(rendered[1]?.getAttribute('aria-selected')).toBe('true');
  });
});

describe('vdocs-toggle-button', () => {
  it('reflects active on aria-pressed and requests the opposite state on click', async () => {
    const requests: boolean[] = [];
    const el = document.createElement('vdocs-toggle-button');
    el.label = 'Bold';
    el.addEventListener('vdocs-toggle', e => requests.push((e as CustomEvent<{ active: boolean }>).detail.active));
    await mount(el);

    const button = el.querySelector('button');
    expect(button?.getAttribute('aria-pressed')).toBe('false');

    await page.getByRole('button', { name: 'Bold' }).click();
    expect(requests).toEqual([ true ]);
    expect(button?.getAttribute('aria-pressed')).toBe('false');

    el.active = true;
    await el.updateComplete;
    expect(button?.getAttribute('aria-pressed')).toBe('true');

    await page.getByRole('button', { name: 'Bold' }).click();
    expect(requests).toEqual([ true, false ]);
  });

  it('uses the label as the accessible name for icon buttons', async () => {
    const el = document.createElement('vdocs-toggle-button');
    el.label = 'Messages';
    el.icon = html`<svg aria-hidden="true" width="16" height="16"></svg>`;
    await mount(el);

    const button = el.querySelector('button');
    expect(button?.getAttribute('aria-label')).toBe('Messages');
    expect(button?.querySelector('svg')).not.toBeNull();
    expect(button?.textContent?.trim()).toBe('');
  });

  it('stops click propagation so a toggle never doubles as a host click', async () => {
    const hostClick = vi.fn();
    const holder = document.createElement('div');
    holder.addEventListener('click', hostClick);
    document.body.appendChild(holder);

    const el = document.createElement('vdocs-toggle-button');
    el.label = 'Bold';
    holder.appendChild(el);
    await el.updateComplete;

    await page.getByRole('button', { name: 'Bold' }).click();
    expect(hostClick).not.toHaveBeenCalled();
  });
});

describe('vdocs-button-panel', () => {
  const mountPanel = async () => {
    const el = document.createElement('vdocs-button-panel');
    el.icon = html`<svg aria-hidden="true" width="16" height="16"></svg>`;
    el.label = 'Field settings';
    const body = document.createElement('div');
    body.textContent = 'Panel Body';
    el.appendChild(body);
    await mount(el);
    return { el, body };
  };

  it('opens an anchored dialog in document.body and closes on click-away', async () => {
    // Keep the outside target inside the default test viewport, clear of the
    // dialog that opens near the trigger at the top left.
    makeButton('Outside', 'position: fixed; top: 8px; left: 250px;');
    const { el, body } = await mountPanel();

    expect(document.querySelector('[role="dialog"]')).toBeNull();

    await page.getByRole('button', { name: 'Field settings' }).click();
    await el.updateComplete;

    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    expect(dialog?.contains(body)).toBe(true);
    expect(dialog?.closest('.vdocs-portal')?.parentElement).toBe(document.body);

    await page.getByRole('button', { name: 'Outside' }).click();
    await el.updateComplete;
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('toggles the panel closed when the trigger is clicked again', async () => {
    const { el } = await mountPanel();
    const trigger = el.querySelector('button');
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');

    await page.getByRole('button', { name: 'Field settings' }).click();
    await el.updateComplete;
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(trigger?.getAttribute('aria-expanded')).toBe('true');

    await page.getByRole('button', { name: 'Field settings' }).click();
    await el.updateComplete;
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
  });

  it('cleans up the body wrapper when disconnected while open', async () => {
    const { el } = await mountPanel();

    await page.getByRole('button', { name: 'Field settings' }).click();
    await el.updateComplete;
    expect(document.querySelector('.vdocs-portal')).not.toBeNull();

    el.remove();
    expect(document.querySelector('.vdocs-portal')).toBeNull();
  });
});

describe('vdocs-table', () => {
  interface IPlayer {
    name: string;
    position: string;
  }

  const columns: ITableColumn<IPlayer>[] = [
    { id: 'name', header: 'Name' },
    { id: 'position', header: 'Position' },
  ];

  const rows: IPlayer[] = [
    { name: 'Paige Turner', position: 'Pitcher' },
    { name: 'Cliff Hanger', position: 'Catcher' },
  ];

  it('renders column headers and row data', async () => {
    const el = document.createElement('vdocs-table');
    el.columns = columns;
    el.rows = rows;
    await mount(el);

    expect(Array.from(el.querySelectorAll('th')).map(th => th.textContent?.trim())).toEqual([ 'Name', 'Position' ]);
    expect(Array.from(el.querySelectorAll('td')).map(td => td.textContent?.trim()))
      .toEqual([ 'Paige Turner', 'Pitcher', 'Cliff Hanger', 'Catcher' ]);
  });

  it('falls back to the column id for headers and stringifies non-text values', async () => {
    const el = document.createElement('vdocs-table');
    el.columns = [ { id: 'position' }, { id: 'starter' }, { id: 'notes' } ];
    el.rows = [ { position: 'Pitcher', starter: true, notes: null } ];
    await mount(el);

    expect(Array.from(el.querySelectorAll('th')).map(th => th.textContent?.trim())).toEqual([ 'position', 'starter', 'notes' ]);
    expect(Array.from(el.querySelectorAll('td')).map(td => td.textContent?.trim())).toEqual([ 'Pitcher', 'true', '' ]);
  });

  it('uses custom header and cell renderers returning Lit templates', async () => {
    const el = document.createElement('vdocs-table');
    el.columns = [
      {
        id: 'name',
        renderHeader: () => html`<em>Player</em>`,
        renderCell: (_column, row: IPlayer) => html`<strong>${row.name.toUpperCase()}</strong>`,
      },
    ];
    el.rows = rows;
    await mount(el);

    expect(el.querySelector('th em')?.textContent).toBe('Player');
    expect(el.querySelector('td strong')?.textContent).toBe('PAIGE TURNER');
  });

  it('emits vdocs-click-row with the clicked record and styles clickable rows', async () => {
    const clicked: IPlayer[] = [];
    const el = document.createElement('vdocs-table');
    el.columns = columns;
    el.rows = rows;
    el.setAttribute('clickable-rows', '');
    el.addEventListener('vdocs-click-row', e => clicked.push(e.detail as IPlayer));
    await mount(el);

    expect(el.querySelector('tbody tr')?.classList.contains('vdocs:cursor-pointer')).toBe(true);

    await page.getByRole('cell', { name: 'Cliff Hanger' }).click();
    expect(clicked).toEqual([ rows[1] ]);
  });

  it('emits vdocs-click-column-header with the clicked column', async () => {
    const headerClicks: ITableColumn<IPlayer>[] = [];
    const el = document.createElement('vdocs-table');
    el.columns = columns;
    el.rows = rows;
    el.addEventListener('vdocs-click-column-header', e => headerClicks.push(e.detail));
    await mount(el);

    await page.getByRole('columnheader', { name: 'Position' }).click();
    expect(headerClicks).toEqual([ columns[1] ]);
  });
});

describe('vdocs-organization-card', () => {
  const baseOrganization: IOrganization = {
    id: 'org-1',
    name: 'Test Organization',
    address: null,
    address2: null,
    phone: null,
    contact_email: null,
    url: 'https://example.com',
    thumbnail_url: null,
    parent_id: null,
    deletion_protected: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  it('renders the logo, name, and web site link', async () => {
    const el = document.createElement('vdocs-organization-card');
    el.organization = { ...baseOrganization, thumbnail_url: 'https://example.com/thumb.png' };
    await mount(el);

    expect(el.querySelector('img')?.getAttribute('src')).toBe('https://example.com/thumb.png');
    expect(el.textContent).toContain('Test Organization');

    const link = el.querySelector('a');
    expect(link?.getAttribute('href')).toBe('https://example.com');
    expect(link?.getAttribute('rel')).toBe('noreferrer nofollow');
  });

  it('falls back to a placeholder icon when there is no logo', async () => {
    const el = document.createElement('vdocs-organization-card');
    el.organization = baseOrganization;
    await mount(el);

    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('svg')).not.toBeNull();
    expect(el.textContent).toContain('Test Organization');
  });

  it('omits the web site link when the organization has no url', async () => {
    const el = document.createElement('vdocs-organization-card');
    el.organization = { ...baseOrganization, url: null };
    await mount(el);

    expect(el.querySelector('a')).toBeNull();
    expect(el.textContent).toContain('Test Organization');
  });
});
