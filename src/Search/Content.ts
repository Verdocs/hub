import {Endpoint} from '../HTTP/Transport';

export interface ISearchOptions {
  saved: boolean;
  name: string | null;
  lastSearched: string;
  params: any;
}

export interface IRecentSearches {
  searches: ISearchOptions[];
}

export interface ISavedSearches {
  searches: ISearchOptions[];
}

export const getRecentSearches = async () => Endpoint.post<IRecentSearches>('/search/recent').then((r) => r.data);

export const getSavedSearches = async () => Endpoint.post<ISavedSearches>('/search/saved').then((r) => r.data);
