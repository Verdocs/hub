import { formatFullName } from '@verdocs/js-sdk';
import type { IRecipient } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { VerdocsButtonComponent } from '../../controls/button.component';
import { showToast } from '../../toast';

/**
 * Display a single recipient from an envelope, with the opportunity to copy an
 * in-person signing link for that recipient to use. The link itself is fetched
 * by the host (see the getLink output); copying writes it to the clipboard.
 */
@Component({
  selector: 'verdocs-envelope-recipient-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsButtonComponent ],
  host: { '[style.display]': `'block'` },
  template: `
    <div class="vdocs:flex vdocs:flex-col vdocs:w-[600px] vdocs:max-w-full vdocs:font-sans vdocs:text-lg vdocs:bg-surface vdocs:rounded-md vdocs:pt-7 vdocs:px-5 vdocs:pb-5">
      <div class="vdocs:text-xl vdocs:font-bold vdocs:text-ink vdocs:mb-2.5">In-Person Signing Link</div>

      <div class="vdocs:flex vdocs:flex-col vdocs:text-ink vdocs:mt-2 vdocs:mb-6">
        <div class="vdocs:text-sm vdocs:font-semibold vdocs:mb-2">{{ recipient().role_name }}</div>

        <div class="vdocs:flex vdocs:flex-row vdocs:items-end vdocs:gap-1.5">
          <div class="vdocs:flex vdocs:flex-1 vdocs:items-center vdocs:h-[34px] vdocs:px-3 vdocs:text-base vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas">
            {{ fullName() }} ({{ recipient().email || recipient().phone }})
          </div>

          @if (!link()) {
            <verdocs-button
              size="small"
              variant="outline"
              [label]="gettingLink() ? 'Loading...' : 'Get Link'"
              [disabled]="gettingLink()"
              (click)="getLink.emit(recipient())" />
          }
        </div>

        @if (link(); as currentLink) {
          <div class="vdocs:flex vdocs:flex-row vdocs:gap-1.5 vdocs:mt-1">
            <div class="vdocs:flex vdocs:flex-1 vdocs:items-center vdocs:h-[34px] vdocs:px-3 vdocs:text-base vdocs:rounded-ctl vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:bg-canvas vdocs:overflow-hidden vdocs:whitespace-nowrap vdocs:text-ellipsis">
              {{ currentLink }}
            </div>
            <verdocs-button size="small" variant="outline" label="Copy" (click)="copyLink()" />
          </div>
        }
      </div>

      <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:justify-center vdocs:mt-2.5">
        <verdocs-button size="small" label="Done" class="vdocs:min-w-[120px]" (click)="done.emit()" />
      </div>
    </div>
  `,
})
export class VerdocsEnvelopeRecipientLinkComponent {
  /** The recipient to display. */
  readonly recipient = input.required<IRecipient>();
  /** The recipient's in-person signing link, once the host has obtained one. */
  readonly link = input<string>();
  /** True while the host is fetching the link. Shown as a loading state on the Get Link button. */
  readonly gettingLink = input(false);

  /** Emitted when the user clicks Get Link. The host fetches the link and re-renders with it set. */
  readonly getLink = output<IRecipient>();
  /** Emitted when the user clicks Done to proceed to the next workflow step. */
  readonly done = output<void>();

  protected readonly fullName = computed(() => formatFullName(this.recipient()));

  protected copyLink() {
    // Browsers block writes that aren't triggered by a user gesture, which is
    // why the copy happens here rather than automatically when the link loads.
    navigator.clipboard
      .writeText(this.link() ?? '')
      .then(() => showToast('Link copied to clipboard!', { style: 'success', duration: 3000 }))
      .catch((e: Error) => showToast(`Unable to copy to clipboard: ${e.message}`, { style: 'error' }));
  }
}
