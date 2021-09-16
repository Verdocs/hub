import axios from 'axios';

export const Endpoint = axios.create({
  baseURL: 'https://stage-api.verdocs.com/',
  timeout: 3000,
  headers: {'X-Client-ID': 'NONE'},
});

export const setAuthToken = (accessToken: string | null) => {
	Endpoint.defaults.headers.Authorization = `Bearer ${accessToken}`;
};

export const setClientID = (clientID: string) => {
	Endpoint.defaults.headers['X-Client-ID'] = clientID;
};
