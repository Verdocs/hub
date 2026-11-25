import {vi} from 'vitest';
import type {VerdocsEndpoint} from '../../VerdocsEndpoint';
import {isIdRetakeRequired, verifySigner} from '../../Envelopes';

const makeEndpoint = () => {
  const post = vi.fn().mockResolvedValue({data: {access_token: 'token'}});
  return {endpoint: {api: {post}} as unknown as VerdocsEndpoint, post};
};

describe('verifySigner', () => {
  it('sends code-based methods as JSON with the default timeout', async () => {
    const {endpoint, post} = makeEndpoint();

    await verifySigner(endpoint, {auth_method: 'passcode', code: '1234'});

    expect(post).toHaveBeenCalledWith('/v2/sign/verify', {auth_method: 'passcode', code: '1234'});
  });

  it('uploads ID photos as multipart form data with a longer timeout', async () => {
    const {endpoint, post} = makeEndpoint();
    const front = new Blob(['front'], {type: 'image/jpeg'});
    const back = new Blob(['back'], {type: 'image/jpeg'});
    const selfie = new Blob(['selfie'], {type: 'image/jpeg'});

    const result = await verifySigner(endpoint, {
      auth_method: 'id',
      country_code: 'USA',
      document_type: 'driverLicense',
      front_image: front,
      back_image: back,
      face_image: selfie,
    });

    expect(result).toEqual({access_token: 'token'});
    const [url, body, config] = post.mock.calls[0];
    expect(url).toBe('/v2/sign/verify');
    expect(config).toEqual({timeout: 180000});
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('auth_method')).toBe('id');
    expect(body.get('country_code')).toBe('USA');
    expect(body.get('document_type')).toBe('driverLicense');
    expect(await (body.get('front_image') as Blob).text()).toBe('front');
    expect(await (body.get('back_image') as Blob).text()).toBe('back');
    expect(await (body.get('face_image') as Blob).text()).toBe('selfie');
  });

  it('leaves the back out for a passport', async () => {
    const {endpoint, post} = makeEndpoint();

    await verifySigner(endpoint, {
      auth_method: 'id',
      country_code: 'GBR',
      document_type: 'passport',
      front_image: new Blob(['front']),
      face_image: new Blob(['selfie']),
    });

    const body = post.mock.calls[0][1] as FormData;
    expect(body.has('back_image')).toBe(false);
  });
});

describe('isIdRetakeRequired', () => {
  it('recognizes the retake response', () => {
    const error = {
      response: {
        status: 400,
        data: {status: 'ERROR', code: 'id_retake', error: 'Please retake the photos.', images: [{image: 'face_image', errors: ['Poor Quality Selfie']}]},
      },
    };

    expect(isIdRetakeRequired(error)).toBe(true);
  });

  it('ignores other errors', () => {
    expect(isIdRetakeRequired({response: {status: 400, data: {status: 'ERROR', error: 'Front image is required'}}})).toBe(false);
    expect(isIdRetakeRequired({response: {status: 500, data: {code: 'id_retake', images: []}}})).toBe(false);
    expect(isIdRetakeRequired(new Error('Network Error'))).toBe(false);
    expect(isIdRetakeRequired(undefined)).toBe(false);
  });
});
