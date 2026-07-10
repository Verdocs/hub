import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, model, output, signal } from '@angular/core';

export interface IFilterOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Display a drop-down menu of quick filter options, as a compact "Label: Value"
 * pill. Used above lists and tables. The value is a two-way model.
 */
@Component({
  selector: 'verdocs-quick-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.display]': `'inline-block'`,
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <div class="vdocs:relative vdocs:inline-block vdocs:font-sans">
      <button
        type="button"
        aria-haspopup="listbox"
        [attr.aria-expanded]="open()"
        class="vdocs:flex vdocs:items-center vdocs:gap-1.5 vdocs:h-8 vdocs:px-2.5 vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:cursor-pointer vdocs:whitespace-nowrap vdocs:hover:border-muted"
        (click)="open.set(!open())">
        <span class="vdocs:text-muted">{{ label() }}:</span>
        {{ selectedLabel() }}
        <span class="vdocs:border-l vdocs:border-solid vdocs:border-edge-light vdocs:self-stretch vdocs:ml-1"></span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="vdocs:size-5 vdocs:text-muted" aria-hidden="true">
          <path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z" />
        </svg>
      </button>

      @if (open()) {
        <div
          role="listbox"
          class="vdocs:absolute vdocs:left-0 vdocs:top-full vdocs:mt-1 vdocs:min-w-full vdocs:w-max vdocs:z-20 vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:rounded-ctl vdocs:shadow-lg vdocs:py-1">
          @for (option of options(); track option.value) {
            <button
              type="button"
              role="option"
              [attr.aria-selected]="option.value === value()"
              [disabled]="option.disabled || false"
              [class]="optionClasses(option)"
              (click)="selectOption(option)">
              {{ option.label }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class VerdocsQuickFilterComponent {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The filter options to display. */
  readonly options = input<IFilterOption[]>([]);
  /** Prefix label shown before the selected value. */
  readonly label = input('Filter');
  /** The currently selected value. Two-way bindable with [(value)]. */
  readonly value = model('');
  /** Shown when no option matches the current value. */
  readonly placeholder = input('Select...');

  /** Emitted when the user picks an option. */
  readonly optionSelected = output<IFilterOption>();

  protected readonly open = signal(false);

  protected readonly selectedLabel = computed(() => {
    const selected = this.options().find(option => option.value === this.value());
    return selected ? selected.label : this.placeholder();
  });

  protected optionClasses(option: IFilterOption) {
    const base = 'vdocs:block vdocs:w-full vdocs:text-left vdocs:px-3 vdocs:py-1.5 vdocs:text-sm vdocs:border-none vdocs:cursor-pointer vdocs:disabled:text-edge vdocs:disabled:cursor-default ';
    return base + (option.value === this.value() ?
      'vdocs:bg-canvas vdocs:text-accent vdocs:font-medium' :
      'vdocs:bg-surface vdocs:text-ink vdocs:hover:bg-canvas');
  }

  protected selectOption(option: IFilterOption) {
    this.open.set(false);
    this.value.set(option.value);
    this.optionSelected.emit(option);
  }

  protected onDocumentClick(event: MouseEvent) {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
