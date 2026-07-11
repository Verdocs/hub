import { page } from 'vitest/browser';
import type { IFilterOption } from './vdocs-quick-filter.js';
import type { IMenuOption } from './vdocs-dropdown.js';
import { mount } from '../test/helpers.js';
import './vdocs-quick-filter.js';
import './vdocs-pagination.js';
import './vdocs-text-input.js';
import './vdocs-dropdown.js';
import './vdocs-spinner.js';
import './vdocs-button.js';

afterEach(() => {
  document.body.replaceChildren();
});

describe('vdocs-button', () => {
  it('renders its label and handles clicks', async () => {
    const onClick = vi.fn();
    const el = document.createElement('vdocs-button');
    el.label = 'Click Me';
    el.addEventListener('click', onClick);
    await mount(el);

    await page.getByRole('button', { name: 'Click Me' }).click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire when disabled', async () => {
    const onClick = vi.fn();
    const el = document.createElement('vdocs-button');
    el.label = 'Nope';
    el.disabled = true;
    el.addEventListener('click', onClick);
    await mount(el);

    const button = el.querySelector('button')!;
    expect(button.disabled).toBe(true);

    // A programmatic click on a disabled native button is a no-op, and real
    // pointer clicks are blocked by the host's pointer-events toggle.
    button.click();
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('vdocs-text-input', () => {
  it('renders a labeled input, tracks typing, and clears via the clear button', async () => {
    const cleared = vi.fn();
    const el = document.createElement('vdocs-text-input');
    el.label = 'Name';
    el.clearable = true;
    el.value = 'abc';
    el.addEventListener('vdocs-clear', cleared);
    await mount(el);

    const input = el.querySelector('input')!;
    expect(input.value).toBe('abc');

    await page.getByLabelText(/Name/).fill('abcdef');
    expect(el.value).toBe('abcdef');

    await page.getByRole('button', { name: 'Clear' }).click();
    expect(cleared).toHaveBeenCalledOnce();
  });

  it('toggles password visibility', async () => {
    const el = document.createElement('vdocs-text-input');
    el.label = 'Password';
    el.type = 'password';
    el.value = 'secret';
    await mount(el);

    expect(el.querySelector('input')!.type).toBe('password');

    await page.getByRole('button', { name: 'Show password' }).click();
    expect(el.querySelector('input')!.type).toBe('text');
  });
});

describe('vdocs-quick-filter', () => {
  const options: IFilterOption[] = [
    { value: 'all', label: 'All' },
    { value: 'starred', label: 'Starred' },
  ];

  it('shows the selected option and fires vdocs-select', async () => {
    const selections: IFilterOption[] = [];
    const el = document.createElement('vdocs-quick-filter');
    el.label = 'Starred';
    el.value = 'all';
    el.options = options;
    el.addEventListener('vdocs-select', e => selections.push((e as CustomEvent<IFilterOption>).detail));
    await mount(el);

    await page.getByRole('button', { name: /Starred.*All/ }).click();
    await page.getByRole('option', { name: 'Starred' }).click();

    expect(selections).toEqual([ options[1] ]);
  });
});

describe('vdocs-dropdown', () => {
  it('opens a menu, skips separators, and fires vdocs-select', async () => {
    const selections: IMenuOption[] = [];
    const el = document.createElement('vdocs-dropdown');
    el.options = [
      { label: 'Preview / Send', id: 'send' },
      { label: '' },
      { label: 'Edit', id: 'edit', disabled: true },
    ];
    el.addEventListener('vdocs-select', e => selections.push((e as CustomEvent<IMenuOption>).detail));
    await mount(el);

    await page.getByRole('button', { name: 'Open menu' }).click();

    const items = Array.from(el.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
    expect(items.map(item => item.textContent?.trim())).toEqual([ 'Preview / Send', 'Edit' ]);
    expect(items[1]?.disabled).toBe(true);

    await page.getByRole('menuitem', { name: 'Preview / Send' }).click();
    expect(selections).toEqual([ { label: 'Preview / Send', id: 'send' } ]);
  });
});

describe('vdocs-pagination', () => {
  it('renders pages and navigates', async () => {
    const pages: number[] = [];
    const el = document.createElement('vdocs-pagination');
    el.selectedPage = 0;
    el.itemCount = 45;
    el.perPage = 10;
    el.addEventListener('vdocs-select-page', e => pages.push(e.detail.page));
    await mount(el);

    expect(el.querySelector('button[aria-label="Page 1"]')?.getAttribute('aria-current')).toBe('page');
    expect(el.querySelector('button[aria-label="First page"]')).toBeNull();

    await page.getByRole('button', { name: 'Last page' }).click();
    expect(pages).toEqual([ 4 ]);
  });

  it('shows the first-page shortcut when beyond page one', async () => {
    const el = document.createElement('vdocs-pagination');
    el.selectedPage = 3;
    el.itemCount = 100;
    el.perPage = 10;
    await mount(el);

    expect(el.querySelector('button[aria-label="First page"]')).not.toBeNull();
  });
});

describe('vdocs-spinner', () => {
  it('renders at the requested size', async () => {
    const el = document.createElement('vdocs-spinner');
    el.size = 24;
    el.mode = 'dark';
    await mount(el);

    const spinner = el.querySelector<HTMLElement>('[role="status"]')!;
    expect(spinner.style.width).toBe('24px');
    expect(spinner.style.height).toBe('24px');
  });
});
