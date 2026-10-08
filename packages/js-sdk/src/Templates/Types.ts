import {ITemplate, ITemplateField} from '../Models';
import type {TFieldDefault} from '../BaseTypes';

export interface ITemplateTag {
  tag_name: string;
  template_id: string;
}

export interface ITag {
  name: string;
  featured?: boolean;
  organization_id?: string;
  created_at?: string;
}

export interface IStar {
  template_id: string;
  profile_id: string;
}

export interface ITemplateSearchResult {
  page: number;
  row: number;
  total: number;
  result: ITemplate[];
}

export interface ITemplateFieldRequest extends Omit<ITemplateField, 'default'> {
  default?: TFieldDefault | null;
}

/**
 * Send feedback about a template to the Verdocs team, with optional details. This endpoint is intended to be
 * used by template maintainers to report field-auto-detection and formatting issues, not by signers. Verdocs
 * does not provide a formal response SLA or request routing/handling commitment for submissions via this
 * endpoint.
 */
export interface ITemplateFeedbackRequest {
  /** Feedback body, max 4000 chars. */
  comments: string;
  /** The part of the app the feedback came from, e.g. "field-suggestions". Max 64 characters. */
  source?: string;
  /** The page the sender was viewing (1-based). */
  page?: number;
  /** Total pages in the template's documents. */
  page_count?: number;
  /** How far down the document the sender had scrolled, from 0 to 100. */
  scroll_percent?: number;
  /** Browser viewport size, e.g. "1440x900". */
  viewport?: string;
  /** Screen size, e.g. "2560x1440". */
  screen?: string;
  /** Zoom level of the document view, e.g. 1.25. */
  zoom?: number;
  /** Browser language, e.g. "en-US". */
  language?: string;
  /** URL of the page the feedback came from. */
  url?: string;
}
