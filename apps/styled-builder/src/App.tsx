import { useState } from 'react';
import PropertiesPanel from './components/PropertiesPanel';
import BuilderToolbar from './components/BuilderToolbar';
import FieldsPalette from './components/FieldsPalette';
import { useBrandTheme } from './theme/useBrandTheme';
import BuilderPage from './components/BuilderPage';
import ThemeDialog from './theme/ThemeDialog';
import { BUILDER_FIELDS } from './fields';

export default function App() {
  const { theme, setTheme } = useBrandTheme();
  const [themeOpen, setThemeOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('signature-1');

  const selected = BUILDER_FIELDS.find(candidate => candidate.id === selectedId);

  return (
    <div className="app-shell">
      <BuilderToolbar theme={theme} onOpenTheme={() => setThemeOpen(true)} />
      <div className="builder-body">
        <FieldsPalette />
        <main className="builder-canvas">
          <BuilderPage selectedId={selectedId} onSelectField={setSelectedId} />
        </main>
        {/* Keyed by field id so the panel's local edits reset on reselect. */}
        <PropertiesPanel key={selected?.id ?? 'none'} field={selected} />
      </div>
      {themeOpen && (
        <ThemeDialog theme={theme} onThemeChange={setTheme} onClose={() => setThemeOpen(false)} />
      )}
    </div>
  );
}
