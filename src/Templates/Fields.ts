import {getEndpoint} from '../HTTP/Transport';
import {IField} from './Types';

export const createField = (templateId: string, params: IField) =>
  getEndpoint()
    .post<IField>(`/templates/${templateId}/pages/`, params)
    .then((r) => r.data);

export const editField = (templateId: string, fieldName: string, params: IField) =>
  getEndpoint()
    .put<IField>(`/templates/${templateId}/pages/${fieldName}`, params)
    .then((r) => r.data);

export const deleteField = (templateId: string, fieldName: string) =>
  getEndpoint()
    .delete(`/templates/${templateId}/pages/${fieldName}`)
    .then((r) => r.data);
