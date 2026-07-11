export interface BrandMarkProps {
  /** Company name displayed next to the mark. */
  name: string;
  /** Logo image URL. Empty renders a monogram tile with the company initial. */
  logoUrl: string;
}

/**
 * The customer's logo and name as they would appear in a white-labeled
 * deployment. Without a logo URL we fall back to a monogram tile in the
 * primary color so the chrome never looks unfinished mid-demo.
 */
export default function BrandMark({ name, logoUrl }: BrandMarkProps) {
  return (
    <div className="brand-mark">
      {logoUrl ? (
        <img className="brand-mark-logo" src={logoUrl} alt={`${name} logo`} />
      ) : (
        <div className="brand-mark-monogram" aria-hidden="true">
          {(name.trim().charAt(0) || 'V').toUpperCase()}
        </div>
      )}
      <span className="brand-mark-name">
        {name}
      </span>
    </div>
  );
}
