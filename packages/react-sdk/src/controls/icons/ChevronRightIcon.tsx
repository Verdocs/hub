import type { IconProps } from './types';

export default function ChevronRightIcon({ className, title }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className={className} aria-hidden={!title}>
      {title && <title>{title}</title>}
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
    </svg>
  );
}
