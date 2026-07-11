import { TestBed } from '@angular/core/testing';
import { Component, computed, signal, TemplateRef, viewChild } from '@angular/core';
import { ITableCellContext, ITableColumn, ITableHeaderContext, VerdocsTableComponent } from './table.component';

interface IPlayer {
  name: string;
  position: string;
}

describe('VerdocsTableComponent', () => {
  @Component({
    imports: [ VerdocsTableComponent ],
    template: `
      <ng-template #nameHeader let-column><em class="custom-header">Player ({{ column.id }})</em></ng-template>
      <ng-template #nameCell let-row><strong class="custom-cell">{{ row.name.toUpperCase() }}</strong></ng-template>
      <verdocs-table
        [columns]="columns()"
        [rows]="rows"
        [clickableRows]="true"
        (clickRow)="clickedRow = $event"
        (clickColumnHeader)="clickedColumn = $event" />
    `,
  })
  class HostComponent {
    readonly nameHeader = viewChild<TemplateRef<ITableHeaderContext<IPlayer>>>('nameHeader');
    readonly nameCell = viewChild<TemplateRef<ITableCellContext<IPlayer>>>('nameCell');
    readonly useTemplates = signal(false);

    rows: IPlayer[] = [
      { name: 'Paige Turner', position: 'Pitcher' },
      { name: 'Cliff Hanger', position: 'Catcher' },
    ];

    clickedRow: IPlayer | null = null;
    clickedColumn: ITableColumn<IPlayer> | null = null;

    readonly columns = computed<ITableColumn<IPlayer>[]>(() => {
      const nameHeader = this.nameHeader();
      const nameCell = this.nameCell();
      if (this.useTemplates() && nameHeader && nameCell) {
        return [
          { id: 'name', headerTemplate: nameHeader, cellTemplate: nameCell },
          { id: 'position', header: 'Position' },
        ];
      }

      return [
        { id: 'name', header: 'Name' },
        { id: 'position' },
      ];
    });
  }

  async function createFixture(useTemplates = false) {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.useTemplates.set(useTemplates);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders headers and row data, falling back to the column id', async () => {
    const fixture = await createFixture();

    const headers: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('th');
    expect(headers.item(0).textContent).toContain('Name');
    expect(headers.item(1).textContent).toContain('position');

    const cells: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('td');
    expect(cells.item(0).textContent).toContain('Paige Turner');
    expect(cells.item(3).textContent).toContain('Catcher');
  });

  it('renders header and cell templates when the column defines them', async () => {
    const fixture = await createFixture(true);

    expect(fixture.nativeElement.querySelector('.custom-header')?.textContent).toContain('Player (name)');
    expect(fixture.nativeElement.querySelector('.custom-cell')?.textContent).toContain('PAIGE TURNER');
  });

  it('emits clickRow with the clicked record', async () => {
    const fixture = await createFixture();

    const rows: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.item(1).className).toContain('vdocs:cursor-pointer');

    rows.item(1).querySelector('td')?.click();
    expect(fixture.componentInstance.clickedRow).toEqual({ name: 'Cliff Hanger', position: 'Catcher' });
  });

  it('emits clickColumnHeader with the clicked column', async () => {
    const fixture = await createFixture();

    const headers: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('th');
    headers.item(1).click();

    expect(fixture.componentInstance.clickedColumn?.id).toBe('position');
  });
});
