import { ChangeDetectionStrategy, Component, input, model, output, signal } from '@angular/core';
import { showToast } from '../toast';

/**
 * A standard text input field with minimal markup, styled to match the other
 * controls. The value is a two-way model: bind with [(value)].
 */
@Component({
  selector: 'verdocs-text-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.display]': `'block'` },
  template: `
    <label class="vdocs:block vdocs:font-sans vdocs:mb-2.5">
      @if (label()) {
        <div class="vdocs:text-sm vdocs:font-medium vdocs:text-ink vdocs:mb-1">
          {{ label() }}:
          @if (required()) {
            <span class="vdocs:text-danger">*</span>
          }
        </div>
      }

      <div class="vdocs:relative vdocs:flex vdocs:items-center">
        <input
          [type]="inputType()"
          [value]="value()"
          [required]="required()"
          [disabled]="disabled()"
          [placeholder]="placeholder()"
          [attr.autocomplete]="autocomplete() || null"
          data-lpignore="true"
          class="vdocs:w-full vdocs:h-10 vdocs:px-2.5 vdocs:text-sm vdocs:text-ink vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge vdocs:rounded-ctl vdocs:outline-none vdocs:focus:border-accent vdocs:disabled:bg-canvas vdocs:disabled:text-muted"
          (input)="onInput($event)"
          (blur)="blurred.emit(value())" />

        @if (clearable() && value()) {
          <button
            type="button"
            aria-label="Clear"
            class="vdocs:absolute vdocs:right-2.5 vdocs:bg-transparent vdocs:border-none vdocs:p-0 vdocs:cursor-pointer vdocs:text-edge vdocs:hover:text-muted"
            (click)="onClear()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.881 122.88" fill="currentColor" class="vdocs:size-4" aria-hidden="true">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M61.44,0c33.933,0,61.441,27.507,61.441,61.439 c0,33.933-27.508,61.44-61.441,61.44C27.508,122.88,0,95.372,0,61.439C0,27.507,27.508,0,61.44,0L61.44,0z M81.719,36.226 c1.363-1.363,3.572-1.363,4.936,0c1.363,1.363,1.363,3.573,0,4.936L66.375,61.439l20.279,20.278c1.363,1.363,1.363,3.573,0,4.937 c-1.363,1.362-3.572,1.362-4.936,0L61.44,66.376L41.162,86.654c-1.362,1.362-3.573,1.362-4.936,0c-1.363-1.363-1.363-3.573,0-4.937 l20.278-20.278L36.226,41.162c-1.363-1.363-1.363-3.573,0-4.936c1.363-1.363,3.573-1.363,4.936,0L61.44,56.504L81.719,36.226 L81.719,36.226z" />
            </svg>
          </button>
        }

        @if (type() === 'password') {
          <button
            type="button"
            [attr.aria-label]="showingPw() ? 'Hide password' : 'Show password'"
            class="vdocs:absolute vdocs:right-2.5 vdocs:bg-transparent vdocs:border-none vdocs:p-0 vdocs:cursor-pointer vdocs:text-muted"
            (click)="showingPw.set(!showingPw())">
            @if (showingPw()) {
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="vdocs:size-5" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="vdocs:size-5" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            }
          </button>
        }

        @if (!clearable() && copyable() && value()) {
          <button
            type="button"
            aria-label="Copy to clipboard"
            class="vdocs:absolute vdocs:right-2.5 vdocs:bg-transparent vdocs:border-none vdocs:p-0 vdocs:cursor-pointer vdocs:text-muted"
            (click)="copyToClipboard()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="vdocs:size-4" aria-hidden="true">
              <path fill-rule="evenodd" d="M15.988 3.012A2.25 2.25 0 0118 5.25v6.5A2.25 2.25 0 0115.75 14H13.5V7A2.5 2.5 0 0011 4.5H8.128a2.252 2.252 0 011.884-1.488A2.25 2.25 0 0112.25 1h1.5a2.25 2.25 0 012.238 2.012zM11.5 3.25a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v.25h-3v-.25z" clip-rule="evenodd" />
              <path fill-rule="evenodd" d="M2 7a1 1 0 011-1h8a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7zm2 3.25a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75zm0 3.5a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75z" clip-rule="evenodd" />
            </svg>
          </button>
        }
      </div>

      @if (description()) {
        <div class="vdocs:text-xs vdocs:text-muted vdocs:mt-1">{{ description() }}</div>
      }
    </label>
  `,
})
export class VerdocsTextInputComponent {
  /** The current value. Two-way bindable with [(value)]. */
  readonly value = model('');
  /** The label for the field. */
  readonly label = input('');
  /** The placeholder for the field. */
  readonly placeholder = input('');
  /** Displayed below the field in a small font, typically instructions or reminders. */
  readonly description = input('');
  /** If set, the autocomplete attribute to apply. */
  readonly autocomplete = input('');
  /** If set, a clear button will be displayed when the field has a value. */
  readonly clearable = input(false);
  /**
   * If set, a copy-to-clipboard button will be displayed. A field may not be
   * both clearable and copyable; clearable wins if both are set.
   */
  readonly copyable = input(false);
  /** Only text-like input types are supported by this control. */
  readonly type = input<'text' | 'password' | 'email' | 'number' | 'search' | 'tel' | 'url'>('text');
  readonly required = input(false);
  readonly disabled = input(false);

  /** Emitted when the field loses focus, with the current value. */
  readonly blurred = output<string>();
  /** Emitted when the user clicks the clear button. */
  readonly cleared = output<void>();

  protected readonly showingPw = signal(false);

  protected inputType() {
    return this.type() === 'password' && this.showingPw() ? 'text' : this.type();
  }

  protected onInput(event: Event) {
    this.value.set((event.target as HTMLInputElement).value);
  }

  protected onClear() {
    this.value.set('');
    this.cleared.emit();
  }

  protected copyToClipboard() {
    navigator.clipboard
      .writeText(this.value())
      .then(() => showToast('Copied!'))
      .catch(() => showToast('Unable to copy to the clipboard.', { style: 'error' }));
  }
}
