import type { ReactNode } from 'react';
import type { IEnvelopeDocument } from '@verdocs/js-sdk';
import CertificateIcon from '../controls/icons/CertificateIcon';
import DocumentIcon from '../controls/icons/DocumentIcon';
import RefreshIcon from '../controls/icons/RefreshIcon';
import CheckIcon from '../controls/icons/CheckIcon';
import ZipIcon from '../controls/icons/ZipIcon';
import Dialog from './Dialog';

/**
 * The download flavors the user can choose: a single attachment as-is, the
 * signing certificate, everything merged into one PDF, or a ZIP of all files.
 */
export type TDownloadVariant = 'document' | 'certificate' | 'combined' | 'zip';

interface DownloadOptionProps {
  icon: ReactNode;
  label: string;
  description: string;
  /** Shows the green check plus readyLabel; otherwise a busy spinner. */
  ready: boolean;
  readyLabel: string;
  disabled?: boolean;
  disabledTitle?: string;
  onSelect: () => void;
}

function DownloadOption({ icon, label, description, ready, readyLabel, disabled = false, disabledTitle, onSelect }: DownloadOptionProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={disabled ? disabledTitle : undefined}
      onClick={onSelect}
      className="vdocs:flex vdocs:w-full vdocs:cursor-pointer vdocs:items-center vdocs:gap-[15px] vdocs:rounded-md vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-surface vdocs:px-[15px] vdocs:py-3 vdocs:text-left vdocs:font-sans vdocs:transition-colors vdocs:enabled:hover:border-primary vdocs:enabled:hover:bg-canvas vdocs:disabled:cursor-default vdocs:disabled:opacity-50">
      <span className="vdocs:flex vdocs:size-9 vdocs:shrink-0 vdocs:items-center vdocs:justify-center vdocs:rounded-full vdocs:bg-canvas vdocs:text-muted vdocs:[&>svg]:size-[18px]">
        {icon}
      </span>

      <span className="vdocs:flex-1">
        <span className="vdocs:mb-0.5 vdocs:block vdocs:text-sm vdocs:font-medium vdocs:text-ink">
          {label}
        </span>
        <span className="vdocs:block vdocs:text-[13px] vdocs:text-muted">
          {description}
        </span>
      </span>

      <span className="vdocs:flex vdocs:min-w-[50px] vdocs:flex-col vdocs:items-center vdocs:gap-0.5 vdocs:text-[11px] vdocs:text-edge">
        {ready ? (
          <>
            <CheckIcon className="vdocs:size-4 vdocs:text-success" />
            {readyLabel}
          </>
        ) : (
          <RefreshIcon className="vdocs:size-4 vdocs:animate-spin" />
        )}
      </span>
    </button>
  );
}

export interface DownloadDialogProps {
  /** The envelope's documents: signer attachments plus the generated certificate. */
  documents?: IEnvelopeDocument[];
  /** True once the envelope is signed. Until then attachments show a busy spinner and the certificate options stay disabled. */
  signed?: boolean;
  /** True while the caller is still polling for generated files; keeps the combined and ZIP options disabled. */
  polling?: boolean;
  /** True when a certificate exists server-side but has not landed in documents yet. */
  hasCertificate?: boolean;
  /** Fired with the chosen document and variant. Envelope-level picks with no single source document (zip, or a certificate not yet in documents) pass document as undefined. */
  onDownload?: (document: IEnvelopeDocument | undefined, variant: TDownloadVariant) => void;
  /** Fired when the user dismisses the dialog via the overlay or the close button. */
  onCancel?: () => void;
}

/**
 * Download choices for an envelope: each attachment individually, the signing
 * certificate, one combined PDF, or everything as a ZIP. The legacy dialog
 * resolved the file links itself through the API; this port is presentational,
 * so the caller supplies the documents array and fetches the actual file when
 * onDownload fires.
 */
export default function DownloadDialog({ documents = [], signed = false, polling = false, hasCertificate = false, onDownload, onCancel }: DownloadDialogProps) {
  const attachments = documents
    .filter(document => document.type === 'attachment')
    .sort((a, b) => (a.order !== b.order ? a.order - b.order : a.created_at.localeCompare(b.created_at)));
  const certificateDocument = documents.find(document => document.type === 'certificate');

  const certReady = signed && (!!certificateDocument || hasCertificate);
  const allDone = !polling && certReady;
  // Merging needs the certificate document itself, not just the flag saying one exists.
  const combinedReady = allDone && !!certificateDocument;

  return (
    <Dialog heading="Download" onClose={onCancel}>
      <div className="vdocs:flex vdocs:flex-col vdocs:gap-[15px]">
        {attachments.length <= 2 &&
          attachments.map(document => (
            <DownloadOption
              key={document.id}
              icon={<DocumentIcon />}
              label={document.name}
              description="Download the document"
              ready={signed}
              readyLabel="Signed"
              onSelect={() => onDownload?.(document, 'document')}
            />
          ))}

        {attachments.length > 2 && (
          <p className="vdocs:m-0 vdocs:px-1 vdocs:text-[13px] vdocs:text-muted vdocs:italic">
            Multiple documents attached. Please use the ZIP option below to download all files.
          </p>
        )}

        <DownloadOption
          icon={<CertificateIcon />}
          label="Certificate"
          description="Download the certificate"
          ready={certReady}
          readyLabel="Ready"
          disabled={!certReady}
          disabledTitle="Certificate not yet available"
          onSelect={() => onDownload?.(certificateDocument, 'certificate')}
        />

        <DownloadOption
          icon={<ZipIcon />}
          label="Combined"
          description="Merge envelopes & certificate into a single PDF"
          ready={combinedReady}
          readyLabel="Ready"
          disabled={!combinedReady}
          disabledTitle="Waiting for all documents to be ready"
          onSelect={() => onDownload?.(certificateDocument, 'combined')}
        />

        <DownloadOption
          icon={<ZipIcon />}
          label="All Files"
          description="Download everything as a ZIP file"
          ready={allDone}
          readyLabel="Ready"
          disabled={!allDone}
          disabledTitle="Waiting for all documents to be ready"
          onSelect={() => onDownload?.(undefined, 'zip')}
        />
      </div>
    </Dialog>
  );
}
