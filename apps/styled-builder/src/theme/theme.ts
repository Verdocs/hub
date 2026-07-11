/**
 * The white-label surface for this demo. The SDK stylesheet defines every
 * design token as a --vdocs-* custom property on :root, so a brand takeover
 * is a handful of inline overrides on <html>: no rebuild, no extra CSS, and
 * everything (SDK controls included) recolors at once.
 */

export interface BrandTheme {
  /** Company name shown in the chrome and used for the monogram fallback. */
  companyName: string;
  /** Hosted logo image URL. Empty renders a monogram tile instead. */
  logoUrl: string;
  /** Main brand color: primary buttons, filled controls, field tints. */
  primary: string;
  /** Darker shade of the brand color, used for hover states and outline text. */
  primaryDark: string;
  /** Secondary color: focus borders, selection, highlights. */
  accent: string;
  /** App background behind the document page. */
  background: string;
  /** Main text color for chrome and labels. */
  ink: string;
  /** Corner radius for buttons and inputs, in pixels. */
  radiusPx: number;
  /** CSS font-family stack for all UI text. */
  fontFamily: string;
}

/** The stock values, matching the tokens shipped in @verdocs/react-sdk/styles.css. */
export const VERDOCS_THEME: BrandTheme = {
  companyName: 'Verdocs',
  logoUrl: '',
  primary: '#55bc81',
  primaryDark: '#2b995b',
  accent: '#654dcb',
  background: '#f5f5fa',
  ink: '#092c4c',
  radiusPx: 4,
  fontFamily: `'Inter', -apple-system, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif`,
};

export interface BrandPreset {
  /** Name shown on the preset button. */
  name: string;
  /** Short descriptor shown under the name. */
  tagline: string;
  /** Theme values applied when the preset is clicked. */
  theme: BrandTheme;
}

/** Fictional brands sales can apply with one click. */
export const BRAND_PRESETS: BrandPreset[] = [
  {
    name: 'Meridian Trust',
    tagline: 'Retail bank',
    theme: {
      companyName: 'Meridian Trust',
      logoUrl: '',
      primary: '#0f4c81',
      primaryDark: '#0a3763',
      accent: '#9c7a2e',
      background: '#eef2f7',
      ink: '#14283c',
      radiusPx: 2,
      fontFamily: `Georgia, 'Times New Roman', serif`,
    },
  },
  {
    name: 'Harbor Realty Group',
    tagline: 'Real estate',
    theme: {
      companyName: 'Harbor Realty Group',
      logoUrl: '',
      primary: '#b23a48',
      primaryDark: '#92303b',
      accent: '#1d3557',
      background: '#faf7f2',
      ink: '#33261d',
      radiusPx: 8,
      fontFamily: `'Trebuchet MS', Verdana, sans-serif`,
    },
  },
  {
    name: 'CarePoint Health',
    tagline: 'Healthcare',
    theme: {
      companyName: 'CarePoint Health',
      logoUrl: '',
      primary: '#0e7c86',
      primaryDark: '#0b626a',
      accent: '#e8871e',
      background: '#f0f7f6',
      ink: '#17383c',
      radiusPx: 12,
      fontFamily: `'Avenir Next', 'Segoe UI', Helvetica, sans-serif`,
    },
  },
];

// Maps the brand values onto the --vdocs-* custom properties. Inline values on
// <html> win the cascade over the stylesheet's :root rules, which is the whole
// mechanism.
function tokenValues(theme: BrandTheme): Record<string, string> {
  return {
    '--vdocs-color-primary': theme.primary,
    '--vdocs-color-primary-dark': theme.primaryDark,
    '--vdocs-color-accent': theme.accent,
    // The SDK also ships an accent-light shade for hover and selection tints.
    // We derive it so a pasted accent stays in step without asking for a
    // second value.
    '--vdocs-color-accent-light': `color-mix(in srgb, ${theme.accent} 65%, white)`,
    '--vdocs-color-canvas': theme.background,
    '--vdocs-color-ink': theme.ink,
    '--vdocs-radius-ctl': `${theme.radiusPx}px`,
    // Stock tokens keep row corners 1px rounder than controls; preserve that.
    '--vdocs-radius-row': `${theme.radiusPx + 1}px`,
    '--vdocs-font-sans': theme.fontFamily,
  };
}

export function applyTheme(theme: BrandTheme) {
  for (const [name, value] of Object.entries(tokenValues(theme))) {
    document.documentElement.style.setProperty(name, value);
  }
}

/** Remove every override so the stock stylesheet values show through again. */
export function clearTheme() {
  for (const name of Object.keys(tokenValues(VERDOCS_THEME))) {
    document.documentElement.style.removeProperty(name);
  }
}

export function isDefaultTheme(theme: BrandTheme) {
  return (Object.keys(VERDOCS_THEME) as (keyof BrandTheme)[]).every(key => theme[key] === VERDOCS_THEME[key]);
}

const STORAGE_KEY = 'verdocs-styled-builder:theme';

export function loadStoredTheme(): BrandTheme | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    // Merge over the defaults so an older stored shape cannot leave holes.
    return { ...VERDOCS_THEME, ...JSON.parse(raw) as Partial<BrandTheme> };
  } catch {
    return null;
  }
}

export function storeTheme(theme: BrandTheme | null) {
  try {
    if (theme) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage can be unavailable (private mode); theming still works for the
    // session, it just will not survive a refresh.
  }
}
