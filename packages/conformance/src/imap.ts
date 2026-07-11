import path from 'node:path';
import { ImapFlow, type MessageStructureObject } from 'imapflow';

export interface IImapEnv {
  host: string;
  user: string;
  password: string;
}

/**
 * Load the IMAP mailbox credentials from the gitignored .env at the hub root.
 * Unlike loadEnv in support.ts this returns null instead of throwing, because
 * the signup lane is optional: without a mailbox we skip it rather than fail
 * the whole conformance run.
 */
export const loadImapEnv = (): IImapEnv | null => {
  try {
    process.loadEnvFile(path.resolve(import.meta.dirname, '../../../.env'));
  } catch {
    // Fall through to the check below; variables may be set externally.
  }

  const host = process.env.VERDOCS_TEST_IMAP_HOST;
  const user = process.env.VERDOCS_TEST_IMAP_USER;
  const password = process.env.VERDOCS_TEST_IMAP_PASSWORD;

  if (!host || !user || !password) {
    return null;
  }

  return { host, user, password };
};

export interface IWaitForMessageParams {
  /** Match messages addressed to this exact address (To or Cc, case-insensitive). */
  to: string;
  /** Optionally require this substring in the Subject (case-insensitive). */
  subjectContains?: string;
  /** Ignore messages older than this instant (small clock-skew allowance applied). */
  since: Date;
  /** How long to keep polling before giving up. Defaults to 120s. */
  timeoutMs?: number;
  /** Delay between polls. Defaults to 5s. */
  pollMs?: number;
}

export interface IMatchedMessage {
  subject: string;
  /** Decoded text/plain part, or empty if the message has none. Beware: Verdocs mails carry only a stub here. */
  text: string;
  /** Decoded text/html part, or empty if the message has none. This is where Verdocs mails put the real content. */
  html: string;
}

// How many of the newest messages to scan on each poll. The test mailbox is
// shared, so a burst of unrelated mail could otherwise push our message out
// of the window.
const SCAN_WINDOW = 20;

// The API host's clock and the mail server's clock are not ours; allow a
// little slack when filtering by date so we don't discard our own message.
const CLOCK_SKEW_MS = 60 * 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Depth-first hunt for the part number of the first body part of the wanted content type. */
const findPartOfType = (node: MessageStructureObject | undefined, type: string): string | undefined => {
  if (!node) {
    return undefined;
  }

  if (node.type === type) {
    // A non-multipart message has no part number; IMAP addresses its body as part 1.
    return node.part || '1';
  }

  for (const child of node.childNodes || []) {
    const found = findPartOfType(child, type);
    if (found) {
      return found;
    }
  }

  return undefined;
};

const streamToText = async (content: NodeJS.ReadableStream, charset?: string): Promise<string> => {
  const chunks: Buffer[] = [];
  for await (const chunk of content) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks);
  try {
    return new TextDecoder(charset || 'utf-8').decode(raw);
  } catch {
    // Unknown charset label; utf-8 is the only safe fallback.
    return raw.toString('utf8');
  }
};

/**
 * Poll the INBOX until a message matching the given criteria arrives, then
 * return its subject and decoded plain and html bodies. Throws after timeoutMs with a
 * description of what was scanned (but never other messages' subjects, since
 * this is a shared mailbox and subjects can carry verification codes).
 *
 * Purelymail's server-side IMAP SEARCH is unreliable, so we never SEARCH.
 * Instead we fetch the newest messages by sequence range on every poll and
 * match the To/Subject headers client-side.
 *
 * ```typescript
 * const message = await waitForMessage(loadImapEnv()!, { to: 'test+x@example.com', since: new Date() });
 * ```
 */
export const waitForMessage = async (env: IImapEnv, params: IWaitForMessageParams): Promise<IMatchedMessage> => {
  const timeoutMs = params.timeoutMs ?? 120000;
  const pollMs = params.pollMs ?? 5000;
  const wantedTo = params.to.toLowerCase();
  const wantedSubject = params.subjectContains?.toLowerCase();
  const earliest = params.since.getTime() - CLOCK_SKEW_MS;

  const client = new ImapFlow({
    host: env.host,
    port: 993,
    secure: true,
    auth: { user: env.user, pass: env.password },
    logger: false,
  });

  // Connection drops between polls surface as an 'error' event; without a
  // listener that would crash the process instead of failing the fetch call.
  client.on('error', () => {});

  await client.connect();

  try {
    const lock = await client.getMailboxLock('INBOX');

    try {
      const deadline = Date.now() + timeoutMs;
      let polls = 0;
      let scanned = 0;

      for (;;) {
        polls += 1;
        const total = typeof client.mailbox === 'object' ? client.mailbox.exists : 0;

        if (total > 0) {
          const firstSeq = Math.max(1, total - SCAN_WINDOW + 1);
          const recent = await client.fetchAll(`${firstSeq}:*`, { uid: true, envelope: true, internalDate: true });
          scanned = recent.length;

          // Newest first, so a resend never hands us a stale code.
          recent.sort((a, b) => b.uid - a.uid);

          for (const message of recent) {
            const envelope = message.envelope;
            if (!envelope) {
              continue;
            }

            const recipients = [ ...envelope.to || [], ...envelope.cc || [] ].map(address => (address.address || '').toLowerCase());
            if (!recipients.includes(wantedTo)) {
              continue;
            }

            if (wantedSubject && !(envelope.subject || '').toLowerCase().includes(wantedSubject)) {
              continue;
            }

            const stamp = message.internalDate ? new Date(message.internalDate) : envelope.date;
            if (stamp && stamp.getTime() < earliest) {
              continue;
            }

            const detail = await client.fetchOne(String(message.uid), { bodyStructure: true }, { uid: true });
            const structure = detail ? detail.bodyStructure : undefined;
            const plainPart = findPartOfType(structure, 'text/plain');
            const htmlPart = findPartOfType(structure, 'text/html');

            // download() undoes the transfer encoding (base64/quoted-printable)
            // for us. We hand back both alternatives because Verdocs mails put
            // a one-line stub in text/plain and the real content in text/html.
            const downloadPart = async (part: string) => {
              const { meta, content } = await client.download(String(message.uid), part, { uid: true });
              return streamToText(content, meta.charset);
            };

            const text = plainPart || htmlPart ? plainPart ? await downloadPart(plainPart) : '' : await downloadPart('1');
            const html = htmlPart ? await downloadPart(htmlPart) : '';

            return { subject: envelope.subject || '', text, html };
          }
        }

        if (Date.now() + pollMs > deadline) {
          throw new Error(
            `No message for ${params.to}${params.subjectContains ? ` with subject containing "${params.subjectContains}"` : ''} ` +
            `after ${Math.round(timeoutMs / 1000)}s (${polls} polls, ${scanned} of ${total} messages scanned each time).`,
          );
        }

        await sleep(pollMs);
        // NOOP gives the server a chance to announce newly arrived messages.
        await client.noop();
      }
    } finally {
      lock.release();
    }
  } finally {
    // Prefer the polite logout; fall back to dropping the socket so a dead
    // connection can never hang the test run.
    await client.logout().catch(() => client.close());
  }
};
