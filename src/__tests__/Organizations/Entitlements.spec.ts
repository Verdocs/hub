import {collapseEntitlements} from '../../Utils';
import {IEntitlement} from '../../Models';

const SAMPLE_ENTITLEMENTS: IEntitlement[] = [
  {
    id: 'eae89e66-83bc-44f7-bb35-a8ef55958b3e',
    organization_id: 'eae89e66-83bc-44f7-bb35-a8ef55958b3e',
    contract_id: '1234',
    notes: 'Test',
    feature: 'kba_auth',
    monthly_max: -1,
    yearly_max: 5000,
    starts_at: '2025-01-01T00:00:00.000Z',
    ends_at: '2025-12-31T00:00:00.000Z',
    created_at: '2025-01-26T00:00:00.000Z',
  },
  {
    id: '98e94415-90b9-4601-a7bf-6557c7f4d426',
    organization_id: 'eae89e66-83bc-44f7-bb35-a8ef55958b3e',
    contract_id: 'A',
    notes: 'B\nC\nD\nE\nF\nG\nH',
    feature: 'kba_auth',
    monthly_max: -1,
    yearly_max: -1,
    starts_at: '2025-01-27T00:00:00.000Z',
    ends_at: '2025-01-27T00:00:00.000Z',
    created_at: '2025-01-27T05:32:30.097Z',
  },
  {
    id: 'c8127c99-be1c-4c4c-af52-cbaf220c4059',
    organization_id: 'eae89e66-83bc-44f7-bb35-a8ef55958b3e',
    contract_id: 'asdf',
    notes: '23123123123',
    feature: 'passcode_auth',
    monthly_max: -1,
    yearly_max: -1,
    starts_at: '2025-01-27T00:00:00.000Z',
    ends_at: '2025-01-27T00:00:00.000Z',
    created_at: '2025-01-27T05:40:26.608Z',
  },
];

it('collapseEntitlements should properly distill entitlements', async () => {
  const e = collapseEntitlements(SAMPLE_ENTITLEMENTS);
  console.log('e', e);
});
