import { formatFullName } from '@verdocs/js-sdk';
import type { IRole, VerdocsEndpoint } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { VerdocsTemplateRolePropertiesComponent } from './template-role-properties.component';
import { VerdocsComponentErrorComponent } from '../../controls/component-error.component';
import { toSDKError, VerdocsTemplateDetailService } from '../../template-detail.service';
import { VerdocsButtonComponent } from '../../controls/button.component';
import { VerdocsPortalComponent } from '../../controls/portal.component';
import { VERDOCS_ENDPOINT } from '../../provide-verdocs';
import type { SDKError } from '../../types';

/** Payload for the rolesUpdated output fired by VerdocsTemplateRolesComponent. */
export interface IRolesUpdatedEvent {
  endpoint: VerdocsEndpoint;
  templateId: string;
  event: 'added' | 'deleted' | 'updated';
  roles: IRole[];
}

const sortRoles = (roles: IRole[]) =>
  [ ...roles ].sort((a, b) => (a.sequence === b.sequence ? a.order - b.order : a.sequence - b.sequence));

// Role names are UGC and can be anything, so the generated name has to dodge
// whatever already exists, not just count upward.
const nextRoleName = (roles: IRole[]) => {
  let nextNumber = roles.length;
  let name = '';
  do {
    nextNumber++;
    name = `Recipient ${nextNumber}`;
  } while (roles.some(role => role.name === name));

  return name;
};

/**
 * Display a template's signing workflow as sequence-ordered rows of role
 * chips. Roles at the same sequence number act in parallel; each row has an
 * add button, and a trailing row adds a new sequence step. Clicking a chip's
 * icon opens the role editor in a floating panel. React's
 * onRolesUpdated/onNext/onCancel/onSdkError callbacks are this component's
 * rolesUpdated, next, cancel, and sdkError outputs.
 */
@Component({
  selector: 'verdocs-template-roles',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    VerdocsButtonComponent,
    VerdocsComponentErrorComponent,
    VerdocsPortalComponent,
    VerdocsTemplateRolePropertiesComponent,
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
        <h5 class="vdocs:text-base vdocs:font-bold vdocs:text-muted vdocs:m-0 vdocs:mb-2.5">Roles and Workflow</h5>

        <div class="vdocs:flex vdocs:flex-col vdocs:gap-2.5 vdocs:mt-2.5">
          @for (sequence of sequences(); track sequence; let index = $index) {
            <div class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:gap-2.5 vdocs:pb-2 vdocs:font-medium vdocs:border-b vdocs:border-dotted vdocs:border-edge-light">
              <div class="vdocs:text-lg vdocs:leading-8">{{ index + 1 }}.</div>

              <div class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:gap-2.5">
                @for (role of rolesAtSequence(sequence); track role.name) {
                  <div class="vdocs:relative vdocs:box-border vdocs:flex vdocs:h-8 vdocs:max-w-[200px] vdocs:flex-col vdocs:rounded-full vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-info/10 vdocs:pl-[34px] vdocs:pr-3.5">
                    <div class="vdocs:overflow-hidden vdocs:text-sm vdocs:font-normal vdocs:leading-[30px] vdocs:whitespace-nowrap vdocs:text-ellipsis">
                      {{ chipLabel(role) }}
                    </div>

                    <!-- The legacy chips swapped the type icon for a gear on hover via CSS; we track
                         hover/focus instead so keyboard users get the same affordance. -->
                    <button
                      type="button"
                      [attr.aria-label]="'Edit role ' + role.name"
                      (mouseenter)="hoveredChip.set(role.name)"
                      (mouseleave)="hoveredChip.set(null)"
                      (focus)="hoveredChip.set(role.name)"
                      (blur)="hoveredChip.set(null)"
                      (click)="openEditor(role.name, $event)"
                      class="vdocs:absolute vdocs:left-1 vdocs:top-1 vdocs:flex vdocs:size-6 vdocs:items-center vdocs:justify-center vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:cursor-pointer vdocs:text-ink/60">
                      @if (hoveredChip() === role.name) {
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="vdocs:size-5">
                          <path fill-rule="evenodd" clip-rule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                        </svg>
                      } @else if (role.type === 'cc') {
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="vdocs:size-5 vdocs:opacity-60">
                          <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                          <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                        </svg>
                      } @else if (role.type === 'approver') {
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="vdocs:size-5 vdocs:opacity-60">
                          <path fill-rule="evenodd" clip-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" />
                        </svg>
                      } @else {
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="vdocs:size-5 vdocs:opacity-60">
                          <path d="m9.225 21.225 4.65-4.65h8.45v4.65Zm-5.35-2.2H5.05l8.5-8.5-1.175-1.175-8.5 8.5Zm14.25-9.95L13.8 4.8l1.325-1.325q.625-.65 1.525-.663.9-.012 1.6.663l1.225 1.175q.675.675.663 1.562-.013.888-.663 1.513ZM16.7 10.55 6 21.225H1.675V16.9L12.35 6.225Zm-3.725-.625-.6-.575 1.175 1.175Z" />
                        </svg>
                      }
                    </button>
                  </div>
                }
              </div>

              <button
                type="button"
                [disabled]="addPending()"
                (click)="addRole(sequence)"
                class="vdocs:h-8 vdocs:px-2.5 vdocs:rounded-full vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-transparent vdocs:cursor-pointer vdocs:opacity-40 vdocs:hover:opacity-100 vdocs:disabled:opacity-20 vdocs:disabled:cursor-default">
                + Add Role
              </button>
            </div>
          }

          <div class="vdocs:flex vdocs:flex-row vdocs:flex-wrap vdocs:gap-2.5 vdocs:pb-2 vdocs:font-medium vdocs:text-muted vdocs:border-b vdocs:border-dotted vdocs:border-edge-light">
            <div class="vdocs:text-lg vdocs:leading-8">{{ sequences().length + 1 }}.</div>

            <button
              type="button"
              [disabled]="addPending()"
              (click)="addRole(nextSequence())"
              class="vdocs:h-8 vdocs:px-2.5 vdocs:rounded-full vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-transparent vdocs:cursor-pointer vdocs:opacity-40 vdocs:hover:opacity-100 vdocs:disabled:opacity-20 vdocs:disabled:cursor-default">
              + Add Role
            </button>
          </div>
        </div>

        @if (sortedRoles().length < 1) {
          <div class="vdocs:text-[13px] vdocs:mt-4 vdocs:mb-1">
            You must add at least one Role before proceeding. Click the + Add Role button above to get started.
          </div>
        }

        <div class="vdocs:flex vdocs:flex-row vdocs:gap-2 vdocs:mt-4">
          <div class="vdocs:flex vdocs:flex-1"></div>
          <verdocs-button variant="outline" label="Cancel" size="small" (click)="cancel.emit()" />
          <verdocs-button label="OK" size="small" [disabled]="sortedRoles().length < 1" (click)="next.emit()" />
        </div>
      </form>

      @if (editing(); as edit) {
        @if (editingRole(); as role) {
          <verdocs-portal [anchor]="edit.anchor" (clickAway)="closeEditor()">
            <verdocs-template-role-properties
              [endpoint]="endpoint()"
              [templateId]="templateId()"
              [role]="role"
              (closed)="closeEditor()"
              (deleted)="onRoleDeleted()"
              (sdkError)="sdkError.emit($event)" />
          </verdocs-portal>
        }
      }
    }
  `,
})
export class VerdocsTemplateRolesComponent {
  /** Endpoint override for dual-session scenarios. Defaults to the provided endpoint. */
  readonly endpoint = input<VerdocsEndpoint>();
  /** The template ID to edit. */
  readonly templateId = input.required<string>();

  /** Emitted when the template's roles change in any way, with the refreshed role list. */
  readonly rolesUpdated = output<IRolesUpdatedEvent>();
  /** Emitted when the user clicks OK to proceed. */
  readonly next = output<void>();
  /** Emitted when the user clicks Cancel. */
  readonly cancel = output<void>();
  /** Emitted if an error occurs, with information about the error. */
  readonly sdkError = output<SDKError>();

  private readonly injectedEndpoint = inject(VERDOCS_ENDPOINT, { optional: true });
  private readonly detailService = inject(VerdocsTemplateDetailService);

  protected readonly query = this.detailService.template(this.templateId, this.endpoint);

  protected readonly placeholders = [ 0, 1, 2 ];

  protected readonly editing = signal<{ roleName: string; anchor: HTMLElement } | null>(null);
  protected readonly hoveredChip = signal<string | null>(null);
  protected readonly addPending = signal(false);

  protected readonly sortedRoles = computed(() => sortRoles(this.query.data()?.roles || []));
  protected readonly sequences = computed(() => [ ...new Set(this.sortedRoles().map(role => role.sequence)) ]);
  protected readonly nextSequence = computed(() => {
    const sequences = this.sequences();
    return sequences.length > 0 ? (sequences[sequences.length - 1] || 0) + 1 : 1;
  });

  protected readonly editingRole = computed(() => {
    const editing = this.editing();
    return editing ? this.sortedRoles().find(role => role.name === editing.roleName) : undefined;
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
      throw new Error('verdocs-template-roles needs provideVerdocs() in your application providers or an explicit endpoint input');
    }

    return resolved;
  });

  protected rolesAtSequence(sequence: number) {
    return this.sortedRoles().filter(role => role.sequence === sequence);
  }

  // Roles with complete contact info are "known" and display as people; the
  // rest are placeholders filled in when each envelope is created.
  protected chipLabel(role: IRole) {
    const unknown = !role.email || !role.first_name || !role.last_name;
    return unknown ? role.name : formatFullName(role);
  }

  private notifyRolesUpdated(event: IRolesUpdatedEvent['event']) {
    // The service awaits the detail refresh before its mutations resolve, so
    // the query already holds the refreshed template.
    this.rolesUpdated.emit({
      endpoint: this.resolvedEndpoint(),
      templateId: this.templateId(),
      event,
      roles: sortRoles(this.query.data()?.roles || []),
    });
  }

  protected async addRole(sequence: number) {
    const templateId = this.templateId();

    this.addPending.set(true);
    try {
      await this.detailService.createRole(
        templateId,
        {
          template_id: templateId,
          name: nextRoleName(this.sortedRoles()),
          type: 'signer',
          sequence,
          order: this.rolesAtSequence(sequence).length + 1,
          full_name: null,
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          message: '',
          delegator: false,
          name_locked: false,
        },
        this.endpoint(),
      );
      this.notifyRolesUpdated('added');
    } catch (error) {
      this.sdkError.emit(toSDKError(error));
    } finally {
      this.addPending.set(false);
    }
  }

  protected openEditor(roleName: string, event: MouseEvent) {
    this.editing.set({ roleName, anchor: event.currentTarget as HTMLElement });
  }

  protected closeEditor() {
    this.editing.set(null);
  }

  protected onRoleDeleted() {
    this.editing.set(null);
    this.notifyRolesUpdated('deleted');
  }
}
