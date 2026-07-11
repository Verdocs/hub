import type { ComponentProps } from 'react';

export interface ProgressBarProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Optional label to display above the bar. */
  label?: string;
  /** If true, the progress percentage will be displayed above the bar. */
  showPercent?: boolean;
  /** The current progress value (0-100). */
  percent?: number;
}

/**
 * Display a simple progress bar in a style consistent with the design system.
 */
export default function ProgressBar({ label = '', showPercent = false, percent = 0, className = '', ...rest }: ProgressBarProps) {
  const widthPercent = Math.ceil(Math.min(Math.max(percent, 0), 100));

  return (
    <div className={`vdocs:font-sans vdocs:w-full vdocs:box-border vdocs:flex vdocs:flex-col ${className}`} {...rest}>
      {(!!label || showPercent) && (
        <div className="vdocs:flex vdocs:flex-row vdocs:justify-between vdocs:mb-2">
          {!!label && (
            <div className="vdocs:text-sm vdocs:font-semibold vdocs:text-ink">
              {label}
            </div>
          )}
          {showPercent && (
            <div className="vdocs:text-sm vdocs:font-semibold vdocs:text-ink">
              {percent}
              %
            </div>
          )}
        </div>
      )}

      <div
        role="progressbar"
        aria-label={label || 'Progress'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={widthPercent}
        className="vdocs:flex vdocs:h-2.5 vdocs:rounded-row vdocs:bg-edge-light">
        <div className="vdocs:rounded-row vdocs:bg-primary" style={{ width: `${widthPercent}%` }} />
      </div>
    </div>
  );
}
