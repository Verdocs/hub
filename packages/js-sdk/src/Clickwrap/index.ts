/**
 * Clickwrap agreements are terms people accept with a checkbox, such as a Terms of Service. Admins write and publish
 * versions; your server checks a person's status and starts a session; the component (or the hosted page) shows the
 * terms and records the outcome with the session token. Every outcome becomes a record in a hash chain, with a signed
 * certificate and an evidence package available for download.
 *
 * @module
 */

export * from './Acceptances';
export * from './Agreements';
export * from './Sessions';
export * from './Types';
