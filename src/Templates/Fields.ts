import {getEndpoint} from '../HTTP/Transport';
import {IField} from './Types';

export const createField = (templateId: string, params: IField) =>
  getEndpoint()
    .api.post<IField>(`/templates/${templateId}/pages/`, params)
    .then((r) => r.data);

export const editField = (templateId: string, fieldName: string, params: IField) =>
  getEndpoint()
    .api.put<IField>(`/templates/${templateId}/pages/${fieldName}`, params)
    .then((r) => r.data);

export const deleteField = (templateId: string, fieldName: string) =>
  getEndpoint()
    .api.delete(`/templates/${templateId}/pages/${fieldName}`)
    .then((r) => r.data);
