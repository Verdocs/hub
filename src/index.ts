/**
 * Verdocs functions are organized into high-level modules that represent the main objects within Verdocs:
 *
 * - Envelopes - An individual document to be signed. Documents are created from templates.
 * - Organizations - An Organization is a container for user profiles, templates, documents, billing, and other related objects.
 * - Templates - A template for a document containing a PDF file, metadata for signature fields, and other information.
 * - Users - All operations related to authentication and user-related operations.
 * - Utils - General support functions used by the other modules and exported for convenience.
 *
 * @module
 */

export * as Models from './Models';

export * as Envelopes from './Envelopes';
export * as Organizations from './Organizations';
export * as Sessions from './Sessions';
export * as Templates from './Templates';
export * as Users from './Users';
export * as Utils from './Utils';
export * from './VerdocsEndpoint';
