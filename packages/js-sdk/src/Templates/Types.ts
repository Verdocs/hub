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

/** What a caller sends for a data key: text, an ISO date, true or false, or one of a fixed set of choices. "mixed" means its fields disagree. */
export type TDataKeyType = 'text' | 'date' | 'boolean' | 'choice' | 'mixed';

export interface IDataContractOption {
  /** What to send in prefill_data. The label is accepted too. */
  value: string;
  /** What the signer sees for this choice. */
  label: string;
}

export interface IDataContractKey {
  /** The data key, such as "applicant.full_name". */
  key: string;
  /** What to send for it: text, date (ISO 8601), boolean, choice (one of the options), or mixed when its fields disagree. */
  type: TDataKeyType;
  /** How many fields on the template use this key. */
  placements: number;
  /** True when one of its fields is read-only, so the signer can't supply the value. */
  needed: boolean;
  /** For choices, the values that are accepted. */
  options?: IDataContractOption[];
  /** Whether the key is a live entry in the template organization's data catalog. */
  in_catalog?: boolean;
}

export interface IDataContract {
  /** The template this contract describes. */
  template_id: string;
  /** Changes only when the keys, their types, whether they're needed, or their options change. */
  contract_hash: string;
  /** Every data key the template's fields use, sorted by key. */
  keys: IDataContractKey[];
  /** A JSON Schema for the prefill_data this template accepts. */
  json_schema: Record<string, unknown>;
}
