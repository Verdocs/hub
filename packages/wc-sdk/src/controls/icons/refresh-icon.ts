import { html, nothing } from 'lit';
import type { IIconOptions } from './types.js';

export const refreshIcon = ({ className = '', title }: IIconOptions = {}) => html`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class=${className} aria-hidden=${title ? nothing : 'true'}>
    ${title ? html`<title>${title}</title>` : nothing}
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M23 4V10H17" />
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.49 15A9 9 0 1 1 21.23 8" />
  </svg>`;
