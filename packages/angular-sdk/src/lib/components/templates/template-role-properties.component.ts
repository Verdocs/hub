import { isValidEmail } from '@verdocs/js-sdk';
import type { IRole, TRecipientType, VerdocsEndpoint } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { VerdocsSelectInputComponent, type ISelectOption } from '../../controls/select-input.component';
import { toSDKError, VerdocsTemplateDetailService } from '../../template-detail.service';
import { VerdocsTextInputComponent } from '../../controls/text-input.component';
import { VerdocsHelpIconComponent } from '../../controls/help-icon.component';
import { VerdocsCheckboxComponent } from '../../controls/checkbox.component';
import { VerdocsButtonComponent } from '../../controls/button.component';
import type { SDKError } from '../../types';

const TypeOptions: ISelectOption[] = [
  { label: 'Signer', value: 'signer' },
  { label: 'CC', value: 'cc' },
  { label: 'Approver', value: 'approver' },
];

/** Pending form edits, layered over the role input. An empty object means the form is clean. */
interface IRoleEdits {
  name?: string;
  type?: TRecipientType;
  sequence?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  delegator?: boolean;
}

/**
 * An editing panel for a single template role: its name, type, signing
 * sequence, default contact info, and delegation setting. Typically composed
 * by VerdocsTemplateRolesComponent, but it can be hosted anywhere a role and
 * template ID are in hand. React's onClose/onDelete/onSdkError callbacks are
 * this component's closed, deleted, and sdkError outputs.
 */
@Component({
  selector: 'verdocs-template-role-properties',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    VerdocsButtonComponent,
    VerdocsCheckboxComponent,
    VerdocsHelpIconComponent,
    VerdocsSelectInputComponent,
    VerdocsTextInputComponent,
  ],
  host: { '[style.display]': `'block'` },
  template: `
    <form
      autocomplete="off"
      class="vdocs:box-border vdocs:flex vdocs:w-80 vdocs:flex-col vdocs:gap-[15px] vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-surface vdocs:p-5 vdocs:font-sans vdocs:text-ink vdocs:shadow-lg"
      (submit)="$event.preventDefault()">
      <div>
        <verdocs-text-input
          label="Role Name (Must be unique)"
          autocomplete="off"
          placeholder="Role Name..."
          class="vdocs:[&_label]:mb-0"
          [value]="name()"
          [disabled]="hasFields()"
          (valueChange)="setEdit({ name: $event })" />
        @if (hasFields()) {
          <div class="vdocs:mt-[7px] vdocs:text-xs vdocs:italic">This role has fields assigned and can no longer be renamed.</div>
        }
      </div>

      <verdocs-select-input
        label="Type"
        class="vdocs:[&_label]:mb-0"
        [options]="typeOptions"
        [value]="type()"
        (valueChange)="onTypeChange($event)" />

      <verdocs-text-input
        label="Sequence"
        type="number"
        autocomplete="off"
        class="vdocs:[&_label]:mb-0"
        description="Roles sharing a sequence number act in parallel; higher numbers act later."
        [value]="String(sequence())"
        (valueChange)="setEdit({ sequence: toSequence($event) })" />

      <div>
        <div class="vdocs:mb-1 vdocs:text-sm vdocs:font-bold vdocs:text-muted">Default Contact Info:</div>

        <div class="vdocs:flex vdocs:flex-row vdocs:gap-[15px]">
          <verdocs-text-input
            autocomplete="off"
            placeholder="First..."
            class="vdocs:flex-1 vdocs:[&_label]:mb-0"
            [value]="firstName()"
            (valueChange)="setEdit({ first_name: $event })" />

          <verdocs-text-input
            autocomplete="off"
            placeholder="Last..."
            class="vdocs:flex-1 vdocs:[&_label]:mb-0"
            [value]="lastName()"
            (valueChange)="setEdit({ last_name: $event })" />
        </div>
      </div>

      <verdocs-text-input
        autocomplete="off"
        placeholder="Email Address..."
        class="vdocs:[&_label]:mb-0"
        [value]="email()"
        (valueChange)="setEdit({ email: $event })" />

      <verdocs-text-input
        autocomplete="off"
        placeholder="Phone Number..."
        class="vdocs:[&_label]:mb-0"
        [value]="phone()"
        (valueChange)="setEdit({ phone: $event })" />

      <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-2">
        <verdocs-checkbox label="May Delegate" [checked]="delegator()" (checkedChange)="setEdit({ delegator: $event })" />
        <verdocs-help-icon text="If enabled, this recipient may delegate their actions to another individual." />
      </div>

      <div class="vdocs:mt-2.5 vdocs:flex vdocs:flex-row vdocs:items-center vdocs:justify-between">
        <button
          type="button"
          aria-label="Delete Role"
          [disabled]="dirty() || deletePending()"
          (click)="onDelete()"
          class="vdocs:flex vdocs:h-[34px] vdocs:cursor-pointer vdocs:items-center vdocs:justify-center vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-transparent vdocs:px-1.5 vdocs:text-danger vdocs:active:bg-canvas vdocs:disabled:cursor-default vdocs:disabled:text-disabled">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" class="vdocs:size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>

        <verdocs-button size="small" label="Save" [disabled]="!dirty() || !isValid() || savePending()" (click)="onSave()" />
      </div>
    </form>
  `,
})
export class VerdocsTemplateRolePropertiesComponent {
  /** Endpoint override for dual-session scenarios. Defaults to the provided endpoint. */
  readonly endpoint = input<VerdocsEndpoint>();
  /** The template ID the role belongs to. */
  readonly templateId = input.required<string>();
  /** The role to edit. */
  readonly role = input.required<IRole>();

  /** Emitted when the panel should close, after a save or when the user dismisses it. */
  readonly closed = output<void>();
  /**
   * Emitted when the user deletes the role. The role has already been deleted
   * server-side when this fires; the parent should update its UI to match.
   */
  readonly deleted = output<{ templateId: string; roleName: string }>();
  /** Emitted if an error occurs, with information about the error. */
  readonly sdkError = output<SDKError>();

  private readonly detailService = inject(VerdocsTemplateDetailService);

  // Only needed to know whether fields reference this role; roles are renameable
  // until fields point at them by name.
  protected readonly query = this.detailService.template(this.templateId, this.endpoint);

  protected readonly typeOptions = TypeOptions;
  protected readonly String = String;

  private readonly edits = signal<IRoleEdits>({});
  protected readonly dirty = computed(() => Object.keys(this.edits()).length > 0);
  protected readonly savePending = signal(false);
  protected readonly deletePending = signal(false);

  protected readonly hasFields = computed(() =>
    (this.query.data()?.fields || []).some(field => field.role_name === this.role().name));

  protected readonly name = computed(() => this.edits().name ?? this.role().name);
  protected readonly type = computed(() => this.edits().type ?? this.role().type);
  protected readonly sequence = computed(() => this.edits().sequence ?? this.role().sequence);
  protected readonly firstName = computed(() => this.edits().first_name ?? this.role().first_name ?? '');
  protected readonly lastName = computed(() => this.edits().last_name ?? this.role().last_name ?? '');
  protected readonly email = computed(() => this.edits().email ?? this.role().email ?? '');
  protected readonly phone = computed(() => this.edits().phone ?? this.role().phone ?? '');
  protected readonly delegator = computed(() => this.edits().delegator ?? this.role().delegator ?? false);

  // Contact info is all-or-nothing: leave it blank to fill in at send time, or
  // supply a complete first/last/email set for a "known" role.
  protected readonly isValid = computed(() => {
    const email = this.email();
    const firstName = this.firstName();
    const lastName = this.lastName();
    return (!email && !firstName && !lastName) || (isValidEmail(email) && !!firstName && !!lastName);
  });

  protected setEdit(edit: IRoleEdits) {
    this.edits.update(previous => ({ ...previous, ...edit }));
  }

  protected onTypeChange(value: string) {
    this.setEdit({ type: value as TRecipientType });
  }

  protected toSequence(value: string) {
    return Math.max(1, Math.floor(+value || 1));
  }

  protected async onSave() {
    this.savePending.set(true);
    try {
      await this.detailService.updateRole(
        this.templateId(),
        this.role().name,
        {
          name: this.name(),
          type: this.type(),
          sequence: this.sequence(),
          first_name: this.firstName(),
          last_name: this.lastName(),
          email: this.email(),
          phone: this.phone(),
          delegator: this.delegator(),
        },
        this.endpoint(),
      );
      this.edits.set({});
      this.closed.emit();
    } catch (error) {
      this.sdkError.emit(toSDKError(error));
    } finally {
      this.savePending.set(false);
    }
  }

  protected async onDelete() {
    if (!window.confirm('Are you sure you wish to remove this role? All associated fields will be removed as well. This action cannot be undone.')) {
      return;
    }

    this.deletePending.set(true);
    try {
      const roleName = this.role().name;
      await this.detailService.deleteRole(this.templateId(), roleName, this.endpoint());
      this.deleted.emit({ templateId: this.templateId(), roleName });
      this.closed.emit();
    } catch (error) {
      this.sdkError.emit(toSDKError(error));
    } finally {
      this.deletePending.set(false);
    }
  }
}
