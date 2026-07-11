import type { IconProps } from './types';

export default function RefreshIcon({ className, title }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} aria-hidden={!title}>
      {title && <title>{title}</title>}
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M23 4V10H17" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.49 15A9 9 0 1 1 21.23 8" />
    </svg>
  );
}
