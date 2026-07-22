import type { IDropdownOption, ITemplateField, VerdocsEndpoint } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, linkedSignal, output, signal } from '@angular/core';
import { toSDKError, VerdocsTemplateDetailService } from '../../template-detail.service';
import { VerdocsSelectInputComponent } from '../../controls/select-input.component';
import { VerdocsTextInputComponent } from '../../controls/text-input.component';
import { VerdocsCheckboxComponent } from '../../controls/checkbox.component';
import { VerdocsButtonComponent } from '../../controls/button.component';
import { VerdocsLoaderComponent } from '../../controls/loader.component';
import type { SDKError } from '../../types';
import { showToast } from '../../toast';

const PANEL_CLASSES = 'vdocs:box-border vdocs:w-80 vdocs:p-5 vdocs:rounded-ctl vdocs:bg-surface vdocs:border vdocs:border-solid ' +
  'vdocs:border-edge-light vdocs:shadow-[2px_2px_10px_0_rgba(0,0,0,0.12)] vdocs:font-sans vdocs:text-ink';

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const isFilledOption = (option: IDropdownOption) => option.id.trim() !== '' || option.label.trim() !== '';

// The options grid always ends with one blank row so there is somewhere to type
// a new entry, mirroring the legacy cleanupOptions behavior.
const withBlankRow = (options: IDropdownOption[]): IDropdownOption[] => [ ...options.filter(isFilledOption), { id: '', label: '' } ];

/**
 * Pending form edits, layered over the loaded field. An empty object means the
 * form is clean; the React port seeds separate draft state instead, but the
 * observable behavior (values follow the field until edited, cancel restores
 * them) is identical.
 */
interface IFieldEdits {
  name?: string;
  label?: string;
  role_name?: string;
  required?: boolean;
  readonly?: boolean;
  group?: string;
  placeholder?: string;
  default?: string;
  options?: IDropdownOption[];
}

/**
 * An edit panel for one template field's settings: name, label, role, required
 * and read-only flags, plus per-type extras (default value and placeholder for
 * text fields, the exclusive-selection group for radio buttons, the options
 * grid for dropdowns). Saves and deletes go through the template structure
 * mutations, so the template's detail queries refresh before settingsChanged
 * or deleted fire. React's onClose/onDelete/onSettingsChanged/onSdkError
 * callbacks are this component's closed, deleted, settingsChanged, and
 * sdkError outputs.
 *
 * The legacy component emitted a role name in its delete event, a leftover
 * from the role properties panel; the port reports the deleted field's name.
 */
@Component({
  selector: 'verdocs-template-field-properties',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    VerdocsButtonComponent,
    VerdocsCheckboxComponent,
    VerdocsLoaderComponent,
    VerdocsSelectInputComponent,
    VerdocsTextInputComponent,
  ],
  host: { '[style.display]': `'block'` },
  template: `
    @if (query.isPending()) {
      <div class="${PANEL_CLASSES} vdocs:relative vdocs:min-h-40">
        <verdocs-loader />
      </div>
    } @else if (field(); as field) {
      @if (helpText() && showingHelp()) {
        <div class="${PANEL_CLASSES}">
          <h6 class="vdocs:flex vdocs:items-center vdocs:m-0 vdocs:mb-2 vdocs:text-base vdocs:font-bold vdocs:text-ink">
            {{ title() }}
            <span class="vdocs:flex-1"></span>
            <button
              type="button"
              aria-label="Hide help"
              (click)="showingHelp.set(false)"
              class="vdocs:bg-transparent vdocs:border-none vdocs:p-0 vdocs:cursor-pointer vdocs:text-ink vdocs:opacity-50 vdocs:hover:opacity-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="vdocs:size-6" aria-hidden="true">
                <path d="M11.925 18q.55 0 .938-.387.387-.388.387-.938 0-.55-.387-.925-.388-.375-.938-.375-.55 0-.925.375t-.375.925q0 .55.375.938.375.387.925.387Zm-.95-3.85h1.95q0-.8.2-1.287.2-.488 1.025-1.288.65-.625 1.025-1.213.375-.587.375-1.437 0-1.425-1.025-2.175Q13.5 6 12.1 6q-1.425 0-2.35.775t-1.275 1.85l1.775.7q.125-.45.55-.975.425-.525 1.275-.525.725 0 1.1.412.375.413.375.888 0 .475-.287.9-.288.425-.713.775-1.075.95-1.325 1.475-.25.525-.25 1.875ZM12 22.2q-2.125 0-3.988-.8-1.862-.8-3.237-2.175Q3.4 17.85 2.6 15.988 1.8 14.125 1.8 12t.8-3.988q.8-1.862 2.175-3.237Q6.15 3.4 8.012 2.6 9.875 1.8 12 1.8t3.988.8q1.862.8 3.237 2.175Q20.6 6.15 21.4 8.012q.8 1.863.8 3.988t-.8 3.988q-.8 1.862-2.175 3.237Q17.85 20.6 15.988 21.4q-1.863.8-3.988.8Zm0-2.275q3.325 0 5.625-2.3t2.3-5.625q0-3.325-2.3-5.625T12 4.075q-3.325 0-5.625 2.3T4.075 12q0 3.325 2.3 5.625t5.625 2.3ZM12 12Z" />
              </svg>
            </button>
          </h6>

          <div class="vdocs:text-sm">{{ helpText() }}</div>
        </div>
      } @else {
        <div class="${PANEL_CLASSES}">
          <h6 class="vdocs:flex vdocs:items-center vdocs:m-0 vdocs:mb-2 vdocs:text-base vdocs:font-bold vdocs:text-ink">
            {{ title() }}
            <span class="vdocs:flex-1"></span>
            @if (helpText()) {
              <button
                type="button"
                aria-label="Show help"
                (click)="showingHelp.set(true)"
                class="vdocs:bg-transparent vdocs:border-none vdocs:p-0 vdocs:cursor-pointer vdocs:text-ink vdocs:opacity-50 vdocs:hover:opacity-100">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="vdocs:size-6" aria-hidden="true">
                  <path d="M11.925 18q.55 0 .938-.387.387-.388.387-.938 0-.55-.387-.925-.388-.375-.938-.375-.55 0-.925.375t-.375.925q0 .55.375.938.375.387.925.387Zm-.95-3.85h1.95q0-.8.2-1.287.2-.488 1.025-1.288.65-.625 1.025-1.213.375-.587.375-1.437 0-1.425-1.025-2.175Q13.5 6 12.1 6q-1.425 0-2.35.775t-1.275 1.85l1.775.7q.125-.45.55-.975.425-.525 1.275-.525.725 0 1.1.412.375.413.375.888 0 .475-.287.9-.288.425-.713.775-1.075.95-1.325 1.475-.25.525-.25 1.875ZM12 22.2q-2.125 0-3.988-.8-1.862-.8-3.237-2.175Q3.4 17.85 2.6 15.988 1.8 14.125 1.8 12t.8-3.988q.8-1.862 2.175-3.237Q6.15 3.4 8.012 2.6 9.875 1.8 12 1.8t3.988.8q1.862.8 3.237 2.175Q20.6 6.15 21.4 8.012q.8 1.863.8 3.988t-.8 3.988q-.8 1.862-2.175 3.237Q17.85 20.6 15.988 21.4q-1.863.8-3.988.8Zm0-2.275q3.325 0 5.625-2.3t2.3-5.625q0-3.325-2.3-5.625T12 4.075q-3.325 0-5.625 2.3T4.075 12q0 3.325 2.3 5.625t5.625 2.3ZM12 12Z" />
                </svg>
              </button>
            }
          </h6>

          <verdocs-text-input
            label="Field Name"
            autocomplete="off"
            placeholder="Field Name..."
            [value]="name()"
            (valueChange)="setEdit({ name: $event })" />

          <verdocs-text-input
            label="Optional Label"
            autocomplete="off"
            placeholder="Optional Label..."
            [value]="label()"
            (valueChange)="setEdit({ label: $event })" />

          <verdocs-select-input label="Role" [options]="roleOptions()" [value]="roleName()" (valueChange)="setEdit({ role_name: $event })" />

          @if (isTextField()) {
            <verdocs-text-input
              label="Default Value"
              autocomplete="off"
              [placeholder]="readOnly() && !defaultValue() ? 'Default value required' : 'Pre-filled value...'"
              [value]="defaultValue()"
              (valueChange)="setEdit({ default: $event })" />
          }

          @if (field.type === 'radio') {
            <verdocs-text-input
              label="Group"
              autocomplete="off"
              placeholder="Group..."
              description="Enable exclusive selections. Only one option within the same group may be selected at a time."
              [value]="group()"
              (valueChange)="onGroupChange($event)" />
          }

          @if (isTextField()) {
            <verdocs-text-input
              label="Placeholder"
              autocomplete="off"
              placeholder="Placeholder..."
              [value]="placeholder()"
              (valueChange)="setEdit({ placeholder: $event })" />
          }

          <div class="vdocs:flex vdocs:flex-col vdocs:gap-2.5 vdocs:my-2.5">
            <verdocs-checkbox label="Required" [checked]="required()" (checkedChange)="setEdit({ required: $event })" />
            <verdocs-checkbox label="Read-only" [checked]="readOnly()" (checkedChange)="setEdit({ readonly: $event })" />
          </div>

          @if (field.type === 'dropdown') {
            <div class="vdocs:bg-canvas vdocs:rounded-ctl vdocs:p-2.5 vdocs:mt-2.5">
              <div class="vdocs:flex vdocs:gap-2 vdocs:mb-1 vdocs:text-sm vdocs:font-bold">
                <div class="vdocs:flex-1">ID</div>
                <div class="vdocs:flex-1">Label</div>
                <div class="vdocs:w-7"></div>
              </div>

              @for (option of options(); track $index) {
                <div class="vdocs:flex vdocs:items-center vdocs:gap-2 vdocs:mb-1">
                  <verdocs-text-input
                    placeholder="Unique ID"
                    class="vdocs:flex-1 vdocs:[&_label]:mb-0"
                    [value]="option.id"
                    (valueChange)="onOptionChange($index, 'id', $event)" />
                  <verdocs-text-input
                    placeholder="Display label"
                    class="vdocs:flex-1 vdocs:[&_label]:mb-0"
                    [value]="option.label"
                    (valueChange)="onOptionChange($index, 'label', $event)" />
                  <button
                    type="button"
                    [attr.aria-label]="'Remove option ' + ($index + 1)"
                    (click)="removeOption($index)"
                    class="vdocs:flex vdocs:size-7 vdocs:shrink-0 vdocs:items-center vdocs:justify-center vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-transparent vdocs:text-ink vdocs:cursor-pointer vdocs:hover:text-danger">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" class="vdocs:size-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              }
            </div>
          }

          <div class="vdocs:flex vdocs:items-center vdocs:gap-2.5 vdocs:mt-[30px]">
            <button
              type="button"
              aria-label="Delete field"
              [disabled]="dirty() || deletePending()"
              (click)="onDelete()"
              class="vdocs:flex vdocs:size-[34px] vdocs:items-center vdocs:justify-center vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-transparent vdocs:text-danger vdocs:cursor-pointer vdocs:disabled:opacity-40 vdocs:disabled:cursor-default">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" class="vdocs:size-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
            <div class="vdocs:flex-1"></div>
            <verdocs-button size="small" variant="outline" label="Cancel" [disabled]="!dirty()" (click)="onCancel()" />
            <verdocs-button size="small" label="Save" [disabled]="saveDisabled()" (click)="onSave()" />
          </div>
        </div>
      }
    }
  `,
})
export class VerdocsTemplateFieldPropertiesComponent {
  /** The ID of the template the field belongs to. */
  readonly templateId = input.required<string>();
  /** The name of the field to edit. */
  readonly fieldName = input.required<string>();
  /** If set, the panel gets a help view toggled by an icon in its header. React's ReactNode prop is this string input. */
  readonly helpText = input('');
  /** Endpoint override for dual-session scenarios. Defaults to the provided endpoint. */
  readonly endpoint = input<VerdocsEndpoint>();

  /** Emitted when the user cancels the panel, and after a successful save or delete. */
  readonly closed = output<void>();
  /** Emitted after the field has been deleted server-side. */
  readonly deleted = output<{ templateId: string; fieldName: string }>();
  /** Emitted after the field's settings have been saved, with the updated field. */
  readonly settingsChanged = output<{ fieldName: string; field: ITemplateField }>();
  /** Emitted if an error occurs, with information about the error. */
  readonly sdkError = output<SDKError>();

  private readonly detailService = inject(VerdocsTemplateDetailService);

  protected readonly query = this.detailService.template(this.templateId, this.endpoint);

  // This panel is a companion to larger experiences, so like the legacy
  // component it goes blank rather than erroring when the field is missing.
  protected readonly field = computed(() => (this.query.data()?.fields || []).find(field => field.name === this.fieldName()));

  // React keys the form by field name so a reopened panel starts clean; the
  // linked signals reset the same way when fieldName changes.
  private readonly edits = linkedSignal<string, IFieldEdits>({ source: this.fieldName, computation: () => ({}) });
  protected readonly showingHelp = linkedSignal<string, boolean>({ source: this.fieldName, computation: () => false });

  protected readonly dirty = computed(() => Object.keys(this.edits()).length > 0);
  protected readonly savePending = signal(false);
  protected readonly deletePending = signal(false);

  protected readonly title = computed(() => {
    const field = this.field();
    return field ? `${capitalize(field.type.replace(/_/g, ' '))} Settings` : '';
  });

  protected readonly isTextField = computed(() => {
    const type = this.field()?.type;
    return type === 'textbox' || type === 'textarea';
  });

  protected readonly roleOptions = computed(() =>
    (this.query.data()?.roles || []).map(role => ({ label: role.name, value: role.name })));

  protected readonly name = computed(() => this.edits().name ?? this.field()?.name ?? '');
  protected readonly label = computed(() => this.edits().label ?? this.field()?.label ?? '');
  protected readonly roleName = computed(() => this.edits().role_name ?? this.field()?.role_name ?? '');
  protected readonly required = computed(() => this.edits().required ?? !!this.field()?.required);
  protected readonly readOnly = computed(() => this.edits().readonly ?? !!this.field()?.readonly);
  protected readonly group = computed(() => this.edits().group ?? this.field()?.group ?? '');
  protected readonly placeholder = computed(() => this.edits().placeholder ?? this.field()?.placeholder ?? '');
  protected readonly defaultValue = computed(() => this.edits().default ?? this.field()?.default ?? '');
  protected readonly options = computed(() => withBlankRow(this.edits().options ?? this.field()?.options ?? []));

  private readonly filledOptions = computed(() => this.options().filter(isFilledOption));

  protected readonly saveDisabled = computed(
    () =>
      !this.dirty() ||
      this.savePending() ||
      (this.field()?.type === 'dropdown' && !this.filledOptions().length) ||
      (this.readOnly() && !this.defaultValue()));

  constructor() {
    effect(() => {
      const error = this.query.error();
      if (error) {
        this.sdkError.emit(toSDKError(error));
      }
    });
  }

  protected setEdit(edit: IFieldEdits) {
    this.edits.update(previous => ({ ...previous, ...edit }));
  }

  protected onGroupChange(value: string) {
    // Group names are normalized the way the legacy editor did it, so radio
    // buttons grouped across sessions keep matching.
    this.setEdit({
      group: (value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ''),
    });
  }

  protected onOptionChange(index: number, key: 'id' | 'label', value: string) {
    this.setEdit({ options: withBlankRow(this.options().map((option, i) => (i === index ? { ...option, [key]: value } : option))) });
  }

  protected removeOption(index: number) {
    this.setEdit({ options: withBlankRow(this.options().filter((_option, i) => i !== index)) });
  }

  protected async onSave() {
    const field = this.field();
    if (!field) {
      return;
    }

    this.savePending.set(true);
    try {
      const updated = await this.detailService.updateField(
        this.templateId(),
        field.name,
        {
          name: this.name(),
          role_name: this.roleName(),
          required: this.required(),
          readonly: this.readOnly(),
          label: this.label() || null,
          group: this.group() || null,
          placeholder: this.placeholder() || null,
          default: this.defaultValue() || null,
          options: this.filledOptions(),
        },
        this.endpoint(),
      );
      this.settingsChanged.emit({ fieldName: field.name, field: updated });
      this.closed.emit();
    } catch (error) {
      showToast('Error updating field, please try again later', { style: 'error' });
      this.sdkError.emit(toSDKError(error));
    } finally {
      this.savePending.set(false);
    }
  }

  protected async onDelete() {
    const field = this.field();
    if (!field) {
      return;
    }

    this.deletePending.set(true);
    try {
      await this.detailService.deleteField(this.templateId(), field.name, this.endpoint());
      this.deleted.emit({ templateId: this.templateId(), fieldName: field.name });
      this.closed.emit();
    } catch (error) {
      showToast('Error deleting field, please try again later', { style: 'error' });
      this.sdkError.emit(toSDKError(error));
    } finally {
      this.deletePending.set(false);
    }
  }

  protected onCancel() {
    this.edits.set({});
    this.closed.emit();
  }
}
