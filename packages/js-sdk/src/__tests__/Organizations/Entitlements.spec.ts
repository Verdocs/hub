import {collapseEntitlements} from '../../Utils';
import {IEntitlement} from '../../Models';

const DAY = 24 * 60 * 60 * 1000;
const yesterday = new Date(Date.now() - DAY).toISOString();
const tomorrow = new Date(Date.now() + DAY).toISOString();
const lastMonth = new Date(Date.now() - 30 * DAY).toISOString();
const lastWeek = new Date(Date.now() - 7 * DAY).toISOString();

const SAMPLE_ENTITLEMENTS: IEntitlement[] = [
  {
    id: 'eae89e66-83bc-44f7-bb35-a8ef55958b3e',
    organization_id: 'eae89e66-83bc-44f7-bb35-a8ef55958b3e',
    contract_id: '1234',
    notes: 'Active kba_auth entitlement',
    feature: 'kba_auth',
    monthly_max: -1,
    yearly_max: 5000,
    starts_at: yesterday,
    ends_at: tomorrow,
    created_at: lastMonth,
  },
  {
    id: '98e94415-90b9-4601-a7bf-6557c7f4d426',
    organization_id: 'eae89e66-83bc-44f7-bb35-a8ef55958b3e',
    contract_id: 'A',
    notes: 'Second active kba_auth entitlement, should lose to the first',
    feature: 'kba_auth',
    monthly_max: -1,
    yearly_max: -1,
    starts_at: yesterday,
    ends_at: tomorrow,
    created_at: lastMonth,
  },
  {
    id: 'c8127c99-be1c-4c4c-af52-cbaf220c4059',
    organization_id: 'eae89e66-83bc-4c4c-af52-cbaf220c4059',
    contract_id: 'asdf',
    notes: 'Expired passcode_auth entitlement',
    feature: 'passcode_auth',
    monthly_max: -1,
    yearly_max: -1,
    starts_at: lastMonth,
    ends_at: lastWeek,
    created_at: lastMonth,
  },
];

it('collapseEntitlements should properly distill entitlements', () => {
  const collapsed = collapseEntitlements(SAMPLE_ENTITLEMENTS);

  // One active entry per feature, first match wins, expired entries dropped
  expect(collapsed.kba_auth?.id).toEqual(SAMPLE_ENTITLEMENTS[0].id);
  expect(collapsed.passcode_auth).toBeUndefined();
  expect(Object.keys(collapsed)).toEqual(['kba_auth']);
});
