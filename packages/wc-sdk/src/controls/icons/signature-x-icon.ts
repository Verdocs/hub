import { html, nothing } from 'lit';
import type { IIconOptions } from './types.js';

export const signatureXIcon = ({ className = '', title }: IIconOptions = {}) => html`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 28" fill="currentColor" class=${className} aria-hidden=${title ? nothing : 'true'}>
    ${title ? html`<title>${title}</title>` : nothing}
    <path d="M24.0625 28.0078H18.4961L12.7539 17.7344C12.5846 17.4219 12.3958 16.9792 12.1875 16.4062H12.1094C11.9922 16.6927 11.7969 17.1354 11.5234 17.7344L5.60547 28.0078H0L9.17969 13.9258L0.742188 0H6.42578L11.4844 9.45312C11.8099 10.0781 12.1029 10.7031 12.3633 11.3281H12.4219C12.7995 10.5078 13.125 9.85677 13.3984 9.375L18.6523 0H23.8867L15.2539 13.8867L24.0625 28.0078Z" />
  </svg>`;
