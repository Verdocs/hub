import { mount } from '@vue/test-utils';
import VerdocsQuickFilter from './VerdocsQuickFilter.vue';
import VerdocsPagination from './VerdocsPagination.vue';
import VerdocsTextInput from './VerdocsTextInput.vue';
import VerdocsDropdown from './VerdocsDropdown.vue';
import VerdocsButton from './VerdocsButton.vue';

describe('VerdocsButton', () => {
  it('renders its label and handles clicks', async () => {
    const onClick = vi.fn();
    const wrapper = mount(VerdocsButton, { props: { label: 'Click Me' }, attrs: { onClick } });

    expect(wrapper.text()).toContain('Click Me');

    await wrapper.get('button').trigger('click');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire when disabled', async () => {
    const onClick = vi.fn();
    const wrapper = mount(VerdocsButton, { props: { label: 'Nope' }, attrs: { disabled: true, onClick } });

    await wrapper.get('button').trigger('click');
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('VerdocsTextInput', () => {
  it('renders a labeled input and clears via the clear button', async () => {
    const wrapper = mount(VerdocsTextInput, { props: { label: 'Name', clearable: true, modelValue: 'abc' } });

    expect(wrapper.get('input').element.value).toBe('abc');

    await wrapper.get('button[aria-label="Clear"]').trigger('click');
    expect(wrapper.emitted('cleared')).toHaveLength(1);
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([ '' ]);
  });

  it('toggles password visibility', async () => {
    const wrapper = mount(VerdocsTextInput, { props: { label: 'Password', type: 'password', modelValue: 'secret' } });

    expect(wrapper.get('input').attributes('type')).toBe('password');

    await wrapper.get('button[aria-label="Show password"]').trigger('click');
    expect(wrapper.get('input').attributes('type')).toBe('text');
  });
});

describe('VerdocsQuickFilter', () => {
  const options = [
    { value: 'all', label: 'All' },
    { value: 'starred', label: 'Starred' },
  ];

  it('shows the selected option and fires optionSelected', async () => {
    const wrapper = mount(VerdocsQuickFilter, { props: { label: 'Starred', value: 'all', options } });

    expect(wrapper.get('button').text()).toContain('All');

    await wrapper.get('button').trigger('click');
    const starred = wrapper.findAll('[role="option"]').find(option => option.text() === 'Starred');
    await starred!.trigger('click');

    expect(wrapper.emitted('optionSelected')).toEqual([ [ options[1] ] ]);
  });
});

describe('VerdocsDropdown', () => {
  it('opens a menu, skips separators, and fires optionSelected', async () => {
    const wrapper = mount(VerdocsDropdown, {
      props: {
        options: [
          { label: 'Preview / Send', id: 'send' },
          { label: '' },
          { label: 'Edit', id: 'edit', disabled: true },
        ],
      },
    });

    await wrapper.get('button[aria-label="Open menu"]').trigger('click');

    const items = wrapper.findAll('[role="menuitem"]');
    expect(items.map(item => item.text())).toEqual([ 'Preview / Send', 'Edit' ]);
    expect(items[1]!.attributes('disabled')).toBeDefined();

    await items[0]!.trigger('click');
    expect(wrapper.emitted('optionSelected')).toEqual([ [ { label: 'Preview / Send', id: 'send' } ] ]);
  });
});

describe('VerdocsPagination', () => {
  it('renders pages and navigates', async () => {
    const wrapper = mount(VerdocsPagination, { props: { selectedPage: 0, itemCount: 45, perPage: 10 } });

    expect(wrapper.get('button[aria-label="Page 1"]').attributes('aria-current')).toBe('page');
    expect(wrapper.find('button[aria-label="First page"]').exists()).toBe(false);

    await wrapper.get('button[aria-label="Last page"]').trigger('click');
    expect(wrapper.emitted('selectPage')).toEqual([ [ 4 ] ]);
  });

  it('shows the first-page shortcut when beyond page one', () => {
    const wrapper = mount(VerdocsPagination, { props: { selectedPage: 3, itemCount: 100, perPage: 10 } });

    expect(wrapper.find('button[aria-label="First page"]').exists()).toBe(true);
  });
});
