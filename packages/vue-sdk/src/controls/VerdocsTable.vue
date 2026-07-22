<script lang="ts">
export interface ITableColumn {
  /** Unique id for the column. When the cell slot does not override it, this is also the row field to display. */
  id: string;
  /** The header label. Defaults to the id. */
  header?: string;
}

export interface VerdocsTableProps<T> {
  /** The columns to display. */
  columns: ITableColumn[];
  /** The rows to display. */
  rows: T[];
}
</script>

<script setup lang="ts" generic="T">
import { getCurrentInstance } from 'vue';

const { columns, rows } = defineProps<VerdocsTableProps<T>>();

const emit = defineEmits<{
  /** Fired when the user clicks a column header. Useful for managing sort options. */
  clickColumnHeader: [column: ITableColumn];
  /** Fired when the user clicks a row. */
  clickRow: [row: T];
}>();

defineSlots<{
  /** Replaces a header cell's content. Falls back to the column's header or id. */
  header?: (props: { column: ITableColumn }) => unknown;
  /** Replaces a data cell's content. Falls back to the row field named by the column id. */
  cell?: (props: { row: T; column: ITableColumn }) => unknown;
}>();

// The legacy table dumped raw field values into the cell, but template interpolation
// would JSON.stringify objects, so anything else non-null gets String() to match the
// React port. Columns needing richer output use the cell slot.
const cellContent = (column: ITableColumn, row: T) => {
  const value = (row as Record<string, unknown>)[column.id];
  if (value === null || value === undefined) {
    return '';
  }

  return typeof value === 'string' || typeof value === 'number' ? value : String(value);
};

// Declared emits are stripped from $attrs, so the vnode props are the only place
// to see whether the parent actually listens for row clicks. This drives only the
// hover and cursor affordance; emitting to nobody is harmless.
const hasRowClick = !!getCurrentInstance()?.vnode.props?.onClickRow;

const rowClasses = [
  'vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge-light',
  hasRowClick ? 'vdocs:cursor-pointer vdocs:hover:bg-accent-light/10' : '',
];
</script>

<template>
  <table class="vdocs:w-full vdocs:my-2.5 vdocs:border-collapse vdocs:font-sans vdocs:text-ink">
    <thead>
      <tr>
        <th
          v-for="column in columns"
          :key="column.id"
          class="vdocs:px-4 vdocs:py-2 vdocs:text-left vdocs:text-sm vdocs:font-semibold vdocs:text-muted"
          @click="emit('clickColumnHeader', column)"
        >
          <slot
            name="header"
            :column="column"
          >
            {{ column.header || column.id }}
          </slot>
        </th>
      </tr>
    </thead>

    <tbody>
      <!-- Rows are arbitrary records with no guaranteed identity, so we key by index. The
           table keeps no per-row state, so reordered data still renders correctly. -->
      <tr
        v-for="(row, index) in rows"
        :key="index"
        :class="rowClasses"
        @click="emit('clickRow', row)"
      >
        <td
          v-for="column in columns"
          :key="column.id"
          class="vdocs:px-4 vdocs:py-2 vdocs:text-sm vdocs:font-normal"
        >
          <slot
            name="cell"
            :row="row"
            :column="column"
          >
            {{ cellContent(column, row) }}
          </slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>
