/**
 * A Tag is a user-specified label applied to a template. Tags help users organize and find Templates.
 * recipients. Every Organization has a set of tags "owned" by that Organization and only visible inside it.
 * Verdocs also provides a set of system-wide "featured" tags available to all Organizations.
 *
 * @module
 */

import {ITemplateTag, ITag} from './Types';
import {VerdocsEndpoint} from '../VerdocsEndpoint';

/**
 * Apply a tag to a template.
 */
export const addTemplateTag = (endpoint: VerdocsEndpoint, templateId: string, params: ITag) =>
  endpoint.api //
    .post<ITemplateTag>(`/templates/${templateId}/tags/`, params)
    .then((r) => r.data);

/**
 * Get all tags for a template.
 */
export const getTemplateTags = (endpoint: VerdocsEndpoint, templateId: string) =>
  endpoint.api //
    .get<ITemplateTag[]>(`/templates/${templateId}/tags/`)
    .then((r) => r.data);

/**
 * Remove a tag from a template.
 */
export const deleteTemplateTag = (endpoint: VerdocsEndpoint, templateId: string, tagName: string) =>
  endpoint.api //
    .post(`/templates/${templateId}/tags/${tagName}`)
    .then((r) => r.data);

/**
 * Create an Organization-wide tag.
 */
export const createTag = (endpoint: VerdocsEndpoint, name: string) =>
  endpoint.api //
    .post<ITag>('/tags', {tag_name: name})
    .then((r) => r.data);

/**
 * Get an Organization-wide tag.
 */
export const getTag = (endpoint: VerdocsEndpoint, name: string) =>
  endpoint.api //
    .get<ITag>(`/tags/${name}`)
    .then((r) => r.data);

/**
 * Get all tags available for use by an Organization.
 */
export const getAllTags = (endpoint: VerdocsEndpoint) =>
  endpoint.api //
    .get<ITag[]>('/tags')
    .then((r) => r.data);
