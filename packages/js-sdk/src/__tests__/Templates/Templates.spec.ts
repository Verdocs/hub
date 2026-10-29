import {vi} from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import {getTemplateDataContract, sendTemplateFeedback, toggleTemplateStar} from '../../Templates';
import {VerdocsEndpoint} from '../../VerdocsEndpoint';

const endpoint = VerdocsEndpoint.getDefault();

it('sendTemplateFeedback should post the feedback to the template', async () => {
  const catchFn = vi.fn();
  const thenFn = vi.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onPost('/v2/templates/tpl_1234/feedback', {comments: 'Missed the date fields', page: 2}).reply(202, {status: 'OK'});

  await sendTemplateFeedback(endpoint, 'tpl_1234', {comments: 'Missed the date fields', page: 2})
    .then(thenFn)
    .catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith({status: 'OK'});
  expect(catchFn).not.toHaveBeenCalled();
});

it('toggleTemplateStar should post to the stars toggle route', async () => {
  const catchFn = vi.fn();
  const thenFn = vi.fn();

  const mock = new MockAdapter(endpoint.api);
  mock.onPost('/v2/templates/tpl_1234/stars/toggle').reply(200, {id: 'tpl_1234', star_counter: 1});

  await toggleTemplateStar(endpoint, 'tpl_1234').then(thenFn).catch(catchFn);
  expect(thenFn).toHaveBeenCalledWith({id: 'tpl_1234', star_counter: 1});
  expect(catchFn).not.toHaveBeenCalled();
});

it('getTemplateDataContract should get the template data contract', async () => {
  const contract = {template_id: 'tpl_1234', contract_hash: 'sha256:abc', keys: [], json_schema: {type: 'object'}};
  const mock = new MockAdapter(endpoint.api);
  mock.onGet('/v2/templates/tpl_1234/data-contract').reply(200, contract);

  expect(await getTemplateDataContract(endpoint, 'tpl_1234')).toEqual(contract);
});
