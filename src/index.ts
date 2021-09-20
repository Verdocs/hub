/**
 * Verdocs functions are organized into high-level modules that represent the main objects within Verdocs:
 *
 * - Documents - An individual document to be signed. Documents are created from templates.
 * - HTTP - General support functionality for Verdocs' REST endpoints. Typically not used directly.
 * - Organizations - An Organization is a container for user profiles, templates, documents, billing, and other related objects.
 * - Templates - A template for a document containing a PDF file, metadata for signature fields, and other information.
 * - Users - All operations related to authentication and user-related operations.
 * - Utils - General support functions used by the other modules and exported for convenience.
 *
 * @module
 */

export * as Documents from './Documents';
export * as HTTP from './HTTP';
export * as Organizations from './Organizations';
export * as Users from './Users';
export * as Utils from './Utils';
