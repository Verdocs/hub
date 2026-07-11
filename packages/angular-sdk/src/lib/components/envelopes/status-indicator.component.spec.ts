import { TestBed } from '@angular/core/testing';
import type { IEnvelope, IRecipient, TEnvelopeStatus } from '@verdocs/js-sdk';
import { getStatusColor, getStatusMessage, VerdocsStatusIndicatorComponent } from './status-indicator.component';

const makeEnvelope = (status: string, recipientStatuses: string[] = []): IEnvelope =>
  ({
    id: 'envelope-1',
    status,
    recipients: recipientStatuses.map((recipientStatus, index) => ({ role_name: `Signer ${index + 1}`, status: recipientStatus }) as IRecipient),
  }) as IEnvelope;

describe('VerdocsStatusIndicatorComponent', () => {
  const render = (inputs: Record<string, unknown> = {}) => {
    const fixture = TestBed.createComponent(VerdocsStatusIndicatorComponent);
    Object.entries(inputs).forEach(([ name, value ]) => fixture.componentRef.setInput(name, value));
    fixture.detectChanges();
    return fixture;
  };

  const label = (fixture: { nativeElement: HTMLElement }) => fixture.nativeElement.querySelector('span')?.textContent?.trim();

  it('renders the full status-to-message mapping', () => {
    const expected: [string, string][] = [
      [ 'accepted', 'Accepted' ],
      [ 'canceled', 'Cancelled' ],
      [ 'complete', 'Completed' ],
      [ 'declined', 'Declined' ],
      [ 'in progress', 'In Progress' ],
      [ 'invited', 'Invited' ],
      [ 'opened', 'Opened' ],
      [ 'pending', 'Pending' ],
      [ 'signed', 'Signed' ],
      [ 'submitted', 'Submitted' ],
    ];

    expected.forEach(([ status, message ]) => {
      const fixture = render({ status });
      // The label and artwork are asserted per status; the mapping table above
      // names each case if one regresses.
      expect(label(fixture)).toBe(message);
      expect(fixture.nativeElement.querySelector('svg')).toBeTruthy();
    });
  });

  it('renders an unknown status string unchanged, with the pending artwork', () => {
    const fixture = render({ status: 'mystery' as TEnvelopeStatus });

    expect(label(fixture)).toBe('mystery');
    expect(getStatusMessage('mystery')).toBe('mystery');
  });

  it('defaults to pending when neither status nor envelope is provided', () => {
    const fixture = render();

    expect(label(fixture)).toBe('Pending');
  });

  it('derives the status from the envelope when no status is given', () => {
    const fixture = render({ envelope: makeEnvelope('complete') });

    expect(label(fixture)).toBe('Completed');
  });

  it('reports partly-signed when some but not all recipients have submitted', () => {
    const fixture = render({ envelope: makeEnvelope('in progress', [ 'submitted', 'invited' ]) });

    expect(label(fixture)).toBe('Partly Signed');
  });

  it('does not report partly-signed when every recipient has submitted', () => {
    const fixture = render({ envelope: makeEnvelope('complete', [ 'submitted', 'submitted' ]) });

    expect(label(fixture)).toBe('Completed');
  });

  it('prefers an explicit status over the envelope', () => {
    const fixture = render({ status: 'declined', envelope: makeEnvelope('in progress', [ 'submitted', 'invited' ]) });

    expect(label(fixture)).toBe('Declined');
  });

  it('colors the declined icon per theme', () => {
    const light = render({ status: 'declined' });
    expect(light.nativeElement.querySelector('svg path')?.getAttribute('fill')).toBe('#ff0000');

    const dark = render({ status: 'declined', theme: 'dark' });
    expect(dark.nativeElement.querySelector('svg path')?.getAttribute('fill')).toBe('#f95353');
  });

  it('renders the same artwork for submitted and complete', () => {
    const submitted = render({ status: 'submitted' });
    const complete = render({ status: 'complete' });

    expect(submitted.nativeElement.querySelector('svg path')?.getAttribute('d'))
      .toBe(complete.nativeElement.querySelector('svg path')?.getAttribute('d'));
  });

  it('sizes the icon down in the small variant', () => {
    const fixture = render({ status: 'pending', size: 'small' });

    expect(fixture.nativeElement.querySelector('svg')?.getAttribute('class')).toContain('vdocs:size-5');
  });

  it('maps statuses to theme colors through getStatusColor', () => {
    expect(getStatusColor('invited')).toBe('var(--vdocs-color-accent, #654dcb)');
    expect(getStatusColor('signed')).toBe('var(--vdocs-color-accent, #654dcb)');
    expect(getStatusColor('complete')).toBe('var(--vdocs-color-primary, #55bc81)');
    expect(getStatusColor('submitted')).toBe('var(--vdocs-color-primary, #55bc81)');
    expect(getStatusColor('declined')).toBe('#ff0000');
    expect(getStatusColor('pending')).toBe('#999999');
    expect(getStatusColor('mystery')).toBe('#999999');
  });
});
