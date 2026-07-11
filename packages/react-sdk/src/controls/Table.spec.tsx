import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import Table, { type ITableColumn } from './Table';

interface IPlayer {
  name: string;
  position: string;
}

const columns: ITableColumn<IPlayer>[] = [
  { id: 'name', header: 'Name' },
  { id: 'position', header: 'Position' },
];

const rows: IPlayer[] = [
  { name: 'Paige Turner', position: 'Pitcher' },
  { name: 'Cliff Hanger', position: 'Catcher' },
];

describe('Table', () => {
  it('renders column headers and row data', () => {
    render(<Table columns={columns} rows={rows} />);

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Position' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Paige Turner' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Catcher' })).toBeInTheDocument();
  });

  it('falls back to the column id when no header is given', () => {
    render(<Table columns={[{ id: 'position' }]} rows={rows} />);

    expect(screen.getByRole('columnheader', { name: 'position' })).toBeInTheDocument();
  });

  it('uses custom header and cell renderers', () => {
    const custom: ITableColumn<IPlayer>[] = [
      {
        id: 'name',
        renderHeader: () => <em>Player</em>,
        renderCell: (_column, row) => <strong>{row.name.toUpperCase()}</strong>,
      },
    ];
    render(<Table columns={custom} rows={rows} />);

    expect(screen.getByRole('columnheader', { name: 'Player' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'PAIGE TURNER' })).toBeInTheDocument();
  });

  it('fires onClickRow with the clicked record', async () => {
    const onClickRow = vi.fn();
    render(<Table columns={columns} rows={rows} onClickRow={onClickRow} />);

    await userEvent.click(screen.getByRole('cell', { name: 'Cliff Hanger' }));
    expect(onClickRow).toHaveBeenCalledWith(rows[1]);
  });

  it('fires onClickColumnHeader with the clicked column', async () => {
    const onClickColumnHeader = vi.fn();
    render(<Table columns={columns} rows={rows} onClickColumnHeader={onClickColumnHeader} />);

    await userEvent.click(screen.getByRole('columnheader', { name: 'Position' }));
    expect(onClickColumnHeader).toHaveBeenCalledWith(columns[1]);
  });
});
