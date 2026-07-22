import { html, nothing } from 'lit';
import type { IIconOptions } from './types.js';

export const zipIcon = ({ className = '', title }: IIconOptions = {}) => html`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class=${className} aria-hidden=${title ? nothing : 'true'}>
    ${title ? html`<title>${title}</title>` : nothing}
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 16V22H14V16" />
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 16H18" />
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 22H4" />
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10L12 16" />
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12L12 16L16 12" />
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16V4H20V16" />
  </svg>`;
