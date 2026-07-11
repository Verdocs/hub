/**
 * Internal helper for the handful of retrieval calls that used to opt into
 * axios-retry. Timeouts get a single second attempt; everything else throws
 * straight through. Not exported from the package.
 */

const TIMEOUT_CODES = ['ECONNABORTED', 'ETIMEDOUT'];

const isTimeoutError = (error: unknown): boolean =>
  !!error && typeof error === 'object' && TIMEOUT_CODES.includes((error as {code?: string}).code || '');

export const retryOnceOnTimeout = async <T>(request: () => Promise<T>): Promise<T> => {
  try {
    return await request();
  } catch (error) {
    if (isTimeoutError(error)) {
      return request();
    }

    throw error;
  }
};
