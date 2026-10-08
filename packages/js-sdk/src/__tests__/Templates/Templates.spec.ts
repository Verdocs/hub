import {vi} from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import {sendTemplateFeedback, toggleTemplateStar} from '../../Templates';
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
