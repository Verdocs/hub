import { mount, type DOMWrapper } from '@vue/test-utils';
import VerdocsFileChooser from './VerdocsFileChooser.vue';

// get() strips exists() from the wrapper type, so the helper takes the same shape.
type InputWrapper = Omit<DOMWrapper<HTMLInputElement>, 'exists'>;

const pdf = (name: string) => new File([ '%PDF-1.4' ], name, { type: 'application/pdf' });

// jsdom does not implement the file picker, so the selection is injected
// directly onto the input before firing change.
const selectFiles = async (input: InputWrapper, files: File[]) => {
  Object.defineProperty(input.element, 'files', { value: files, configurable: true });
  await input.trigger('change');
};

describe('VerdocsFileChooser', () => {
  it('reports a selected file and updates the prompt', async () => {
    const wrapper = mount(VerdocsFileChooser);

    expect(wrapper.text()).toContain('Drag a file here');
    expect(wrapper.get('button').text()).toBe('Select a file from your computer');

    const file = pdf('contract.pdf');
    await selectFiles(wrapper.get('input'), [ file ]);

    expect(wrapper.emitted('selectFiles')).toEqual([ [ [ file ] ] ]);
    expect(wrapper.text()).toContain('contract.pdf');
    expect(wrapper.get('button').text()).toBe('Select a different file');
  });

  it('clears the selection when the user goes to pick a different file', async () => {
    const wrapper = mount(VerdocsFileChooser);

    await selectFiles(wrapper.get('input'), [ pdf('contract.pdf') ]);
    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('selectFiles')?.at(-1)).toEqual([ [] ]);
    expect(wrapper.text()).toContain('Drag a file here');
  });

  it('accepts several files when multiple is set', async () => {
    const wrapper = mount(VerdocsFileChooser, { props: { multiple: true } });

    const files = [ pdf('nda.pdf'), pdf('lease.pdf') ];
    await selectFiles(wrapper.get('input'), files);

    expect(wrapper.emitted('selectFiles')).toEqual([ [ files ] ]);
    expect(wrapper.text()).toContain('nda.pdf, lease.pdf');
  });

  it('takes only the first dropped file unless multiple is set', async () => {
    const wrapper = mount(VerdocsFileChooser);

    const files = [ pdf('nda.pdf'), pdf('lease.pdf') ];
    await wrapper.trigger('drop', { dataTransfer: { files } });

    expect(wrapper.emitted('selectFiles')).toEqual([ [ [ files[0] ] ] ]);
    expect(wrapper.text()).toContain('nda.pdf');
    expect(wrapper.text()).not.toContain('lease.pdf');
  });

  it('highlights the drop target while dragging over it', async () => {
    const wrapper = mount(VerdocsFileChooser);

    await wrapper.trigger('dragover');
    expect(wrapper.classes()).toContain('vdocs:outline-dashed');

    await wrapper.trigger('dragleave');
    expect(wrapper.classes()).not.toContain('vdocs:outline-dashed');
  });
});
