import type { IconProps } from './types';

export default function MenuArrowIcon({ className, title }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden={!title}>
      {title && <title>{title}</title>}
      <path d="M7 10l5 5 5-5H7z" />
    </svg>
  );
}
