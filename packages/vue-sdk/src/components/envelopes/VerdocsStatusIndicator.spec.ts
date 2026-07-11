import { mount } from '@vue/test-utils';
import type { IEnvelope, IRecipient } from '@verdocs/js-sdk';
import VerdocsStatusIndicator, { getStatusColor, getStatusMessage } from './VerdocsStatusIndicator.vue';

const makeEnvelope = (overrides: Partial<IEnvelope>): IEnvelope =>
  ({
    id: 'envelope-1',
    name: 'Test Envelope',
    status: 'pending',
    recipients: [],
    ...overrides,
  }) as IEnvelope;

const makeRecipient = (overrides: Partial<IRecipient>): IRecipient =>
  ({
    envelope_id: 'envelope-1',
    role_name: 'Signer 1',
    first_name: 'Test',
    last_name: 'Recipient',
    email: 'test@example.com',
    sequence: 1,
    status: 'invited',
    ...overrides,
  }) as IRecipient;

describe('VerdocsStatusIndicator', () => {
  it.each([
    [ 'pending', 'Pending' ],
    [ 'in progress', 'In Progress' ],
    [ 'complete', 'Completed' ],
    [ 'declined', 'Declined' ],
    [ 'canceled', 'Cancelled' ],
    [ 'invited', 'Invited' ],
    [ 'opened', 'Opened' ],
    [ 'signed', 'Signed' ],
    [ 'submitted', 'Submitted' ],
    [ 'accepted', 'Accepted' ],
  ] as const)('renders the %s status as %s', (status, label) => {
    const wrapper = mount(VerdocsStatusIndicator, { props: { status } });
    expect(wrapper.text()).toContain(label);
  });

  it('returns an unknown status string unchanged', () => {
    expect(getStatusMessage('archived')).toBe('archived');
  });

  it('defaults to pending when neither status nor envelope is provided', () => {
    const wrapper = mount(VerdocsStatusIndicator);
    expect(wrapper.text()).toContain('Pending');
  });

  it('derives the status from the envelope when no status is given', () => {
    const wrapper = mount(VerdocsStatusIndicator, { props: { envelope: makeEnvelope({ status: 'declined' }) } });
    expect(wrapper.text()).toContain('Declined');
  });

  it('reports partly-signed when some but not all recipients have submitted', () => {
    const envelope = makeEnvelope({
      status: 'in progress',
      recipients: [ makeRecipient({ status: 'submitted' }), makeRecipient({ role_name: 'Signer 2', status: 'invited' }) ],
    });

    const wrapper = mount(VerdocsStatusIndicator, { props: { envelope } });
    expect(wrapper.text()).toContain('Partly Signed');
  });

  it('does not report partly-signed when every recipient has submitted', () => {
    const envelope = makeEnvelope({
      status: 'complete',
      recipients: [ makeRecipient({ status: 'submitted' }), makeRecipient({ role_name: 'Signer 2', status: 'submitted' }) ],
    });

    const wrapper = mount(VerdocsStatusIndicator, { props: { envelope } });
    expect(wrapper.text()).toContain('Completed');
  });

  it('prefers an explicit status over the envelope', () => {
    const wrapper = mount(VerdocsStatusIndicator, { props: { status: 'canceled', envelope: makeEnvelope({ status: 'complete' }) } });
    expect(wrapper.text()).toContain('Cancelled');
  });

  it.each([
    [ 'invited', 'var(--vdocs-color-accent, #654dcb)' ],
    [ 'opened', 'var(--vdocs-color-accent, #654dcb)' ],
    [ 'accepted', 'var(--vdocs-color-accent, #654dcb)' ],
    [ 'signed', 'var(--vdocs-color-accent, #654dcb)' ],
    [ 'some-signed', 'var(--vdocs-color-primary, #55bc81)' ],
    [ 'submitted', 'var(--vdocs-color-primary, #55bc81)' ],
    [ 'complete', 'var(--vdocs-color-primary, #55bc81)' ],
    [ 'declined', '#ff0000' ],
    [ 'canceled', '#999999' ],
    [ 'in progress', '#999999' ],
    [ 'pending', '#999999' ],
    [ 'anything-else', '#999999' ],
  ])('maps the %s status to color %s', (status, color) => {
    expect(getStatusColor(status)).toBe(color);
  });

  it('colors the declined icon per theme', () => {
    const light = mount(VerdocsStatusIndicator, { props: { status: 'declined' } });
    expect(light.find('svg path').attributes('fill')).toBe('#ff0000');

    const dark = mount(VerdocsStatusIndicator, { props: { status: 'declined', theme: 'dark' } });
    expect(dark.find('svg path').attributes('fill')).toBe('#f95353');
  });

  it('renders the same artwork for submitted and complete', () => {
    const submitted = mount(VerdocsStatusIndicator, { props: { status: 'submitted' } });
    const submittedPath = submitted.find('svg path').attributes('d');

    const complete = mount(VerdocsStatusIndicator, { props: { status: 'complete' } });
    expect(complete.find('svg path').attributes('d')).toBe(submittedPath);
  });
});
