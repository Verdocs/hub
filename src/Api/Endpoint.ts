import axios, {AxiosResponse} from 'axios';

export const Endpoint = axios.create({
  baseURL: 'https://stage-api.verdocs.com/',
  timeout: 3000,
  headers: {'X-Client-ID': '1234'},
});

export type RequestStatus = 'OK' | 'ERROR';

/* istanbul ignore next */
export const setAuthToken = (accessToken: string | null) => {
  Endpoint.defaults.headers.Authorization = `Bearer ${accessToken}`;
};

/** Most requests only ever need to access the data from the server's response */
export const StandardDataReponse = (response: AxiosResponse) => response.data;
