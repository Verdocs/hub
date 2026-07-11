import type { IRecipient, IUpdateRecipientParams, VerdocsEndpoint } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { VerdocsTextInputComponent } from '../../controls/text-input.component';
import { VerdocsButtonComponent } from '../../controls/button.component';
import { VerdocsDialogComponent } from '../../dialogs/dialog.component';
import { VerdocsEnvelopesService } from '../../envelopes.service';
import { toSDKError } from '../../template-detail.service';
import { showToast } from '../../toast';
import { SDKError } from '../../types';

/**
 * A dialog for updating a recipient's contact details (name, email, phone, and
 * invite message) before they act. Only the fields that actually changed are
 * submitted, and the envelope's detail queries refresh after a save so any
 * mounted views update. Render conditionally and unmount in updated/cancel.
 */
@Component({
  selector: 'verdocs-envelope-update-recipient',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsButtonComponent, VerdocsDialogComponent, VerdocsTextInputComponent ],
  template: `
    @if (recipient(); as recipient) {
      <verdocs-dialog heading="Update Recipient" [footer]="footerTpl" (closed)="cancel.emit()">
        <div class="vdocs:mb-2 vdocs:text-sm vdocs:font-semibold vdocs:text-ink">{{ roleName() }}</div>

        <div class="vdocs:flex vdocs:flex-row vdocs:gap-3">
          <verdocs-text-input
            class="vdocs:flex-1"
            placeholder="First Name..."
            [value]="firstName() ?? recipient.first_name ?? ''"
            (valueChange)="firstName.set($event)" />
          <verdocs-text-input
            class="vdocs:flex-1"
            placeholder="Last Name..."
            [value]="lastName() ?? recipient.last_name ?? ''"
            (valueChange)="lastName.set($event)" />
        </div>

        <verdocs-text-input
          type="email"
          placeholder="Email Address..."
          [value]="email() ?? recipient.email ?? ''"
          (valueChange)="email.set($event)" />

        <verdocs-text-input
          type="tel"
          placeholder="Phone Number..."
          [value]="phone() ?? recipient.phone ?? ''"
          (valueChange)="phone.set($event)" />

        <textarea
          rows="3"
          aria-label="Invitation Message"
          placeholder="Optional message to include in invitation..."
          data-lpignore="true"
          [value]="message() ?? recipient.message ?? ''"
          (input)="onMessageInput($event)"
          class="vdocs:box-border vdocs:w-full vdocs:resize-y vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge vdocs:bg-surface vdocs:p-2.5 vdocs:font-sans vdocs:text-sm vdocs:text-ink vdocs:outline-none vdocs:focus:border-accent"></textarea>

        <div class="vdocs:mt-2 vdocs:text-sm vdocs:italic vdocs:text-muted">
          NOTE: If you change the recipient's email address or invite message, they will receive a
          new invitation to sign the envelope. This will also reset their status if they have previously
          declined to sign.
        </div>
      </verdocs-dialog>

      <ng-template #footerTpl>
        <div class="vdocs:flex vdocs:flex-row vdocs:justify-end vdocs:gap-3">
          <verdocs-button label="Cancel" variant="outline" size="small" [disabled]="saving()" (click)="cancel.emit()" />
          <verdocs-button label="Save" size="small" [disabled]="saving()" (click)="save()" />
        </div>
      </ng-template>
    }
  `,
})
export class VerdocsEnvelopeUpdateRecipientComponent {
  /** Endpoint override for dual-session scenarios. Defaults to the provided endpoint. */
  readonly endpoint = input<VerdocsEndpoint>();
  /** The envelope containing the recipient to update. */
  readonly envelopeId = input.required<string>();
  /** The role name of the recipient to update. */
  readonly roleName = input.required<string>();

  /** Emitted after the recipient is successfully updated, with the updated recipient. */
  readonly updated = output<IRecipient>();
  /** Emitted when the user dismisses the dialog without saving any changes. */
  readonly cancel = output<void>();
  /** Emitted if an error occurs, with information about the error. */
  readonly sdkError = output<SDKError>();

  private readonly envelopesService = inject(VerdocsEnvelopesService);

  private readonly query = this.envelopesService.envelope(this.envelopeId, this.endpoint);

  // Edit buffers overlay the loaded recipient: null means untouched, so the
  // form tracks the server data until the user starts typing in a field.
  protected readonly firstName = signal<string | null>(null);
  protected readonly lastName = signal<string | null>(null);
  protected readonly email = signal<string | null>(null);
  protected readonly phone = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);

  protected readonly saving = signal(false);

  // The legacy component rendered nothing until the envelope loaded, to avoid
  // flashing an empty dialog.
  protected readonly recipient = computed(() =>
    (this.query.data()?.recipients ?? []).find(recipient => recipient.role_name === this.roleName()));

  constructor() {
    effect(() => {
      const error = this.query.error();
      if (error) {
        this.sdkError.emit(toSDKError(error));
      }
    });
  }

  protected onMessageInput(event: Event) {
    this.message.set((event.target as HTMLTextAreaElement).value);
  }

  protected async save() {
    const recipient = this.recipient();
    if (!recipient) {
      return;
    }

    const fields: IUpdateRecipientParams = {};
    const firstName = this.firstName();
    if (firstName !== null && firstName !== recipient.first_name) {
      fields.first_name = firstName;
    }
    const lastName = this.lastName();
    if (lastName !== null && lastName !== recipient.last_name) {
      fields.last_name = lastName;
    }
    const email = this.email();
    if (email !== null && email !== recipient.email) {
      fields.email = email;
    }
    const phone = this.phone();
    if (phone !== null && phone !== (recipient.phone ?? '')) {
      fields.phone = phone;
    }
    const message = this.message();
    if (message !== null && message !== (recipient.message ?? '')) {
      fields.message = message;
    }

    // Nothing changed, so skip the request. The server sends a fresh invite on
    // some updates and we don't want to trigger that for a no-op save.
    if (Object.keys(fields).length < 1) {
      this.cancel.emit();
      return;
    }

    this.saving.set(true);
    try {
      const updated = await this.envelopesService.updateRecipient(this.envelopeId(), this.roleName(), fields, this.endpoint());
      showToast('Recipient updated', { style: 'success' });
      this.updated.emit(updated);
    } catch (error) {
      showToast(`Error updating recipient: ${(error as Error).message}`, { style: 'error' });
      this.sdkError.emit(toSDKError(error));
    } finally {
      this.saving.set(false);
    }
  }
}
