import type { ReactNode, TableHTMLAttributes } from 'react';

export interface ITableColumn<T> {
  /** Unique id for the column. When no renderCell is given, this is also the row field to display. */
  id: string;
  /** The header label. Defaults to the id. */
  header?: string;
  /** Optional custom renderer for the header cell. */
  renderHeader?: (column: ITableColumn<T>) => ReactNode;
  /** Optional custom renderer for the data cells in this column. */
  renderCell?: (column: ITableColumn<T>, row: T) => ReactNode;
}

export interface TableProps<T> extends Omit<TableHTMLAttributes<HTMLTableElement>, 'children'> {
  /** The columns to display. */
  columns: ITableColumn<T>[];
  /** The rows to display. */
  rows: T[];
  /** Called when the user clicks a column header. Useful for managing sort options. */
  onClickColumnHeader?: (column: ITableColumn<T>) => void;
  /** Called when the user clicks a row. */
  onClickRow?: (row: T) => void;
}

// The legacy table dumped raw field values into the cell, but React can only render strings
// and numbers, so anything else non-null gets String() rather than crashing the render.
// Columns needing richer output define a renderCell.
function defaultCellContent<T>(column: ITableColumn<T>, row: T): ReactNode {
  const value = (row as Record<string, unknown>)[column.id];
  if (value === null || value === undefined) {
    return null;
  }

  return typeof value === 'string' || typeof value === 'number' ? value : String(value);
}

/**
 * Display a simple table of data. Columns and data cells may have custom renderers
 * defined to support creating interactive table layouts.
 */
export default function Table<T>({ columns, rows, onClickColumnHeader, onClickRow, className = '', ...rest }: TableProps<T>) {
  return (
    <table className={`vdocs:w-full vdocs:my-2.5 vdocs:border-collapse vdocs:font-sans vdocs:text-ink ${className}`} {...rest}>
      <thead>
        <tr>
          {columns.map(column => (
            <th
              key={column.id}
              onClick={() => onClickColumnHeader?.(column)}
              className="vdocs:px-4 vdocs:py-2 vdocs:text-left vdocs:text-sm vdocs:font-semibold vdocs:text-muted">
              {column.renderHeader ? column.renderHeader(column) : column.header || column.id}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {/* Rows are arbitrary records with no guaranteed identity, so we key by index. The
            table keeps no per-row state, so reordered data still renders correctly. */}
        {rows.map((row, index) => (
          <tr
            key={index}
            onClick={() => onClickRow?.(row)}
            className={`vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge-light ${
              onClickRow ? 'vdocs:cursor-pointer vdocs:hover:bg-accent-light/10' : ''
            }`}>
            {columns.map(column => (
              <td key={column.id} className="vdocs:px-4 vdocs:py-2 vdocs:text-sm vdocs:font-normal">
                {column.renderCell ? column.renderCell(column, row) : defaultCellContent(column, row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
