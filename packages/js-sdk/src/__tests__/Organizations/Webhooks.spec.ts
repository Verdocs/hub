import {vi} from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import {getWebhookDeliveries, getWebhookDelivery, getWebhookDeliveryStats, resendWebhookDelivery} from '../../Organizations';
import {VerdocsEndpoint} from '../../VerdocsEndpoint';

const endpoint = VerdocsEndpoint.getDefault();

const call = async (fn: () => Promise<unknown>) => {
  const thenFn = vi.fn();
  const catchFn = vi.fn();
  await fn().then(thenFn).catch(catchFn);
  expect(catchFn).not.toHaveBeenCalled();
  return thenFn.mock.calls[0]?.[0];
};

it('getWebhookDeliveries passes its filters as query params', async () => {
  const mock = new MockAdapter(endpoint.api);
  mock.onGet('/v2/webhooks/deliveries', {params: {status: 'failed', page: 1}}).reply(200, {count: 0, rows: 25, page: 1, deliveries: []});

  expect(await call(() => getWebhookDeliveries(endpoint, {status: 'failed', page: 1}))).toEqual({count: 0, rows: 25, page: 1, deliveries: []});
});

it('getWebhookDeliveryStats asks for the requested number of days', async () => {
  const mock = new MockAdapter(endpoint.api);
  mock.onGet('/v2/webhooks/deliveries/stats', {params: {days: 7}}).reply(200, [{date: '2026-10-08', delivered: 1, failed: 0, pending: 0}]);

  expect(await call(() => getWebhookDeliveryStats(endpoint, 7))).toEqual([{date: '2026-10-08', delivered: 1, failed: 0, pending: 0}]);
});

it('getWebhookDelivery and resendWebhookDelivery address one delivery', async () => {
  const mock = new MockAdapter(endpoint.api);
  mock.onGet('/v2/webhooks/deliveries/d_1').reply(200, {id: 'd_1', status: 'failed'});
  mock.onPost('/v2/webhooks/deliveries/d_1/resend').reply(200, {id: 'd_1', status: 'delivered'});

  expect(await call(() => getWebhookDelivery(endpoint, 'd_1'))).toEqual({id: 'd_1', status: 'failed'});
  expect(await call(() => resendWebhookDelivery(endpoint, 'd_1'))).toEqual({id: 'd_1', status: 'delivered'});
});
