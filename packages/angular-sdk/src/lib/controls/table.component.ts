import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, TemplateRef } from '@angular/core';

export interface ITableHeaderContext<T> {
  /** The column being rendered. */
  $implicit: ITableColumn<T>;
}

export interface ITableCellContext<T> {
  /** The row being rendered. */
  $implicit: T;
  /** The column being rendered. */
  column: ITableColumn<T>;
}

export interface ITableColumn<T> {
  /** Unique id for the column. When no cellTemplate is given, this is also the row field to display. */
  id: string;
  /** The header label. Defaults to the id. */
  header?: string;
  /** Optional template for the header cell, the Angular take on React's renderHeader. The column is the implicit context. */
  headerTemplate?: TemplateRef<ITableHeaderContext<T>>;
  /** Optional template for the data cells in this column, the Angular take on React's renderCell. The row is the implicit context. */
  cellTemplate?: TemplateRef<ITableCellContext<T>>;
}

/**
 * Display a simple table of data. Columns may define header and cell templates
 * to support creating interactive table layouts. React's onClickColumnHeader and
 * onClickRow callbacks are the clickColumnHeader and clickRow outputs.
 *
 * ```html
 * <ng-template #nameCell let-row><strong>{{ row.name }}</strong></ng-template>
 * <verdocs-table [columns]="[{ id: 'name', cellTemplate: nameCell }]" [rows]="rows" />
 * ```
 */
@Component({
  selector: 'verdocs-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ NgTemplateOutlet ],
  host: { '[style.display]': `'block'` },
  template: `
    <table class="vdocs:w-full vdocs:my-2.5 vdocs:border-collapse vdocs:font-sans vdocs:text-ink">
      <thead>
        <tr>
          @for (column of columns(); track column.id) {
            <th
              class="vdocs:px-4 vdocs:py-2 vdocs:text-left vdocs:text-sm vdocs:font-semibold vdocs:text-muted"
              (click)="clickColumnHeader.emit(column)">
              @if (column.headerTemplate) {
                <ng-container [ngTemplateOutlet]="column.headerTemplate" [ngTemplateOutletContext]="{ $implicit: column }" />
              } @else {
                {{ column.header || column.id }}
              }
            </th>
          }
        </tr>
      </thead>

      <tbody>
        <!-- Rows are arbitrary records with no guaranteed identity, so we track by index. The
             table keeps no per-row state, so reordered data still renders correctly. -->
        @for (row of rows(); track $index) {
          <tr [class]="rowClasses()" (click)="clickRow.emit(row)">
            @for (column of columns(); track column.id) {
              <td class="vdocs:px-4 vdocs:py-2 vdocs:text-sm vdocs:font-normal">
                @if (column.cellTemplate) {
                  <ng-container [ngTemplateOutlet]="column.cellTemplate" [ngTemplateOutletContext]="{ $implicit: row, column: column }" />
                } @else {
                  {{ defaultCellContent(column, row) }}
                }
              </td>
            }
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class VerdocsTableComponent<T> {
  /** The columns to display. */
  readonly columns = input.required<ITableColumn<T>[]>();
  /** The rows to display. */
  readonly rows = input.required<T[]>();
  /**
   * Adds the pointer cursor and row hover treatment. React infers this from the
   * presence of onClickRow; Angular cannot see output subscribers, so it is an
   * explicit input.
   */
  readonly clickableRows = input(false);

  /** Emitted when the user clicks a column header. Useful for managing sort options. */
  readonly clickColumnHeader = output<ITableColumn<T>>();
  /** Emitted when the user clicks a row. */
  readonly clickRow = output<T>();

  protected readonly rowClasses = computed(
    () =>
      'vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge-light' +
      (this.clickableRows() ? ' vdocs:cursor-pointer vdocs:hover:bg-accent-light/10' : ''),
  );

  // The legacy table dumped raw field values into the cell; anything that isn't
  // already text gets String() rather than rendering "[object Object]" surprises
  // ad hoc. Columns needing richer output define a cellTemplate.
  protected defaultCellContent(column: ITableColumn<T>, row: T): string | number | null {
    const value = (row as Record<string, unknown>)[column.id];
    if (value === null || value === undefined) {
      return null;
    }

    return typeof value === 'string' || typeof value === 'number' ? value : String(value);
  }
}
