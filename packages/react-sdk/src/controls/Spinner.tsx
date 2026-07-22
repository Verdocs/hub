export interface SpinnerProps {
  /** Diameter of the spinner in pixels. */
  size?: number;
  /** Light spinners suit dark backgrounds, dark spinners suit light ones. */
  mode?: 'light' | 'dark';
}

/**
 * Display a small loading spinner.
 */
export default function Spinner({ size = 32, mode = 'light' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`vdocs:animate-spin vdocs:rounded-full vdocs:border-[3px] ${
        mode === 'light' ? 'vdocs:border-white/30 vdocs:border-t-white' : 'vdocs:border-ink/30 vdocs:border-t-ink'
      }`}
      style={{ width: size, height: size, flex: `0 0 ${size}px` }}
    />
  );
}
