import type {IEnvelope, IProfile} from '../../Models';
import {userCanResetEnvelope} from '../../Envelopes';

const owner = {id: 'owner'} as IProfile;
const other = {id: 'other'} as IProfile;

const makeEnvelope = (status: string, recipients: object[] = []) => ({profile_id: 'owner', status, recipients}) as unknown as IEnvelope;

describe('userCanResetEnvelope', () => {
  it('allows the owner to reset an expired envelope', () => {
    expect(userCanResetEnvelope(owner, makeEnvelope('expired'))).toBe(true);
    expect(userCanResetEnvelope(other, makeEnvelope('expired'))).toBe(false);
  });

  it('allows a reset when a recipient failed authentication', () => {
    expect(userCanResetEnvelope(owner, makeEnvelope('in progress', [{status: 'failed'}]))).toBe(true);
    expect(userCanResetEnvelope(owner, makeEnvelope('pending', [{status: 'invited', auth_method_states: {kba: 'failed'}}]))).toBe(true);
  });

  it('refuses envelopes with nothing to reset or in a final state', () => {
    expect(userCanResetEnvelope(owner, makeEnvelope('in progress', [{status: 'invited', auth_method_states: {passcode: ''}}]))).toBe(false);
    expect(userCanResetEnvelope(owner, makeEnvelope('canceled', [{status: 'failed'}]))).toBe(false);
    expect(userCanResetEnvelope(owner, makeEnvelope('complete'))).toBe(false);
  });
});
