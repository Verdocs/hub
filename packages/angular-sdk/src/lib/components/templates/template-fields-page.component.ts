import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import type { IRole, ITemplateDocument, ITemplateField, TFieldType, VerdocsEndpoint } from '@verdocs/js-sdk';
import { VerdocsFieldAttachmentComponent } from '../../fields/field-attachment.component';
import { VerdocsTemplateDocumentPageComponent } from './template-document-page.component';
import { VerdocsFieldSignatureComponent } from '../../fields/field-signature.component';
import { VerdocsFieldTimestampComponent } from '../../fields/field-timestamp.component';
import { VerdocsFieldCheckboxComponent } from '../../fields/field-checkbox.component';
import { VerdocsFieldDropdownComponent } from '../../fields/field-dropdown.component';
import { VerdocsFieldTextareaComponent } from '../../fields/field-textarea.component';
import { VerdocsFieldInitialComponent } from '../../fields/field-initial.component';
import { VerdocsFieldPaymentComponent } from '../../fields/field-payment.component';
import { VerdocsFieldTextboxComponent } from '../../fields/field-textbox.component';
import { VerdocsFieldRadioComponent } from '../../fields/field-radio.component';
import { VerdocsFieldDateComponent } from '../../fields/field-date.component';
import { VerdocsTemplateDetailService } from '../../template-detail.service';

/** Payload for the openField output: the clicked field and its anchor element for the floating panel. */
export interface IOpenFieldEvent {
  field: ITemplateField;
  anchor: HTMLElement;
}

/**
 * One page of the field layout view: the server-rendered page image with the
 * template's fields drawn over it in their stored positions, colored per role.
 * Composed by VerdocsTemplateFieldsComponent (it is the Angular take on the
 * React port's internal FieldsPage component) and kept separate so each page
 * gets its own page-image query.
 *
 * Fields are display-only on the builder canvas: disabled, sized to the
 * field's stored box, and click-transparent so clicks land on the settings
 * wrapper even over disabled inputs (which never fire mouse events). Field
 * x/y are PDF points with y measured up from the page bottom; inside the
 * document page's field layer those map straight to left/bottom. Clicking (or
 * Enter/Space) opens the settings panel, replacing the legacy hover popover
 * and interact.js dragging (docs/PORTING.md rule 6).
 */
@Component({
  selector: 'verdocs-template-fields-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    VerdocsFieldAttachmentComponent,
    VerdocsFieldCheckboxComponent,
    VerdocsFieldDateComponent,
    VerdocsFieldDropdownComponent,
    VerdocsFieldInitialComponent,
    VerdocsFieldPaymentComponent,
    VerdocsFieldRadioComponent,
    VerdocsFieldSignatureComponent,
    VerdocsFieldTextareaComponent,
    VerdocsFieldTextboxComponent,
    VerdocsFieldTimestampComponent,
    VerdocsTemplateDocumentPageComponent,
  ],
  host: { '[style.display]': `'block'` },
  template: `
    <verdocs-template-document-page
      [pageImageUri]="imageQuery.data()"
      [virtualWidth]="pageSize().width"
      [virtualHeight]="pageSize().height"
      [pageNumber]="page()">
      @for (field of fields(); track field.name) {
        <div
          role="button"
          tabindex="0"
          [attr.aria-label]="field.name + ' settings'"
          (click)="open(field, $event)"
          (keydown)="onKeydown(field, $event)"
          class="vdocs:absolute vdocs:box-border vdocs:cursor-pointer vdocs:outline-offset-2 vdocs:focus-visible:outline-2 vdocs:focus-visible:outline-accent"
          [style.left.px]="field.x"
          [style.bottom.px]="field.y"
          [style.width.px]="field.width"
          [style.height.px]="field.height">
          @switch (effectiveType(field)) {
            @case ('signature') {
              <verdocs-field-signature [field]="field" [disabled]="true" [signerIndex]="signerIndex(field)" class="vdocs:pointer-events-none" style="width: 100%; height: 100%" />
            }
            @case ('initial') {
              <verdocs-field-initial [field]="field" [disabled]="true" [signerIndex]="signerIndex(field)" class="vdocs:pointer-events-none" style="width: 100%; height: 100%" />
            }
            @case ('textbox') {
              <verdocs-field-textbox [field]="field" [disabled]="true" [signerIndex]="signerIndex(field)" class="vdocs:pointer-events-none" style="width: 100%; height: 100%" />
            }
            @case ('textarea') {
              <verdocs-field-textarea [field]="field" [disabled]="true" [signerIndex]="signerIndex(field)" class="vdocs:pointer-events-none" style="width: 100%; height: 100%" />
            }
            @case ('date') {
              <verdocs-field-date [field]="field" [disabled]="true" [signerIndex]="signerIndex(field)" class="vdocs:pointer-events-none" style="width: 100%; height: 100%" />
            }
            @case ('timestamp') {
              <verdocs-field-timestamp [field]="field" [disabled]="true" [signerIndex]="signerIndex(field)" class="vdocs:pointer-events-none" style="width: 100%; height: 100%" />
            }
            @case ('dropdown') {
              <verdocs-field-dropdown [field]="field" [disabled]="true" [signerIndex]="signerIndex(field)" class="vdocs:pointer-events-none" style="width: 100%; height: 100%" />
            }
            @case ('checkbox') {
              <verdocs-field-checkbox [field]="field" [disabled]="true" [signerIndex]="signerIndex(field)" class="vdocs:pointer-events-none" style="width: 100%; height: 100%" />
            }
            @case ('radio') {
              <verdocs-field-radio [field]="field" [disabled]="true" [signerIndex]="signerIndex(field)" class="vdocs:pointer-events-none" style="width: 100%; height: 100%" />
            }
            @case ('attachment') {
              <verdocs-field-attachment [field]="field" [disabled]="true" [signerIndex]="signerIndex(field)" class="vdocs:pointer-events-none" style="width: 100%; height: 100%" />
            }
            @case ('payment') {
              <verdocs-field-payment [field]="field" [disabled]="true" [signerIndex]="signerIndex(field)" class="vdocs:pointer-events-none" style="width: 100%; height: 100%" />
            }
            @default {
              {{ field.name }}
            }
          }
        </div>
      }
    </verdocs-template-document-page>
  `,
})
export class VerdocsTemplateFieldsPageComponent {
  /** The document the page belongs to. */
  readonly document = input.required<ITemplateDocument>();
  /** The 1-based page number to render. */
  readonly page = input.required<number>();
  /** The fields placed on this page. */
  readonly fields = input.required<ITemplateField[]>();
  /** The template's roles, sequence-sorted; field colors come from each field's role index. */
  readonly roles = input.required<IRole[]>();
  /** Endpoint override for dual-session scenarios. Defaults to the provided endpoint. */
  readonly endpoint = input<VerdocsEndpoint>();

  /** Emitted when the user activates a field, with the anchor for the settings panel. */
  readonly openField = output<IOpenFieldEvent>();

  private readonly detailService = inject(VerdocsTemplateDetailService);

  protected readonly imageQuery = this.detailService.documentPageImage(
    computed(() => ({ documentId: this.document().id, page: this.page() })),
    this.endpoint,
  );

  // Page sizes are keyed by 1-based page number; US Letter when absent,
  // matching the legacy fallback.
  protected readonly pageSize = computed(() => this.document().page_sizes?.[this.page()] || { width: 612, height: 792 });

  // The legacy render switch, minus the Stencil store plumbing: each field type
  // maps to its display component. Legacy promoted textboxes carrying a leading
  // setting to textareas, and fell through to the bare field name for unknown
  // types; both behaviors are kept. Payment was not in the legacy switch (it
  // fell through to the name) but the port has a payment field, so it is mapped.
  protected effectiveType(field: ITemplateField): TFieldType {
    return field.type === 'textbox' && (field.settings?.leading ?? 0) > 0 ? 'textarea' : field.type;
  }

  protected signerIndex(field: ITemplateField) {
    return Math.max(this.roles().findIndex(role => role.name === field.role_name), 0);
  }

  protected open(field: ITemplateField, event: Event) {
    this.openField.emit({ field, anchor: event.currentTarget as HTMLElement });
  }

  protected onKeydown(field: ITemplateField, event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.open(field, event);
    }
  }
}
