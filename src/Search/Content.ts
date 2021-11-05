/**
 * Verdocs provides a range of search functions to help find and retrieve content. This module provides generic functions intended
 * to locate items across all content types. More specific retrievals may be performed using the various "list" endpoints within
 * each collection (e.g. {@link Documents.Documents.searchDocuments} or {@link Templates.Templates.searchTemplates}).
 *
 * @module
 */

import {ISavedSearch, ISearchHistory, ISearchParams, ISearchResult} from './Types';
import {getEndpoint} from '../HTTP/Transport';

/**
 * Retrieve recent and saved searches. Note that result counts will be limited to a maximum of 20 entries for each
 * type but this may be expanded in the future. Client UI's should self-limit display counts as needed.
 *
 * ```typescript
 * import {Content} from '@verdocs/js-sdk/Search';
 *
 * const {recent, saved} = await Content.getSearchHistory();
 * ```
 */
export const getSearchHistory = async () =>
  getEndpoint()
    .get<ISearchHistory>('/search/history')
    .then((r) => r.data);

/**
 * Save a search. If a name is re-used, that saved search will be overwritten with the new parameters.
 *
 * ```typescript
 * import {Content} from '@verdocs/js-sdk/Search';
 *
 * const entry = await Documents.saveSearch('W9 Forms', {q: 'w9', type: 'template});
 * ```
 */
export const saveSearch = async (name: string, params: ISearchParams) =>
  getEndpoint()
    .post<ISavedSearch>('/search/saved', {name, params})
    .then((r) => r.data);

/**
 * Search for documents matching various criteria.
 *
 * ```typescript
 * import {Content} from '@verdocs/js-sdk/Search';
 *
 * const {result, page, total} = await Documents.search({ ... });
 * ```
 */
export const searchContent = async (params: ISearchParams) =>
  getEndpoint()
    .post<ISearchResult>('/search/content')
    .then((r) => r.data);
