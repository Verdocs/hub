/**
 * An Organization is a high-level container within Verdocs that groups together Templates, Documents, Profiles, Billing, and
 * other settings. A User may be a member of more than one Organization. Each membership is tracked by a Profile representing
 * that user's settings within that organization. It is important to select the correct Profile before performing operations
 * against the Verdocs API, as this also sets the Organization that will be operated on, and the user's permissions within it.
 *
 * @module
 */

export * from './ApiKeys';
export * from './Contacts';
export * from './Groups';
export * from './Invitations';
export * from './Members';
export * from './Organizations';
export * from './Types';
export * from './Webhooks';
