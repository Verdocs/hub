import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { VerdocsFileChooserComponent } from '../controls/file-chooser.component';
import { VerdocsButtonComponent } from '../controls/button.component';
import { VerdocsDialogComponent } from './dialog.component';

const DEFAULT_ACCEPT = '.pdf,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*';

const MB = 1024 * 1024;

/**
 * Prompts the user to pick one or more files to attach. Nothing is transmitted:
 * the chosen files are handed to the caller via the upload event, and the caller
 * performs the actual upload and removes the dialog. Purely presentational;
 * mount it conditionally like the other dialogs. React's onUpload/onCancel
 * callbacks are this component's upload and cancel outputs.
 */
@Component({
  selector: 'verdocs-upload-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsDialogComponent, VerdocsButtonComponent, VerdocsFileChooserComponent ],
  template: `
    <verdocs-dialog heading="Upload attachment" [footer]="footerTpl" (closed)="cancel.emit()">
      <!-- The dashed frame preserves the legacy drop-target affordance around the shared picker. -->
      <div class="vdocs:rounded-ctl vdocs:border-2 vdocs:border-dashed vdocs:border-edge">
        <verdocs-file-chooser [accept]="accept()" [multiple]="multiple()" (selectFiles)="files.set($event)" />
      </div>

      @if (tooBig()) {
        <div class="vdocs:mt-4 vdocs:text-sm vdocs:text-danger">Total file size must not exceed {{ limitLabel() }}.</div>
      }
    </verdocs-dialog>

    <ng-template #footerTpl>
      <div class="vdocs:flex vdocs:flex-row vdocs:justify-end vdocs:gap-4">
        <verdocs-button label="Cancel" variant="outline" (click)="cancel.emit()" />
        <verdocs-button label="Upload" [disabled]="tooBig() || files().length < 1" (click)="upload.emit(files())" />
      </div>
    </ng-template>
  `,
})
export class VerdocsUploadDialogComponent {
  /** File types offered by the browse dialog, in the input accept syntax. Defaults to PDF, Word, and image files. */
  readonly accept = input(DEFAULT_ACCEPT);
  /** If set, the user may choose more than one file. */
  readonly multiple = input(false);
  /** Maximum total size of the selected files, in bytes. Defaults to 20MB. */
  readonly maxSize = input(20 * MB);

  /** Emitted with the chosen files when the user clicks Upload. */
  readonly upload = output<File[]>();
  /** Emitted when the user clicks Cancel, the close button, or the background overlay. */
  readonly cancel = output<void>();

  protected readonly files = signal<File[]>([]);

  protected readonly tooBig = computed(() => this.files().reduce((acc, file) => acc + file.size, 0) > this.maxSize());

  // The legacy dialog hard-coded "20MB" in this message even when maxSize was customized;
  // we derive the label from the actual limit instead.
  protected readonly limitLabel = computed(() => {
    const maxSize = this.maxSize();
    return maxSize >= MB ? `${Math.round((maxSize / MB) * 10) / 10}MB` : `${Math.round(maxSize / 1024)}KB`;
  });
}
