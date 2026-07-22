import { Button, TextInput } from '@verdocs/react-sdk';
import { BRAND_PRESETS, VERDOCS_THEME, type BrandTheme } from './theme';

export interface ThemeDialogProps {
  /** The active brand values shown in the form. */
  theme: BrandTheme;
  /** Called with the full updated theme on every edit; values apply live. */
  onThemeChange: (theme: BrandTheme) => void;
  /** Called when the user closes the dialog. */
  onClose: () => void;
}

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

// Swatch picker plus free-text hex, because sales will paste values straight
// out of a customer's brand guide.
function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <div className="color-field">
      <span className="color-field-label">
        {label}
      </span>
      <span className="color-field-controls">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={HEX_PATTERN.test(value) ? value.toLowerCase() : '#000000'}
          onChange={event => onChange(event.target.value)}
        />
        <input
          type="text"
          aria-label={label}
          value={value}
          onChange={event => onChange(event.target.value)}
        />
      </span>
    </div>
  );
}

/**
 * The paste-your-values panel. Presets dress the app as a fictional customer
 * in one click; the fields below take a real prospect's brand values. Every
 * change applies live, and Reset puts the stock Verdocs theme back.
 */
export default function ThemeDialog({ theme, onThemeChange, onClose }: ThemeDialogProps) {
  const update = (patch: Partial<BrandTheme>) => onThemeChange({ ...theme, ...patch });

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Brand theme"
        onClick={event => event.stopPropagation()}>
        <div className="dialog-header">
          <h2>
            Brand theme
          </h2>
          <button type="button" className="dialog-close" aria-label="Close" onClick={onClose}>
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </button>
        </div>

        <div className="preset-row">
          {BRAND_PRESETS.map(preset => (
            <button key={preset.name} type="button" className="preset-chip" onClick={() => onThemeChange(preset.theme)}>
              <span className="preset-swatches" aria-hidden="true">
                <i style={{ background: preset.theme.primary }} />
                <i style={{ background: preset.theme.accent }} />
                <i style={{ background: preset.theme.background }} />
              </span>
              <span className="preset-name">
                {preset.name}
              </span>
              <span className="preset-tagline">
                {preset.tagline}
              </span>
            </button>
          ))}
        </div>

        <div className="dialog-fields">
          <TextInput
            label="Company name"
            value={theme.companyName}
            onChange={event => update({ companyName: event.target.value })}
          />
          <TextInput
            label="Logo URL"
            type="url"
            placeholder="https://..."
            description="Leave empty to show a monogram tile."
            value={theme.logoUrl}
            onChange={event => update({ logoUrl: event.target.value })}
          />

          <div className="color-grid">
            <ColorField label="Primary" value={theme.primary} onChange={primary => update({ primary })} />
            <ColorField label="Primary dark" value={theme.primaryDark} onChange={primaryDark => update({ primaryDark })} />
            <ColorField label="Accent" value={theme.accent} onChange={accent => update({ accent })} />
            <ColorField label="Background" value={theme.background} onChange={background => update({ background })} />
            <ColorField label="Text" value={theme.ink} onChange={ink => update({ ink })} />
          </div>

          <label className="radius-field">
            <span>
              Corner radius:
              {' '}
              {theme.radiusPx}
              px
            </span>
            <input
              type="range"
              min={0}
              max={20}
              value={theme.radiusPx}
              onChange={event => update({ radiusPx: Number(event.target.value) })}
            />
          </label>

          <TextInput
            label="Font family"
            description="Any CSS font-family stack."
            value={theme.fontFamily}
            onChange={event => update({ fontFamily: event.target.value })}
          />
        </div>

        <div className="dialog-footer">
          <Button label="Reset to Verdocs" variant="outline" size="small" onClick={() => onThemeChange(VERDOCS_THEME)} />
          <Button label="Done" size="small" onClick={onClose} />
        </div>
      </div>
    </div>
  );
}
