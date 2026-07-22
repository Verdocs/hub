# Comments

Binding for every line written in this repo: code comments, doc comments, commit messages when we write them, README prose, all of it. The goal is that nothing here reads machine-generated, and comments carry information the code cannot.

## Core rules

1. No em-dashes, anywhere, ever. Use commas, colons, parentheses, or restructure the sentence.
2. No emoji, no smart quotes, no high-ASCII or decorative Unicode. Straight ASCII quotes and apostrophes only.
3. No overly formal or structured language. If a comment sounds like a compliance memo ("In order to facilitate...", "It should be noted that..."), rewrite it the way you would say it to the person at the next desk.
4. Comment the why, not the what. A comment that restates the next line is noise; delete it. A comment that explains a constraint, a gotcha, or a decision earns its place.
5. Never write comments that talk to a reviewer or narrate the change you just made ("fixed the bug where...", "this now correctly handles..."). Comments are for the next reader of the file, who has no idea a change ever happened.
6. Write in plain sentences, first person plural where it fits. "We remove the prefix here so we don't repeat it in every endpoint" is the house voice.
7. Keep TODO comments honest: what needs to happen and enough context that someone else could do it. No bare "TODO: fix".

## Internal comments

The tone standard is the platform api codebase. Real examples of comments doing their job:

```ts
// Express 5 changed the default query parser from 'extended' (qs) to 'simple' (Node querystring). The simple parser
// doesn't decode bracketed array params: `status[]=pending` becomes the key "status[]" rather than an array under
// "status". We have a few queries relying on the old behavior (envelope filter) so we override that.
```

```ts
// Our load balancer directs traffic to us based on a URL prefix. We remove it here so we don't need to
// repeat it in every endpoint.
```

```ts
// All recipients will get a notification, so if the creator is also a recipient we don't want
// to send them a dupe.
```

Each explains something the code cannot say: an upstream behavior change, an infrastructure constraint, a business rule. None of them narrate syntax. That is the bar.

Sparse is fine. Most code needs no comment at all; a well-named function beats a paragraph. When logic is genuinely subtle (session handoff, retry semantics, date math), a short block comment above the section beats line-by-line drips.

## User-facing doc comments

Public SDK surface gets doc comments in the js-sdk style: a one-or-two sentence summary in plain language, a runnable example where usage is not obvious, then any machine-consumed tags. Example from js-sdk:

```ts
/**
 * Get all templates accessible by the caller, with optional filters.
 *
 * ```typescript
 * import {getTemplates} from '@verdocs/js-sdk/Templates';
 *
 * await getTemplates(VerdocsEndpoint.getDefault(), { is_starred: true });
 * ```
 *
 * @group Templates
 * @api GET /v2/templates Get Templates
 */
```

Rules for doc comments:

1. The summary states what the caller gets, not how the internals work.
2. Examples must be copy-pasteable and current. A wrong example is worse than none.
3. Property-level doc comments are one line where possible ("Page to retrieve (0-based). Defaults to 0.").
4. js-sdk's @group/@api/@apiQuery tags feed the OpenAPI generator; keep them accurate there. Other SDKs use their language's native doc format (TSDoc, Angular/Compodoc-friendly JSDoc, XML doc comments in C#, docstrings in Python) per their own standards doc.

## The AI-marker ban, spelled out

These are the tells we will not ship: em-dashes, emoji, smart quotes, box-drawing or arrow characters in prose, bullet-pointed comment blocks with bolded lead-ins, "Note that" as a sentence opener repeated three times per file, and hedged non-statements ("this should generally work in most cases"). If a comment cannot commit to a fact, find out the fact or delete the comment.
