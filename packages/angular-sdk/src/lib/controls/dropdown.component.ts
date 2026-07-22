import { ChangeDetectionStrategy, Component, ElementRef, inject, input, output, signal } from '@angular/core';

export interface IMenuOption {
  /** The label to display. Options with an empty label render as separators. */
  label: string;
  /** Identifier emitted with optionSelected when the option is chosen. */
  id?: string;
  disabled?: boolean;
}

/**
 * Display a drop-down menu button. A menu of the specified options is shown
 * when the button is pressed, and hidden when an option is selected or the
 * user clicks elsewhere. Separators may be created by supplying an entry with
 * an empty label.
 */
@Component({
  selector: 'verdocs-dropdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.display]': `'inline-block'`,
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <div class="vdocs:relative vdocs:inline-block vdocs:font-sans">
      <button
        type="button"
        aria-haspopup="menu"
        [attr.aria-expanded]="open()"
        aria-label="Open menu"
        class="vdocs:flex vdocs:items-center vdocs:justify-center vdocs:size-8 vdocs:p-0 vdocs:bg-transparent vdocs:border-none vdocs:rounded-ctl vdocs:cursor-pointer vdocs:text-primary vdocs:hover:bg-canvas"
        (click)="toggle($event)">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="vdocs:size-6" aria-hidden="true">
          <path d="M7 10l5 5 5-5H7z" />
        </svg>
      </button>

      @if (open()) {
        <div
          role="menu"
          class="vdocs:absolute vdocs:right-0 vdocs:top-full vdocs:mt-1 vdocs:w-max vdocs:min-w-40 vdocs:z-20 vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:rounded-ctl vdocs:shadow-lg vdocs:py-1">
          @for (option of options(); track $index) {
            @if (option.label) {
              <button
                type="button"
                role="menuitem"
                [disabled]="option.disabled || false"
                class="vdocs:block vdocs:w-full vdocs:text-left vdocs:px-3 vdocs:py-1.5 vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:border-none vdocs:cursor-pointer vdocs:hover:bg-canvas vdocs:disabled:text-edge vdocs:disabled:cursor-default vdocs:disabled:bg-surface"
                (click)="selectOption($event, option)">
                {{ option.label }}
              </button>
            } @else {
              <div class="vdocs:border-t vdocs:border-solid vdocs:border-edge-light vdocs:my-1"></div>
            }
          }
        </div>
      }
    </div>
  `,
})
export class VerdocsDropdownComponent {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The menu options to display. */
  readonly options = input<IMenuOption[]>([]);

  /** Emitted when the user picks an option. */
  readonly optionSelected = output<IMenuOption>();

  protected readonly open = signal(false);

  protected toggle(event: MouseEvent) {
    event.stopPropagation();
    this.open.set(!this.open());
  }

  protected selectOption(event: MouseEvent, option: IMenuOption) {
    event.stopPropagation();
    this.open.set(false);
    this.optionSelected.emit(option);
  }

  protected onDocumentClick(event: MouseEvent) {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
