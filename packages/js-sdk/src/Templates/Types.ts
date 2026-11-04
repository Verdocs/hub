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

/** Where one role sits in a template's workflow, for arrangeTemplateRoles. */
export interface IRolePosition {
  /** The role's name. */
  name: string;
  /** The step the role acts in. Roles that share a step are invited together. */
  sequence: number;
  /** The role's place within its step, for display. Leave it out to keep the role's current order. */
  order?: number;
}

export type TTemplateAnalysisStatus = 'queued' | 'running' | 'complete' | 'failed';

/** A suggested cleanup of one template field. */
export interface ITemplateAnalysisField {
  /** The template field this suggestion describes. */
  name: string;
  /** A snake_case name suited to prefill data and webhook payloads. */
  api_name: string;
  /** What the person filling the form would call it, in sentence case. */
  label: string;
  /** The field type that best fits what the form asks for. */
  type: 'textbox' | 'textarea' | 'date' | 'checkbox' | 'radio' | 'dropdown' | 'signature' | 'initial';
  /** A validator that clearly applies, or "none". */
  format: 'none' | 'email' | 'phone' | 'url' | 'postal_code' | 'number' | 'ssn';
}

/** Fields that answer one question. */
export interface ITemplateAnalysisGroup {
  /** A snake_case name for the question. */
  api_name: string;
  /** The question, as the form asks it. */
  label: string;
  /** "radio" when one answer applies, "checkbox_set" for "check all that apply". */
  kind: 'radio' | 'checkbox_set';
  /** The fields that answer it, each with the value it stands for. */
  members: {name: string; value: string}[];
  /** Why the model grouped them, in a few words. */
  reason: string;
}

/** Fields the form only wants filled depending on another answer. */
export interface ITemplateAnalysisRule {
  /** The fields that depend on the answer. */
  target_names: string[];
  /** The api_name of the controlling group, or of a single controlling checkbox. */
  when_group: string;
  /** The member value that turns the fields on, or "checked". */
  when_value: string;
  /** The form wording behind the rule, in a few words. */
  reason: string;
}

/** Suggestions for one page of a template document. */
export interface ITemplateAnalysisPage {
  /** The template document the page belongs to. */
  document_id: string;
  /** The page number, starting at 1. */
  page: number;
  /** "failed" when the model couldn't analyze this page. */
  status: 'complete' | 'failed';
  /** Who fills this page, as a short role name such as "Applicant". */
  signer?: string;
  /** One suggestion per field on the page. */
  fields?: ITemplateAnalysisField[];
  /** Radio groups and check-all-that-apply sets. */
  groups?: ITemplateAnalysisGroup[];
  /** Conditional fields. */
  rules?: ITemplateAnalysisRule[];
  /** Fields on the page that have no suggestion. */
  missing?: string[];
  /** What went wrong, when the page failed. */
  error?: string;
}

/** A model's suggested cleanup of a template's fields. */
export interface ITemplateAnalysis {
  /** The analysis ID. */
  id: string;
  /** The template analyzed. */
  template_id: string;
  /** The organization that owns the template. */
  organization_id: string;
  /** Who asked for the analysis. */
  profile_id: string | null;
  /** Poll until this is "complete" or "failed". */
  status: TTemplateAnalysisStatus;
  /** The Bedrock model that ran it. */
  model: string;
  /** The effort level it ran at. */
  effort: string;
  /** Pages with fields to analyze. */
  pages_total: number;
  /** Pages finished so far, including any that failed. */
  pages_done: number;
  /** The suggestions per page, once complete. Only getTemplateAnalysis includes them. */
  result?: {pages: ITemplateAnalysisPage[]} | null;
  /** Token totals across every page. */
  usage: {input_tokens: number; output_tokens: number; cache_read_input_tokens: number; cache_creation_input_tokens: number} | null;
  /** What went wrong, when any page failed. */
  error: string | null;
  /** When the analysis finished. */
  completed_at: string | null;
  /** When the analysis was requested. */
  created_at: string;
  /** When the analysis last changed. */
  updated_at: string;
}
