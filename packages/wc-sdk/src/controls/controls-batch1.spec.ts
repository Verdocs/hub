import { html } from 'lit';
import { page } from 'vitest/browser';
import type { IToggleButton } from './vdocs-toggle.js';
import { mount } from '../test/helpers.js';
import './vdocs-progress-bar.js';
import './vdocs-radio-button.js';
import './vdocs-help-icon.js';
import './vdocs-checkbox.js';
import './vdocs-loader.js';
import './vdocs-switch.js';
import './vdocs-toggle.js';

afterEach(() => {
  document.body.replaceChildren();
});

describe('vdocs-checkbox', () => {
  it('renders a labeled checkbox, unchecked by default', async () => {
    const el = document.createElement('vdocs-checkbox');
    el.label = 'Accept the terms';
    await mount(el);

    const input = el.querySelector('input')!;
    expect(input.type).toBe('checkbox');
    expect(input.checked).toBe(false);
    expect(el.textContent).toContain('Accept the terms');
  });

  it('toggles when clicked and reports each new state', async () => {
    const changes: boolean[] = [];
    const el = document.createElement('vdocs-checkbox');
    el.label = 'Accept';
    el.addEventListener('vdocs-checked-change', e => changes.push(e.detail.checked));
    await mount(el);

    await page.getByRole('checkbox', { name: 'Accept' }).click();
    expect(el.checked).toBe(true);

    await page.getByRole('checkbox', { name: 'Accept' }).click();
    expect(el.checked).toBe(false);
    expect(changes).toEqual([ true, false ]);
  });

  it('toggles when the label text is clicked', async () => {
    const el = document.createElement('vdocs-checkbox');
    el.label = 'Click my label';
    await mount(el);

    await page.getByText('Click my label').click();

    expect(el.checked).toBe(true);
    expect(el.querySelector('input')!.checked).toBe(true);
  });

  it('cannot be toggled when disabled', async () => {
    const changed = vi.fn();
    const el = document.createElement('vdocs-checkbox');
    el.label = 'Locked';
    el.disabled = true;
    el.addEventListener('vdocs-checked-change', changed);
    await mount(el);

    const input = el.querySelector('input')!;
    expect(input.disabled).toBe(true);

    // A programmatic click on a disabled input is a no-op, and Playwright
    // refuses to pointer-click disabled controls.
    input.click();
    expect(changed).not.toHaveBeenCalled();
    expect(input.checked).toBe(false);
  });
});

describe('vdocs-radio-button', () => {
  it('renders a labeled radio button, unselected by default', async () => {
    const el = document.createElement('vdocs-radio-button');
    el.label = 'Typed';
    el.name = 'mode';
    el.value = 'type';
    await mount(el);

    const input = el.querySelector('input')!;
    expect(input.type).toBe('radio');
    expect(input.checked).toBe(false);
    expect(input.value).toBe('type');
  });

  it('selects on click and fires vdocs-checked-change', async () => {
    const changes: boolean[] = [];
    const el = document.createElement('vdocs-radio-button');
    el.label = 'Drawn';
    el.name = 'mode';
    el.value = 'draw';
    el.addEventListener('vdocs-checked-change', e => changes.push(e.detail.checked));
    await mount(el);

    await page.getByRole('radio', { name: 'Drawn' }).click();

    expect(el.checked).toBe(true);
    expect(changes).toEqual([ true ]);
  });

  it('moves the selection within a named group and resyncs the deselected button', async () => {
    const typed = document.createElement('vdocs-radio-button');
    typed.label = 'Typed';
    typed.name = 'mode';
    typed.value = 'type';
    typed.checked = true;
    const drawn = document.createElement('vdocs-radio-button');
    drawn.label = 'Drawn';
    drawn.name = 'mode';
    drawn.value = 'draw';
    await mount(typed);
    await mount(drawn);

    await page.getByRole('radio', { name: 'Drawn' }).click();

    expect(drawn.checked).toBe(true);
    expect(typed.checked).toBe(false);
    expect(typed.querySelector('input')!.checked).toBe(false);
  });

  it('cannot be selected when disabled', async () => {
    const changed = vi.fn();
    const el = document.createElement('vdocs-radio-button');
    el.label = 'Locked';
    el.name = 'mode';
    el.value = 'x';
    el.disabled = true;
    el.addEventListener('vdocs-checked-change', changed);
    await mount(el);

    el.querySelector('input')!.click();

    expect(changed).not.toHaveBeenCalled();
    expect(el.checked).toBe(false);
  });
});

describe('vdocs-switch', () => {
  it('renders an accessible switch, off by default', async () => {
    const el = document.createElement('vdocs-switch');
    el.label = 'Send reminders';
    await mount(el);

    const input = el.querySelector('input')!;
    expect(input.getAttribute('role')).toBe('switch');
    expect(input.checked).toBe(false);
  });

  it('toggles on click and reports the new value', async () => {
    const changes: boolean[] = [];
    const el = document.createElement('vdocs-switch');
    el.label = 'Send reminders';
    el.addEventListener('vdocs-checked-change', e => changes.push(e.detail.checked));
    await mount(el);

    await page.getByRole('switch', { name: 'Send reminders' }).click();
    expect(el.checked).toBe(true);

    await page.getByRole('switch', { name: 'Send reminders' }).click();
    expect(el.checked).toBe(false);
    expect(changes).toEqual([ true, false ]);
  });

  it('lets the native change event bubble for raw-event listeners', async () => {
    const onChange = vi.fn();
    const el = document.createElement('vdocs-switch');
    el.label = 'Reminders';
    el.addEventListener('change', onChange);
    await mount(el);

    await page.getByRole('switch', { name: 'Reminders' }).click();

    expect(onChange).toHaveBeenCalledOnce();
  });

  it('ignores clicks when disabled', async () => {
    const changed = vi.fn();
    const el = document.createElement('vdocs-switch');
    el.label = 'Locked';
    el.disabled = true;
    el.addEventListener('vdocs-checked-change', changed);
    await mount(el);

    el.querySelector('input')!.click();

    expect(changed).not.toHaveBeenCalled();
    expect(el.checked).toBe(false);
  });
});

describe('vdocs-toggle', () => {
  const toggleButtons = (): IToggleButton[] => [
    { id: 'one', label: 'One', icon: html`<svg aria-hidden="true"></svg>` },
    { id: 'two', label: 'Two', icon: html`<svg aria-hidden="true"></svg>` },
  ];

  const pressed = (el: HTMLElement, label: string) => el.querySelector(`button[aria-label="${label}"]`)!.getAttribute('aria-pressed');

  it('renders a labeled group with the first button selected by default', async () => {
    const el = document.createElement('vdocs-toggle');
    el.label = 'View';
    el.buttons = toggleButtons();
    await mount(el);

    expect(el.querySelector('[role="group"]')!.getAttribute('aria-label')).toBe('View');
    expect(pressed(el, 'One')).toBe('true');
    expect(pressed(el, 'Two')).toBe('false');
  });

  it('starts from default-selection', async () => {
    const el = document.createElement('vdocs-toggle');
    el.buttons = toggleButtons();
    el.defaultSelection = 1;
    await mount(el);

    expect(pressed(el, 'Two')).toBe('true');
  });

  it('moves the selection on click and fires vdocs-change', async () => {
    const selections: { id: string; index: number }[] = [];
    const el = document.createElement('vdocs-toggle');
    el.label = 'View';
    el.buttons = toggleButtons();
    el.addEventListener('vdocs-change', e => {
      const { button, index } = (e as CustomEvent<{ button: IToggleButton; index: number }>).detail;
      selections.push({ id: button.id, index });
    });
    await mount(el);

    await page.getByRole('button', { name: 'Two' }).click();
    await el.updateComplete;

    expect(pressed(el, 'Two')).toBe('true');
    expect(pressed(el, 'One')).toBe('false');
    expect(selections).toEqual([ { id: 'two', index: 1 } ]);
  });

  it('leaves the selection to the owner when controlled', async () => {
    const changed = vi.fn();
    const el = document.createElement('vdocs-toggle');
    el.label = 'View';
    el.buttons = toggleButtons();
    el.selection = 0;
    el.addEventListener('vdocs-change', changed);
    await mount(el);

    await page.getByRole('button', { name: 'Two' }).click();
    await el.updateComplete;

    expect(changed).toHaveBeenCalledOnce();
    expect(pressed(el, 'One')).toBe('true');
    expect(pressed(el, 'Two')).toBe('false');
  });
});

describe('vdocs-loader', () => {
  it('announces itself as a loading status indicator', async () => {
    const el = document.createElement('vdocs-loader');
    await mount(el);

    expect(el.querySelector('[role="status"]')!.getAttribute('aria-label')).toBe('Loading');
  });

  it('spins a ring of eight dots', async () => {
    const el = document.createElement('vdocs-loader');
    await mount(el);

    const ring = el.querySelector('[role="status"] > div')!;
    expect(ring.classList.contains('vdocs:animate-spin')).toBe(true);
    expect(ring.children).toHaveLength(8);
  });

  it('adds no box of its own, so the ring centers in the nearest positioned ancestor', async () => {
    const el = document.createElement('vdocs-loader');
    await mount(el);

    expect(el.classList.contains('vdocs:contents')).toBe(true);
  });
});

describe('vdocs-progress-bar', () => {
  it('renders the label and percentage above the bar', async () => {
    const el = document.createElement('vdocs-progress-bar');
    el.label = 'Uploading...';
    el.showPercent = true;
    el.percent = 54;
    await mount(el);

    expect(el.textContent).toContain('Uploading...');
    expect(el.textContent).toContain('54%');

    const bar = el.querySelector('[role="progressbar"]')!;
    expect(bar.getAttribute('aria-label')).toBe('Uploading...');
    expect(bar.getAttribute('aria-valuenow')).toBe('54');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(el.querySelector<HTMLElement>('[role="progressbar"] > div')!.style.width).toBe('54%');
  });

  it('clamps the reported progress to the 0-100 range', async () => {
    const el = document.createElement('vdocs-progress-bar');
    el.percent = 150;
    await mount(el);

    const bar = el.querySelector('[role="progressbar"]')!;
    expect(bar.getAttribute('aria-valuenow')).toBe('100');

    el.percent = -5;
    await el.updateComplete;
    expect(bar.getAttribute('aria-valuenow')).toBe('0');
    expect(el.querySelector<HTMLElement>('[role="progressbar"] > div')!.style.width).toBe('0%');
  });

  it('omits the labels row when neither label nor percentage is requested', async () => {
    const el = document.createElement('vdocs-progress-bar');
    el.percent = 25;
    await mount(el);

    expect(el.textContent).not.toContain('%');
    expect(el.querySelector('[role="progressbar"]')!.getAttribute('aria-label')).toBe('Progress');
  });
});

describe('vdocs-help-icon', () => {
  it('shows the tooltip on hover and hides it again', async () => {
    const el = document.createElement('vdocs-help-icon');
    el.text = 'Sample help text';
    await mount(el);

    expect(el.querySelector('[role="tooltip"]')).toBeNull();

    await page.getByRole('img', { name: 'Help' }).hover();
    await el.updateComplete;
    const tooltip = el.querySelector('[role="tooltip"]')!;
    expect(tooltip.textContent).toContain('Sample help text');
    expect(tooltip.id).toBe(el.querySelector('[role="img"]')!.getAttribute('aria-describedby'));

    await page.getByRole('img', { name: 'Help' }).unhover();
    await el.updateComplete;
    expect(el.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('shows the tooltip on keyboard focus and hides it on blur', async () => {
    const el = document.createElement('vdocs-help-icon');
    el.text = 'Keyboard help';
    await mount(el);

    const trigger = el.querySelector<HTMLElement>('[role="img"]')!;
    trigger.focus();
    await el.updateComplete;
    expect(el.querySelector('[role="tooltip"]')!.textContent).toContain('Keyboard help');

    trigger.blur();
    await el.updateComplete;
    expect(el.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('renders a caller-supplied icon in place of the default', async () => {
    const el = document.createElement('vdocs-help-icon');
    el.text = 'Custom';
    el.icon = html`<svg data-testid="custom-icon"></svg>`;
    await mount(el);

    expect(el.querySelector('[data-testid="custom-icon"]')).not.toBeNull();
    expect(el.querySelector('path')).toBeNull();
  });
});
