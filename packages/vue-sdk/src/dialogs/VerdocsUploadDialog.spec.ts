import { DOMWrapper, mount } from '@vue/test-utils';
import VerdocsUploadDialog from './VerdocsUploadDialog.vue';

// The dialog teleports to document.body, so assertions and clicks go through a
// body wrapper rather than the mount wrapper.
const body = () => new DOMWrapper(document.body);

const buttonByLabel = (label: string) => body().findAll('button').find(button => button.text() === label)!;

const pdf = (name: string, content = '%PDF-1.4') => new File([ content ], name, { type: 'application/pdf' });

// jsdom does not implement the file picker, so the selection is injected
// directly onto the input before firing change.
const selectFiles = async (files: File[]) => {
  const input = body().get('input[type="file"]');
  Object.defineProperty(input.element, 'files', { value: files, configurable: true });
  await input.trigger('change');
};

describe('VerdocsUploadDialog', () => {
  it('enables Upload once a file is chosen and hands the files over', async () => {
    const wrapper = mount(VerdocsUploadDialog);

    expect(body().get('[role="dialog"]').text()).toContain('Upload attachment');
    expect(buttonByLabel('Upload').attributes('disabled')).toBeDefined();

    const file = pdf('contract.pdf');
    await selectFiles([ file ]);

    expect(buttonByLabel('Upload').attributes('disabled')).toBeUndefined();
    await buttonByLabel('Upload').trigger('click');
    expect(wrapper.emitted('upload')).toEqual([ [ [ file ] ] ]);

    wrapper.unmount();
  });

  it('flags selections over the size limit and keeps Upload disabled', async () => {
    const wrapper = mount(VerdocsUploadDialog, { props: { maxSize: 1024 } });

    await selectFiles([ pdf('big.pdf', 'x'.repeat(2048)) ]);

    expect(body().get('[role="dialog"]').text()).toContain('Total file size must not exceed 1KB.');
    expect(buttonByLabel('Upload').attributes('disabled')).toBeDefined();
    expect(wrapper.emitted('upload')).toBeUndefined();

    wrapper.unmount();
  });

  it('cancels via the Cancel button and dialog dismissal', async () => {
    const wrapper = mount(VerdocsUploadDialog);

    await buttonByLabel('Cancel').trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(1);

    await body().get('button[aria-label="Close"]').trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(2);
    expect(wrapper.emitted('upload')).toBeUndefined();

    wrapper.unmount();
  });
});
