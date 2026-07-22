import { html, nothing } from 'lit';
import type { IIconOptions } from './types.js';

export const menuArrowIcon = ({ className = '', title }: IIconOptions = {}) => html`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class=${className} aria-hidden=${title ? nothing : 'true'}>
    ${title ? html`<title>${title}</title>` : nothing}
    <path d="M7 10l5 5 5-5H7z" />
  </svg>`;
