import type { ITemplate, ITemplateDocument, ITemplateField, VerdocsEndpoint } from '@verdocs/js-sdk';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { VerdocsTemplateFieldsPageComponent, type IOpenFieldEvent } from './template-fields-page.component';
import { VerdocsTemplateFieldPropertiesComponent } from './template-field-properties.component';
import { VerdocsComponentErrorComponent } from '../../controls/component-error.component';
import { toSDKError, VerdocsTemplateDetailService } from '../../template-detail.service';
import { VerdocsLoaderComponent } from '../../controls/loader.component';
import { VerdocsPortalComponent } from '../../controls/portal.component';
import { VERDOCS_ENDPOINT } from '../../provide-verdocs';
import type { SDKError } from '../../types';

/** Reported through templateUpdated whenever a field changes. */
export interface ITemplateFieldsEvent {
  endpoint: VerdocsEndpoint;
  template: ITemplate;
  event: 'updated-field' | 'deleted-field';
}

/**
 * The field layout view of the template builder: every page of every document
 * in the template, with the template's fields drawn over them in their stored
 * positions and colored per role. Clicking a field opens the field properties
 * panel in a floating panel; saves and deletes go through the template
 * structure mutations, so the canvas refreshes from the updated template.
 * React's onTemplateUpdated/onSdkError callbacks are this component's
 * templateUpdated and sdkError outputs.
 *
 * Deviations from the legacy component, per docs/PORTING.md rule 6: interact.js
 * field dragging is not ported, and with it the add-field toolbar and
 * click-to-place mode (the builder-canvas authoring affordances). Fields are
 * repositioned and created through the API or a future builder embed.
 */
@Component({
  selector: 'verdocs-template-fields',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    VerdocsComponentErrorComponent,
    VerdocsLoaderComponent,
    VerdocsPortalComponent,
    VerdocsTemplateFieldPropertiesComponent,
    VerdocsTemplateFieldsPageComponent,
  ],
  host: { '[style.display]': `'block'` },
  template: `
    @if (query.isPending()) {
      <div class="vdocs:relative vdocs:min-h-[600px]">
        <verdocs-loader />
      </div>
    } @else if (!query.data()) {
      <verdocs-component-error message="Unable to load template fields. Please verify you are signed in and try again." />
    } @else {
      <div class="vdocs:relative vdocs:font-sans vdocs:min-h-[600px]">
        <div class="vdocs:flex vdocs:flex-col vdocs:items-center vdocs:box-border vdocs:min-h-[200px] vdocs:p-[15px] vdocs:gap-[15px]">
          @for (document of documents(); track document.id) {
            <div class="vdocs:w-full vdocs:flex vdocs:flex-col vdocs:gap-[15px]">
              @if (documents().length > 1) {
                <div class="vdocs:box-border vdocs:w-full vdocs:rounded-md vdocs:bg-ink vdocs:text-white vdocs:text-base vdocs:font-medium vdocs:px-5 vdocs:py-3">
                  {{ document.name }}
                </div>
              }

              @for (page of pagesOf(document); track page) {
                <verdocs-template-fields-page
                  [document]="document"
                  [page]="page"
                  [fields]="fieldsFor(document, page)"
                  [roles]="sortedRoles()"
                  [endpoint]="endpoint()"
                  (openField)="onOpenField($event)" />
              }
            </div>
          }

          @if (!documents().length) {
            <div class="vdocs:text-lg vdocs:text-muted vdocs:py-20">This template does not have any documents yet.</div>
          }
        </div>

        @if (selectedField(); as selected) {
          <verdocs-portal [anchor]="selected.anchor" (clickAway)="selectedField.set(null)">
            <verdocs-template-field-properties
              [templateId]="templateId()"
              [fieldName]="selected.name"
              [endpoint]="endpoint()"
              (closed)="selectedField.set(null)"
              (settingsChanged)="onSettingsChanged($event)"
              (deleted)="onFieldDeleted($event)"
              (sdkError)="sdkError.emit($event)" />
          </verdocs-portal>
        }
      </div>
    }
  `,
})
export class VerdocsTemplateFieldsComponent {
  /** The ID of the template whose fields are displayed. */
  readonly templateId = input.required<string>();
  /** Endpoint override for dual-session scenarios. Defaults to the provided endpoint. */
  readonly endpoint = input<VerdocsEndpoint>();

  /** Emitted when a field is updated or deleted, e.g. for cache invalidation in the host app. */
  readonly templateUpdated = output<ITemplateFieldsEvent>();
  /** Emitted if an error occurs, with information about the error. */
  readonly sdkError = output<SDKError>();

  private readonly injectedEndpoint = inject(VERDOCS_ENDPOINT, { optional: true });
  private readonly detailService = inject(VerdocsTemplateDetailService);

  protected readonly query = this.detailService.template(this.templateId, this.endpoint);

  protected readonly selectedField = signal<{ name: string; anchor: HTMLElement } | null>(null);

  protected readonly documents = computed(() => this.query.data()?.documents || []);
  protected readonly fields = computed(() => this.query.data()?.fields || []);
  protected readonly sortedRoles = computed(() =>
    [ ...this.query.data()?.roles || [] ].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)));

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
      throw new Error('verdocs-template-fields needs provideVerdocs() in your application providers or an explicit endpoint input');
    }

    return resolved;
  });

  protected pagesOf(document: ITemplateDocument) {
    return Array.from({ length: document.pages || 0 }, (_, index) => index + 1);
  }

  protected fieldsFor(document: ITemplateDocument, page: number) {
    return this.fields().filter(field => field.document_id === document.id && field.page === page);
  }

  protected onOpenField(event: IOpenFieldEvent) {
    this.selectedField.set({ name: event.field.name, anchor: event.anchor });
  }

  // The legacy templateUpdated event carried a hand-merged copy of the
  // template; the payloads here match it. The query refresh happens in the
  // structure mutations, so these are purely host notifications.
  protected onSettingsChanged(event: { fieldName: string; field: ITemplateField }) {
    const template = this.query.data();
    if (!template) {
      return;
    }

    this.templateUpdated.emit({
      endpoint: this.resolvedEndpoint(),
      template: { ...template, fields: this.fields().map(field => (field.name === event.fieldName ? event.field : field)) },
      event: 'updated-field',
    });
  }

  protected onFieldDeleted(event: { templateId: string; fieldName: string }) {
    const template = this.query.data();
    this.selectedField.set(null);
    if (!template) {
      return;
    }

    this.templateUpdated.emit({
      endpoint: this.resolvedEndpoint(),
      template: { ...template, fields: this.fields().filter(field => field.name !== event.fieldName) },
      event: 'deleted-field',
    });
  }
}
