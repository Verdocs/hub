import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Table, { type ITableColumn, type TableProps } from './Table';

interface ISamplePlayer {
  name: string;
  position: string;
  number: number;
}

const SamplePlayers: ISamplePlayer[] = [
  { name: 'Paige Turner', position: 'Pitcher', number: 12 },
  { name: 'Cliff Hanger', position: 'Catcher', number: 7 },
  { name: 'Sandy Beech', position: 'Shortstop', number: 23 },
  { name: 'Rocky Rhodes', position: 'First Base', number: 45 },
];

const SampleColumns: ITableColumn<ISamplePlayer>[] = [
  { id: 'name', header: 'Name' },
  { id: 'position', header: 'Position' },
  { id: 'number', header: 'Number' },
];

const CustomColumns: ITableColumn<ISamplePlayer>[] = [
  {
    id: 'name',
    header: 'Name',
    renderCell: (_column, row) => <strong>{row.name}</strong>,
  },
  { id: 'position', header: 'Position' },
  {
    id: 'number',
    renderHeader: () => <em>Jersey No.</em>,
    renderCell: (_column, row) => `#${row.number}`,
  },
];

// Storybook cannot infer T from a generic component, so we pin the sample row type here.
const meta = {
  title: 'Controls/Table',
  component: Table as typeof Table<ISamplePlayer>,
  args: {
    columns: SampleColumns,
    rows: SamplePlayers,
  },
} satisfies Meta<typeof Table<ISamplePlayer>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const CustomRenderers: Story = {
  args: { columns: CustomColumns },
};

function ClickableTable(args: TableProps<ISamplePlayer>) {
  const [lastClicked, setLastClicked] = useState<ISamplePlayer | null>(null);
  return (
    <div>
      <Table {...args} onClickRow={setLastClicked} />
      <div style={{ fontFamily: 'sans-serif', fontSize: 14 }}>
        {lastClicked ? `Clicked: ${lastClicked.name}` : 'Click a row...'}
      </div>
    </div>
  );
}

export const ClickableRows: Story = {
  render: args => <ClickableTable {...args} />,
};
