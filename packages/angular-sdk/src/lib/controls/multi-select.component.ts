import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, model, signal } from '@angular/core';

export interface IMultiSelectOption {
  /** The label to display for the option. */
  label: string;
  /** The value tracked in selectedOptions. */
  value: string;
}

// aria-labelledby needs a page-unique id per instance; Angular has no useId
// equivalent, so a module counter does the job.
let nextLabelId = 0;

/**
 * Display a dropdown that allows multiple options to be selected. The trigger
 * summarizes the current selection; pressing it opens a checkbox list that
 * stays open while the user toggles options and closes on an outside click or
 * Escape. The selection is a two-way model: bind with [(selectedOptions)].
 * React's onSelectionChanged callback is this component's selectedOptionsChange
 * event.
 */
@Component({
  selector: 'verdocs-multi-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.display]': `'block'`,
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'open.set(false)',
  },
  template: `
    <div class="vdocs:block vdocs:w-full vdocs:font-sans vdocs:mb-2.5">
      @if (label()) {
        <div [id]="labelId" class="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1">{{ label() }}:</div>
      }

      <div class="vdocs:relative">
        <button
          type="button"
          [attr.aria-expanded]="open()"
          [attr.aria-labelledby]="label() ? labelId : null"
          class="vdocs:relative vdocs:flex vdocs:flex-wrap vdocs:items-center vdocs:gap-1 vdocs:w-full vdocs:min-h-10 vdocs:box-border vdocs:pl-2.5 vdocs:pr-8 vdocs:py-1 vdocs:text-sm vdocs:text-left vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:cursor-pointer vdocs:outline-none vdocs:focus:border-accent"
          (click)="open.set(!open())">
          @if (selectedOptions().length === 0) {
            <span class="vdocs:text-muted">{{ placeholder() }}</span>
          } @else {
            @for (value of selectedOptions(); track value) {
              <span class="vdocs:inline-block vdocs:px-1.5 vdocs:py-0.5 vdocs:text-xs vdocs:text-white vdocs:bg-accent-dark vdocs:rounded-ctl">
                {{ optionLabel(value) }}
              </span>
            }
          }
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" [class]="caretClasses()" aria-hidden="true">
            <path
              d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z" />
          </svg>
        </button>

        @if (open()) {
          <div
            role="group"
            [attr.aria-labelledby]="label() ? labelId : null"
            class="vdocs:absolute vdocs:left-0 vdocs:top-full vdocs:mt-1 vdocs:w-max vdocs:min-w-52 vdocs:z-20 vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:rounded-ctl vdocs:shadow-lg vdocs:py-1">
            @for (option of options(); track option.value) {
              <label
                class="vdocs:flex vdocs:items-center vdocs:gap-1.5 vdocs:px-2 vdocs:py-1.5 vdocs:text-[13px] vdocs:text-ink vdocs:whitespace-nowrap vdocs:cursor-pointer vdocs:hover:bg-canvas">
                <input
                  type="checkbox"
                  [checked]="selectedOptions().includes(option.value)"
                  class="vdocs:size-4 vdocs:accent-primary vdocs:cursor-pointer"
                  (change)="toggleOption(option, $event)" />
                {{ option.label }}
              </label>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class VerdocsMultiSelectComponent {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The options to list. */
  readonly options = input.required<IMultiSelectOption[]>();
  /** The values currently selected. Two-way bindable with [(selectedOptions)]. */
  readonly selectedOptions = model<string[]>([]);
  /** The label for the field. */
  readonly label = input('');
  /** Shown in the trigger when no options are selected. */
  readonly placeholder = input('Select...');

  protected readonly open = signal(false);
  protected readonly labelId = `verdocs-multi-select-label-${nextLabelId++}`;

  protected readonly caretClasses = computed(
    () =>
      'vdocs:absolute vdocs:right-2 vdocs:top-1/2 vdocs:-translate-y-1/2 vdocs:size-4.5 vdocs:text-muted' +
      (this.open() ? ' vdocs:rotate-180' : ''),
  );

  protected optionLabel(value: string) {
    return this.options().find(option => option.value === value)?.label || 'Unknown';
  }

  protected toggleOption(option: IMultiSelectOption, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const selected = this.selectedOptions();
    this.selectedOptions.set(checked ? [ ...selected, option.value ] : selected.filter(value => value !== option.value));
  }

  protected onDocumentClick(event: MouseEvent) {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
