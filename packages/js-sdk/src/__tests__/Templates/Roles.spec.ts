import MockAdapter from 'axios-mock-adapter';
import {arrangeTemplateRoles, renumberRoles} from '../../Templates';
import {VerdocsEndpoint} from '../../VerdocsEndpoint';

const endpoint = VerdocsEndpoint.getDefault();
const places = (roles: {name: string; sequence: number; order: number}[]) => roles.map((role) => `${role.name}:${role.sequence}.${role.order}`);

it('arrangeTemplateRoles should patch the role positions onto the template', async () => {
  const roles = [
    {name: 'Seller', sequence: 1, order: 1},
    {name: 'Buyer', sequence: 2, order: 1},
  ];
  const mock = new MockAdapter(endpoint.api);
  mock.onPatch('/v2/roles/tpl_1234', {roles: [{name: 'Seller', sequence: 1}]}).reply(200, roles);

  expect(await arrangeTemplateRoles(endpoint, 'tpl_1234', [{name: 'Seller', sequence: 1}])).toEqual(roles);
});

it('renumberRoles closes a skipped step', () => {
  const roles = [
    {name: 'Recipient', sequence: 1, order: 1},
    {name: 'Recipient 2', sequence: 1, order: 2},
    {name: 'Seller', sequence: 3, order: 1},
  ];

  expect(places(renumberRoles(roles))).toEqual(['Recipient:1.1', 'Recipient 2:1.2', 'Seller:2.1']);
});

it('renumberRoles gives a contested spot to the roles in first', () => {
  const roles = [
    {name: 'A', sequence: 1, order: 1},
    {name: 'B', sequence: 1, order: 2},
    {name: 'C', sequence: 1, order: 1},
  ];

  expect(places(renumberRoles(roles, ['C']))).toEqual(['C:1.1', 'A:1.2', 'B:1.3']);
});

it('renumberRoles leaves its input alone', () => {
  const roles = [{name: 'A', sequence: 2, order: 4}];

  expect(places(renumberRoles(roles))).toEqual(['A:1.1']);
  expect(places(roles)).toEqual(['A:2.4']);
});
