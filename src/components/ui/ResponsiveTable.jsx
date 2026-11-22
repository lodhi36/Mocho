import { For, Show } from 'solid-js';
import { EmptyState } from './DataDisplay.jsx';

export function ResponsiveTable(props) {
  return (
    <Show
      when={props.rows && props.rows.length > 0}
      fallback={
        <EmptyState
          title={props.emptyTitle || 'No records found'}
          description={props.emptyDescription || 'Try adjusting your search or filter criteria.'}
          action={props.emptyAction}
        />
      }
    >
      {/* Desktop Table */}
      <div class="hidden md:block bg-white border border-[#DDE6F2] rounded-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-[#DDE6F2] bg-[#F8FAFD]">
                <For each={props.columns}>
                  {(col) => (
                    <th
                      class={`px-4 py-3 text-xs font-semibold text-[#5A6C8A] whitespace-nowrap ${
                        col.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {col.header}
                    </th>
                  )}
                </For>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#EBF1FA]">
              <For each={props.rows}>
                {(row) => (
                  <tr
                    class={`hover:bg-[#F8FAFD] transition-colors ${
                      props.onRowClick ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => props.onRowClick && props.onRowClick(row)}
                  >
                    <For each={props.columns}>
                      {(col) => (
                        <td
                          class={`px-4 py-3.5 text-sm text-[#0D1B3E] align-middle ${
                            col.align === 'right' ? 'text-right tabular-nums' : 'text-left'
                          } ${col.class || ''}`}
                        >
                          {col.render ? col.render(row) : row[col.key]}
                        </td>
                      )}
                    </For>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards (zero horizontal scrolling) */}
      <div class="md:hidden flex flex-col gap-3">
        <For each={props.rows}>
          {(row) => (
            <div
              class={`bg-white border border-[#DDE6F2] rounded-xl p-4 flex flex-col gap-2.5 ${
                props.onRowClick ? 'cursor-pointer active:bg-[#F8FAFD]' : ''
              }`}
              onClick={() => props.onRowClick && props.onRowClick(row)}
            >
              <For each={props.columns}>
                {(col) => (
                  <div class="flex items-start justify-between gap-3 text-sm">
                    <span class="text-xs font-medium text-[#5A6C8A] shrink-0">{col.header}</span>
                    <div
                      class={`text-right text-[#0D1B3E] ${
                        col.align === 'right' ? 'tabular-nums font-medium' : ''
                      }`}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </div>
                  </div>
                )}
              </For>
            </div>
          )}
        </For>
      </div>
    </Show>
  );
}
