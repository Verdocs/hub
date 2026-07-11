import type { IEnvelope, IProfile, IRecipient, TRecipientStatus, VerdocsEndpoint } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { capitalize, formatFullName, getRecipientsWithActions, recipientCanAct, userIsEnvelopeOwner } from '@verdocs/js-sdk';
import { VerdocsEnvelopeHistoryIconComponent, type THistoryIcon } from './envelope-history-icon.component';
import { VerdocsEnvelopeUpdateRecipientComponent } from './envelope-update-recipient.component';
import { VerdocsDropdownComponent, type IMenuOption } from '../../controls/dropdown.component';
import { VerdocsTextInputComponent } from '../../controls/text-input.component';
import { VerdocsOkDialogComponent } from '../../dialogs/ok-dialog.component';
import { VerdocsButtonComponent } from '../../controls/button.component';
import { VerdocsSwitchComponent } from '../../controls/switch.component';
import { VerdocsEnvelopesService } from '../../envelopes.service';
import { toSDKError } from '../../template-detail.service';
import { VERDOCS_ENDPOINT } from '../../provide-verdocs';
import { showToast } from '../../toast';
import { SDKError } from '../../types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Payload for the envelopeUpdated output emitted by VerdocsEnvelopeSidebarComponent. */
export interface IEnvelopeUpdatedEvent {
  endpoint: VerdocsEndpoint;
  envelope: IEnvelope;
  event: string;
}

/** Payload for recipient-level outputs emitted by VerdocsEnvelopeSidebarComponent. */
export interface IEnvelopeRecipientEvent {
  endpoint: VerdocsEndpoint;
  envelope: IEnvelope;
  recipient: IRecipient;
}

interface IHistoryEntry {
  icon: THistoryIcon;
  message: string;
  date: Date;
}

// Legacy FORMAT_TIMESTAMP was date-fns 'P pp' (short date, time with seconds);
// the next-reminder field used 'P p'. Intl gives us the same localized output.
const timestampFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'medium' });
const reminderFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' });

function prepareHistoryEntries(envelope: IEnvelope): IHistoryEntry[] {
  const entries: IHistoryEntry[] = [];
  const histories = envelope.history_entries ?? [];

  entries.push({ icon: 'pencil', message: 'Envelope created.', date: new Date(envelope.created_at) });

  if (envelope.status === 'complete') {
    entries.push({ icon: 'pencil', message: 'Envelope completed.', date: new Date(envelope.updated_at) });
  }

  // Older envelopes have no owner:canceled history entry, so we synthesize one
  // from the status to keep the timeline complete.
  const ownerCanceled = histories.some(history => (history.event as string) === 'owner:canceled');
  if (envelope.status === 'canceled' && !ownerCanceled) {
    entries.push({ icon: 'pencil', message: 'Envelope Canceled.', date: new Date(envelope.canceled_at) });
  }

  histories.forEach(history => {
    const recipient = (envelope.recipients ?? []).find(r => r.role_name === history.role_name);
    const fullName = formatFullName(recipient);
    const date = new Date(history.created_at);

    switch (history.event.toLowerCase()) {
      case 'recipient:kba_verified':
        entries.push({ icon: 'key', message: `KBA verification completed by ${fullName}.`, date });
        break;
      case 'recipient:kba_failed':
        entries.push({ icon: 'keyslash', message: `KBA verification failed by ${fullName}.`, date });
        break;
      case 'recipient:id_verified':
        entries.push({ icon: 'idcard', message: `ID verification completed by ${fullName}.`, date });
        break;
      case 'recipient:id_failed':
        entries.push({ icon: 'idcardslash', message: `ID verification failed by ${fullName}.`, date });
        break;
      case 'recipient:pin_verified':
        entries.push({ icon: 'pin', message: `PIN verification completed by ${fullName}.`, date });
        break;
      case 'recipient:pin_failed':
        entries.push({ icon: 'pinslash', message: `PIN verification failed by ${fullName}.`, date });
        break;
      case 'recipient:signed':
        entries.push({ icon: 'gesture', message: `Signed by ${fullName}.`, date });
        break;
      case 'recipient:declined':
        entries.push({ icon: 'clear', message: `Declined by ${fullName}.`, date });
        break;
      case 'recipient:opened':
        switch (history.event_detail) {
          case 'email':
          case 'mail':
            entries.push({ icon: 'visibility', message: `Opened by ${fullName}, via email.`, date });
            break;
          case 'sms':
            entries.push({ icon: 'visibility', message: `Opened by ${fullName}, via SMS.`, date });
            break;
          case 'in_person_link':
            entries.push({ icon: 'visibility', message: `Opened by ${fullName}, via In-person link.`, date });
            break;
          case 'in_app':
            entries.push({ icon: 'visibility', message: `Opened by ${fullName}, via dashboard.`, date });
            break;
          default:
            entries.push({ icon: 'visibility', message: `Opened by ${fullName}.`, date });
        }
        break;
      case 'recipient:submitted':
        if (history.event_detail === 'approver') {
          entries.push({ icon: 'check_circle', message: `Approved by ${fullName}.`, date });
        } else {
          entries.push({ icon: 'send', message: `Submitted by ${fullName}.`, date });
        }
        break;
      case 'recipient:prepared':
        entries.push({ icon: 'send', message: `Prepared by ${fullName}.`, date });
        break;
      case 'recipient:claimed':
        if (history.event_detail === 'guest') {
          entries.push({ icon: 'account_circle', message: `${fullName} claimed the Envelope as a guest.`, date });
        } else if (history.event_detail === 'profile') {
          entries.push({ icon: 'verified_user', message: `${fullName} claimed the Envelope as a verified user.`, date });
        }
        break;
      case 'recipient:agreed':
        entries.push({ icon: 'done', message: `${fullName} agreed to use electronic records and signatures.`, date });
        break;
      case 'recipient:invited':
        if (history.event_detail === 'sms') {
          entries.push({ icon: 'textsms', message: `${fullName} has been invited via SMS.`, date });
        } else {
          entries.push({ icon: 'mail', message: `${fullName} has been invited via email.`, date });
        }
        break;
      case 'recipient:reminder':
        if (history.event_detail === 'sms') {
          entries.push({ icon: 'textsms', message: `${fullName} sent a reminder via SMS.`, date });
        } else {
          entries.push({ icon: 'mail', message: `${fullName} sent a reminder via email.`, date });
        }
        break;
      case 'invitation:resent':
        entries.push({
          icon: 'mail',
          message: `Invitation was resent to ${fullName}${history.event_detail === 'reminder' ? ' by reminder' : ''}.`,
          date,
        });
        break;
      case 'envelope:cc':
        entries.push({ icon: 'contact_mail', message: `A copy has been sent to ${fullName}.`, date });
        break;
      case 'recipient:delegated':
        entries.push({ icon: 'people', message: history.event_detail, date });
        break;
      case 'recipient:updated_info':
        entries.push({ icon: 'perm_identity', message: history.event_detail, date });
        break;
      case 'owner:updated_recipient_info':
        entries.push({ icon: 'perm_identity', message: history.event_detail, date });
        break;
      case 'created':
        entries.push({ icon: 'create', message: 'Envelope was created.', date });
        break;
      case 'completed':
        entries.push({ icon: 'done_all', message: 'Envelope was completed.', date });
        break;
      case 'envelope:canceled':
      case 'envelope_canceled':
      case 'canceled':
      case 'owner:canceled':
        entries.push({ icon: 'cancel', message: 'Envelope was canceled by the creator.', date });
        break;
      case 'envelope:expired':
        entries.push({ icon: 'cancel', message: 'Envelope expired.', date });
        break;
      case 'owner:get_in_person_link':
        entries.push({ icon: 'link', message: `Owner accessed the In-person link for ${fullName}.`, date });
        break;
      default:
        // Unknown event types are skipped rather than rendered as raw codes.
        break;
    }
  });

  entries.sort((a, b) => b.date.getTime() - a.date.getTime());
  return entries;
}

const STATUS_CLASSES: Partial<Record<TRecipientStatus, string>> = {
  invited: 'vdocs:bg-[#ff8f00]',
  signed: 'vdocs:bg-success',
  submitted: 'vdocs:bg-success',
  pending: 'vdocs:bg-info',
  canceled: 'vdocs:bg-danger',
  declined: 'vdocs:bg-danger',
};

const TABS = [
  { id: 'details', label: 'Details' },
  { id: 'recipients', label: 'Recipients' },
  { id: 'history', label: 'History' },
];

/**
 * A collapsible details sidebar for an envelope, with Details, Recipients, and
 * History tabs. Clicking a tab opens the panel; clicking the active tab again
 * collapses it. Envelope owners can send reminders, re-invite or update
 * recipients, adjust reminder schedules, and cancel the envelope.
 */
@Component({
  selector: 'verdocs-envelope-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    VerdocsButtonComponent,
    VerdocsDropdownComponent,
    VerdocsEnvelopeHistoryIconComponent,
    VerdocsEnvelopeUpdateRecipientComponent,
    VerdocsOkDialogComponent,
    VerdocsSwitchComponent,
    VerdocsTextInputComponent,
  ],
  host: { '[class]': 'hostClasses()' },
  template: `
    <div role="tablist" aria-orientation="vertical" class="vdocs:flex vdocs:w-14 vdocs:shrink-0 vdocs:flex-col">
      @for (tab of tabs; track tab.id) {
        <button
          type="button"
          role="tab"
          [attr.aria-label]="tab.label"
          [attr.aria-selected]="panelOpen() && activeTab() === $index"
          (click)="selectTab($index)"
          [class]="
            'vdocs:flex vdocs:h-[50px] vdocs:w-full vdocs:cursor-pointer vdocs:items-center vdocs:justify-center vdocs:border-0 vdocs:border-l-2 vdocs:border-solid vdocs:bg-transparent vdocs:p-0 vdocs:text-white '
            + (activeTab() === $index && panelOpen() ? 'vdocs:border-primary' : 'vdocs:border-transparent')
          ">
          @switch (tab.id) {
            @case ('details') {
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="vdocs:size-6" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            }
            @case ('recipients') {
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="vdocs:size-6" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            }
            @default {
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="vdocs:size-6" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            }
          }
        </button>
      }
    </div>

    @if (panelOpen()) {
      <div role="tabpanel" class="vdocs:flex vdocs:min-w-0 vdocs:flex-1 vdocs:flex-col vdocs:overflow-y-auto vdocs:px-4 vdocs:pt-3 vdocs:pb-4 vdocs:text-white">
        @if (!envelope() && !query.isPending()) {
          <div class="vdocs:text-sm">Unable to load envelope. Please try again later.</div>
        }

        @if (envelope(); as envelope) {
          @if (activeTab() === 0) {
            <div class="vdocs:mb-3 vdocs:truncate vdocs:text-base">Details</div>
            @for (field of detailFields(); track field.label) {
              <div class="vdocs:truncate vdocs:text-xs vdocs:text-white/55">{{ field.label }}</div>
              <div class="vdocs:mb-3.5 vdocs:truncate vdocs:text-sm vdocs:font-medium">{{ field.value }}</div>
            }
          }

          @if (activeTab() === 1) {
            <div class="vdocs:mb-3 vdocs:truncate vdocs:text-base">Recipients</div>

            @for (recipient of sortedRecipients(); track recipient.role_name) {
              <div class="vdocs:mb-4 vdocs:border vdocs:border-solid vdocs:border-edge vdocs:p-2 vdocs:text-sm">
                <div class="vdocs:mb-1 vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-1.5">
                  <div class="vdocs:flex vdocs:size-6 vdocs:shrink-0 vdocs:items-center vdocs:justify-center vdocs:rounded-full vdocs:border vdocs:border-solid vdocs:border-edge vdocs:text-sm vdocs:font-medium">
                    {{ $index + 1 }}
                  </div>
                  <div class="vdocs:min-w-0 vdocs:flex-1 vdocs:truncate vdocs:capitalize">
                    {{ displayRoleName(recipient) }}
                  </div>
                  <div [class]="chipClasses(recipient.status)">{{ recipient.status }}</div>
                  @if (isOwner() && !functionsDisabled()) {
                    <verdocs-dropdown [options]="recipientMenuOptions(recipient)" (optionSelected)="onRecipientAction(recipient, $event)" />
                  }
                </div>

                <div class="vdocs:flex vdocs:flex-col">
                  <div class="vdocs:truncate">{{ fullName(recipient) }}</div>
                  <div class="vdocs:truncate">{{ recipient.email }}</div>
                  @if (recipient.phone) {
                    <div class="vdocs:truncate">{{ recipient.phone }}</div>
                  }
                </div>
              </div>
            }

            @if (isOwner()) {
              <div class="vdocs:mt-1 vdocs:mb-7">
                <div class="vdocs:flex vdocs:flex-row vdocs:items-center">
                  <div class="vdocs:flex vdocs:flex-1 vdocs:text-sm">Reminders</div>
                  <verdocs-switch
                    ariaLabel="Reminders"
                    [checked]="remindersEnabled()"
                    [disabled]="functionsDisabled() || updatingReminders()"
                    (checkedChange)="toggleReminders()" />
                </div>

                @if (remindersEnabled()) {
                  <div class="vdocs:mt-2 vdocs:text-sm">NOTE: Reminders will only be sent for up to 14 days.</div>
                  <div class="vdocs:mt-2 vdocs:flex vdocs:flex-row vdocs:items-center">
                    <div class="vdocs:flex-1 vdocs:text-sm">Initial Reminder (days):</div>
                    <verdocs-text-input
                      placeholder="In days..."
                      class="vdocs:w-[100px] vdocs:[&_label]:mb-0"
                      [disabled]="functionsDisabled() || updatingReminders()"
                      [value]="initialDays()"
                      (valueChange)="initialDaysEdit.set($event)"
                      (blurred)="commitReminders()" />
                  </div>
                  <div class="vdocs:mt-2 vdocs:flex vdocs:flex-row vdocs:items-center">
                    <div class="vdocs:flex-1 vdocs:text-sm">Follow-up Reminders (days):</div>
                    <verdocs-text-input
                      placeholder="In days..."
                      class="vdocs:w-[100px] vdocs:[&_label]:mb-0"
                      [disabled]="functionsDisabled() || updatingReminders()"
                      [value]="followupDays()"
                      (valueChange)="followupDaysEdit.set($event)"
                      (blurred)="commitReminders()" />
                  </div>
                  <div class="vdocs:mt-2 vdocs:flex vdocs:flex-row vdocs:text-sm">
                    <div class="vdocs:flex-1">Next Reminder:</div>
                    <div class="vdocs:text-white/85">{{ nextReminder() }}</div>
                  </div>
                }
              </div>

              <verdocs-button
                label="Cancel Envelope"
                class="vdocs:w-full"
                [disabled]="functionsDisabled() || canceling()"
                (click)="showCancelDialog.set(true)" />
            }
          }

          @if (activeTab() === 2) {
            <div class="vdocs:mb-1 vdocs:truncate vdocs:text-base">History</div>
            @for (entry of historyEntries(); track $index) {
              <div
                [class]="
                  'vdocs:mt-2 vdocs:flex vdocs:flex-row vdocs:items-center vdocs:pt-2 '
                  + ($index > 0 ? 'vdocs:border-0 vdocs:border-t vdocs:border-solid vdocs:border-white/25' : '')
                ">
                <verdocs-envelope-history-icon [name]="entry.icon" class="vdocs:mr-3.5 vdocs:shrink-0" />
                <div class="vdocs:min-w-0">
                  <div class="vdocs:mb-1 vdocs:text-sm">{{ entry.message }}</div>
                  <div class="vdocs:text-xs vdocs:text-white/55">{{ formatTimestamp(entry.date) }}</div>
                </div>
              </div>
            }
          }
        }
      </div>
    }

    @if (showCancelDialog()) {
      <verdocs-ok-dialog
        heading="Cancel Envelope?"
        message="Are you sure you want to cancel this Envelope? This action cannot be undone."
        [showCancel]="true"
        (ok)="confirmCancel()"
        (cancel)="showCancelDialog.set(false)" />
    }

    @if (reinviteRole()) {
      <verdocs-ok-dialog
        heading="Re-invite Recipient?"
        message='This will reset the recipient&apos;s KBA status and send a new signing invitation. If you just want to send a reminder, please click "Send Reminder" instead.'
        [showCancel]="true"
        (ok)="confirmReinvite()"
        (cancel)="reinviteRole.set('')" />
    }

    @if (updateRole(); as role) {
      <verdocs-envelope-update-recipient
        [endpoint]="endpoint()"
        [envelopeId]="envelopeId()"
        [roleName]="role"
        (updated)="onRecipientUpdated()"
        (cancel)="updateRole.set('')"
        (sdkError)="sdkError.emit($event)" />
    }
  `,
})
export class VerdocsEnvelopeSidebarComponent {
  /** Endpoint override for dual-session scenarios. Defaults to the provided endpoint. */
  readonly endpoint = input<VerdocsEndpoint>();
  /** The envelope to render. */
  readonly envelopeId = input.required<string>();

  /** Emitted when the panel is opened or closed, with the new open state. */
  readonly toggle = output<boolean>();
  /**
   * Emitted when the envelope is updated in any way (reminder sent, recipient
   * reset or updated, envelope canceled). May be used for tasks such as cache
   * invalidation or reporting to other systems.
   */
  readonly envelopeUpdated = output<IEnvelopeUpdatedEvent>();
  /**
   * Emitted when the user selects Get In-Person Link for a recipient. The host
   * should display its in-person signing link flow for that recipient.
   */
  readonly getInPersonLink = output<IEnvelopeRecipientEvent>();
  /** Emitted if an error occurs, with information about the error. */
  readonly sdkError = output<SDKError>();

  private readonly injectedEndpoint = inject(VERDOCS_ENDPOINT, { optional: true });
  private readonly envelopesService = inject(VerdocsEnvelopesService);

  protected readonly tabs = TABS;

  protected readonly query = this.envelopesService.envelope(this.envelopeId, this.endpoint);
  protected readonly envelope = computed(() => this.query.data());

  protected readonly profile = signal<IProfile | null>(null);

  protected readonly activeTab = signal(0);
  protected readonly panelOpen = signal(false);
  protected readonly showCancelDialog = signal(false);
  protected readonly reinviteRole = signal('');
  protected readonly updateRole = signal('');

  // Edit buffers for the reminder inputs: null means untouched, so the fields
  // track the envelope until the user types, and commits happen on blur.
  protected readonly initialDaysEdit = signal<string | null>(null);
  protected readonly followupDaysEdit = signal<string | null>(null);

  protected readonly canceling = signal(false);
  protected readonly updatingReminders = signal(false);

  protected readonly hostClasses = computed(
    () =>
      'vdocs:box-border vdocs:flex vdocs:h-full vdocs:min-h-[400px] vdocs:flex-row vdocs:overflow-hidden vdocs:bg-[#41435e] vdocs:font-sans vdocs:transition-[width] vdocs:duration-500 ' +
      (this.panelOpen() ? 'vdocs:w-[400px] vdocs:max-[500px]:w-[300px]' : 'vdocs:w-14'),
  );

  protected readonly isOwner = computed(() => {
    const envelope = this.envelope();
    return !!envelope && userIsEnvelopeOwner(this.profile(), envelope);
  });

  protected readonly functionsDisabled = computed(() => {
    const envelope = this.envelope();
    return !!envelope && envelope.status !== 'pending' && envelope.status !== 'in progress';
  });

  private readonly recipientsWithActions = computed(() => {
    const envelope = this.envelope();
    return envelope ? getRecipientsWithActions(envelope) : [];
  });

  protected readonly sortedRecipients = computed(() =>
    [ ...this.envelope()?.recipients ?? [] ].sort((a, b) =>
      (a.sequence === b.sequence ? a.order - b.order : a.sequence - b.sequence)));

  protected readonly historyEntries = computed(() => {
    const envelope = this.envelope();
    return envelope ? prepareHistoryEntries(envelope) : [];
  });

  protected readonly detailFields = computed(() => {
    const envelope = this.envelope();
    if (!envelope) {
      return [];
    }

    return [
      { label: 'Envelope ID', value: envelope.id },
      { label: 'Date Created', value: timestampFormatter.format(new Date(envelope.created_at)) },
      { label: 'Last Modified', value: timestampFormatter.format(new Date(envelope.updated_at)) },
      { label: 'Status', value: capitalize(envelope.status) },
      { label: 'Owner ID', value: envelope.profile_id },
      { label: 'Owner Name', value: formatFullName(envelope.profile) },
      { label: 'Owner Email', value: envelope.profile?.email ?? '' },
    ];
  });

  protected readonly remindersEnabled = computed(() => !!this.envelope()?.initial_reminder);

  protected readonly initialDays = computed(() =>
    this.initialDaysEdit() ?? String(Math.floor((this.envelope()?.initial_reminder ?? 0) / MS_PER_DAY)));

  protected readonly followupDays = computed(() =>
    this.followupDaysEdit() ?? String(Math.floor((this.envelope()?.followup_reminders ?? 0) / MS_PER_DAY)));

  protected readonly nextReminder = computed(() => {
    const next = this.envelope()?.next_reminder;
    return next ? reminderFormatter.format(new Date(next)) : 'None';
  });

  constructor() {
    effect(onCleanup => {
      const endpoint = this.resolvedEndpoint();
      const unsubscribe = endpoint.onSessionChanged((_endpoint, _session, profile) => this.profile.set(profile));
      endpoint.loadSession();
      onCleanup(unsubscribe);
    });

    effect(() => {
      const error = this.query.error();
      if (error) {
        this.sdkError.emit(toSDKError(error));
      }
    });
  }

  private readonly resolvedEndpoint = computed(() => {
    const resolved = this.endpoint() ?? this.injectedEndpoint;
    if (!resolved) {
      throw new Error('verdocs-envelope-sidebar needs provideVerdocs() in your application providers or an explicit endpoint input');
    }

    return resolved;
  });

  protected selectTab(index: number) {
    const nextOpen = index !== this.activeTab() || !this.panelOpen();
    this.panelOpen.set(nextOpen);
    this.activeTab.set(index);
    this.toggle.emit(nextOpen);
  }

  protected chipClasses(status: TRecipientStatus) {
    return (
      'vdocs:min-w-[90px] vdocs:rounded-[5px] vdocs:px-2 vdocs:py-[3px] vdocs:text-center vdocs:text-sm vdocs:capitalize vdocs:text-white ' +
      (STATUS_CLASSES[status] ?? 'vdocs:bg-muted')
    );
  }

  protected displayRoleName(recipient: IRecipient) {
    return recipient.role_name.replace('delegated_to_', 'Delegated');
  }

  protected fullName(recipient: IRecipient) {
    return formatFullName(recipient);
  }

  protected formatTimestamp(date: Date) {
    return timestampFormatter.format(date);
  }

  private canResendRecipient(recipient: IRecipient) {
    return (
      ![ 'pending', 'declined', 'submitted', 'canceled' ].includes(recipient.status) &&
      ![ 'complete', 'declined', 'canceled' ].includes(this.envelope()?.status ?? '')
    );
  }

  protected recipientMenuOptions(recipient: IRecipient): IMenuOption[] {
    const canSendReminder = this.canResendRecipient(recipient);

    return [
      { id: 'update', label: 'Update', disabled: recipient.status === 'submitted' },
      { id: 'reminder', label: 'Send Reminder', disabled: !canSendReminder },
      { id: 'inperson', label: 'Get In-Person Link', disabled: !recipientCanAct(recipient, this.recipientsWithActions()) },
      { id: 'reinvite', label: 'Re-invite', disabled: !canSendReminder },
    ];
  }

  protected onRecipientAction(recipient: IRecipient, option: IMenuOption) {
    switch (option.id) {
      case 'update':
        this.updateRole.set(recipient.role_name);
        break;
      case 'reminder':
        // sendReminder owns its errors (it toasts on failure), so it never
        // rejects; the no-op catch just satisfies no-floating-promises.
        this.sendReminder(recipient.role_name).catch(() => undefined);
        break;
      case 'reinvite':
        this.reinviteRole.set(recipient.role_name);
        break;
      case 'inperson': {
        const envelope = this.envelope();
        if (envelope) {
          this.getInPersonLink.emit({ endpoint: this.resolvedEndpoint(), envelope, recipient });
        }
        break;
      }
      default:
        break;
    }
  }

  private emitEnvelopeUpdated(event: string, envelope?: IEnvelope) {
    const current = envelope ?? this.envelope();
    if (current) {
      this.envelopeUpdated.emit({ endpoint: this.resolvedEndpoint(), envelope: current, event });
    }
  }

  private async sendReminder(roleName: string) {
    // Snapshot before the mutation refreshes the query, so the emitted
    // envelope matches what the user acted on (as in React).
    const envelope = this.envelope();
    try {
      await this.envelopesService.remindRecipient(this.envelopeId(), roleName, this.endpoint());
      showToast('Reminder Sent', { style: 'success' });
      this.emitEnvelopeUpdated('reminder', envelope);
    } catch (error) {
      showToast(`Error sending reminder: ${(error as Error).message}`, { style: 'error' });
    }
  }

  protected async confirmReinvite() {
    const roleName = this.reinviteRole();
    this.reinviteRole.set('');

    const envelope = this.envelope();
    try {
      await this.envelopesService.resetRecipient(this.envelopeId(), roleName, this.endpoint());
      showToast('Recipient Reset', { style: 'success' });
      this.emitEnvelopeUpdated('reinvite', envelope);
    } catch (error) {
      showToast(`Error resetting recipient: ${(error as Error).message}`, { style: 'error' });
    }
  }

  protected async confirmCancel() {
    this.showCancelDialog.set(false);

    const envelope = this.envelope();
    this.canceling.set(true);
    try {
      await this.envelopesService.cancelEnvelope(this.envelopeId(), this.endpoint());
      showToast('Envelope canceled', { style: 'success' });
      this.panelOpen.set(false);
      if (envelope) {
        this.emitEnvelopeUpdated('canceled', { ...envelope, status: 'canceled' });
      }
    } catch (error) {
      showToast(`Error canceling envelope: ${(error as Error).message}`, { style: 'error' });
    } finally {
      this.canceling.set(false);
    }
  }

  protected toggleReminders() {
    // updateReminders owns its errors (toasts on failure), so these never
    // reject; the no-op catch satisfies no-floating-promises.
    if (this.remindersEnabled()) {
      this.updateReminders({ initial_reminder: null, followup_reminders: null }).catch(() => undefined);
    } else {
      this.updateReminders({ initial_reminder: MS_PER_DAY, followup_reminders: 3 * MS_PER_DAY }).catch(() => undefined);
    }
  }

  protected commitReminders() {
    // Blur fires whether or not the user typed anything; only commit edits.
    if (this.initialDaysEdit() === null && this.followupDaysEdit() === null) {
      return;
    }

    this.updateReminders({
      initial_reminder: Number(this.initialDays()) * MS_PER_DAY,
      followup_reminders: Number(this.followupDays()) * MS_PER_DAY,
    }).catch(() => undefined);
  }

  private async updateReminders(params: { initial_reminder: number | null; followup_reminders: number | null }) {
    this.updatingReminders.set(true);
    try {
      await this.envelopesService.updateEnvelope(this.envelopeId(), params, this.endpoint());
    } catch (error) {
      showToast(`Error updating reminders: ${(error as Error).message}`, { style: 'error' });
    } finally {
      this.initialDaysEdit.set(null);
      this.followupDaysEdit.set(null);
      this.updatingReminders.set(false);
    }
  }

  protected onRecipientUpdated() {
    this.updateRole.set('');
    this.emitEnvelopeUpdated('update');
  }
}
