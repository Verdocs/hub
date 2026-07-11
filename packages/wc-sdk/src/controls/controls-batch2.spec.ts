import { html } from 'lit';
import { page, userEvent } from 'vitest/browser';
import { mount } from '../test/helpers.js';
import './vdocs-component-error.js';
import './vdocs-file-chooser.js';
import './vdocs-multi-select.js';
import './vdocs-select-input.js';
import './vdocs-toolbar-icon.js';
import './vdocs-date-input.js';
import './vdocs-flag.js';

afterEach(() => {
  document.body.replaceChildren();
});

const pdf = (name: string) => new File([ '%PDF-1.4' ], name, { type: 'application/pdf' });

const dataTransfer = (files: File[]) => {
  const dt = new DataTransfer();
  files.forEach(file => dt.items.add(file));
  return dt;
};

/** Put files in a file input the way a browse dialog would, change event included. */
const pickFiles = (input: HTMLInputElement, files: File[]) => {
  input.files = dataTransfer(files).files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

describe('vdocs-toolbar-icon', () => {
  it('renders the icon in a labeled button and passes clicks through', async () => {
    const onClick = vi.fn();
    const el = document.createElement('vdocs-toolbar-icon');
    el.text = 'Add signature';
    el.icon = html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"></svg>`;
    el.addEventListener('click', onClick);
    await mount(el);

    expect(el.querySelector('button svg')).not.toBeNull();

    await page.getByRole('button', { name: 'Add signature' }).click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows the tooltip on hover and hides it again', async () => {
    const el = document.createElement('vdocs-toolbar-icon');
    el.text = 'Add signature';
    await mount(el);

    expect(el.querySelector('[role="tooltip"]')).toBeNull();

    await page.getByRole('button', { name: 'Add signature' }).hover();
    await el.updateComplete;
    expect(el.querySelector('[role="tooltip"]')?.textContent).toContain('Add signature');

    await page.getByRole('button', { name: 'Add signature' }).unhover();
    await el.updateComplete;
    expect(el.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('shows the tooltip on focus and hides it on blur', async () => {
    const el = document.createElement('vdocs-toolbar-icon');
    el.text = 'Add signature';
    await mount(el);

    const button = el.querySelector('button')!;
    button.focus();
    await el.updateComplete;
    expect(el.querySelector('[role="tooltip"]')).not.toBeNull();

    button.blur();
    await el.updateComplete;
    expect(el.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('positions the tooltip per the placement property', async () => {
    const el = document.createElement('vdocs-toolbar-icon');
    el.text = 'Add signature';
    el.placement = 'top';
    await mount(el);

    await page.getByRole('button', { name: 'Add signature' }).hover();
    await el.updateComplete;
    expect(el.querySelector('[role="tooltip"]')?.className).toContain('vdocs:bottom-full');

    await page.getByRole('button', { name: 'Add signature' }).unhover();
  });

  it('never shows an empty tooltip', async () => {
    const el = document.createElement('vdocs-toolbar-icon');
    await mount(el);

    const button = el.querySelector('button')!;
    button.focus();
    await el.updateComplete;
    expect(el.querySelector('[role="tooltip"]')).toBeNull();
  });
});

describe('vdocs-component-error', () => {
  it('announces the message as an alert', async () => {
    const el = document.createElement('vdocs-component-error');
    el.message = 'Something went wrong.';
    await mount(el);

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Something went wrong.');
  });

  it('rerenders when the message property changes', async () => {
    const el = document.createElement('vdocs-component-error');
    el.message = 'First failure.';
    await mount(el);

    el.message = 'Second failure.';
    await el.updateComplete;
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Second failure.');
  });

  it('keeps the alert wrapping a centered panel, the markup white-label CSS targets', async () => {
    const el = document.createElement('vdocs-component-error');
    el.message = 'Oops.';
    await mount(el);

    expect(el.querySelector('[role="alert"] > div')).not.toBeNull();
  });
});

describe('vdocs-flag', () => {
  // The flag positions itself against its nearest positioned ancestor; mounted
  // bare in the body it would land off-screen at the viewport's right edge.
  const mountFlag = async (el: HTMLElementTagNameMap['vdocs-flag']) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 240px; height: 40px; margin: 20px;';
    wrapper.appendChild(el);
    document.body.appendChild(wrapper);
    await el.updateComplete;
    return el;
  };

  it('renders its label and surfaces body clicks on the element', async () => {
    const onClick = vi.fn();
    const el = document.createElement('vdocs-flag');
    el.addEventListener('click', onClick);
    await mountFlag(el);

    await page.getByText('FILL').click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('fires vdocs-skip without triggering body click listeners', async () => {
    const onClick = vi.fn();
    const onSkip = vi.fn();
    const el = document.createElement('vdocs-flag');
    el.showSkip = true;
    el.addEventListener('click', onClick);
    el.addEventListener('vdocs-skip', onSkip);
    await mountFlag(el);

    await page.getByRole('button', { name: 'SKIP' }).click();
    expect(onSkip).toHaveBeenCalledOnce();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('omits the skip link unless requested', async () => {
    const el = document.createElement('vdocs-flag');
    el.label = 'NEXT';
    el.variant = 'next';
    await mountFlag(el);

    expect(el.textContent).toContain('NEXT');
    expect(el.querySelector('button')).toBeNull();
  });

  it('swaps variant classes on the host', async () => {
    const el = document.createElement('vdocs-flag');
    await mountFlag(el);

    expect(el.classList.contains('vdocs:w-[110px]')).toBe(true);

    el.variant = 'next';
    await el.updateComplete;
    expect(el.classList.contains('vdocs:w-24')).toBe(true);
    expect(el.classList.contains('vdocs:w-[110px]')).toBe(false);
  });
});

describe('vdocs-select-input', () => {
  const options = [
    { label: 'Contract', value: 'contract' },
    { label: 'Invoice', value: 'invoice' },
    { label: 'Purchase Order', value: 'po' },
  ];

  it('renders a labeled select with options and preselects the value', async () => {
    const el = document.createElement('vdocs-select-input');
    el.label = 'Document Type';
    el.options = options;
    el.value = 'invoice';
    await mount(el);

    const select = el.querySelector('select')!;
    expect(select.options.length).toBe(3);
    expect(select.value).toBe('invoice');
    expect(el.textContent).toContain('Purchase Order');
  });

  it('reports user picks through vdocs-change', async () => {
    const values: string[] = [];
    const el = document.createElement('vdocs-select-input');
    el.label = 'Document Type';
    el.options = options;
    el.value = 'contract';
    el.addEventListener('vdocs-change', e => values.push((e as CustomEvent<{ value: string }>).detail.value));
    await mount(el);

    const select = el.querySelector('select')!;
    select.value = 'invoice';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    expect(values).toEqual([ 'invoice' ]);
    expect(el.value).toBe('invoice');
  });

  it('marks required fields and wires required/disabled to the select', async () => {
    const el = document.createElement('vdocs-select-input');
    el.label = 'Document Type';
    el.options = options;
    el.required = true;
    el.disabled = true;
    await mount(el);

    const select = el.querySelector('select')!;
    expect(select.required).toBe(true);
    expect(select.disabled).toBe(true);
    expect(el.textContent).toContain('*');
  });

  it('updates the selection on programmatic value changes without firing vdocs-change', async () => {
    const onChange = vi.fn();
    const el = document.createElement('vdocs-select-input');
    el.options = options;
    el.value = 'contract';
    el.addEventListener('vdocs-change', onChange);
    await mount(el);

    el.value = 'po';
    await el.updateComplete;

    expect(el.querySelector('select')!.value).toBe('po');
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('vdocs-date-input', () => {
  it('renders a labeled date input and reports edits', async () => {
    const values: string[] = [];
    const el = document.createElement('vdocs-date-input');
    el.label = 'Expiration Date';
    el.addEventListener('vdocs-input', e => values.push(e.detail.value));
    await mount(el);

    expect(el.querySelector('input')!.type).toBe('date');

    await page.getByLabelText(/Expiration Date/).fill('2026-07-04');

    expect(el.value).toBe('2026-07-04');
    expect(values.at(-1)).toBe('2026-07-04');
  });

  it('marks required fields and wires required/disabled to the input', async () => {
    const el = document.createElement('vdocs-date-input');
    el.label = 'Effective Date';
    el.required = true;
    el.disabled = true;
    await mount(el);

    const input = el.querySelector('input')!;
    expect(input.required).toBe(true);
    expect(input.disabled).toBe(true);
    expect(el.textContent).toContain('*');
  });

  it('reflects programmatic value changes without firing vdocs-input', async () => {
    const onInput = vi.fn();
    const el = document.createElement('vdocs-date-input');
    el.addEventListener('vdocs-input', onInput);
    await mount(el);

    el.value = '2026-01-15';
    await el.updateComplete;

    expect(el.querySelector('input')!.value).toBe('2026-01-15');
    expect(onInput).not.toHaveBeenCalled();
  });
});

describe('vdocs-file-chooser', () => {
  it('reports a selected file and updates the prompt', async () => {
    const selections: File[][] = [];
    const el = document.createElement('vdocs-file-chooser');
    el.addEventListener('vdocs-select-files', e => selections.push(e.detail.files));
    await mount(el);

    expect(el.textContent).toContain('Drag a file here');
    expect(el.textContent).toContain('Select a file from your computer');

    const file = pdf('contract.pdf');
    pickFiles(el.querySelector('input')!, [ file ]);
    await el.updateComplete;

    expect(selections).toEqual([ [ file ] ]);
    expect(el.textContent).toContain('contract.pdf');
    expect(el.textContent).toContain('Select a different file');
  });

  it('clears the selection when the user goes to pick a different file', async () => {
    const selections: File[][] = [];
    const el = document.createElement('vdocs-file-chooser');
    el.addEventListener('vdocs-select-files', e => selections.push(e.detail.files));
    await mount(el);

    const input = el.querySelector('input')!;
    pickFiles(input, [ pdf('contract.pdf') ]);
    await el.updateComplete;

    // Stubbed so headed test runs never pop a real file dialog; the assertion
    // below still proves the browse click reached the input.
    const browse = vi.spyOn(input, 'click').mockImplementation(() => undefined);
    await page.getByRole('button', { name: 'Select a different file' }).click();
    await el.updateComplete;

    expect(browse).toHaveBeenCalledOnce();
    expect(selections.at(-1)).toEqual([]);
    expect(el.textContent).toContain('Drag a file here');
  });

  it('accepts several files when multiple is set', async () => {
    const selections: File[][] = [];
    const el = document.createElement('vdocs-file-chooser');
    el.multiple = true;
    el.addEventListener('vdocs-select-files', e => selections.push(e.detail.files));
    await mount(el);

    const files = [ pdf('nda.pdf'), pdf('lease.pdf') ];
    pickFiles(el.querySelector('input')!, files);
    await el.updateComplete;

    expect(selections).toEqual([ files ]);
    expect(el.textContent).toContain('nda.pdf, lease.pdf');
  });

  it('highlights the drop target during a drag and accepts dropped files', async () => {
    const selections: File[][] = [];
    const el = document.createElement('vdocs-file-chooser');
    el.addEventListener('vdocs-select-files', e => selections.push(e.detail.files));
    await mount(el);

    const box = el.querySelector('div')!;
    box.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dataTransfer([ pdf('contract.pdf') ]) }));
    await el.updateComplete;
    expect(box.className).toContain('vdocs:outline-dashed');

    box.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dataTransfer([ pdf('contract.pdf') ]) }));
    await el.updateComplete;

    expect(selections.at(-1)?.map(file => file.name)).toEqual([ 'contract.pdf' ]);
    expect(box.className).not.toContain('vdocs:outline-dashed');
  });

  it('keeps only the first dropped file unless multiple is set', async () => {
    const selections: File[][] = [];
    const el = document.createElement('vdocs-file-chooser');
    el.addEventListener('vdocs-select-files', e => selections.push(e.detail.files));
    await mount(el);

    const box = el.querySelector('div')!;
    box.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dataTransfer([ pdf('nda.pdf'), pdf('lease.pdf') ]) }));
    await el.updateComplete;

    expect(selections.at(-1)?.map(file => file.name)).toEqual([ 'nda.pdf' ]);
  });
});

describe('vdocs-multi-select', () => {
  const options = [
    { label: 'E-mail', value: 'email' },
    { label: 'SMS', value: 'sms' },
  ];

  it('opens the picker and adds a selection without closing', async () => {
    const selections: string[][] = [];
    const el = document.createElement('vdocs-multi-select');
    el.label = 'Delivery Methods';
    el.options = options;
    el.addEventListener('vdocs-selection-changed', e => selections.push(e.detail.selectedOptions));
    await mount(el);

    expect(el.textContent).toContain('Select...');
    expect(el.querySelector('input[type="checkbox"]')).toBeNull();

    await page.getByRole('button', { name: /Delivery Methods/ }).click();
    await page.getByRole('checkbox', { name: 'SMS' }).click();

    expect(selections).toEqual([ [ 'sms' ] ]);
    expect(el.selectedOptions).toEqual([ 'sms' ]);
    expect(el.querySelectorAll('input[type="checkbox"]').length).toBe(2);
  });

  it('summarizes selections as chips and removes them on uncheck', async () => {
    const selections: string[][] = [];
    const el = document.createElement('vdocs-multi-select');
    el.label = 'Delivery Methods';
    el.options = options;
    el.selectedOptions = [ 'email', 'sms' ];
    el.addEventListener('vdocs-selection-changed', e => selections.push(e.detail.selectedOptions));
    await mount(el);

    expect(el.textContent).not.toContain('Select...');
    expect(el.textContent).toContain('E-mail');
    expect(el.textContent).toContain('SMS');

    await page.getByRole('button', { name: /Delivery Methods/ }).click();
    await el.updateComplete;

    const checkboxes = el.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    expect(Array.from(checkboxes).map(checkbox => checkbox.checked)).toEqual([ true, true ]);

    await page.getByRole('checkbox', { name: 'E-mail' }).click();
    expect(selections).toEqual([ [ 'sms' ] ]);
    expect(el.selectedOptions).toEqual([ 'sms' ]);
  });

  it('closes on outside clicks', async () => {
    const el = document.createElement('vdocs-multi-select');
    el.label = 'Delivery Methods';
    el.options = options;
    await mount(el);

    await page.getByRole('button', { name: /Delivery Methods/ }).click();
    await el.updateComplete;
    expect(el.querySelector('input[type="checkbox"]')).not.toBeNull();

    document.body.click();
    await el.updateComplete;
    expect(el.querySelector('input[type="checkbox"]')).toBeNull();
  });

  it('closes on Escape', async () => {
    const el = document.createElement('vdocs-multi-select');
    el.label = 'Delivery Methods';
    el.options = options;
    await mount(el);

    await page.getByRole('button', { name: /Delivery Methods/ }).click();
    await el.updateComplete;
    expect(el.querySelector('input[type="checkbox"]')).not.toBeNull();

    await userEvent.keyboard('{Escape}');
    await el.updateComplete;
    expect(el.querySelector('input[type="checkbox"]')).toBeNull();
  });

  it('updates the chips on programmatic selection changes without firing events', async () => {
    const onChanged = vi.fn();
    const el = document.createElement('vdocs-multi-select');
    el.options = options;
    el.addEventListener('vdocs-selection-changed', onChanged);
    await mount(el);

    el.selectedOptions = [ 'sms' ];
    await el.updateComplete;

    expect(el.textContent).toContain('SMS');
    expect(el.textContent).not.toContain('Select...');
    expect(onChanged).not.toHaveBeenCalled();
  });
});
