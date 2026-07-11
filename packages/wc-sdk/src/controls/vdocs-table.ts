import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { VdocsElement } from '../base/vdocs-element.js';
import { register } from '../base/register.js';

export interface ITableColumn<T = any> {
  /** Unique id for the column. When no renderCell is given, this is also the row field to display. */
  id: string;
  /** The header label. Defaults to the id. */
  header?: string;
  /** Optional custom renderer for the header cell, returning a Lit template or plain text. */
  renderHeader?: (column: ITableColumn<T>) => TemplateResult | string;
  /** Optional custom renderer for the data cells in this column, returning a Lit template or plain text. */
  renderCell?: (column: ITableColumn<T>, row: T) => TemplateResult | string | number | null;
}

// The legacy table dumped raw field values into the cell. Anything that is not
// already renderable text gets String() rather than leaking objects into the
// markup; columns needing richer output define a renderCell.
const defaultCellContent = (column: ITableColumn, row: any) => {
  const value = (row as Record<string, unknown>)[column.id];
  if (value === null || value === undefined) {
    return nothing;
  }

  return typeof value === 'string' || typeof value === 'number' ? value : String(value);
};

/**
 * Display a simple table of data. Columns and data cells may have custom
 * renderers defined, returning Lit templates, to support creating interactive
 * table layouts. Rows and columns go through properties (arrays never travel
 * as attributes).
 *
 * Set the clickable-rows attribute when listening for vdocs-click-row so rows
 * read as interactive; an element cannot see its listeners the way the React
 * control sees an onClickRow prop, so the styling is opt-in.
 *
 * @fires vdocs-click-row - Fired when the user clicks a row, with the row record in detail.
 * @fires vdocs-click-column-header - Fired when the user clicks a column header, with the ITableColumn in detail. Useful for managing sort options.
 */
export class VdocsTable extends VdocsElement {
  static override properties = {
    columns: { attribute: false },
    rows: { attribute: false },
    clickableRows: { type: Boolean, attribute: 'clickable-rows' },
  };

  /** The columns to display. Property-only. */
  declare columns: ITableColumn[];
  /** The rows to display. Property-only. */
  declare rows: any[];
  /** Style rows as interactive (pointer cursor, hover highlight). */
  declare clickableRows: boolean;

  constructor() {
    super();
    this.columns = [];
    this.rows = [];
    this.clickableRows = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('vdocs:block');
  }

  override render() {
    return html`
      <table class="vdocs:w-full vdocs:my-2.5 vdocs:border-collapse vdocs:font-sans vdocs:text-ink">
        <thead>
          <tr>
            ${this.columns.map(column => html`
              <th
                class="vdocs:px-4 vdocs:py-2 vdocs:text-left vdocs:text-sm vdocs:font-semibold vdocs:text-muted"
                @click=${() => this.emit('vdocs-click-column-header', column)}>
                ${column.renderHeader ? column.renderHeader(column) : column.header || column.id}
              </th>`)}
          </tr>
        </thead>

        <tbody>
          ${this.rows.map(row => html`
            <tr
              class="vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge-light ${this.clickableRows ?
                'vdocs:cursor-pointer vdocs:hover:bg-accent-light/10' :
                ''}"
              @click=${() => this.emit('vdocs-click-row', row)}>
              ${this.columns.map(column => html`
                <td class="vdocs:px-4 vdocs:py-2 vdocs:text-sm vdocs:font-normal">
                  ${column.renderCell ? column.renderCell(column, row) : defaultCellContent(column, row)}
                </td>`)}
            </tr>`)}
        </tbody>
      </table>`;
  }
}

register('vdocs-table', VdocsTable);

declare global {
  interface HTMLElementTagNameMap {
    'vdocs-table': VdocsTable;
  }

  interface GlobalEventHandlersEventMap {
    'vdocs-click-row': CustomEvent<any>;
    'vdocs-click-column-header': CustomEvent<ITableColumn>;
  }
}
