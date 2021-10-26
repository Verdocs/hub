import {Endpoint} from '../HTTP/Transport';
import {ISavedSearch, ISearchHistory, ISearchParams, ISearchResult} from './Types';

export const getSearchHistory = async () => Endpoint.get<ISearchHistory>('/search/history').then((r) => r.data);

export const saveSearch = async (name: string, params: ISearchParams) =>
  Endpoint.post<ISavedSearch>('/search/saved', {...params, name}).then((r) => r.data);

export const searchContent = async (params: ISearchParams) =>
  Endpoint.post<ISearchResult>('/search/content').then((r) => r.data);
