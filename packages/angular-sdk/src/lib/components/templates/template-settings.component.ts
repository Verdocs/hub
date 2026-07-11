import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import type { ITemplateCreateParams, TTemplateSender, TTemplateVisibility, VerdocsEndpoint } from '@verdocs/js-sdk';
import { VerdocsSelectInputComponent, type ISelectOption } from '../../controls/select-input.component';
import { VerdocsComponentErrorComponent } from '../../controls/component-error.component';
import { toSDKError, VerdocsTemplateDetailService } from '../../template-detail.service';
import { VerdocsTextInputComponent } from '../../controls/text-input.component';
import { VerdocsButtonComponent } from '../../controls/button.component';
import { VerdocsSwitchComponent } from '../../controls/switch.component';
import { SDKError, type ITemplateEvent } from '../../types';
import { VERDOCS_ENDPOINT } from '../../provide-verdocs';
import { showToast } from '../../toast';

// The server stores reminder delays in milliseconds; the form edits them in days.
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const VisibilityOptions: ISelectOption[] = [
  { value: 'private', label: 'Private' },
  { value: 'shared', label: 'Shared' },
  { value: 'public', label: 'Public' },
];

const SenderOptions: ISelectOption[] = [
  { value: 'envelope_creator', label: 'Envelope Creator' },
  { value: 'template_owner', label: 'Template Owner' },
];

/**
 * Pending form edits, layered over the server copy of the template. An empty
 * object means the form is clean.
 */
interface ITemplateSettingsEdits {
  name?: string;
  visibility?: TTemplateVisibility;
  sender?: TTemplateSender;
  sendReminders?: boolean;
  initialReminderDays?: number;
  followupReminderDays?: number;
}

/**
 * Display an edit form for a template's basic settings: name, visibility,
 * envelope ownership, and signing reminders. Values load from the template
 * detail query and save through a single update call. React's
 * onSettingsChanged/onCancel/onSdkError callbacks are this component's
 * settingsChanged, cancel, and sdkError outputs.
 */
@Component({
  selector: 'verdocs-template-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    VerdocsButtonComponent,
    VerdocsComponentErrorComponent,
    VerdocsSelectInputComponent,
    VerdocsSwitchComponent,
    VerdocsTextInputComponent,
  ],
  host: { '[style.display]': `'block'` },
  template: `
    @if (query.error()) {
      <verdocs-component-error message="Unable to load this template. Please try again later." />
    } @else if (!query.data()) {
      <div class="vdocs:max-w-[600px] vdocs:p-3">
        @for (placeholder of placeholders; track placeholder) {
          <div class="vdocs:h-10 vdocs:my-2.5 vdocs:rounded-ctl vdocs:bg-canvas vdocs:animate-pulse"></div>
        }
      </div>
    } @else {
      <form
        autocomplete="off"
        class="vdocs:flex vdocs:flex-col vdocs:max-w-[600px] vdocs:p-3 vdocs:bg-canvas vdocs:font-sans vdocs:text-ink"
        (submit)="$event.preventDefault()">
        <h5 class="vdocs:text-base vdocs:font-bold vdocs:text-muted vdocs:m-0 vdocs:mb-2.5">Settings</h5>

        <div class="vdocs:mt-5">
          <verdocs-text-input
            label="Template Name"
            autocomplete="off"
            placeholder="Template Name..."
            [value]="name()"
            (valueChange)="setEdit({ name: $event })" />
        </div>

        <div class="vdocs:mt-5">
          <verdocs-select-input
            label="Visibility"
            [options]="visibilityOptions"
            [value]="visibility()"
            (valueChange)="onVisibilityChange($event)" />
        </div>

        <div class="vdocs:mt-5">
          <verdocs-select-input
            label="Owner for envelopes created from this template"
            [options]="senderOptions"
            [value]="sender() || ''"
            (valueChange)="onSenderChange($event)" />
        </div>

        <div class="vdocs:mt-5">
          <verdocs-switch label="Send Reminders" [checked]="sendReminders()" (checkedChange)="setEdit({ sendReminders: $event })" />
        </div>

        @if (sendReminders()) {
          <div class="vdocs:mt-5">
            <verdocs-text-input
              label="First Reminder (days)"
              type="number"
              autocomplete="off"
              placeholder="Delay in days..."
              [value]="String(initialReminderDays())"
              (valueChange)="setEdit({ initialReminderDays: toDays($event) })" />
          </div>

          <div class="vdocs:mt-5">
            <verdocs-text-input
              label="Follow-up Reminders (days)"
              type="number"
              autocomplete="off"
              placeholder="Delay in days..."
              [value]="String(followupReminderDays())"
              (valueChange)="setEdit({ followupReminderDays: toDays($event) })" />
          </div>
        }

        <div class="vdocs:flex vdocs:flex-row vdocs:gap-2 vdocs:mt-4">
          <verdocs-button variant="outline" label="Cancel" size="small" (click)="cancel.emit()" />
          <verdocs-button label="Save" size="small" [disabled]="!dirty() || pending()" (click)="save()" />
        </div>
      </form>
    }
  `,
})
export class VerdocsTemplateSettingsComponent {
  /** Endpoint override for dual-session scenarios. Defaults to the provided endpoint. */
  readonly endpoint = input<VerdocsEndpoint>();
  /** The template ID to edit. */
  readonly templateId = input.required<string>();

  /** Emitted after the settings are saved successfully, with the updated template. */
  readonly settingsChanged = output<ITemplateEvent>();
  /** Emitted when the user clicks Cancel. */
  readonly cancel = output<void>();
  /** Emitted if an error occurs, with information about the error. */
  readonly sdkError = output<SDKError>();

  private readonly injectedEndpoint = inject(VERDOCS_ENDPOINT, { optional: true });
  private readonly detailService = inject(VerdocsTemplateDetailService);

  protected readonly query = this.detailService.template(this.templateId, this.endpoint);

  protected readonly visibilityOptions = VisibilityOptions;
  protected readonly senderOptions = SenderOptions;
  protected readonly placeholders = [ 0, 1, 2, 3, 4 ];
  protected readonly String = String;

  private readonly edits = signal<ITemplateSettingsEdits>({});
  protected readonly dirty = computed(() => Object.keys(this.edits()).length > 0);
  protected readonly pending = signal(false);

  // The template is the source of truth; edits overlay it until they are saved
  // (the mutation primes the query with the server's copy, so clearing the
  // edits after a save leaves the form showing exactly what was stored).
  protected readonly name = computed(() => this.edits().name ?? this.query.data()?.name ?? '');
  protected readonly visibility = computed(() => this.edits().visibility ?? this.query.data()?.visibility ?? 'private');
  protected readonly sender = computed(() => this.edits().sender ?? this.query.data()?.sender);
  protected readonly sendReminders = computed(() => this.edits().sendReminders ?? !!this.query.data()?.initial_reminder);
  protected readonly initialReminderDays = computed(() => {
    const stored = this.query.data()?.initial_reminder;
    return this.edits().initialReminderDays ?? (stored ? Math.floor(stored / MS_PER_DAY) : 0);
  });

  protected readonly followupReminderDays = computed(() => {
    const stored = this.query.data()?.followup_reminders;
    return this.edits().followupReminderDays ?? (stored ? Math.floor(stored / MS_PER_DAY) : 0);
  });

  constructor() {
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
      throw new Error('verdocs-template-settings needs provideVerdocs() in your application providers or an explicit endpoint input');
    }

    return resolved;
  });

  protected setEdit(edit: ITemplateSettingsEdits) {
    this.edits.update(previous => ({ ...previous, ...edit }));
  }

  protected onVisibilityChange(value: string) {
    this.setEdit({ visibility: value as TTemplateVisibility });
  }

  protected onSenderChange(value: string) {
    this.setEdit({ sender: value as TTemplateSender });
  }

  protected toDays(value: string) {
    return Math.max(0, Math.floor(+value || 0));
  }

  protected async save() {
    const sendReminders = this.sendReminders();

    // The create/update params type declares the reminder fields as numbers, but
    // the API uses null to disable reminders (and the legacy component sent null),
    // so we cast to keep the wire payload identical.
    const params = {
      name: this.name(),
      visibility: this.visibility(),
      sender: this.sender(),
      initial_reminder: sendReminders ? this.initialReminderDays() * MS_PER_DAY : null,
      followup_reminders: sendReminders ? this.followupReminderDays() * MS_PER_DAY : null,
    } as Partial<ITemplateCreateParams>;

    this.pending.set(true);
    try {
      const updated = await this.detailService.updateTemplate(this.templateId(), params, this.endpoint());
      this.edits.set({});
      this.settingsChanged.emit({ endpoint: this.resolvedEndpoint(), template: updated });
    } catch (error) {
      const details = error as Error & { response?: { data?: { error?: string } } };
      this.sdkError.emit(toSDKError(error));
      showToast(details.response?.data?.error || 'Error updating template, please try again later.', { style: 'error' });
    } finally {
      this.pending.set(false);
    }
  }
}
