export interface ComponentErrorProps {
  /** The message to display. */
  message: string;
}

/**
 * Render a simple error message. Other components render this when they cannot
 * proceed, e.g. after a failed data load.
 */
export default function ComponentError({ message }: ComponentErrorProps) {
  return (
    <div role="alert" className="vdocs:font-sans vdocs:flex vdocs:p-[15px] vdocs:items-center vdocs:justify-center">
      <div className="vdocs:flex-1 vdocs:h-[300px] vdocs:flex vdocs:text-lg vdocs:text-ink vdocs:box-border vdocs:px-5 vdocs:bg-surface vdocs:items-center vdocs:justify-center">
        {message}
      </div>
    </div>
  );
}
