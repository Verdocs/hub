import { html, nothing } from 'lit';
import type { IIconOptions } from './types.js';

// A stack of three sheets, used behind a page-count number in the attachments
// list. The legacy source hardcoded the slate outline; we follow currentColor
// so the caller's text color drives it. The sheet fills stay white: it draws a
// paper stack, and no token stands in for the page color.
export const pageCountIcon = ({ className = '', title }: IIconOptions = {}) => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="19" height="24" viewBox="0 0 19 24" fill="none" class=${className} aria-hidden=${title ? nothing : 'true'}>
    ${title ? html`<title>${title}</title>` : nothing}
    <rect x="0.5" y="0.5" width="14" height="17" rx="0.5" fill="white" stroke="currentColor" />
    <rect x="2.5" y="2.5" width="14" height="18" rx="0.5" fill="white" stroke="currentColor" />
    <rect x="4.5" y="4.5" width="14" height="19" rx="0.5" fill="white" stroke="currentColor" />
  </svg>`;
