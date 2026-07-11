import type { IRecipient, TRecipientStatus, VerdocsEndpoint } from '@verdocs/js-sdk';
import { formatFullName, getRecipientsWithActions, recipientCanAct } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { VerdocsComponentErrorComponent } from '../../controls/component-error.component';
import { VerdocsButtonComponent } from '../../controls/button.component';
import { VerdocsEnvelopesService } from '../../envelopes.service';
import type { IEnvelopeEvent } from './envelopes-list.component';
import { toSDKError } from '../../template-detail.service';
import { VERDOCS_ENDPOINT } from '../../provide-verdocs';
import { showToast } from '../../toast';
import { SDKError } from '../../types';

const STATUS_CLASSES: Partial<Record<TRecipientStatus, string>> = {
  invited: 'vdocs:bg-[#ff8f00]',
  signed: 'vdocs:bg-success',
  submitted: 'vdocs:bg-success',
  pending: 'vdocs:bg-info',
  canceled: 'vdocs:bg-danger',
  declined: 'vdocs:bg-danger',
};

/**
 * The post-send summary of an envelope's recipients: each role with its current
 * status, plus an in-person signing link fetcher for recipients who can act now.
 * The legacy component rendered as a full-screen overlay; this one renders as a
 * plain panel, so hosts that want the modal treatment can wrap it in a dialog.
 */
@Component({
  selector: 'verdocs-envelope-recipient-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsButtonComponent, VerdocsComponentErrorComponent ],
  host: { '[style.display]': `'block'` },
  template: `
    @if (!query.isPending()) {
      @if (query.data(); as envelope) {
        <div class="vdocs:flex vdocs:w-[600px] vdocs:max-w-full vdocs:flex-col vdocs:rounded-md vdocs:bg-surface vdocs:px-5 vdocs:pt-[30px] vdocs:pb-5 vdocs:font-sans vdocs:box-border">
          <h1 class="vdocs:m-0 vdocs:mb-2.5 vdocs:text-xl vdocs:font-bold vdocs:text-ink">Recipient Summary</h1>

          <div>
            @for (recipient of sortedRecipients(); track recipient.role_name) {
              <div class="vdocs:mt-2 vdocs:mb-6 vdocs:flex vdocs:flex-col vdocs:text-muted">
                <div class="vdocs:mb-2 vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-2">
                  <div class="vdocs:flex-1 vdocs:text-sm vdocs:font-semibold vdocs:text-ink">{{ recipient.role_name }}</div>
                  <div [class]="chipClasses(recipient.status)">{{ recipient.status }}</div>
                </div>

                <div class="vdocs:flex vdocs:flex-row vdocs:items-end vdocs:gap-[5px]">
                  <div class="vdocs:flex vdocs:h-[34px] vdocs:min-w-0 vdocs:flex-1 vdocs:items-center vdocs:truncate vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas vdocs:px-3 vdocs:text-base">
                    {{ recipientLine(recipient) }}
                  </div>
                  @if (canGetLink(recipient) && !links()[recipient.role_name]) {
                    <verdocs-button
                      size="small"
                      variant="outline"
                      label="Get Link"
                      [disabled]="gettingLinkRole() === recipient.role_name"
                      (click)="getLink(recipient.role_name)" />
                  }
                </div>

                @if (links()[recipient.role_name]; as link) {
                  <div class="vdocs:mt-1 vdocs:flex vdocs:flex-row vdocs:gap-[5px]">
                    <div class="vdocs:flex vdocs:h-[34px] vdocs:min-w-0 vdocs:flex-1 vdocs:items-center vdocs:overflow-hidden vdocs:truncate vdocs:whitespace-nowrap vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas vdocs:px-3 vdocs:text-base">
                      {{ link }}
                    </div>
                    <verdocs-button size="small" variant="outline" label="Copy" (click)="copyLink(link)" />
                  </div>
                }
              </div>
            }
          </div>

          @if (canSendAnother() || canView() || canDone()) {
            <div class="vdocs:mt-2.5 vdocs:flex vdocs:flex-row vdocs:items-center vdocs:justify-center vdocs:gap-[15px]">
              @if (canSendAnother()) {
                <verdocs-button size="small" label="Send Another" class="vdocs:min-w-[120px]" (click)="emitEnvelopeEvent(another)" />
              }
              @if (canView()) {
                <verdocs-button size="small" label="View Now" class="vdocs:min-w-[120px]" (click)="emitEnvelopeEvent(view)" />
              }
              @if (canDone()) {
                <verdocs-button size="small" label="Done" class="vdocs:min-w-[120px]" (click)="emitEnvelopeEvent(done)" />
              }
            </div>
          }
        </div>
      } @else {
        <verdocs-component-error message="Unable to load envelope. Please try again later." />
      }
    }
  `,
})
export class VerdocsEnvelopeRecipientSummaryComponent {
  /** Endpoint override for dual-session scenarios. Defaults to the provided endpoint. */
  readonly endpoint = input<VerdocsEndpoint>();
  /** The envelope to summarize. */
  readonly envelopeId = input.required<string>();
  /** Enable or disable the Send Another button. */
  readonly canSendAnother = input(true);
  /** Enable or disable the View button. */
  readonly canView = input(true);
  /** Enable or disable the Done button. */
  readonly canDone = input(true);

  /** Emitted when the user clicks Send Another. The host should route to its send flow. */
  readonly another = output<IEnvelopeEvent>();
  /** Emitted when the user clicks View Now. The host should route to its envelope view. */
  readonly view = output<IEnvelopeEvent>();
  /** Emitted when the user clicks Done. The host should route to its next workflow step. */
  readonly done = output<IEnvelopeEvent>();
  /** Emitted if an error occurs, with information about the error. */
  readonly sdkError = output<SDKError>();

  private readonly injectedEndpoint = inject(VERDOCS_ENDPOINT, { optional: true });
  private readonly envelopesService = inject(VerdocsEnvelopesService);

  // The legacy component rendered nothing while loading. The summary is shown
  // right after a send, so the data is usually already loaded anyway.
  protected readonly query = this.envelopesService.envelope(this.envelopeId, this.endpoint);

  protected readonly links = signal<Record<string, string>>({});
  protected readonly gettingLinkRole = signal<string | null>(null);

  private readonly recipientsWithActions = computed(() => {
    const envelope = this.query.data();
    return envelope ? getRecipientsWithActions(envelope) : [];
  });

  protected readonly sortedRecipients = computed(() =>
    [ ...this.query.data()?.recipients ?? [] ].sort((a, b) =>
      (a.sequence === b.sequence ? a.order - b.order : a.sequence - b.sequence)));

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
      throw new Error('verdocs-envelope-recipient-summary needs provideVerdocs() in your application providers or an explicit endpoint input');
    }

    return resolved;
  });

  protected chipClasses(status: TRecipientStatus) {
    return (
      'vdocs:min-w-[100px] vdocs:rounded-[5px] vdocs:px-2 vdocs:py-[3px] vdocs:text-center vdocs:text-sm vdocs:capitalize vdocs:text-white ' +
      (STATUS_CLASSES[status] ?? 'vdocs:bg-muted')
    );
  }

  protected canGetLink(recipient: IRecipient) {
    return recipientCanAct(recipient, this.recipientsWithActions());
  }

  protected recipientLine(recipient: IRecipient) {
    return `${formatFullName(recipient)} (${recipient.email || recipient.phone})`;
  }

  protected copyLink(link: string) {
    navigator.clipboard
      .writeText(link)
      .then(() => showToast('Link copied to clipboard.', { style: 'success' }))
      .catch(error => {
        showToast('Unable to copy to the clipboard.', { style: 'error' });
        this.sdkError.emit(toSDKError(error));
      });
  }

  protected async getLink(roleName: string) {
    this.gettingLinkRole.set(roleName);
    try {
      const response = await this.envelopesService.getInPersonLink(this.envelopeId(), roleName, this.endpoint());
      this.links.update(previous => ({ ...previous, [roleName]: response.link }));
      this.copyLink(response.link);
    } catch (error) {
      showToast(`Unable to get link: ${(error as Error).message}`, { style: 'error' });
      this.sdkError.emit(toSDKError(error));
    } finally {
      this.gettingLinkRole.set(null);
    }
  }

  protected emitEnvelopeEvent(emitter: { emit: (event: IEnvelopeEvent) => void }) {
    const envelope = this.query.data();
    if (envelope) {
      emitter.emit({ endpoint: this.resolvedEndpoint(), envelope });
    }
  }
}
