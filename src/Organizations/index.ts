/**
 * An Organization is a high-level container within Verdocs that groups together Templates, Documents, Profiles, Billing, and
 * other settings. A User may be a member of more than one Organization. Each membership is tracked by a Profile representing
 * that user's settings within that organization. It is important to select the correct Profile before performing operations
 * against the Verdocs API, as this also sets the Organization that will be operated on, and the user's permissions within it.
 *
 * @module
 */

export * as ApiKeys from './ApiKeys';
export * as Groups from './Groups';
export * as Invitations from './Invitations';
export * as Members from './Members';
export * as Organizations from './Organizations';
export * as Types from './Types';
export * as Webhooks from './Webhooks';
export * as Whitelabel from './Whitelabel';
