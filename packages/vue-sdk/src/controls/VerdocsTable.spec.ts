import { h } from 'vue';
import { mount } from '@vue/test-utils';
import VerdocsTable, { type ITableColumn } from './VerdocsTable.vue';

interface IPlayer {
  name: string;
  position: string;
}

const columns: ITableColumn[] = [
  { id: 'name', header: 'Name' },
  { id: 'position', header: 'Position' },
];

const rows: IPlayer[] = [
  { name: 'Paige Turner', position: 'Pitcher' },
  { name: 'Cliff Hanger', position: 'Catcher' },
];

describe('VerdocsTable', () => {
  it('renders column headers and row data', () => {
    const wrapper = mount(VerdocsTable, { props: { columns, rows } });

    expect(wrapper.findAll('th').map(th => th.text())).toEqual([ 'Name', 'Position' ]);

    const cells = wrapper.findAll('td').map(td => td.text());
    expect(cells).toContain('Paige Turner');
    expect(cells).toContain('Catcher');
    expect(wrapper.findAll('tbody tr')[0]!.classes()).not.toContain('vdocs:cursor-pointer');
  });

  it('falls back to the column id when no header is given', () => {
    const wrapper = mount(VerdocsTable, { props: { columns: [ { id: 'position' } ], rows } });

    expect(wrapper.get('th').text()).toBe('position');
  });

  it('renders scoped header and cell slots', () => {
    // mount() cannot thread the component's generic, so the slot sees row as
    // unknown here; template consumers get the inferred row type instead.
    const wrapper = mount(VerdocsTable, {
      props: { columns: [ { id: 'name' } ], rows },
      slots: {
        header: () => h('em', 'Player'),
        cell: ({ row }: { row: unknown }) => h('strong', (row as IPlayer).name.toUpperCase()),
      },
    });

    expect(wrapper.get('th em').text()).toBe('Player');
    expect(wrapper.get('td strong').text()).toBe('PAIGE TURNER');
  });

  it('emits clickRow with the clicked record and marks rows clickable', async () => {
    const wrapper = mount(VerdocsTable, { props: { columns, rows, onClickRow: () => undefined } });

    expect(wrapper.findAll('tbody tr')[0]!.classes()).toContain('vdocs:cursor-pointer');

    await wrapper.findAll('tbody tr')[1]!.trigger('click');
    expect(wrapper.emitted('clickRow')).toEqual([ [ rows[1] ] ]);
  });

  it('emits clickColumnHeader with the clicked column', async () => {
    const wrapper = mount(VerdocsTable, { props: { columns, rows } });

    await wrapper.findAll('th')[1]!.trigger('click');
    expect(wrapper.emitted('clickColumnHeader')).toEqual([ [ columns[1] ] ]);
  });
});
