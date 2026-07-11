import { ChangeDetectionStrategy, Component, input, output, TemplateRef } from '@angular/core';
import { VerdocsButtonComponent } from '../controls/button.component';
import { VerdocsDialogComponent } from './dialog.component';

/**
 * A simple message dialog with an OK button and an optional Cancel button. Purely
 * presentational: the caller mounts it conditionally and removes it from the ok
 * and cancel events. Regardless of showCancel, the dialog is always dismissable
 * via the overlay and the close button, both of which fire cancel. React's
 * onOk/onCancel callbacks are this component's ok and cancel outputs.
 */
@Component({
  selector: 'verdocs-ok-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ VerdocsDialogComponent, VerdocsButtonComponent ],
  template: `
    <verdocs-dialog [heading]="heading()" [footer]="footerTpl" (closed)="cancel.emit()">
      @if (message()) {
        {{ message() }}
      }
      <ng-content />
    </verdocs-dialog>

    <ng-template #footerTpl>
      <div class="vdocs:flex vdocs:flex-row vdocs:justify-end vdocs:gap-3">
        @if (showCancel()) {
          <verdocs-button label="Cancel" variant="outline" (click)="cancel.emit()" />
        }
        <verdocs-button [label]="buttonLabel()" (click)="ok.emit()" />
      </div>
    </ng-template>
  `,
})
export class VerdocsOkDialogComponent {
  /** The title of the dialog. "title" is a reserved word, so we use heading. */
  readonly heading = input<string | TemplateRef<void> | null>(null);
  /** The message to display. React's ReactNode message prop is this string input; project content for rich messages. */
  readonly message = input('');
  /** Override the OK button's label. */
  readonly buttonLabel = input('OK');
  /** If set, a Cancel button is also displayed. */
  readonly showCancel = input(false);

  /** Emitted when the user clicks the OK button. */
  readonly ok = output<void>();
  /** Emitted when the user clicks Cancel, the close button, or the background overlay. */
  readonly cancel = output<void>();
}
