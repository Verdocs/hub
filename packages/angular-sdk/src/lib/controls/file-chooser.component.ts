import { ChangeDetectionStrategy, Component, computed, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { VerdocsButtonComponent } from './button.component';

const DEFAULT_ACCEPT = 'application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * Displays a file picker to upload an attachment: a drag-and-drop target plus a
 * click-to-browse button. This component is just the picker; the host application
 * provides the actual upload functionality. React's onSelectFiles callback is
 * this component's selectFiles output.
 */
@Component({
  selector: 'verdocs-file-chooser',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsButtonComponent ],
  host: { '[style.display]': `'block'` },
  template: `
    <div
      [class]="boxClasses()"
      (drop)="onDrop($event)"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)">
      <input
        #file
        type="file"
        [accept]="accept()"
        [multiple]="multiple()"
        aria-label="Select a file"
        class="vdocs:sr-only"
        (change)="onFilesChanged($event)" />

      <div class="vdocs:text-xl vdocs:font-bold vdocs:wrap-anywhere">{{ prompt() }}</div>

      <div class="vdocs:h-5 vdocs:my-5 vdocs:text-base">{{ files().length ? '' : 'Or, if you prefer...' }}</div>

      <verdocs-button
        size="small"
        [label]="files().length ? 'Select a different file' : 'Select a file from your computer'"
        (click)="browse()" />
    </div>
  `,
})
export class VerdocsFileChooserComponent {
  /** File types offered by the browse dialog, in the input accept syntax. Defaults to PDF and Word documents. */
  readonly accept = input(DEFAULT_ACCEPT);
  /** If set, the user may choose more than one file. */
  readonly multiple = input(false);

  /**
   * Emitted when the selection changes. The list is empty when the selection is cleared,
   * e.g. while the user is choosing a different file. Host applications should use this
   * to enable/disable buttons that upload or otherwise process the selection.
   */
  readonly selectFiles = output<File[]>();

  protected readonly files = signal<File[]>([]);
  protected readonly dragging = signal(false);

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('file');

  protected readonly prompt = computed(() =>
    this.files().length ? this.files().map(file => file.name).join(', ') : 'Drag a file here');

  protected readonly boxClasses = computed(
    () =>
      'vdocs:flex vdocs:flex-col vdocs:box-border vdocs:font-sans vdocs:text-center vdocs:text-muted vdocs:bg-surface vdocs:rounded-ctl vdocs:px-4 vdocs:py-10' +
      (this.dragging() ? ' vdocs:outline-2 vdocs:outline-dashed vdocs:outline-accent' : ''),
  );

  private applySelection(selected: File[]) {
    this.files.set(selected);
    this.selectFiles.emit(selected);
  }

  protected onFilesChanged(event: Event) {
    this.applySelection(Array.from((event.target as HTMLInputElement).files ?? []));
  }

  protected browse() {
    // The selection resets before the dialog opens so hosts can disable their upload buttons
    // while a new pick is pending. Clearing the input's value also means re-picking the same
    // file still fires a change event.
    this.applySelection([]);
    const input = this.fileInput().nativeElement;
    input.value = '';
    input.click();
  }

  protected onDragOver(event: DragEvent) {
    // preventDefault marks the box as a valid drop target; without it the browser opens the file.
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDragLeave(event: DragEvent) {
    // dragleave also fires when the cursor moves over child nodes; only clear the highlight
    // when the cursor actually left the box.
    if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) {
      this.dragging.set(false);
    }
  }

  protected onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragging.set(false);

    // The accept attribute only filters the browse dialog; browsers don't enforce it on drops.
    // Hosts validate file types when they process the upload anyway.
    const dropped = Array.from(event.dataTransfer?.files ?? []);
    if (dropped.length) {
      this.applySelection(this.multiple() ? dropped : dropped.slice(0, 1));
    }
  }
}
