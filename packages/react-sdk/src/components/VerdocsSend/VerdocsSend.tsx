import { useEffect, useMemo, useRef, useState } from 'react';
import { formatFullName, isValidEmail } from '@verdocs/js-sdk';
import type { ICreateEnvelopeFromTemplateRequest, ICreateEnvelopeRecipientFromTemplate } from '@verdocs/js-sdk';
import type { ChangeEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import type { IBrand, IEnvelope, IRecipient, ITemplate, TRecipientAuthMethod, VerdocsEndpoint } from '@verdocs/js-sdk';
import { ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon, WarningTriangleIcon } from '../../controls/icons';
import { useOrganizationContacts } from '../../hooks/useOrganizationContacts';
import { useCreateEnvelope } from '../../hooks/useCreateEnvelope';
import { useEntitlements } from '../../hooks/useEntitlements';
import { useOrganization } from '../../hooks/useOrganization';
import ComponentError from '../../controls/ComponentError';
import { useTemplate } from '../../hooks/useTemplates';
import { getWebAppUrl } from '../../utils/environment';
import ContactPicker from '../envelopes/ContactPicker';
import { signerClassName } from '../../fields/types';
import { useSession } from '../../hooks/useSession';
import { useBrands } from '../../hooks/useBrands';
import Checkbox from '../../controls/Checkbox';
import { showToast } from '../../utils/toast';
import Spinner from '../../controls/Spinner';
import Button from '../../controls/Button';
import Loader from '../../controls/Loader';
import { SDKError } from '../../types';

/**
 * Everything the component is about to send, exactly as it will be posted: recipients plus
 * brand_key, expires_at, no_contact, timezone, and locale. Hosts that cancel the send and
 * create the envelope themselves should forward it unchanged.
 */
export interface ISendEventDetail extends ICreateEnvelopeFromTemplateRequest {
  name: string;
  template_id: string;
  recipients: ICreateEnvelopeRecipientFromTemplate[];
  template: ITemplate;
}

/** The same payload once the envelope exists, reported through onSend. */
export interface ISentEventDetail extends ICreateEnvelopeFromTemplateRequest {
  name: string;
  template_id: string;
  recipients: ICreateEnvelopeRecipientFromTemplate[];
  envelope_id: string;
  envelope: IEnvelope;
}

export interface VerdocsSendProps {
  /** The endpoint to use. Defaults to the one supplied by the nearest VerdocsProvider. */
  endpoint?: VerdocsEndpoint;
  /** The ID of the template to create the envelope from. */
  templateId: string;
  /**
   * The environment the control is being called from, e.g. 'web'. This changes how notifications
   * are assembled so recipients get invitation URLs that work for them. Leave unset unless you
   * know the environment; unknown values produce incorrect behavior.
   */
  environment?: string;
  /**
   * Whether to show the cancel button. Turn it off where the embed sits in a flow that has its
   * own navigation for the user to back out.
   */
  showCancel?: boolean;
  /**
   * Preselect a brand by key. The sender can still change it in the brand chooser. Leave unset
   * for the organization default.
   */
  brandKey?: string;
  /** Called with the pending request just before it is posted. Return false to cancel the send. */
  onBeforeSend?: (details: ISendEventDetail) => boolean | void;
  /** Called once the envelope has been created. */
  onSend?: (details: ISentEventDetail) => void;
  /** Called when the user clicks Cancel. */
  onCancel?: () => void;
  /** Called if the envelope could not be created. */
  onSdkError?: (error: SDKError) => void;
  /** Called as the sender types a name in the recipient form. */
  onSearchContacts?: (query: string) => void;
}

type TSendView = 'main' | 'recipient' | 'brand' | 'expires' | 'notifications';

interface IRoleRow {
  /** Stable per-template row id: level plus position within that level. */
  id: string;
  roleName: string;
  level: number;
  /** Position in the template's role list, which drives the signer color. */
  signerIndex: number;
  defaults: Partial<IRecipient>;
}

const VERDOCS_LOGO_URL = 'https://app.verdocs.com/assets/blue-logo.svg';

// Product decision: web senders get a 120-day default and ceiling. The API keeps its own rules
// so developers calling it directly are not forced into these. The API refuses an expiration
// less than a day out, so one day is the floor here.
const MIN_EXPIRY_DAYS = 1;
const MAX_EXPIRY_DAYS = 120;
const DEFAULT_EXPIRY_DAYS = 120;

// A swipe right on a detail view goes Back. It must start in the left quarter of the pane (so a
// drag across a text field or the pill rows never triggers it), travel at least this far, be
// more horizontal than vertical, and finish quickly.
const SWIPE_START_FRACTION = 0.25;
const SWIPE_MIN_DISTANCE = 60;
const SWIPE_MAX_DURATION = 500;

const AUTH_METHOD_LABELS: Record<TRecipientAuthMethod, string> = {
  email: 'Email',
  passcode: 'Passcode',
  sms: 'SMS',
  kba: 'KBA',
  id: 'ID check',
};

// Separator between a recipient's name and email. Escaped because the repo bans non-ASCII source.
const MIDDLE_DOT = '\u00b7';

const ROW_CLASSES =
  'vdocs:flex vdocs:w-full vdocs:cursor-pointer vdocs:items-center vdocs:gap-2.5 vdocs:border-0 vdocs:border-t '
  + 'vdocs:border-solid vdocs:border-edge-light vdocs:bg-transparent vdocs:text-left vdocs:font-sans vdocs:text-ink '
  + 'vdocs:last:border-b vdocs:focus-visible:outline-2 vdocs:focus-visible:-outline-offset-2 vdocs:focus-visible:outline-accent';

const HINT_CLASSES = 'vdocs:mt-2.5 vdocs:text-xs/relaxed vdocs:text-muted';

const LINK_CLASSES = 'vdocs:font-medium vdocs:text-accent vdocs:no-underline';

const INPUT_CLASSES =
  'vdocs:box-border vdocs:h-9 vdocs:w-full vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge '
  + 'vdocs:bg-surface vdocs:pr-[52px] vdocs:pl-2.5 vdocs:font-sans vdocs:text-sm vdocs:text-ink vdocs:outline-none '
  + 'vdocs:placeholder:text-edge vdocs:focus:border-accent';

// Amber has no design token: the warning treatment is specific to this card, so it carries its
// own values rather than bending the danger or info tokens into a shade they do not mean.
const WARNING_TEXT = 'vdocs:text-[#78350f]';
const WARNING_ICON = 'vdocs:text-[#d97706]';

const clampExpiryDays = (digits: string) => (digits ? String(Math.min(Math.max(Number(digits), MIN_EXPIRY_DAYS), MAX_EXPIRY_DAYS)) : '');

const effectiveExpiryDays = (value: string) => {
  const days = Number(value);
  return days >= MIN_EXPIRY_DAYS ? Math.min(days, MAX_EXPIRY_DAYS) : DEFAULT_EXPIRY_DAYS;
};

const expiresAtFor = (value: string) => new Date(Date.now() + effectiveExpiryDays(value) * 24 * 60 * 60 * 1000);

const isConfigured = (recipient: Partial<IRecipient> | undefined) =>
  !!recipient?.first_name && !!recipient?.last_name && isValidEmail(recipient?.email || '');

// Only options the sender switched on are worth surfacing on the row. Email verification is the
// default for every recipient, so it is never listed.
const recipientOptionLabels = (recipient: Partial<IRecipient> | undefined) => {
  if (!recipient) {
    return [];
  }

  const labels = (recipient.auth_methods || []).filter(method => method !== 'email').map(method => AUTH_METHOD_LABELS[method] || method);
  if (recipient.delegator) {
    labels.push('May delegate');
  }

  if (recipient.name_locked) {
    labels.push('Name locked');
  }

  return labels;
};

const hasMoreBelow = (el: HTMLElement) => el.scrollHeight - el.clientHeight - el.scrollTop > 2;

function RoleDot({ signerIndex }: { signerIndex: number }) {
  return (
    <span
      className={`${signerClassName(signerIndex)} vdocs:size-2.5 vdocs:shrink-0 vdocs:rounded-full vdocs:border vdocs:border-solid vdocs:border-[rgba(0,0,0,0.1)]`}
    />
  );
}

function SectionTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`vdocs:mb-1.5 vdocs:text-xs vdocs:font-semibold vdocs:text-ink ${className}`}>
      {children}
    </div>
  );
}

function DetailHeader({ title, onBack }: { title: ReactNode; onBack: () => void }) {
  return (
    <div className="vdocs:mb-3.5 vdocs:flex vdocs:items-center vdocs:gap-2">
      <button
        type="button"
        onClick={onBack}
        className="vdocs:flex vdocs:flex-[0_0_52px] vdocs:cursor-pointer vdocs:items-center vdocs:border-none vdocs:bg-transparent vdocs:p-0 vdocs:font-sans vdocs:text-[13px] vdocs:font-medium vdocs:text-accent">
        <ChevronLeftIcon className="vdocs:size-4" />
        Back
      </button>
      <div className="vdocs:flex vdocs:flex-1 vdocs:items-center vdocs:justify-center vdocs:gap-2 vdocs:text-sm vdocs:font-semibold">
        {title}
      </div>
      <div className="vdocs:flex-[0_0_52px]" />
    </div>
  );
}

/**
 * Scrolling region of a detail view. The fade over its bottom edge appears only while there is
 * more content below, so a view that fits shows no decoration at all.
 */
function DetailBody({ children }: { children: ReactNode }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);

  // Measured rather than derived: only the browser knows whether this content overflowed. The
  // children dependency re-measures when a view grows, e.g. the notifications warning opening.
  useEffect(() => {
    if (bodyRef.current) {
      setMoreBelow(hasMoreBelow(bodyRef.current));
    }
  }, [children]);

  return (
    <div className="vdocs:relative vdocs:flex vdocs:min-h-0 vdocs:flex-1 vdocs:flex-col">
      <div ref={bodyRef} onScroll={e => setMoreBelow(hasMoreBelow(e.currentTarget))} className="vdocs:min-h-0 vdocs:flex-1 vdocs:overflow-y-auto">
        {children}
      </div>
      <div
        aria-hidden="true"
        className={`vdocs:pointer-events-none vdocs:absolute vdocs:inset-x-0 vdocs:bottom-0 vdocs:h-9 vdocs:bg-linear-to-b vdocs:from-[rgba(255,255,255,0)] vdocs:to-surface vdocs:transition-opacity ${moreBelow ? 'vdocs:opacity-100' : 'vdocs:opacity-0'}`}
      />
    </div>
  );
}

function DetailFooter({ onDone }: { onDone: () => void }) {
  return (
    <div className="vdocs:mt-2.5 vdocs:border-0 vdocs:border-t vdocs:border-solid vdocs:border-edge-light vdocs:pt-3">
      <Button label="Done" size="small" className="vdocs:w-full" onClick={onDone} />
    </div>
  );
}

function BrandSwatch({ brand, fallback }: { brand: IBrand | null; fallback: string }) {
  const image = brand?.favicon_url || brand?.thumbnail_url || (brand ? null : VERDOCS_LOGO_URL);
  if (image) {
    return (
      <span className="vdocs:flex vdocs:size-[22px] vdocs:shrink-0 vdocs:items-center vdocs:justify-center vdocs:overflow-hidden vdocs:rounded-row vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-surface">
        <img src={image} alt="" className="vdocs:size-full vdocs:object-contain" />
      </span>
    );
  }

  return (
    <span
      style={{ backgroundColor: brand?.primary_color || undefined }}
      className="vdocs:flex vdocs:size-[22px] vdocs:shrink-0 vdocs:items-center vdocs:justify-center vdocs:overflow-hidden vdocs:rounded-row vdocs:bg-accent-dark vdocs:text-[9px] vdocs:font-bold vdocs:text-white">
      {fallback.substring(0, 2).toUpperCase()}
    </span>
  );
}

function BrandOption({ label, sub, selected, swatch, onSelect }: { label: string; sub: string; selected: boolean; swatch: ReactNode; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="vdocs:flex vdocs:w-full vdocs:cursor-pointer vdocs:items-center vdocs:gap-2.5 vdocs:border-0 vdocs:border-t vdocs:border-solid vdocs:border-edge-light vdocs:bg-transparent vdocs:px-0 vdocs:py-2.5 vdocs:text-left vdocs:font-sans vdocs:text-[13px] vdocs:text-ink vdocs:first:border-t-0">
      <span
        className={`vdocs:flex vdocs:size-4 vdocs:shrink-0 vdocs:items-center vdocs:justify-center vdocs:rounded-full vdocs:border vdocs:border-solid ${selected ? 'vdocs:border-accent' : 'vdocs:border-edge'}`}>
        {selected && <span className="vdocs:size-2 vdocs:rounded-full vdocs:bg-accent" />}
      </span>
      {swatch}
      <span className="vdocs:flex vdocs:min-w-0 vdocs:flex-1 vdocs:flex-col">
        {label}
        <small className="vdocs:truncate vdocs:text-[11px] vdocs:text-muted">
          {sub}
        </small>
      </span>
    </button>
  );
}

/**
 * Send a template to one or more recipients as an envelope for signing. The card shows a
 * roster of the template's roles plus the delivery settings, and every row slides the card
 * across to a detail view rather than opening a popup.
 *
 * Host applications should ensure the template is sendable before displaying this component.
 * To be sendable a template needs at least one document, at least one participant, and at
 * least one field assigned to every signer. This component renders nothing otherwise.
 *
 * ```tsx
 * <VerdocsSend
 *   templateId={templateId}
 *   onSend={details => console.log('Sent', details.envelope_id)}
 *   onCancel={() => history.back()}
 * />
 * ```
 */
export default function VerdocsSend({
  endpoint: endpointOverride,
  templateId,
  environment = '',
  showCancel = true,
  brandKey: initialBrandKey = '',
  onBeforeSend,
  onSend,
  onCancel,
  onSdkError,
  onSearchContacts,
}: VerdocsSendProps) {
  const { authenticated, profile, endpoint } = useSession(endpointOverride);
  const [view, setView] = useState<TSendView>('main');
  const [editingRoleId, setEditingRoleId] = useState('');
  const [brandKey, setBrandKey] = useState(initialBrandKey);
  const [expiresInDays, setExpiresInDays] = useState('');
  const [noContact, setNoContact] = useState(false);
  const [recipientEdits, setRecipientEdits] = useState<Record<string, Partial<IRecipient>>>({});
  const [loadedOrganizationId, setLoadedOrganizationId] = useState('');

  const swipeStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const swallowNextClick = useRef(false);

  const templateQuery = useTemplate(templateId, endpointOverride);
  const template = templateQuery.data;
  const organizationId = template?.organization_id || '';

  const brandsQuery = useBrands(organizationId || undefined, endpointOverride);
  const organizationQuery = useOrganization(organizationId || undefined, endpointOverride);
  const contactsQuery = useOrganizationContacts(endpointOverride);
  const entitlementsQuery = useEntitlements(endpointOverride);
  const createEnvelope = useCreateEnvelope(endpointOverride);

  const brands = brandsQuery.data || [];
  const sending = createEnvelope.isPending;

  // A template that moves to another organization takes its brands with it, so the chosen brand
  // and any half-finished edit no longer mean anything. Adjusting state here rather than in an
  // effect keeps the stale brand out of the render that follows.
  if (organizationId !== loadedOrganizationId) {
    if (loadedOrganizationId) {
      setBrandKey('');
      setRecipientEdits({});
      setEditingRoleId('');
      setView('main');
    }

    setLoadedOrganizationId(organizationId);
  }

  const roleRows = useMemo<IRoleRow[]>(() => {
    const countByLevel: Record<number, number> = {};

    return (template?.roles || [])
      .map((role, index) => {
        const level = role.sequence;
        countByLevel[level] = (countByLevel[level] || 0) + 1;
        const id = `r-${level}-${countByLevel[level] - 1}`;

        return {
          id,
          roleName: role.name,
          level,
          signerIndex: index,
          defaults: { ...role, id, role_name: role.name } as Partial<IRecipient>,
        };
      })
      .sort((a, b) => a.level - b.level);
  }, [template]);

  // Roles the template author already filled in count as configured, so the sender only has to
  // touch the ones left open. Their own edits layer over the top.
  const recipients = useMemo(() => {
    const merged: Record<string, Partial<IRecipient>> = {};
    roleRows.forEach(row => {
      if (row.defaults.first_name && isValidEmail(row.defaults.email || '')) {
        merged[row.id] = row.defaults;
      }
    });

    return { ...merged, ...recipientEdits };
  }, [roleRows, recipientEdits]);

  const suggestions = useMemo(() => {
    const contacts = contactsQuery.data || [];
    if (!profile) {
      return contacts;
    }

    // The sender is the most likely recipient of their own envelope, so they ride at the end of
    // the address book rather than waiting for a search.
    return [...contacts, profile];
  }, [contactsQuery.data, profile]);

  const availableAuthMethods = useMemo<TRecipientAuthMethod[]>(() => {
    const entitlements = entitlementsQuery.data;
    const methods: TRecipientAuthMethod[] = ['passcode', 'email'];
    if (entitlements?.sms_auth) {
      methods.push('sms');
    }

    if (entitlements?.kba_auth) {
      methods.push('kba');
    }

    if (entitlements?.id_auth) {
      methods.push('id');
    }

    return methods;
  }, [entitlementsQuery.data]);

  const levels = useMemo(() => [...new Set(roleRows.map(row => row.level))], [roleRows]);
  const configuredRecipients = roleRows.map(row => recipients[row.id]).filter(isConfigured) as Partial<IRecipient>[];
  const allRolesConfigured = roleRows.length > 0 && configuredRecipients.length === roleRows.length;
  const configuredEmails = configuredRecipients.map(recipient => (recipient.email || '').toLowerCase());
  const hasDuplicateEmails = new Set(configuredEmails).size < configuredEmails.length;

  const defaultBrand = brands.find(brand => brand.id === organizationQuery.data?.default_brand_id) || null;
  // With no brand of its own the organization gets Verdocs styling, so that is what default means.
  const defaultBrandLabel = `Default (${defaultBrand?.name || 'Verdocs'})`;
  const selectedBrand = brandKey ? brands.find(brand => brand.key === brandKey) : undefined;
  const selectedBrandLabel = brandKey ? selectedBrand?.name || selectedBrand?.key || brandKey : defaultBrandLabel;
  const otherBrands = brands
    .filter(brand => brand.id !== defaultBrand?.id)
    .sort((a, b) => (a.name || a.key).localeCompare(b.name || b.key));

  const expiresAt = expiresAtFor(expiresInDays);
  const expiresShort = expiresAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const expiresLong = `${expiresAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at ${expiresAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  const editingRow = roleRows.find(row => row.id === editingRoleId);
  const detailOpen = view !== 'main';
  const webAppUrl = getWebAppUrl(endpoint);

  const handleSubmitContact = (row: IRoleRow, contact: Partial<IRecipient>) => {
    setRecipientEdits(previous => ({ ...previous, [row.id]: { ...row.defaults, ...contact } }));
    setEditingRoleId('');
    setView('main');
  };

  const handleExpiryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const clamped = clampExpiryDays((e.target.value || '').replace(/[^0-9]/g, ''));
    setExpiresInDays(clamped);
    // React will not rewrite a value it believes is unchanged, so stripped characters would
    // otherwise stay visible in the field.
    e.target.value = clamped;
  };

  const handleSend = () => {
    if (sending || !template) {
      return;
    }

    const localeData = Intl.DateTimeFormat().resolvedOptions();
    const request: ICreateEnvelopeFromTemplateRequest = {
      template_id: templateId,
      name: template.name || 'New Envelope',
      environment,
      initial_reminder: 0,
      followup_reminders: 0,
      recipients: roleRows.map(row => recipients[row.id]).filter(Boolean) as ICreateEnvelopeRecipientFromTemplate[],
      timezone: localeData.timeZone,
      locale: localeData.locale,
      expires_at: expiresAtFor(expiresInDays).toISOString(),
      no_contact: noContact,
    };

    if (brandKey) {
      request.brand_key = brandKey;
    }

    const details: ISendEventDetail = { ...request, name: request.name!, template };
    if (onBeforeSend?.(details) === false) {
      return;
    }

    createEnvelope.mutate(request, {
      onSuccess: envelope => {
        setRecipientEdits({});
        setView('main');
        setEditingRoleId('');
        setBrandKey('');
        setExpiresInDays('');
        setNoContact(false);
        onSend?.({ ...request, name: request.name!, envelope_id: envelope.id, envelope });
      },
      onError: (error: any) => {
        showToast(error?.response?.data?.error || 'Error creating envelope, please try again later.', { style: 'error' });
        onSdkError?.(new SDKError(error?.message, error?.response?.status, error?.response?.data));
      },
    });
  };

  const handleSwipeStart = (e: ReactPointerEvent<HTMLDivElement>) => {
    swallowNextClick.current = false;
    const rect = e.currentTarget.getBoundingClientRect();
    const onTextEntry = !!(e.target as HTMLElement)?.closest?.('input, textarea, select, [contenteditable]');
    if (!detailOpen || onTextEntry || e.clientX - rect.left > rect.width * SWIPE_START_FRACTION) {
      swipeStart.current = null;
      return;
    }

    swipeStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handleSwipeEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) {
      return;
    }

    const dx = e.clientX - start.x;
    const dy = Math.abs(e.clientY - start.y);
    if (dx >= SWIPE_MIN_DISTANCE && dx > dy && Date.now() - start.time <= SWIPE_MAX_DURATION) {
      // A wide button under the finger would otherwise take the click that ends the swipe.
      swallowNextClick.current = true;
      setView('main');
    }
  };

  const handleClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (swallowNextClick.current) {
      swallowNextClick.current = false;
      e.stopPropagation();
      e.preventDefault();
    }
  };

  if (!authenticated) {
    return <ComponentError message="You must be authenticated to use this module." />;
  }

  if (templateQuery.isPending) {
    return (
      <div className="vdocs:relative vdocs:min-h-[480px] vdocs:w-full vdocs:max-w-[480px]">
        <Loader />
      </div>
    );
  }

  if (!template?.is_sendable) {
    return null;
  }

  const renderRecipientDetail = () => {
    if (!editingRow) {
      return <DetailHeader title="Recipient" onBack={() => setView('main')} />;
    }

    return (
      <>
        <DetailHeader
          onBack={() => setView('main')}
          title={
            <>
              <RoleDot signerIndex={editingRow.signerIndex} />
              {editingRow.roleName}
            </>
          } />
        <ContactPicker
          showCancel={false}
          suggestions={suggestions}
          availableAuthMethods={availableAuthMethods}
          templateRole={recipients[editingRow.id] ?? editingRow.defaults}
          onSearchContacts={onSearchContacts}
          onSubmit={contact => handleSubmitContact(editingRow, contact)} />
      </>
    );
  };

  const renderBrandDetail = () => (
    <>
      <DetailHeader title="Brand" onBack={() => setView('main')} />
      <DetailBody>
        <div role="radiogroup" aria-label="Brand" className="vdocs:flex vdocs:flex-col">
          <BrandOption
            label={defaultBrandLabel}
            sub="Organization default"
            selected={!brandKey}
            swatch={<BrandSwatch brand={defaultBrand} fallback={defaultBrand?.name || 'V'} />}
            onSelect={() => setBrandKey('')} />
          {otherBrands.length > 0 && <div className="vdocs:my-0.5 vdocs:border-0 vdocs:border-t vdocs:border-solid vdocs:border-edge" />}
          {otherBrands.map(brand => (
            <BrandOption
              key={brand.id}
              label={brand.name || brand.key}
              sub={brand.key}
              selected={brandKey === brand.key}
              swatch={<BrandSwatch brand={brand} fallback={brand.name || brand.key} />}
              onSelect={() => setBrandKey(brand.key)} />
          ))}
        </div>
        {brands.length === 0 && (
          <p className={HINT_CLASSES}>
            Configure the look and feel of the signing experience by{' '}
            <a href={`${webAppUrl}/settings/branding`} target="_blank" rel="noopener noreferrer" className={LINK_CLASSES}>
              Creating a Brand
              <ExternalLinkIcon className="vdocs:ml-0.5 vdocs:inline-block vdocs:size-[11px] vdocs:align-[-1px]" />
            </a>
            .
          </p>
        )}
      </DetailBody>
      <DetailFooter onDone={() => setView('main')} />
    </>
  );

  const renderExpiresDetail = () => (
    <>
      <DetailHeader title="Expiration" onBack={() => setView('main')} />
      <DetailBody>
        <div className="vdocs:relative">
          <input
            type="text"
            inputMode="numeric"
            aria-label="Expires in days"
            placeholder={String(DEFAULT_EXPIRY_DAYS)}
            value={expiresInDays}
            disabled={sending}
            onChange={handleExpiryChange}
            className={INPUT_CLASSES} />
          <span className="vdocs:pointer-events-none vdocs:absolute vdocs:top-0 vdocs:right-2.5 vdocs:flex vdocs:h-9 vdocs:items-center vdocs:text-[13px] vdocs:text-muted">
            days
          </span>
        </div>
        <p className={HINT_CLASSES}>
          This envelope will expire on {expiresLong}. Expirations may be set from {MIN_EXPIRY_DAYS}-{MAX_EXPIRY_DAYS} days. If left blank, this will default to{' '}
          {DEFAULT_EXPIRY_DAYS}.
        </p>
      </DetailBody>
      <DetailFooter onDone={() => setView('main')} />
    </>
  );

  const renderNotificationsDetail = () => (
    <>
      <DetailHeader title="Notifications" onBack={() => setView('main')} />
      <DetailBody>
        <Checkbox size="small" label="Disable notifications" checked={noContact} className="vdocs:py-1" onChange={e => setNoContact(e.target.checked)} />
        {noContact && (
          <div
            className={`vdocs:mt-3 vdocs:flex vdocs:gap-2.5 vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-[#fde68a] vdocs:bg-[#fffbeb] vdocs:px-3 vdocs:py-2.5 vdocs:text-xs/relaxed ${WARNING_TEXT}`}>
            <WarningTriangleIcon className={`vdocs:mt-px vdocs:size-[18px] vdocs:shrink-0 ${WARNING_ICON}`} />
            <div>
              Disabling notifications turns off invitations and reminders to recipients as well as status updates to you. You may obtain invite links in the
              recipient summary or via an API call. We strongly recommend enabling{' '}
              <a href={`${webAppUrl}/settings/webhooks`} target="_blank" rel="noopener noreferrer" className={LINK_CLASSES}>
                Webhooks
                <ExternalLinkIcon className="vdocs:ml-0.5 vdocs:inline-block vdocs:size-[11px] vdocs:align-[-1px]" />
              </a>{' '}
              to facilitate this step.
            </div>
          </div>
        )}
      </DetailBody>
      <DetailFooter onDone={() => setView('main')} />
    </>
  );

  const renderDetail = () => {
    switch (view) {
      case 'recipient':
        return renderRecipientDetail();
      case 'brand':
        return renderBrandDetail();
      case 'expires':
        return renderExpiresDetail();
      case 'notifications':
        return renderNotificationsDetail();
      default:
        return null;
    }
  };

  return (
    <div
      onClickCapture={handleClickCapture}
      className="vdocs:relative vdocs:box-border vdocs:w-full vdocs:max-w-[480px] vdocs:overflow-hidden vdocs:rounded-lg vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-surface vdocs:font-sans vdocs:text-sm vdocs:text-ink">
      {/* The main pane sets the card's height. The detail pane sits beside it, off-canvas to the
          right, and the track slides one pane-width left when a detail view opens. */}
      <div
        className={`vdocs:relative vdocs:flex vdocs:min-h-[480px] vdocs:flex-col vdocs:transition-transform vdocs:duration-[220ms] vdocs:ease-out vdocs:motion-reduce:transition-none ${detailOpen ? 'vdocs:-translate-x-full' : ''}`}>
        {/* Whichever pane is off-canvas is inert so its controls leave the tab order; a focused
            element out there would otherwise drag the track sideways. */}
        <div inert={detailOpen} className="vdocs:flex vdocs:flex-1 vdocs:flex-col vdocs:p-4">
          <SectionTitle>Recipients</SectionTitle>
          <div className="vdocs:flex vdocs:flex-col">
            {levels.map(level => (
              <div key={level} className="vdocs:flex vdocs:flex-col">
                {levels.length > 1 && (
                  <div className="vdocs:pt-2.5 vdocs:pb-1 vdocs:text-[11px] vdocs:text-muted">
                    Step {level}
                  </div>
                )}
                {roleRows
                  .filter(row => row.level === level)
                  .map(row => {
                    const recipient = recipients[row.id];
                    const configured = isConfigured(recipient);
                    const optionLabels = recipientOptionLabels(recipient);

                    return (
                      <button
                        key={row.id}
                        type="button"
                        data-rn={row.roleName}
                        onClick={() => {
                          setEditingRoleId(row.id);
                          setView('recipient');
                        }}
                        className={`${ROW_CLASSES} vdocs:py-2 vdocs:pr-1.5 vdocs:pl-0`}>
                        <RoleDot signerIndex={row.signerIndex} />
                        <span className="vdocs:flex vdocs:min-w-0 vdocs:flex-1 vdocs:flex-col">
                          <span className="vdocs:text-[13px] vdocs:font-semibold">
                            {row.roleName}
                          </span>
                          {configured ? (
                            <span className="vdocs:truncate vdocs:text-xs vdocs:text-muted">
                              {formatFullName(recipient)} {MIDDLE_DOT} {recipient?.email}
                            </span>
                          ) : (
                            <span className="vdocs:truncate vdocs:text-xs vdocs:font-medium vdocs:text-accent">
                              Configure recipient
                            </span>
                          )}
                          {optionLabels.length > 0 && (
                            <span className="vdocs:mt-[3px] vdocs:flex vdocs:flex-wrap vdocs:gap-1">
                              {optionLabels.map(label => (
                                <span
                                  key={label}
                                  className="vdocs:inline-flex vdocs:h-[18px] vdocs:items-center vdocs:rounded-full vdocs:bg-accent-tint vdocs:px-1.5 vdocs:text-[10px] vdocs:font-medium vdocs:text-ink">
                                  {label}
                                </span>
                              ))}
                            </span>
                          )}
                        </span>
                        <ChevronRightIcon className="vdocs:size-4 vdocs:shrink-0 vdocs:text-edge" />
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>

          <SectionTitle className="vdocs:mt-4">Delivery</SectionTitle>
          <div className="vdocs:flex vdocs:flex-col">
            <button type="button" disabled={sending} onClick={() => setView('brand')} className={`${ROW_CLASSES} vdocs:h-10 vdocs:pr-1.5 vdocs:text-[13px]`}>
              <span className="vdocs:flex-[0_0_84px] vdocs:text-muted">Brand</span>{' '}
              <span className="vdocs:min-w-0 vdocs:flex-1 vdocs:truncate vdocs:font-medium">
                {selectedBrandLabel}
              </span>
              <ChevronRightIcon className="vdocs:size-4 vdocs:shrink-0 vdocs:text-edge" />
            </button>
            <button type="button" disabled={sending} onClick={() => setView('expires')} className={`${ROW_CLASSES} vdocs:h-10 vdocs:pr-1.5 vdocs:text-[13px]`}>
              <span className="vdocs:flex-[0_0_84px] vdocs:text-muted">Expires</span>{' '}
              <span className="vdocs:min-w-0 vdocs:flex-1 vdocs:truncate vdocs:font-medium">
                {effectiveExpiryDays(expiresInDays)} days{' '}
                <small className="vdocs:text-[13px] vdocs:font-normal vdocs:text-muted">
                  {MIDDLE_DOT} {expiresShort}
                </small>
              </span>
              <ChevronRightIcon className="vdocs:size-4 vdocs:shrink-0 vdocs:text-edge" />
            </button>
            <button type="button" disabled={sending} onClick={() => setView('notifications')} className={`${ROW_CLASSES} vdocs:h-10 vdocs:pr-1.5 vdocs:text-[13px]`}>
              <span className="vdocs:flex-[0_0_84px] vdocs:text-muted">Notifications</span>{' '}
              <span className={`vdocs:min-w-0 vdocs:flex-1 vdocs:truncate vdocs:font-medium ${noContact ? WARNING_ICON : ''}`}>
                {noContact ? 'Off' : 'On'}
              </span>
              <ChevronRightIcon className="vdocs:size-4 vdocs:shrink-0 vdocs:text-edge" />
            </button>
          </div>

          <div className="vdocs:flex-1" />

          <div className="vdocs:mt-3.5 vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:items-center vdocs:justify-end vdocs:gap-2.5">
            {hasDuplicateEmails && (
              <div role="alert" className="vdocs:mb-2.5 vdocs:w-full vdocs:text-[13px] vdocs:text-danger">
                Recipients cannot share the same email.
              </div>
            )}
            {sending && <Spinner size={20} mode="dark" />}
            {showCancel && <Button label="Cancel" size="small" variant="outline" disabled={sending} onClick={() => onCancel?.()} />}
            <Button label="Send" size="small" disabled={!allRolesConfigured || sending || hasDuplicateEmails} onClick={handleSend} />
          </div>
        </div>

        <div
          inert={!detailOpen}
          onPointerDown={handleSwipeStart}
          onPointerUp={handleSwipeEnd}
          onPointerCancel={() => {
            swipeStart.current = null;
          }}
          className="vdocs:absolute vdocs:top-0 vdocs:bottom-0 vdocs:left-full vdocs:flex vdocs:w-full vdocs:flex-col vdocs:overflow-hidden vdocs:p-4">
          {renderDetail()}
        </div>
      </div>
    </div>
  );
}
