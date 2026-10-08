import { html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';
import { createRef, ref } from 'lit/directives/ref.js';
import type { PropertyValues, TemplateResult } from 'lit';
import { formatFullName, isValidEmail } from '@verdocs/js-sdk';
import type {
  IBrand,
  ICreateEnvelopeFromTemplateRequest,
  ICreateEnvelopeRecipientFromTemplate,
  IEnvelope,
  IProfile,
  IRecipient,
  ITemplate,
  TRecipientAuthMethod,
  VerdocsEndpoint,
} from '@verdocs/js-sdk';
import { BrandsController, EntitlementsController, OrganizationContactsController, OrganizationController } from '../store/organizations.js';
import type { IContactSelectEvent } from './vdocs-contact-picker.js';
import { SessionController } from '../base/session-controller.js';
import { TemplateController } from '../store/template-detail.js';
import { updateScrollFade } from '../utils/scroll-fade.js';
import { signerClassName } from '../fields/field-base.js';
import { VdocsElement } from '../base/vdocs-element.js';
import { createEnvelope } from '../store/envelopes.js';
import { getWebAppUrl } from '../utils/environment.js';
import { resolveEndpoint } from '../base/endpoint.js';
import { register } from '../base/register.js';
import '../controls/vdocs-component-error.js';
import { showToast } from '../utils/toast.js';
import '../controls/vdocs-checkbox.js';
import { SDKError } from '../types.js';
import '../controls/vdocs-spinner.js';
import '../controls/vdocs-button.js';
import '../controls/vdocs-loader.js';
import './vdocs-contact-picker.js';

/**
 * Everything the component is about to send, exactly as it will be posted:
 * recipients plus brand_key, expires_at, no_contact, timezone, and locale.
 * Hosts that cancel the send and create the envelope themselves should forward
 * it unchanged.
 */
export interface ISendEventDetail extends ICreateEnvelopeFromTemplateRequest {
  name: string;
  template_id: string;
  recipients: ICreateEnvelopeRecipientFromTemplate[];
  template: ITemplate;
}

/** The same payload once the envelope exists, reported through vdocs-send. */
export interface ISentEventDetail extends ICreateEnvelopeFromTemplateRequest {
  name: string;
  template_id: string;
  recipients: ICreateEnvelopeRecipientFromTemplate[];
  envelope_id: string;
  envelope: IEnvelope;
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

const ROW_CLASSES = 'vdocs:flex vdocs:w-full vdocs:cursor-pointer vdocs:items-center vdocs:gap-2.5 vdocs:border-0 vdocs:border-t ' +
  'vdocs:border-solid vdocs:border-edge-light vdocs:bg-transparent vdocs:text-left vdocs:font-sans vdocs:text-ink ' +
  'vdocs:last:border-b vdocs:focus-visible:outline-2 vdocs:focus-visible:-outline-offset-2 vdocs:focus-visible:outline-accent';

const HINT_CLASSES = 'vdocs:mt-2.5 vdocs:text-xs/relaxed vdocs:text-muted';

const LINK_CLASSES = 'vdocs:font-medium vdocs:text-accent vdocs:no-underline';

const INPUT_CLASSES = 'vdocs:box-border vdocs:h-9 vdocs:w-full vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge ' +
  'vdocs:bg-surface vdocs:pr-[52px] vdocs:pl-2.5 vdocs:font-sans vdocs:text-sm vdocs:text-ink vdocs:outline-none ' +
  'vdocs:placeholder:text-edge vdocs:focus:border-accent';

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

const chevronRightIcon = (className: string): TemplateResult => html`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class=${className}>
    <path d="m9 6 6 6-6 6" />
  </svg>`;

const chevronLeftIcon = (className: string): TemplateResult => html`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class=${className}>
    <path d="m15 18-6-6 6-6" />
  </svg>`;

const warningIcon = (className: string): TemplateResult => html`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class=${className}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>`;

const externalLinkIcon = (className: string): TemplateResult => html`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class=${className}>
    <path d="M15 3h6v6M10 14 21 3M21 14v7H3V3h7" />
  </svg>`;

const roleDot = (signerIndex: number): TemplateResult => html`
  <span class="${signerClassName(signerIndex)} vdocs:size-2.5 vdocs:shrink-0 vdocs:rounded-full vdocs:border vdocs:border-solid vdocs:border-[rgba(0,0,0,0.1)]"></span>`;

const sectionTitle = (label: string, className = ''): TemplateResult => html`
  <div class="vdocs:mb-1.5 vdocs:text-xs vdocs:font-semibold vdocs:text-ink ${className}">${label}</div>`;

/**
 * Send a template to one or more recipients as an envelope for signing. The
 * card shows a roster of the template's roles plus the delivery settings, and
 * every row slides the card across to a detail view rather than opening a
 * popup.
 *
 * Host applications should ensure the template is sendable before displaying
 * this component. To be sendable a template needs at least one document, at
 * least one participant, and at least one field assigned to every signer. This
 * component renders nothing otherwise.
 *
 * ```html
 * <vdocs-send template-id="TEMPLATEID"></vdocs-send>
 * ```
 *
 * @fires vdocs-before-send - Fired with an ISendEventDetail just before the request is posted. Cancelable: call preventDefault() to abort the send.
 * @fires vdocs-send - Fired with an ISentEventDetail once the envelope has been created.
 * @fires vdocs-cancel - Fired when the user clicks Cancel.
 * @fires vdocs-sdk-error - Fired with an SDKError if the envelope could not be created.
 * @fires vdocs-search-contacts - Fired with the current name text as the sender types in the recipient form.
 */
export class VdocsSend extends VdocsElement {
  static override properties = {
    endpoint: { attribute: false },
    templateId: { type: String, attribute: 'template-id' },
    environment: { type: String },
    showCancel: { attribute: false },
    brandKey: { type: String, attribute: 'brand-key' },
    view: { state: true },
    editingRoleId: { state: true },
    selectedBrandKey: { state: true },
    expiresInDays: { state: true },
    noContact: { state: true },
    recipientEdits: { state: true },
    sending: { state: true },
  };

  /** Endpoint override for dual-session scenarios. Defaults to the default endpoint. */
  declare endpoint?: VerdocsEndpoint;
  /** The ID of the template to create the envelope from. */
  declare templateId: string;
  /**
   * The environment the control is being called from, e.g. 'web'. This changes how
   * notifications are assembled so recipients get invitation URLs that work for them. Leave
   * unset unless you know the environment; unknown values produce incorrect behavior.
   */
  declare environment: string;
  /**
   * Whether to show the cancel button. Turn it off where the embed sits in a flow that has its
   * own navigation for the user to back out. Property-only, because it defaults to true and a
   * boolean attribute cannot switch that off.
   */
  declare showCancel: boolean;
  /**
   * Preselect a brand by key. The sender can still change it in the brand chooser. Leave unset
   * for the organization default.
   */
  declare brandKey: string;

  private declare view: TSendView;
  private declare editingRoleId: string;
  private declare selectedBrandKey: string;
  private declare expiresInDays: string;
  private declare noContact: boolean;
  private declare recipientEdits: Record<string, Partial<IRecipient>>;
  private declare sending: boolean;

  private loadedOrganizationId = '';
  private swipeStart: { x: number; y: number; time: number } | null = null;
  private swallowNextClick = false;
  private detailBody = createRef<HTMLDivElement>();

  private session = new SessionController(this, () => this.resolvedEndpoint);

  private templateQuery = new TemplateController(
    this,
    () => ({ templateId: this.templateId || undefined, endpoint: this.resolvedEndpoint }),
    error => this.emitSdkError(error),
  );

  private brandsQuery = new BrandsController(this, () => ({ organizationId: this.organizationId || undefined, endpoint: this.resolvedEndpoint }));

  private organizationQuery = new OrganizationController(this, () => ({ organizationId: this.organizationId || undefined, endpoint: this.resolvedEndpoint }));

  private contactsQuery = new OrganizationContactsController(this, () => ({ endpoint: this.resolvedEndpoint }));

  private entitlementsQuery = new EntitlementsController(this, () => ({ endpoint: this.resolvedEndpoint }));

  constructor() {
    super();
    this.templateId = '';
    this.environment = '';
    this.showCancel = true;
    this.brandKey = '';
    this.view = 'main';
    this.editingRoleId = '';
    this.selectedBrandKey = '';
    this.expiresInDays = '';
    this.noContact = false;
    this.recipientEdits = {};
    this.sending = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:block');
    // A wide button under the finger would otherwise take the click that ends a
    // back-swipe, so we swallow that one click before it reaches any handler.
    this.addEventListener('click', this.handleClickCapture, { capture: true });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.handleClickCapture, { capture: true });
  }

  override willUpdate(changed: PropertyValues<this>) {
    if (changed.has('brandKey')) {
      this.selectedBrandKey = this.brandKey;
    }

    // A template that moves to another organization takes its brands with it, so the chosen
    // brand and any half-finished edit no longer mean anything.
    const organizationId = this.organizationId;
    if (organizationId !== this.loadedOrganizationId) {
      if (this.loadedOrganizationId) {
        this.selectedBrandKey = '';
        this.recipientEdits = {};
        this.editingRoleId = '';
        this.view = 'main';
      }

      this.loadedOrganizationId = organizationId;
    }
  }

  override updated() {
    updateScrollFade(this.detailBody.value);
  }

  private get resolvedEndpoint(): VerdocsEndpoint {
    return resolveEndpoint(this.endpoint);
  }

  private get template(): ITemplate | undefined {
    return this.templateQuery.data;
  }

  private get organizationId(): string {
    return this.template?.organization_id || '';
  }

  private get brands(): IBrand[] {
    return this.brandsQuery.data || [];
  }

  private get roleRows(): IRoleRow[] {
    const countByLevel: Record<number, number> = {};

    return (this.template?.roles || [])
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
  }

  // Roles the template author already filled in count as configured, so the sender only has to
  // touch the ones left open. Their own edits layer over the top.
  private get recipients(): Record<string, Partial<IRecipient>> {
    const merged: Record<string, Partial<IRecipient>> = {};
    this.roleRows.forEach(row => {
      if (row.defaults.first_name && isValidEmail(row.defaults.email || '')) {
        merged[row.id] = row.defaults;
      }
    });

    return { ...merged, ...this.recipientEdits };
  }

  private get suggestions(): Partial<IProfile>[] {
    const contacts = this.contactsQuery.data || [];
    const profile = this.session.profile;
    if (!profile) {
      return contacts;
    }

    // The sender is the most likely recipient of their own envelope, so they ride at the end of
    // the address book rather than waiting for a search.
    return [ ...contacts, profile ];
  }

  private get availableAuthMethods(): TRecipientAuthMethod[] {
    const entitlements = this.entitlementsQuery.data;
    const methods: TRecipientAuthMethod[] = [ 'passcode', 'email' ];
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
  }

  private get defaultBrand(): IBrand | null {
    return this.brands.find(brand => brand.id === this.organizationQuery.data?.default_brand_id) || null;
  }

  // With no brand of its own the organization gets Verdocs styling, so that is what default means.
  private get defaultBrandLabel(): string {
    return `Default (${this.defaultBrand?.name || 'Verdocs'})`;
  }

  private get otherBrands(): IBrand[] {
    return this.brands
      .filter(brand => brand.id !== this.defaultBrand?.id)
      .sort((a, b) => (a.name || a.key).localeCompare(b.name || b.key));
  }

  private emitSdkError(error: unknown) {
    const e = error as { message?: string; response?: { status?: number; data?: unknown } };
    this.emit('vdocs-sdk-error', new SDKError(e?.message || '', e?.response?.status, e?.response?.data));
  }

  private setView(view: TSendView) {
    this.view = view;
  }

  private handleSubmitContact(row: IRoleRow, contact: IContactSelectEvent) {
    this.recipientEdits = { ...this.recipientEdits, [row.id]: { ...row.defaults, ...contact } };
    this.editingRoleId = '';
    this.view = 'main';
  }

  private handleExpiryInput(input: HTMLInputElement) {
    // The live() binding puts the clamped value back on the field, so stripped characters never
    // stay visible.
    this.expiresInDays = clampExpiryDays((input.value || '').replace(/[^0-9]/g, ''));
  }

  private async handleSend() {
    const template = this.template;
    if (this.sending || !template) {
      return;
    }

    const localeData = Intl.DateTimeFormat().resolvedOptions();
    const request: ICreateEnvelopeFromTemplateRequest = {
      template_id: this.templateId,
      name: template.name || 'New Envelope',
      environment: this.environment,
      initial_reminder: 0,
      followup_reminders: 0,
      recipients: this.roleRows.map(row => this.recipients[row.id]).filter(Boolean) as ICreateEnvelopeRecipientFromTemplate[],
      timezone: localeData.timeZone,
      locale: localeData.locale,
      expires_at: expiresAtFor(this.expiresInDays).toISOString(),
      no_contact: this.noContact,
    };

    if (this.selectedBrandKey) {
      request.brand_key = this.selectedBrandKey;
    }

    const details: ISendEventDetail = { ...request, name: request.name!, template };

    // The shared emit() helper fires non-cancelable events. This one has to be cancelable so a
    // host can take over the create call itself, the way the legacy control's beforeSend worked.
    const beforeSend = new CustomEvent<ISendEventDetail>('vdocs-before-send', { detail: details, bubbles: true, composed: true, cancelable: true });
    this.dispatchEvent(beforeSend);
    if (beforeSend.defaultPrevented) {
      return;
    }

    this.sending = true;

    try {
      const envelope = await createEnvelope(this.resolvedEndpoint, request);
      this.recipientEdits = {};
      this.view = 'main';
      this.editingRoleId = '';
      this.selectedBrandKey = '';
      this.expiresInDays = '';
      this.noContact = false;
      this.sending = false;
      this.emit<ISentEventDetail>('vdocs-send', { ...request, name: request.name!, envelope_id: envelope.id, envelope });
    } catch (error) {
      this.sending = false;
      const e = error as { response?: { data?: { error?: string } } };
      showToast(e?.response?.data?.error || 'Error creating envelope, please try again later.', { style: 'error' });
      this.emitSdkError(error);
    }
  }

  private handleSwipeStart = (e: PointerEvent) => {
    this.swallowNextClick = false;
    const pane = e.currentTarget as HTMLElement;
    const rect = pane.getBoundingClientRect();
    const onTextEntry = !!(e.target as HTMLElement)?.closest?.('input, textarea, select, [contenteditable]');
    if (this.view === 'main' || onTextEntry || e.clientX - rect.left > rect.width * SWIPE_START_FRACTION) {
      this.swipeStart = null;
      return;
    }

    this.swipeStart = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  private handleSwipeEnd = (e: PointerEvent) => {
    const start = this.swipeStart;
    this.swipeStart = null;
    if (!start) {
      return;
    }

    const dx = e.clientX - start.x;
    const dy = Math.abs(e.clientY - start.y);
    if (dx >= SWIPE_MIN_DISTANCE && dx > dy && Date.now() - start.time <= SWIPE_MAX_DURATION) {
      this.swallowNextClick = true;
      this.view = 'main';
    }
  };

  private handleClickCapture = (e: Event) => {
    if (this.swallowNextClick) {
      this.swallowNextClick = false;
      e.stopPropagation();
      e.preventDefault();
    }
  };

  private renderDetailHeader(title: TemplateResult | string): TemplateResult {
    return html`
      <div class="vdocs:mb-3.5 vdocs:flex vdocs:items-center vdocs:gap-2">
        <button
          type="button"
          @click=${() => this.setView('main')}
          class="vdocs:flex vdocs:flex-[0_0_52px] vdocs:cursor-pointer vdocs:items-center vdocs:border-none vdocs:bg-transparent vdocs:p-0 vdocs:font-sans vdocs:text-[13px] vdocs:font-medium vdocs:text-accent">
          ${chevronLeftIcon('vdocs:size-4')}
          Back
        </button>
        <div class="vdocs:flex vdocs:flex-1 vdocs:items-center vdocs:justify-center vdocs:gap-2 vdocs:text-sm vdocs:font-semibold">${title}</div>
        <div class="vdocs:flex-[0_0_52px]"></div>
      </div>`;
  }

  /**
   * Scrolling region of a detail view. The fade over its bottom edge appears
   * only while there is more content below, so a view that fits shows no
   * decoration at all.
   */
  private renderDetailBody(content: TemplateResult): TemplateResult {
    return html`
      <div class="vdocs:group vdocs:relative vdocs:flex vdocs:min-h-0 vdocs:flex-1 vdocs:flex-col">
        <div
          ${ref(this.detailBody)}
          class="vdocs:min-h-0 vdocs:flex-1 vdocs:overflow-y-auto"
          @scroll=${(e: Event) => updateScrollFade(e.currentTarget as HTMLElement)}>
          ${content}
        </div>
        <div
          aria-hidden="true"
          class="vdocs:pointer-events-none vdocs:absolute vdocs:inset-x-0 vdocs:bottom-0 vdocs:h-9 vdocs:bg-linear-to-b vdocs:from-[rgba(255,255,255,0)] vdocs:to-surface vdocs:opacity-0 vdocs:transition-opacity vdocs:group-[.vdocs-scroll-more]:opacity-100"></div>
      </div>`;
  }

  private renderDetailFooter(): TemplateResult {
    return html`
      <div class="vdocs:mt-2.5 vdocs:border-0 vdocs:border-t vdocs:border-solid vdocs:border-edge-light vdocs:pt-3">
        <vdocs-button label="Done" size="small" class="vdocs:block vdocs:w-full" @click=${() => this.setView('main')}></vdocs-button>
      </div>`;
  }

  private renderBrandSwatch(brand: IBrand | null, fallback: string): TemplateResult {
    const image = brand?.favicon_url || brand?.thumbnail_url || (brand ? null : VERDOCS_LOGO_URL);
    if (image) {
      return html`
        <span
          class="vdocs:flex vdocs:size-[22px] vdocs:shrink-0 vdocs:items-center vdocs:justify-center vdocs:overflow-hidden vdocs:rounded-row vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-surface">
          <img src=${image} alt="" class="vdocs:size-full vdocs:object-contain" />
        </span>`;
    }

    return html`
      <span
        style=${brand?.primary_color ? `background-color: ${brand.primary_color}` : nothing}
        class="vdocs:flex vdocs:size-[22px] vdocs:shrink-0 vdocs:items-center vdocs:justify-center vdocs:overflow-hidden vdocs:rounded-row vdocs:bg-accent-dark vdocs:text-[9px] vdocs:font-bold vdocs:text-white">
        ${fallback.substring(0, 2).toUpperCase()}
      </span>`;
  }

  private renderBrandOption(label: string, sub: string, selected: boolean, swatch: TemplateResult, onSelect: () => void): TemplateResult {
    return html`
      <button
        type="button"
        role="radio"
        aria-checked=${selected}
        @click=${onSelect}
        class="vdocs:flex vdocs:w-full vdocs:cursor-pointer vdocs:items-center vdocs:gap-2.5 vdocs:border-0 vdocs:border-t vdocs:border-solid vdocs:border-edge-light vdocs:bg-transparent vdocs:px-0 vdocs:py-2.5 vdocs:text-left vdocs:font-sans vdocs:text-[13px] vdocs:text-ink vdocs:first:border-t-0">
        <span
          class="vdocs:flex vdocs:size-4 vdocs:shrink-0 vdocs:items-center vdocs:justify-center vdocs:rounded-full vdocs:border vdocs:border-solid ${selected ? 'vdocs:border-accent' : 'vdocs:border-edge'}">
          ${selected ? html`<span class="vdocs:size-2 vdocs:rounded-full vdocs:bg-accent"></span>` : nothing}
        </span>
        ${swatch}
        <span class="vdocs:flex vdocs:min-w-0 vdocs:flex-1 vdocs:flex-col">
          ${label}
          <small class="vdocs:truncate vdocs:text-[11px] vdocs:text-muted">${sub}</small>
        </span>
      </button>`;
  }

  private renderRecipientDetail(): TemplateResult {
    const editingRow = this.roleRows.find(row => row.id === this.editingRoleId);
    if (!editingRow) {
      return this.renderDetailHeader('Recipient');
    }

    return html`
      ${this.renderDetailHeader(html`${roleDot(editingRow.signerIndex)}${editingRow.roleName}`)}
      <vdocs-contact-picker
        .showCancel=${false}
        .suggestions=${this.suggestions}
        .availableAuthMethods=${this.availableAuthMethods}
        .templateRole=${this.recipients[editingRow.id] ?? editingRow.defaults}
        @vdocs-search-contacts=${(e: CustomEvent<string>) => {
          // Both picker events bubble, so we stop them here and re-fire the one hosts care about
          // from this element. Otherwise a host would see the picker as the target, and would see
          // the internal submit event too.
          e.stopPropagation();
          this.emit('vdocs-search-contacts', e.detail);
        }}
        @vdocs-submit-contact=${(e: CustomEvent<IContactSelectEvent>) => {
          e.stopPropagation();
          this.handleSubmitContact(editingRow, e.detail);
        }}></vdocs-contact-picker>`;
  }

  private renderBrandDetail(): TemplateResult {
    const webAppUrl = getWebAppUrl(this.resolvedEndpoint);

    return html`
      ${this.renderDetailHeader('Brand')}
      ${this.renderDetailBody(html`
        <div role="radiogroup" aria-label="Brand" class="vdocs:flex vdocs:flex-col">
          ${this.renderBrandOption(
            this.defaultBrandLabel,
            'Organization default',
            !this.selectedBrandKey,
            this.renderBrandSwatch(this.defaultBrand, this.defaultBrand?.name || 'V'),
            () => {
              this.selectedBrandKey = '';
            },
          )}
          ${this.otherBrands.length > 0 ? html`<div class="vdocs:my-0.5 vdocs:border-0 vdocs:border-t vdocs:border-solid vdocs:border-edge"></div>` : nothing}
          ${this.otherBrands.map(brand => this.renderBrandOption(
            brand.name || brand.key,
            brand.key,
            this.selectedBrandKey === brand.key,
            this.renderBrandSwatch(brand, brand.name || brand.key),
            () => {
              this.selectedBrandKey = brand.key;
            },
          ))}
        </div>
        ${this.brands.length === 0 ?
          html`
            <p class=${HINT_CLASSES}>
              Configure the look and feel of the signing experience by
              <a href=${`${webAppUrl}/settings/branding`} target="_blank" rel="noopener noreferrer" class=${LINK_CLASSES}>
                Creating a Brand${externalLinkIcon('vdocs:ml-0.5 vdocs:inline-block vdocs:size-[11px] vdocs:align-[-1px]')}
              </a>.
            </p>` :
          nothing}`)}
      ${this.renderDetailFooter()}`;
  }

  private renderExpiresDetail(): TemplateResult {
    const expiresAt = expiresAtFor(this.expiresInDays);
    const expiresLong = `${expiresAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at ` +
      `${expiresAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;

    return html`
      ${this.renderDetailHeader('Expiration')}
      ${this.renderDetailBody(html`
        <div class="vdocs:relative">
          <input
            type="text"
            inputmode="numeric"
            aria-label="Expires in days"
            placeholder=${String(DEFAULT_EXPIRY_DAYS)}
            class=${INPUT_CLASSES}
            ?disabled=${this.sending}
            .value=${live(this.expiresInDays)}
            @input=${(e: Event) => this.handleExpiryInput(e.target as HTMLInputElement)} />
          <span
            class="vdocs:pointer-events-none vdocs:absolute vdocs:top-0 vdocs:right-2.5 vdocs:flex vdocs:h-9 vdocs:items-center vdocs:text-[13px] vdocs:text-muted">
            days
          </span>
        </div>
        <p class=${HINT_CLASSES}>
          This envelope will expire on ${expiresLong}. Expirations may be set from ${MIN_EXPIRY_DAYS}-${MAX_EXPIRY_DAYS} days. If left blank, this will default
          to ${DEFAULT_EXPIRY_DAYS}.
        </p>`)}
      ${this.renderDetailFooter()}`;
  }

  private renderNotificationsDetail(): TemplateResult {
    const webAppUrl = getWebAppUrl(this.resolvedEndpoint);

    return html`
      ${this.renderDetailHeader('Notifications')}
      ${this.renderDetailBody(html`
        <vdocs-checkbox
          size="small"
          label="Disable notifications"
          class="vdocs:block vdocs:py-1"
          ?checked=${this.noContact}
          @vdocs-checked-change=${(e: CustomEvent<{ checked: boolean }>) => {
            this.noContact = e.detail.checked;
          }}></vdocs-checkbox>
        ${this.noContact ?
          html`
            <div
              class="vdocs:mt-3 vdocs:flex vdocs:gap-2.5 vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-[#fde68a] vdocs:bg-[#fffbeb] vdocs:px-3 vdocs:py-2.5 vdocs:text-xs/relaxed ${WARNING_TEXT}">
              ${warningIcon(`vdocs:mt-px vdocs:size-[18px] vdocs:shrink-0 ${WARNING_ICON}`)}
              <div>
                Disabling notifications turns off invitations and reminders to recipients as well as status updates to you. You may obtain invite links in the
                recipient summary or via an API call. We strongly recommend enabling
                <a href=${`${webAppUrl}/settings/webhooks`} target="_blank" rel="noopener noreferrer" class=${LINK_CLASSES}>
                  Webhooks${externalLinkIcon('vdocs:ml-0.5 vdocs:inline-block vdocs:size-[11px] vdocs:align-[-1px]')}
                </a>
                to facilitate this step.
              </div>
            </div>` :
          nothing}`)}
      ${this.renderDetailFooter()}`;
  }

  private renderDetail(): TemplateResult | typeof nothing {
    switch (this.view) {
      case 'recipient':
        return this.renderRecipientDetail();
      case 'brand':
        return this.renderBrandDetail();
      case 'expires':
        return this.renderExpiresDetail();
      case 'notifications':
        return this.renderNotificationsDetail();
      default:
        return nothing;
    }
  }

  private renderRoleRow(row: IRoleRow): TemplateResult {
    const recipient = this.recipients[row.id];
    const optionLabels = recipientOptionLabels(recipient);

    return html`
      <button
        type="button"
        data-rn=${row.roleName}
        @click=${() => {
          this.editingRoleId = row.id;
          this.view = 'recipient';
        }}
        class="${ROW_CLASSES} vdocs:py-2 vdocs:pr-1.5 vdocs:pl-0">
        ${roleDot(row.signerIndex)}
        <span class="vdocs:flex vdocs:min-w-0 vdocs:flex-1 vdocs:flex-col">
          <span class="vdocs:text-[13px] vdocs:font-semibold">${row.roleName}</span>
          ${isConfigured(recipient) ?
            html`<span class="vdocs:truncate vdocs:text-xs vdocs:text-muted">${formatFullName(recipient)} ${MIDDLE_DOT} ${recipient?.email}</span>` :
            html`<span class="vdocs:truncate vdocs:text-xs vdocs:font-medium vdocs:text-accent">Configure recipient</span>`}
          ${optionLabels.length > 0 ?
            html`
              <span class="vdocs:mt-[3px] vdocs:flex vdocs:flex-wrap vdocs:gap-1">
                ${optionLabels.map(label => html`
                  <span
                    class="vdocs:inline-flex vdocs:h-[18px] vdocs:items-center vdocs:rounded-full vdocs:bg-accent-tint vdocs:px-1.5 vdocs:text-[10px] vdocs:font-medium vdocs:text-ink">
                    ${label}
                  </span>`)}
              </span>` :
            nothing}
        </span>
        ${chevronRightIcon('vdocs:size-4 vdocs:shrink-0 vdocs:text-edge')}
      </button>`;
  }

  private renderDeliveryRow(label: string, value: TemplateResult, view: TSendView): TemplateResult {
    return html`
      <button
        type="button"
        ?disabled=${this.sending}
        @click=${() => this.setView(view)}
        class="${ROW_CLASSES} vdocs:h-10 vdocs:pr-1.5 vdocs:text-[13px]">
        <span class="vdocs:flex-[0_0_84px] vdocs:text-muted">${label}</span>
        ${value}
        ${chevronRightIcon('vdocs:size-4 vdocs:shrink-0 vdocs:text-edge')}
      </button>`;
  }

  override render(): TemplateResult | typeof nothing {
    if (!this.session.authenticated) {
      return html`<vdocs-component-error message="You must be authenticated to use this module."></vdocs-component-error>`;
    }

    if (this.templateQuery.isPending) {
      return html`
        <div class="vdocs:relative vdocs:min-h-[480px] vdocs:w-full vdocs:max-w-[480px]">
          <vdocs-loader></vdocs-loader>
        </div>`;
    }

    const template = this.template;
    if (!template?.is_sendable) {
      return nothing;
    }

    const roleRows = this.roleRows;
    const levels = [ ...new Set(roleRows.map(row => row.level)) ];
    const recipients = this.recipients;
    const configuredRecipients = roleRows.map(row => recipients[row.id]).filter(isConfigured);
    const allRolesConfigured = roleRows.length > 0 && configuredRecipients.length === roleRows.length;
    const configuredEmails = configuredRecipients.map(recipient => (recipient?.email || '').toLowerCase());
    const hasDuplicateEmails = new Set(configuredEmails).size < configuredEmails.length;

    const selectedBrand = this.selectedBrandKey ? this.brands.find(brand => brand.key === this.selectedBrandKey) : undefined;
    const selectedBrandLabel = this.selectedBrandKey ?
      selectedBrand?.name || selectedBrand?.key || this.selectedBrandKey :
      this.defaultBrandLabel;

    const expiresShort = expiresAtFor(this.expiresInDays).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const detailOpen = this.view !== 'main';

    return html`
      <div
        class="vdocs:relative vdocs:box-border vdocs:w-full vdocs:max-w-[480px] vdocs:overflow-hidden vdocs:rounded-lg vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-surface vdocs:font-sans vdocs:text-sm vdocs:text-ink">
        <!-- The main pane sets the card's height. The detail pane sits beside it, off-canvas to
             the right, and the track slides one pane-width left when a detail view opens. -->
        <div
          class="vdocs:relative vdocs:flex vdocs:min-h-[480px] vdocs:flex-col vdocs:transition-transform vdocs:duration-[220ms] vdocs:ease-out vdocs:motion-reduce:transition-none ${detailOpen ? 'vdocs:-translate-x-full' : ''}">
          <!-- Whichever pane is off-canvas is inert so its controls leave the tab order; a
               focused element out there would otherwise drag the track sideways. -->
          <div ?inert=${detailOpen} class="vdocs:flex vdocs:flex-1 vdocs:flex-col vdocs:p-4">
            ${sectionTitle('Recipients')}
            <div class="vdocs:flex vdocs:flex-col">
              ${levels.map(level => html`
                <div class="vdocs:flex vdocs:flex-col">
                  ${levels.length > 1 ? html`<div class="vdocs:pt-2.5 vdocs:pb-1 vdocs:text-[11px] vdocs:text-muted">Step ${level}</div>` : nothing}
                  ${roleRows.filter(row => row.level === level).map(row => this.renderRoleRow(row))}
                </div>`)}
            </div>

            ${sectionTitle('Delivery', 'vdocs:mt-4')}
            <div class="vdocs:flex vdocs:flex-col">
              ${this.renderDeliveryRow(
                'Brand',
                html`<span class="vdocs:min-w-0 vdocs:flex-1 vdocs:truncate vdocs:font-medium">${selectedBrandLabel}</span>`,
                'brand',
              )}
              ${this.renderDeliveryRow(
                'Expires',
                html`
                  <span class="vdocs:min-w-0 vdocs:flex-1 vdocs:truncate vdocs:font-medium">
                    ${effectiveExpiryDays(this.expiresInDays)} days
                    <small class="vdocs:text-[13px] vdocs:font-normal vdocs:text-muted">${MIDDLE_DOT} ${expiresShort}</small>
                  </span>`,
                'expires',
              )}
              ${this.renderDeliveryRow(
                'Notifications',
                html`
                  <span class="vdocs:min-w-0 vdocs:flex-1 vdocs:truncate vdocs:font-medium ${this.noContact ? WARNING_ICON : ''}">
                    ${this.noContact ? 'Off' : 'On'}
                  </span>`,
                'notifications',
              )}
            </div>

            <div class="vdocs:flex-1"></div>

            <div class="vdocs:mt-3.5 vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:items-center vdocs:justify-end vdocs:gap-2.5">
              ${hasDuplicateEmails ?
                html`<div role="alert" class="vdocs:mb-2.5 vdocs:w-full vdocs:text-[13px] vdocs:text-danger">Recipients cannot share the same email.</div>` :
                nothing}
              ${this.sending ? html`<vdocs-spinner .size=${20} mode="dark"></vdocs-spinner>` : nothing}
              ${this.showCancel ?
                html`
                  <vdocs-button
                    label="Cancel"
                    size="small"
                    variant="outline"
                    ?disabled=${this.sending}
                    @click=${() => this.emit('vdocs-cancel')}></vdocs-button>` :
                nothing}
              <vdocs-button
                label="Send"
                size="small"
                ?disabled=${!allRolesConfigured || this.sending || hasDuplicateEmails}
                @click=${() => {
                  // handleSend reports its own failures (toast plus an sdkError event), so there
                  // is no rejection path left to handle here.
                  this.handleSend().catch(() => undefined);
                }}></vdocs-button>
            </div>
          </div>

          <div
            ?inert=${!detailOpen}
            @pointerdown=${this.handleSwipeStart}
            @pointerup=${this.handleSwipeEnd}
            @pointercancel=${() => {
              this.swipeStart = null;
            }}
            class="vdocs:absolute vdocs:top-0 vdocs:bottom-0 vdocs:left-full vdocs:flex vdocs:w-full vdocs:flex-col vdocs:overflow-hidden vdocs:p-4">
            ${this.renderDetail()}
          </div>
        </div>
      </div>`;
  }
}

register('vdocs-send', VdocsSend);

// vdocs-cancel, vdocs-sdk-error, and vdocs-search-contacts are already declared
// elsewhere with the same payloads, so only the send-specific events are here.
declare global {
  interface HTMLElementTagNameMap {
    'vdocs-send': VdocsSend;
  }

  interface GlobalEventHandlersEventMap {
    'vdocs-before-send': CustomEvent<ISendEventDetail>;
    'vdocs-send': CustomEvent<ISentEventDetail>;
  }
}
