import { mount } from '@vue/test-utils';
import VerdocsProgressBar from './VerdocsProgressBar.vue';

describe('VerdocsProgressBar', () => {
  it('renders the label and percentage above the bar', () => {
    const wrapper = mount(VerdocsProgressBar, { props: { label: 'Uploading...', showPercent: true, percent: 54 } });

    expect(wrapper.text()).toContain('Uploading...');
    expect(wrapper.text()).toContain('54%');

    const bar = wrapper.get('[role="progressbar"]');
    expect(bar.attributes('aria-label')).toBe('Uploading...');
    expect(bar.attributes('aria-valuenow')).toBe('54');
    expect(bar.attributes('aria-valuemin')).toBe('0');
    expect(bar.attributes('aria-valuemax')).toBe('100');
  });

  it('clamps the reported progress to the 0-100 range', () => {
    const over = mount(VerdocsProgressBar, { props: { percent: 150 } });
    expect(over.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('100');
    expect(over.get('[role="progressbar"]').attributes('aria-label')).toBe('Progress');

    const under = mount(VerdocsProgressBar, { props: { percent: -20 } });
    expect(under.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('0');
  });

  it('omits the labels row when neither label nor percentage is requested', () => {
    const wrapper = mount(VerdocsProgressBar, { props: { percent: 25 } });

    expect(wrapper.text()).not.toContain('%');
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('25');
  });
});
