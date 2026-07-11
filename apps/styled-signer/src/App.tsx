import { useState } from 'react';
import { showToast } from '@verdocs/react-sdk';
import AdoptSignatureModal from './components/AdoptSignatureModal';
import { SIGNER_FIELDS, type SignerField } from './fields';
import { useBrandTheme } from './theme/useBrandTheme';
import SignerFooter from './components/SignerFooter';
import SignerHeader from './components/SignerHeader';
import SignerPage from './components/SignerPage';
import ThemeDialog from './theme/ThemeDialog';

const DEFAULT_SIGNER = 'Jordan Alvarez';

function formatToday(): string {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
}

export default function App() {
  const { theme, setTheme } = useBrandTheme();
  const [themeOpen, setThemeOpen] = useState(false);
  const [adopting, setAdopting] = useState(false);
  // The first field arrives pre-filled so the ceremony opens mid-flight
  // ("Field 2 of 6"), which reads better in a demo than a blank slate.
  const [values, setValues] = useState<Record<string, string>>({ 'full-name': DEFAULT_SIGNER });

  const done = SIGNER_FIELDS.filter(field => values[field.id]).length;
  const active = SIGNER_FIELDS.find(field => !values[field.id]);
  const signerName = values['signature'] || values['full-name'] || DEFAULT_SIGNER;

  // Clicking a field completes it with a canned value; only the signature
  // detours through the adopt modal, like the real ceremony.
  const fillField = (field: SignerField) => {
    if (field.kind === 'signature') {
      setAdopting(true);
      return;
    }

    let value = field.filledValue;
    if (field.kind === 'date') {
      value = formatToday();
    } else if (field.kind === 'initials') {
      value = initialsOf(signerName);
    }
    setValues(previous => ({ ...previous, [field.id]: value }));
  };

  const handleNext = () => {
    if (active) {
      fillField(active);
    } else {
      showToast('Demo complete. This is where the envelope would be submitted.', { style: 'success' });
    }
  };

  const handleDecline = () => {
    showToast('Declining is disabled in this demo.', { style: 'info' });
  };

  const handleAdopt = (name: string) => {
    setValues(previous => ({ ...previous, signature: name }));
    setAdopting(false);
  };

  return (
    <div className="app-shell">
      <SignerHeader
        theme={theme}
        done={done}
        total={SIGNER_FIELDS.length}
        onOpenTheme={() => setThemeOpen(true)}
      />
      <main className="signer-body">
        <SignerPage values={values} activeId={active?.id} onFieldClick={fillField} />
      </main>
      <SignerFooter remaining={SIGNER_FIELDS.length - done} onNext={handleNext} onDecline={handleDecline} />

      {themeOpen && (
        <ThemeDialog theme={theme} onThemeChange={setTheme} onClose={() => setThemeOpen(false)} />
      )}
      {adopting && (
        <AdoptSignatureModal
          initialName={signerName}
          onAdopt={handleAdopt}
          onClose={() => setAdopting(false)}
        />
      )}
    </div>
  );
}
