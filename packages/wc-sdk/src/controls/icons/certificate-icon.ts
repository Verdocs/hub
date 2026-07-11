import { html, nothing } from 'lit';
import type { IIconOptions } from './types.js';

export const certificateIcon = ({ className = '', title }: IIconOptions = {}) => html`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class=${className} aria-hidden=${title ? nothing : 'true'}>
    ${title ? html`<title>${title}</title>` : nothing}
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z" />
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" />
  </svg>`;
