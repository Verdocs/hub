import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface IConformanceEnv {
  apiBase: string;
  email: string;
  password: string;
}

/**
 * Load credentials from the gitignored .env at the hub root. The suite runs
 * only via an explicit script, so missing credentials are a hard error with
 * instructions rather than a silent skip.
 */
export const loadEnv = (): IConformanceEnv => {
  try {
    process.loadEnvFile(path.resolve(import.meta.dirname, '../../../.env'));
  } catch {
    // Fall through to the check below; variables may be set externally.
  }

  const apiBase = process.env.VERDOCS_API_BASE;
  const email = process.env.VERDOCS_TEST_EMAIL;
  const password = process.env.VERDOCS_TEST_PASSWORD;

  if (!apiBase || !email || !password) {
    throw new Error('Conformance tests need VERDOCS_API_BASE, VERDOCS_TEST_EMAIL, and VERDOCS_TEST_PASSWORD. Copy .env.example to .env at the hub root and fill in a beta test account.');
  }

  return { apiBase, email, password };
};

export interface ICurlResult {
  status: number;
  body: unknown;
}

/**
 * Call an endpoint with real curl in a child process. This is the reference
 * side of every conformance check: raw HTTP with no SDK code in the path.
 */
export const curl = async (method: string, url: string, options: { token?: string; json?: unknown } = {}): Promise<ICurlResult> => {
  const args = [ '-s', '-X', method, '-w', '\n%{http_code}' ];

  if (options.token) {
    args.push('-H', `Authorization: Bearer ${options.token}`);
  }

  if (options.json !== undefined) {
    args.push('-H', 'Content-Type: application/json', '--data', JSON.stringify(options.json));
  }

  args.push(url);

  const { stdout } = await execFileAsync('curl', args);
  const lastNewline = stdout.lastIndexOf('\n');
  const rawBody = stdout.slice(0, lastNewline);
  const status = Number(stdout.slice(lastNewline + 1));

  let body: unknown = rawBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    // Leave non-JSON bodies as raw text.
  }

  return { status, body };
};

const VOLATILE_KEY_PATTERN = /(_at|_exp)$|^(access_token|id_token|refresh_token|expires_in|last_polled)/i;

/**
 * Replace volatile values (timestamps, tokens, expiries) with type markers so
 * two calls made seconds apart still compare equal. Applied to both the curl
 * and SDK sides before diffing, so the shape is still fully checked.
 */
export const normalizeVolatile = (value: unknown, extraVolatileKeys: string[] = []): unknown => {
  if (Array.isArray(value)) {
    return value.map(item => normalizeVolatile(item, extraVolatileKeys));
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([ key, entry ]) => {
      if (VOLATILE_KEY_PATTERN.test(key) || extraVolatileKeys.includes(key)) {
        return [ key, `<<${entry === null ? 'null' : typeof entry}>>` ];
      }

      return [ key, normalizeVolatile(entry, extraVolatileKeys) ];
    }));
  }

  return value;
};
