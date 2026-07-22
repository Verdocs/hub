import { useEffect, useState } from 'react';
import { applyTheme, clearTheme, isDefaultTheme, loadStoredTheme, storeTheme, VERDOCS_THEME, type BrandTheme } from './theme';

export interface BrandThemeState {
  /** The active brand values. */
  theme: BrandTheme;
  /** Replace the active theme; the document restyles immediately. */
  setTheme: (theme: BrandTheme) => void;
}

/**
 * Owns the active brand theme: applies it to the document and persists the
 * last values so a refresh keeps the demo dressed. Setting the theme back to
 * the stock values clears the overrides and forgets the stored copy.
 */
export function useBrandTheme(): BrandThemeState {
  const [theme, setTheme] = useState<BrandTheme>(() => loadStoredTheme() ?? VERDOCS_THEME);

  // The tokens live on <html>, outside the React tree, so an effect keeps
  // them (and the stored copy) in sync with state.
  useEffect(() => {
    if (isDefaultTheme(theme)) {
      clearTheme();
      storeTheme(null);
    } else {
      applyTheme(theme);
      storeTheme(theme);
    }
  }, [theme]);

  return { theme, setTheme };
}
