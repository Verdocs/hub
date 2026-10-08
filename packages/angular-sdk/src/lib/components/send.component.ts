import { formatFullName, isValidEmail } from '@verdocs/js-sdk';
import {
  afterEveryRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import type {
  IBrand,
  ICreateEnvelopeFromTemplateRequest,
  ICreateEnvelopeRecipientFromTemplate,
  IEnvelope,
  IProfile,
  IRecipient,
  ITemplate,
  TRecipientAuthMethod,
  TSession,
  VerdocsEndpoint,
} from '@verdocs/js-sdk';
import { VerdocsContactPickerComponent, type IContactSelectEvent } from './envelopes/contact-picker.component';
import { VerdocsComponentErrorComponent } from '../controls/component-error.component';
import { toSDKError, VerdocsTemplateDetailService } from '../template-detail.service';
import { VerdocsCheckboxComponent } from '../controls/checkbox.component';
import { VerdocsSpinnerComponent } from '../controls/spinner.component';
import { VerdocsOrganizationsService } from '../organizations.service';
import { VerdocsButtonComponent } from '../controls/button.component';
import { VerdocsLoaderComponent } from '../controls/loader.component';
import { VerdocsEnvelopesService } from '../envelopes.service';
import { signerClassName } from '../fields/field-base';
import { VERDOCS_ENDPOINT } from '../provide-verdocs';
import { getWebAppUrl } from '../environment';
import type { SDKError } from '../types';
import { showToast } from '../toast';

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

/**
 * The beforeSend payload. Angular outputs are delivered synchronously, so a handler cancels
 * the send by calling preventDefault() before it returns, the way it would with a DOM event:
 *
 * ```html
 * <verdocs-send [templateId]="templateId" (beforeSend)="review($event)" />
 * ```
 * ```ts
 * review(details: IBeforeSendEvent) {
 *   if (!this.approved) {
 *     details.preventDefault();
 *   }
 * }
 * ```
 */
export interface IBeforeSendEvent extends ISendEventDetail {
  /** Call during the handler to stop the send. Ignored once the handler has returned. */
  preventDefault: () => void;
}

/** The same payload once the envelope exists, reported through the send output. */
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

interface IBrandOption {
  key: string;
  label: string;
  sub: string;
  image: string | null;
  fallback: string;
  color: string | null;
  /** The organization default sits above a rule, the rest below it. */
  dividerBefore: boolean;
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

const brandImage = (brand: IBrand | null) => brand?.favicon_url || brand?.thumbnail_url || (brand ? null : VERDOCS_LOGO_URL);

// Show the bottom fade only while there is more content below the fold. The class goes straight
// onto the DOM rather than into a signal, so running this after every render cannot loop.
const updateScrollFade = (body: HTMLElement | null | undefined) => {
  const wrap = body?.parentElement;
  if (!body || !wrap) {
    return;
  }

  const scrollable = body.scrollHeight > body.clientHeight + 1;
  const atEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - 1;
  wrap.classList.toggle('vdocs-scroll-more', scrollable && !atEnd);
};

/**
 * Send a template to one or more recipients as an envelope for signing. The card shows a
 * roster of the template's roles plus the delivery settings, and every row slides the card
 * across to a detail view rather than opening a popup.
 *
 * Host applications should ensure the template is sendable before displaying this component.
 * To be sendable a template needs at least one document, at least one participant, and at
 * least one field assigned to every signer. This component renders nothing otherwise.
 *
 * ```html
 * <verdocs-send [templateId]="templateId" (send)="onSent($event)" (cancel)="goBack()" />
 * ```
 */
@Component({
  selector: 'verdocs-send',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    VerdocsButtonComponent,
    VerdocsCheckboxComponent,
    VerdocsComponentErrorComponent,
    VerdocsContactPickerComponent,
    VerdocsLoaderComponent,
    VerdocsSpinnerComponent,
  ],
  host: { '[style.display]': `'block'` },
  template: `
    @if (!authenticated()) {
      <verdocs-component-error message="You must be authenticated to use this module." />
    } @else if (templateQuery.isPending()) {
      <div class="vdocs:relative vdocs:min-h-[480px] vdocs:w-full vdocs:max-w-[480px]">
        <verdocs-loader />
      </div>
    } @else if (template()?.is_sendable) {
      <div
        class="vdocs:relative vdocs:box-border vdocs:w-full vdocs:max-w-[480px] vdocs:overflow-hidden vdocs:rounded-lg vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-surface vdocs:font-sans vdocs:text-sm vdocs:text-ink">
        <!-- The main pane sets the card's height. The detail pane sits beside it, off-canvas to
             the right, and the track slides one pane-width left when a detail view opens. -->
        <div
          [class]="trackClasses()">
          <!-- Whichever pane is off-canvas is inert so its controls leave the tab order; a focused
               element out there would otherwise drag the track sideways. -->
          <div [attr.inert]="detailOpen() ? '' : null" class="vdocs:flex vdocs:flex-1 vdocs:flex-col vdocs:p-4">
            <div [class]="sectionTitleClasses">Recipients</div>
            <div class="vdocs:flex vdocs:flex-col">
              @for (level of levels(); track level) {
                <div class="vdocs:flex vdocs:flex-col">
                  @if (levels().length > 1) {
                    <div class="vdocs:pt-2.5 vdocs:pb-1 vdocs:text-[11px] vdocs:text-muted">Step {{ level }}</div>
                  }
                  @for (row of rowsAtLevel(level); track row.id) {
                    <button
                      type="button"
                      [attr.data-rn]="row.roleName"
                      [class]="rowClasses + ' vdocs:py-2 vdocs:pr-1.5 vdocs:pl-0'"
                      (click)="openRecipient(row)">
                      <span [class]="dotClasses(row.signerIndex)"></span>
                      <span class="vdocs:flex vdocs:min-w-0 vdocs:flex-1 vdocs:flex-col">
                        <span class="vdocs:text-[13px] vdocs:font-semibold">{{ row.roleName }}</span>
                        @if (recipientFor(row.id); as recipient) {
                          <span class="vdocs:truncate vdocs:text-xs vdocs:text-muted">{{ recipientSummary(recipient) }}</span>
                        } @else {
                          <span class="vdocs:truncate vdocs:text-xs vdocs:font-medium vdocs:text-accent">Configure recipient</span>
                        }
                        @if (optionLabels(row.id); as labels) {
                          <span class="vdocs:mt-[3px] vdocs:flex vdocs:flex-wrap vdocs:gap-1">
                            @for (label of labels; track label) {
                              <span
                                class="vdocs:inline-flex vdocs:h-[18px] vdocs:items-center vdocs:rounded-full vdocs:bg-accent-tint vdocs:px-1.5 vdocs:text-[10px] vdocs:font-medium vdocs:text-ink">
                                {{ label }}
                              </span>
                            }
                          </span>
                        }
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                        class="vdocs:size-4 vdocs:shrink-0 vdocs:text-edge">
                        <path d="m9 6 6 6-6 6" />
                      </svg>
                    </button>
                  }
                </div>
              }
            </div>

            <div [class]="sectionTitleClasses + ' vdocs:mt-4'">Delivery</div>
            <div class="vdocs:flex vdocs:flex-col">
              <button
                type="button"
                [disabled]="sending()"
                [class]="rowClasses + ' vdocs:h-10 vdocs:pr-1.5 vdocs:text-[13px]'"
                (click)="view.set('brand')">
                <span class="vdocs:flex-[0_0_84px] vdocs:text-muted">Brand</span>
                <span class="vdocs:min-w-0 vdocs:flex-1 vdocs:truncate vdocs:font-medium">{{ selectedBrandLabel() }}</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  class="vdocs:size-4 vdocs:shrink-0 vdocs:text-edge">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>
              <button
                type="button"
                [disabled]="sending()"
                [class]="rowClasses + ' vdocs:h-10 vdocs:pr-1.5 vdocs:text-[13px]'"
                (click)="view.set('expires')">
                <span class="vdocs:flex-[0_0_84px] vdocs:text-muted">Expires</span>
                <span class="vdocs:min-w-0 vdocs:flex-1 vdocs:truncate vdocs:font-medium">
                  {{ effectiveExpiry() }} days
                  <small class="vdocs:text-[13px] vdocs:font-normal vdocs:text-muted">{{ middleDot }} {{ expiresShort() }}</small>
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  class="vdocs:size-4 vdocs:shrink-0 vdocs:text-edge">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>
              <button
                type="button"
                [disabled]="sending()"
                [class]="rowClasses + ' vdocs:h-10 vdocs:pr-1.5 vdocs:text-[13px]'"
                (click)="view.set('notifications')">
                <span class="vdocs:flex-[0_0_84px] vdocs:text-muted">Notifications</span>
                <span
                  class="vdocs:min-w-0 vdocs:flex-1 vdocs:truncate vdocs:font-medium"
                  [class]="noContact() ? warningIcon : ''">
                  {{ noContact() ? 'Off' : 'On' }}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  class="vdocs:size-4 vdocs:shrink-0 vdocs:text-edge">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>
            </div>

            <div class="vdocs:flex-1"></div>

            <div class="vdocs:mt-3.5 vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:items-center vdocs:justify-end vdocs:gap-2.5">
              @if (hasDuplicateEmails()) {
                <div role="alert" class="vdocs:mb-2.5 vdocs:w-full vdocs:text-[13px] vdocs:text-danger">Recipients cannot share the same email.</div>
              }
              @if (sending()) {
                <verdocs-spinner mode="dark" [size]="20" />
              }
              @if (showCancel()) {
                <verdocs-button label="Cancel" size="small" variant="outline" [disabled]="sending()" (click)="cancel.emit()" />
              }
              <verdocs-button label="Send" size="small" [disabled]="!allRolesConfigured() || sending() || hasDuplicateEmails()" (click)="onSend()" />
            </div>
          </div>

          <div
            [attr.inert]="detailOpen() ? null : ''"
            class="vdocs:absolute vdocs:top-0 vdocs:bottom-0 vdocs:left-full vdocs:flex vdocs:w-full vdocs:flex-col vdocs:overflow-hidden vdocs:p-4"
            (pointerdown)="onSwipeStart($event)"
            (pointerup)="onSwipeEnd($event)"
            (pointercancel)="onSwipeCancel()">
            @if (detailOpen()) {
              <div class="vdocs:mb-3.5 vdocs:flex vdocs:items-center vdocs:gap-2">
                <button
                  type="button"
                  (click)="view.set('main')"
                  class="vdocs:flex vdocs:flex-[0_0_52px] vdocs:cursor-pointer vdocs:items-center vdocs:border-none vdocs:bg-transparent vdocs:p-0 vdocs:font-sans vdocs:text-[13px] vdocs:font-medium vdocs:text-accent">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                    class="vdocs:size-4">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  Back
                </button>
                <div class="vdocs:flex vdocs:flex-1 vdocs:items-center vdocs:justify-center vdocs:gap-2 vdocs:text-sm vdocs:font-semibold">
                  @switch (view()) {
                    @case ('recipient') {
                      @if (editingRow(); as row) {
                        <span [class]="dotClasses(row.signerIndex)"></span>
                        {{ row.roleName }}
                      } @else {
                        Recipient
                      }
                    }
                    @case ('brand') {
                      Brand
                    }
                    @case ('expires') {
                      Expiration
                    }
                    @case ('notifications') {
                      Notifications
                    }
                  }
                </div>
                <div class="vdocs:flex-[0_0_52px]"></div>
              </div>

              @if (view() === 'recipient') {
                @if (editingRow(); as row) {
                  <verdocs-contact-picker
                    [showCancel]="false"
                    [suggestions]="suggestions()"
                    [availableAuthMethods]="availableAuthMethods()"
                    [templateRole]="recipients()[row.id] ?? row.defaults"
                    (searchContacts)="searchContacts.emit($event)"
                    (submit)="submitContact(row, $event)" />
                }
              } @else {
                <div class="vdocs:group vdocs:relative vdocs:flex vdocs:min-h-0 vdocs:flex-1 vdocs:flex-col">
                  <div #detailBody class="vdocs:min-h-0 vdocs:flex-1 vdocs:overflow-y-auto" (scroll)="onDetailScroll($event)">
                    @switch (view()) {
                      @case ('brand') {
                        <div role="radiogroup" aria-label="Brand" class="vdocs:flex vdocs:flex-col">
                          @for (option of brandOptions(); track option.key) {
                            @if (option.dividerBefore) {
                              <div class="vdocs:my-0.5 vdocs:border-0 vdocs:border-t vdocs:border-solid vdocs:border-edge"></div>
                            }
                            <button
                              type="button"
                              role="radio"
                              [attr.aria-checked]="selectedBrandKey() === option.key"
                              (click)="selectedBrandKey.set(option.key)"
                              class="vdocs:flex vdocs:w-full vdocs:cursor-pointer vdocs:items-center vdocs:gap-2.5 vdocs:border-0 vdocs:border-t vdocs:border-solid vdocs:border-edge-light vdocs:bg-transparent vdocs:px-0 vdocs:py-2.5 vdocs:text-left vdocs:font-sans vdocs:text-[13px] vdocs:text-ink vdocs:first:border-t-0">
                              <span
                                class="vdocs:flex vdocs:size-4 vdocs:shrink-0 vdocs:items-center vdocs:justify-center vdocs:rounded-full vdocs:border vdocs:border-solid"
                                [class]="selectedBrandKey() === option.key ? 'vdocs:border-accent' : 'vdocs:border-edge'">
                                @if (selectedBrandKey() === option.key) {
                                  <span class="vdocs:size-2 vdocs:rounded-full vdocs:bg-accent"></span>
                                }
                              </span>
                              @if (option.image; as image) {
                                <span
                                  class="vdocs:flex vdocs:size-[22px] vdocs:shrink-0 vdocs:items-center vdocs:justify-center vdocs:overflow-hidden vdocs:rounded-row vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-surface">
                                  <img [src]="image" alt="" class="vdocs:size-full vdocs:object-contain" />
                                </span>
                              } @else {
                                <span
                                  [style.backgroundColor]="option.color"
                                  class="vdocs:flex vdocs:size-[22px] vdocs:shrink-0 vdocs:items-center vdocs:justify-center vdocs:overflow-hidden vdocs:rounded-row vdocs:bg-accent-dark vdocs:text-[9px] vdocs:font-bold vdocs:text-white">
                                  {{ option.fallback }}
                                </span>
                              }
                              <span class="vdocs:flex vdocs:min-w-0 vdocs:flex-1 vdocs:flex-col">
                                {{ option.label }}
                                <small class="vdocs:truncate vdocs:text-[11px] vdocs:text-muted">{{ option.sub }}</small>
                              </span>
                            </button>
                          }
                        </div>
                        @if (brands().length === 0) {
                          <p [class]="hintClasses">
                            Configure the look and feel of the signing experience by
                            <a [href]="webAppUrl() + '/settings/branding'" target="_blank" rel="noopener noreferrer" [class]="linkClasses">
                              Creating a Brand
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                aria-hidden="true"
                                class="vdocs:ml-0.5 vdocs:inline-block vdocs:size-[11px] vdocs:align-[-1px]">
                                <path d="M15 3h6v6M10 14 21 3M21 14v7H3V3h7" />
                              </svg>
                            </a>
                            .
                          </p>
                        }
                      }
                      @case ('expires') {
                        <div class="vdocs:relative">
                          <input
                            type="text"
                            inputmode="numeric"
                            aria-label="Expires in days"
                            [placeholder]="defaultExpiryPlaceholder"
                            [value]="expiresInDays()"
                            [disabled]="sending()"
                            [class]="inputClasses"
                            (input)="onExpiryInput($event)" />
                          <span
                            class="vdocs:pointer-events-none vdocs:absolute vdocs:top-0 vdocs:right-2.5 vdocs:flex vdocs:h-9 vdocs:items-center vdocs:text-[13px] vdocs:text-muted">
                            days
                          </span>
                        </div>
                        <p [class]="hintClasses">
                          This envelope will expire on {{ expiresLong() }}. Expirations may be set from {{ minExpiryDays }}-{{ maxExpiryDays }} days. If left
                          blank, this will default to {{ defaultExpiryDays }}.
                        </p>
                      }
                      @case ('notifications') {
                        <verdocs-checkbox size="small" label="Disable notifications" [checked]="noContact()" class="vdocs:py-1"
                          (checkedChange)="noContact.set($event)" />
                        @if (noContact()) {
                          <div
                            class="vdocs:mt-3 vdocs:flex vdocs:gap-2.5 vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-[#fde68a] vdocs:bg-[#fffbeb] vdocs:px-3 vdocs:py-2.5 vdocs:text-xs/relaxed"
                            [class]="warningText">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              aria-hidden="true"
                              class="vdocs:mt-px vdocs:size-[18px] vdocs:shrink-0"
                              [class]="warningIcon">
                              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                              <path d="M12 9v4M12 17h.01" />
                            </svg>
                            <div>
                              Disabling notifications turns off invitations and reminders to recipients as well as status updates to you. You may obtain invite
                              links in the recipient summary or via an API call. We strongly recommend enabling
                              <a [href]="webAppUrl() + '/settings/webhooks'" target="_blank" rel="noopener noreferrer" [class]="linkClasses">
                                Webhooks
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  aria-hidden="true"
                                  class="vdocs:ml-0.5 vdocs:inline-block vdocs:size-[11px] vdocs:align-[-1px]">
                                  <path d="M15 3h6v6M10 14 21 3M21 14v7H3V3h7" />
                                </svg>
                              </a>
                              to facilitate this step.
                            </div>
                          </div>
                        }
                      }
                    }
                  </div>
                  <div
                    aria-hidden="true"
                    class="vdocs:pointer-events-none vdocs:absolute vdocs:inset-x-0 vdocs:bottom-0 vdocs:h-9 vdocs:bg-linear-to-b vdocs:from-surface/0 vdocs:to-surface vdocs:opacity-0 vdocs:transition-opacity vdocs:group-[.vdocs-scroll-more]:opacity-100"></div>
                </div>
                <div class="vdocs:mt-2.5 vdocs:border-0 vdocs:border-t vdocs:border-solid vdocs:border-edge-light vdocs:pt-3">
                  <verdocs-button label="Done" size="small" class="vdocs:block vdocs:w-full" (click)="view.set('main')" />
                </div>
              }
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class VerdocsSendComponent {
  /** Endpoint override for dual-session scenarios. Defaults to the provided endpoint. */
  readonly endpoint = input<VerdocsEndpoint>();
  /** The ID of the template to create the envelope from. */
  readonly templateId = input.required<string>();
  /**
   * The environment the control is being called from, e.g. 'web'. This changes how notifications
   * are assembled so recipients get invitation URLs that work for them. Leave unset unless you
   * know the environment; unknown values produce incorrect behavior.
   */
  readonly environment = input('');
  /**
   * Whether to show the cancel button. Turn it off where the embed sits in a flow that has its
   * own navigation for the user to back out.
   */
  readonly showCancel = input(true);
  /**
   * Preselect a brand by key. The sender can still change it in the brand chooser. Leave unset
   * for the organization default.
   */
  readonly brandKey = input('');

  /**
   * Emitted with the pending request just before it is posted. Call preventDefault() on the
   * payload during the handler to cancel the send.
   */
  readonly beforeSend = output<IBeforeSendEvent>();
  /** Emitted once the envelope has been created. */
  readonly send = output<ISentEventDetail>();
  /** Emitted when the user clicks Cancel. */
  readonly cancel = output<void>();
  /** Emitted if the envelope could not be created. */
  readonly sdkError = output<SDKError>();
  /** Emitted as the sender types a name in the recipient form. */
  readonly searchContacts = output<string>();

  protected readonly rowClasses = ROW_CLASSES;
  protected readonly hintClasses = HINT_CLASSES;
  protected readonly linkClasses = LINK_CLASSES;
  protected readonly inputClasses = INPUT_CLASSES;
  protected readonly warningText = WARNING_TEXT;
  protected readonly warningIcon = WARNING_ICON;
  protected readonly middleDot = MIDDLE_DOT;
  protected readonly minExpiryDays = MIN_EXPIRY_DAYS;
  protected readonly maxExpiryDays = MAX_EXPIRY_DAYS;
  protected readonly defaultExpiryDays = DEFAULT_EXPIRY_DAYS;
  protected readonly defaultExpiryPlaceholder = String(DEFAULT_EXPIRY_DAYS);
  protected readonly sectionTitleClasses = 'vdocs:mb-1.5 vdocs:text-xs vdocs:font-semibold vdocs:text-ink';

  private readonly injectedEndpoint = inject(VERDOCS_ENDPOINT, { optional: true });
  private readonly templatesService = inject(VerdocsTemplateDetailService);
  private readonly envelopesService = inject(VerdocsEnvelopesService);
  private readonly organizationsService = inject(VerdocsOrganizationsService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly resolvedEndpoint = computed(() => {
    const resolved = this.endpoint() ?? this.injectedEndpoint;
    if (!resolved) {
      throw new Error('verdocs-send needs provideVerdocs() in your application providers or an explicit endpoint input');
    }

    return resolved;
  });

  // Seeded from the endpoint so a card mounted with a session already loaded never flashes the
  // "must be authenticated" message, then kept current by the session listener below.
  private readonly session = linkedSignal<VerdocsEndpoint, TSession>({
    source: this.resolvedEndpoint,
    computation: endpoint => endpoint.session,
  });

  private readonly profile = linkedSignal<VerdocsEndpoint, IProfile | null>({
    source: this.resolvedEndpoint,
    computation: endpoint => endpoint.profile,
  });

  protected readonly authenticated = computed(() => !!this.session());

  protected readonly templateQuery = this.templatesService.template(this.templateId, this.endpoint);
  protected readonly template = computed(() => this.templateQuery.data());

  private readonly organizationId = computed(() => this.template()?.organization_id || '');

  private readonly brandsQuery = this.organizationsService.brands(
    computed(() => this.organizationId() || undefined),
    this.endpoint,
  );

  private readonly organizationQuery = this.organizationsService.organization(
    computed(() => this.organizationId() || undefined),
    this.endpoint,
  );

  private readonly contactsQuery = this.organizationsService.contacts(this.authenticated, this.endpoint);
  private readonly entitlementsQuery = this.organizationsService.entitlements(this.authenticated, this.endpoint);

  protected readonly brands = computed(() => this.brandsQuery.data() || []);
  protected readonly sending = signal(false);

  // A template that moves to another organization takes its brands with it, so the chosen brand
  // and any half-finished edit no longer mean anything: they reset with the organization.
  protected readonly view = linkedSignal<string, TSendView>({
    source: this.organizationId,
    computation: () => 'main',
  });

  private readonly editingRoleId = linkedSignal<string, string>({
    source: this.organizationId,
    computation: () => '',
  });

  private readonly recipientEdits = linkedSignal<string, Record<string, Partial<IRecipient>>>({
    source: this.organizationId,
    computation: () => ({}),
  });

  protected readonly selectedBrandKey = linkedSignal<string, string>({
    source: this.organizationId,
    // The preset seeds the choice once (untracked, the way React seeds useState with it), and
    // only a move away from a known organization clears it: the template's own organization
    // arriving is the first load, not a move.
    computation: (_organizationId, previous) => (previous?.source ? '' : untracked(() => this.brandKey())),
  });

  protected readonly expiresInDays = signal('');
  protected readonly noContact = signal(false);

  protected readonly roleRows = computed<IRoleRow[]>(() => {
    const countByLevel: Record<number, number> = {};

    return (this.template()?.roles || [])
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
  });

  // Roles the template author already filled in count as configured, so the sender only has to
  // touch the ones left open. Their own edits layer over the top.
  protected readonly recipients = computed(() => {
    const merged: Record<string, Partial<IRecipient>> = {};
    this.roleRows().forEach(row => {
      if (row.defaults.first_name && isValidEmail(row.defaults.email || '')) {
        merged[row.id] = row.defaults;
      }
    });

    return { ...merged, ...this.recipientEdits() };
  });

  protected readonly suggestions = computed(() => {
    const contacts = this.contactsQuery.data() || [];
    const profile = this.profile();

    // The sender is the most likely recipient of their own envelope, so they ride at the end of
    // the address book rather than waiting for a search.
    return profile ? [ ...contacts, profile ] : contacts;
  });

  protected readonly availableAuthMethods = computed<TRecipientAuthMethod[]>(() => {
    const entitlements = this.entitlementsQuery.data();
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
  });

  protected readonly levels = computed(() => [ ...new Set(this.roleRows().map(row => row.level)) ]);

  private readonly configuredRecipients = computed(
    () => this.roleRows().map(row => this.recipients()[row.id]).filter(isConfigured) as Partial<IRecipient>[]);

  protected readonly allRolesConfigured = computed(() => this.roleRows().length > 0 && this.configuredRecipients().length === this.roleRows().length);

  protected readonly hasDuplicateEmails = computed(() => {
    const emails = this.configuredRecipients().map(recipient => (recipient.email || '').toLowerCase());
    return new Set(emails).size < emails.length;
  });

  private readonly defaultBrand = computed(
    () => this.brands().find(brand => brand.id === this.organizationQuery.data()?.default_brand_id) || null);

  // With no brand of its own the organization gets Verdocs styling, so that is what default means.
  private readonly defaultBrandLabel = computed(() => `Default (${this.defaultBrand()?.name || 'Verdocs'})`);

  protected readonly selectedBrandLabel = computed(() => {
    const key = this.selectedBrandKey();
    if (!key) {
      return this.defaultBrandLabel();
    }

    const brand = this.brands().find(candidate => candidate.key === key);
    return brand?.name || brand?.key || key;
  });

  private readonly otherBrands = computed(() =>
    this.brands()
      .filter(brand => brand.id !== this.defaultBrand()?.id)
      .sort((a, b) => (a.name || a.key).localeCompare(b.name || b.key)));

  protected readonly brandOptions = computed<IBrandOption[]>(() => {
    const defaultBrand = this.defaultBrand();
    const options: IBrandOption[] = [
      {
        key: '',
        label: this.defaultBrandLabel(),
        sub: 'Organization default',
        image: brandImage(defaultBrand),
        fallback: (defaultBrand?.name || 'V').substring(0, 2).toUpperCase(),
        color: defaultBrand?.primary_color || null,
        dividerBefore: false,
      },
    ];

    this.otherBrands().forEach((brand, index) => {
      options.push({
        key: brand.key,
        label: brand.name || brand.key,
        sub: brand.key,
        image: brandImage(brand),
        fallback: (brand.name || brand.key).substring(0, 2).toUpperCase(),
        color: brand.primary_color || null,
        dividerBefore: index === 0,
      });
    });

    return options;
  });

  protected readonly effectiveExpiry = computed(() => effectiveExpiryDays(this.expiresInDays()));

  private readonly expiresAt = computed(() => expiresAtFor(this.expiresInDays()));

  protected readonly expiresShort = computed(() => this.expiresAt().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));

  protected readonly expiresLong = computed(() => {
    const expiresAt = this.expiresAt();
    const date = expiresAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${date} at ${expiresAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  });

  protected readonly editingRow = computed(() => this.roleRows().find(row => row.id === this.editingRoleId()));

  protected readonly detailOpen = computed(() => this.view() !== 'main');

  protected readonly trackClasses = computed(
    () =>
      'vdocs:relative vdocs:flex vdocs:min-h-[480px] vdocs:flex-col vdocs:transition-transform vdocs:duration-[220ms] vdocs:ease-out ' +
      `vdocs:motion-reduce:transition-none ${this.detailOpen() ? 'vdocs:-translate-x-full' : ''}`,
  );

  protected readonly webAppUrl = computed(() => getWebAppUrl(this.resolvedEndpoint()));

  private readonly detailBody = viewChild<ElementRef<HTMLDivElement>>('detailBody');

  private swipeStart: { x: number; y: number; time: number } | null = null;
  private swallowNextClick = false;

  constructor() {
    effect(onCleanup => {
      const endpoint = this.resolvedEndpoint();
      const unsubscribe = endpoint.onSessionChanged((_endpoint, session, profile) => {
        this.session.set(session);
        this.profile.set(profile);
      });

      endpoint.loadSession();
      onCleanup(unsubscribe);
    });

    // Only the browser knows whether a detail view overflowed, so the fade is measured rather
    // than derived, after every render (the notifications warning grows the view as it opens).
    afterEveryRender(() => updateScrollFade(this.detailBody()?.nativeElement));

    // Angular templates cannot bind a capture-phase listener, and the click that ends a swipe has
    // to be swallowed before it reaches whatever wide button was under the finger.
    const element = this.host.nativeElement;
    const swallow = (event: MouseEvent) => {
      if (this.swallowNextClick) {
        this.swallowNextClick = false;
        event.stopPropagation();
        event.preventDefault();
      }
    };

    element.addEventListener('click', swallow, { capture: true });
    inject(DestroyRef).onDestroy(() => element.removeEventListener('click', swallow, { capture: true }));
  }

  protected dotClasses(signerIndex: number) {
    return `${signerClassName(signerIndex)} vdocs:size-2.5 vdocs:shrink-0 vdocs:rounded-full vdocs:border vdocs:border-solid vdocs:border-[rgba(0,0,0,0.1)]`;
  }

  protected rowsAtLevel(level: number) {
    return this.roleRows().filter(row => row.level === level);
  }

  /** The configured recipient for a row, or undefined while the row still needs a person. */
  protected recipientFor(rowId: string) {
    const recipient = this.recipients()[rowId];
    return isConfigured(recipient) ? recipient : undefined;
  }

  protected recipientSummary(recipient: Partial<IRecipient>) {
    return `${formatFullName(recipient)} ${MIDDLE_DOT} ${recipient.email}`;
  }

  /** The option pills for a row, or undefined when the recipient turned none of them on. */
  protected optionLabels(rowId: string) {
    const labels = recipientOptionLabels(this.recipients()[rowId]);
    return labels.length ? labels : undefined;
  }

  protected openRecipient(row: IRoleRow) {
    this.editingRoleId.set(row.id);
    this.view.set('recipient');
  }

  protected submitContact(row: IRoleRow, contact: IContactSelectEvent) {
    this.recipientEdits.update(previous => ({ ...previous, [row.id]: { ...row.defaults, ...contact } }));
    this.editingRoleId.set('');
    this.view.set('main');
  }

  protected onDetailScroll(event: Event) {
    updateScrollFade(event.currentTarget as HTMLElement);
  }

  protected onExpiryInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const clamped = clampExpiryDays(target.value.replace(/[^0-9]/g, ''));
    this.expiresInDays.set(clamped);
    // Angular skips writing a [value] binding it believes is unchanged, so stripped characters
    // would otherwise stay visible in the field.
    target.value = clamped;
  }

  protected onSwipeStart(event: PointerEvent) {
    this.swallowNextClick = false;
    const pane = event.currentTarget as HTMLElement;
    const rect = pane.getBoundingClientRect();
    const onTextEntry = !!(event.target as HTMLElement)?.closest?.('input, textarea, select, [contenteditable]');
    if (!this.detailOpen() || onTextEntry || event.clientX - rect.left > rect.width * SWIPE_START_FRACTION) {
      this.swipeStart = null;
      return;
    }

    this.swipeStart = { x: event.clientX, y: event.clientY, time: Date.now() };
  }

  protected onSwipeEnd(event: PointerEvent) {
    const start = this.swipeStart;
    this.swipeStart = null;
    if (!start) {
      return;
    }

    const dx = event.clientX - start.x;
    const dy = Math.abs(event.clientY - start.y);
    if (dx >= SWIPE_MIN_DISTANCE && dx > dy && Date.now() - start.time <= SWIPE_MAX_DURATION) {
      this.swallowNextClick = true;
      this.view.set('main');
    }
  }

  protected onSwipeCancel() {
    this.swipeStart = null;
  }

  protected async onSend() {
    const template = this.template();
    if (this.sending() || !template) {
      return;
    }

    const localeData = Intl.DateTimeFormat().resolvedOptions();
    const request: ICreateEnvelopeFromTemplateRequest = {
      template_id: this.templateId(),
      name: template.name || 'New Envelope',
      environment: this.environment(),
      initial_reminder: 0,
      followup_reminders: 0,
      recipients: this.roleRows().map(row => this.recipients()[row.id]).filter(Boolean) as ICreateEnvelopeRecipientFromTemplate[],
      timezone: localeData.timeZone,
      locale: localeData.locale,
      expires_at: expiresAtFor(this.expiresInDays()).toISOString(),
      no_contact: this.noContact(),
    };

    const brandKey = this.selectedBrandKey();
    if (brandKey) {
      request.brand_key = brandKey;
    }

    let canceled = false;
    this.beforeSend.emit({
      ...request,
      name: request.name!,
      template,
      preventDefault: () => {
        canceled = true;
      },
    });

    if (canceled) {
      return;
    }

    this.sending.set(true);
    try {
      const envelope = await this.envelopesService.createEnvelope(request, this.endpoint());
      this.recipientEdits.set({});
      this.editingRoleId.set('');
      this.view.set('main');
      this.selectedBrandKey.set('');
      this.expiresInDays.set('');
      this.noContact.set(false);
      this.send.emit({ ...request, name: request.name!, envelope_id: envelope.id, envelope });
    } catch (error) {
      const details = error as { response?: { data?: { error?: string } } };
      showToast(details?.response?.data?.error || 'Error creating envelope, please try again later.', { style: 'error' });
      this.sdkError.emit(toSDKError(error));
    } finally {
      this.sending.set(false);
    }
  }
}
