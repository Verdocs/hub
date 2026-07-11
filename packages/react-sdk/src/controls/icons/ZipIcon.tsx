import type { IconProps } from './types';

export default function ZipIcon({ className, title }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden={!title}>
      {title && <title>{title}</title>}
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 16V22H14V16" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 16H18" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 22H4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10L12 16" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12L12 16L16 12" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16V4H20V16" />
    </svg>
  );
}
