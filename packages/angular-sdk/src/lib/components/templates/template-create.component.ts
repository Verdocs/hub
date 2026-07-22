import type { ITemplate, VerdocsEndpoint } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { toSDKError, VerdocsTemplateDetailService } from '../../template-detail.service';
import { VerdocsFileChooserComponent } from '../../controls/file-chooser.component';
import { VerdocsTextInputComponent } from '../../controls/text-input.component';
import { VerdocsSpinnerComponent } from '../../controls/spinner.component';
import { VerdocsButtonComponent } from '../../controls/button.component';
import type { SDKError } from '../../types';

// Matches the legacy web-sdk limit: the API caps creation requests at 20MB, and
// the extra half-megabyte leaves room for the multipart framing around the files.
const DEFAULT_MAX_SIZE = 20.5 * 1024 * 1024;

/**
 * Upload one or more documents and create a new template from them. This is
 * typically the first step in a template creation workflow: when
 * templateCreated fires, the host usually routes to its template editor.
 * React's onTemplateCreated/onCancel/onSdkError callbacks are this component's
 * templateCreated, cancel, and sdkError outputs.
 */
@Component({
  selector: 'verdocs-template-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsButtonComponent, VerdocsFileChooserComponent, VerdocsSpinnerComponent, VerdocsTextInputComponent ],
  host: { '[style.display]': `'block'` },
  template: `
    <form autocomplete="off" class="vdocs:flex vdocs:flex-col vdocs:p-3 vdocs:bg-surface vdocs:font-sans" (submit)="onSubmit($event)">
      <verdocs-text-input
        label="Name"
        placeholder="Template Name..."
        [required]="true"
        [value]="name()"
        [disabled]="pending()"
        (valueChange)="onNameInput($event)" />

      <!-- The file chooser has no disabled input, so we gate interaction at the wrapper while the upload runs. -->
      <div [class]="pending() ? 'vdocs:pointer-events-none vdocs:opacity-50' : ''">
        <verdocs-file-chooser [multiple]="true" (selectFiles)="onSelectFiles($event)" />
      </div>

      @if (sizeError()) {
        <div class="vdocs:mt-4 vdocs:text-sm vdocs:text-danger">{{ sizeError() }}</div>
      }

      <div class="vdocs:flex vdocs:flex-row vdocs:items-center vdocs:gap-2 vdocs:mt-4">
        @if (pending()) {
          <verdocs-spinner mode="dark" [size]="24" />
          <div class="vdocs:text-sm vdocs:text-muted">Creating template...</div>
        }

        <div class="vdocs:flex-1"></div>

        <verdocs-button size="small" label="Cancel" variant="outline" [disabled]="pending()" (click)="cancel.emit()" />
        <verdocs-button size="small" type="submit" label="Create" [disabled]="submitDisabled()" />
      </div>
    </form>
  `,
})
export class VerdocsTemplateCreateComponent {
  /** Endpoint override for dual-session scenarios. Defaults to the provided endpoint. */
  readonly endpoint = input<VerdocsEndpoint>();
  /** Maximum combined size of the uploaded documents, in bytes. Defaults to roughly 20MB. */
  readonly maxSize = input(DEFAULT_MAX_SIZE);

  /** Emitted when the user clicks Cancel. */
  readonly cancel = output<void>();
  /** Emitted if an error occurs, with information about the error. */
  readonly sdkError = output<SDKError>();
  /** Emitted when the template has been created. */
  readonly templateCreated = output<ITemplate>();

  private readonly detailService = inject(VerdocsTemplateDetailService);

  protected readonly files = signal<File[]>([]);
  protected readonly name = signal('');
  protected readonly pending = signal(false);

  // A file selection suggests a template name, but never over a name the user typed.
  private nameEdited = false;

  protected readonly sizeError = computed(() => {
    const totalSize = this.files().reduce((total, file) => total + file.size, 0);
    return totalSize > this.maxSize() ? 'Total file size must not exceed 20MB.' : '';
  });

  protected readonly submitDisabled = computed(
    () => !this.files().length || !this.name().trim() || !!this.sizeError() || this.pending());

  protected onSelectFiles(selected: File[]) {
    this.files.set(selected);

    const first = selected[0];
    if (!this.nameEdited && first) {
      this.name.set(first.name);
    }
  }

  protected onNameInput(value: string) {
    this.name.set(value);
    this.nameEdited = true;
  }

  protected async onSubmit(event: Event) {
    event.preventDefault();
    if (this.submitDisabled()) {
      return;
    }

    this.pending.set(true);
    try {
      const template = await this.detailService.createTemplate(
        { name: this.name().trim(), documents: this.files() },
        this.endpoint(),
      );
      this.templateCreated.emit(template);
    } catch (error) {
      this.sdkError.emit(toSDKError(error));
    } finally {
      this.pending.set(false);
    }
  }
}
