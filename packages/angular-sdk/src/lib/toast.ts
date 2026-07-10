/**
 * Minimal toast helper for infrequent notifications. These toasts do not stack:
 * showing a new one replaces any that is still visible. Styled inline (with
 * --vdocs-* token fallbacks) so no additional stylesheet is required.
 */

export interface IToastConfig {
  duration?: number;
  style?: 'error' | 'info' | 'success' | 'default';
}

const Icons = {
  error: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:24px;height:24px;display:block"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" /></svg>`,
  success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:24px;height:24px;display:block"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" /></svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:24px;height:24px;display:block"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" /></svg>`,
  default: '',
};

const Colors = {
  error: 'var(--vdocs-color-danger, #ed3d3d)',
  success: 'var(--vdocs-color-success, #3dc763)',
  info: 'var(--vdocs-color-info, #2379c7)',
  default: 'var(--vdocs-color-accent, #6a56c1)',
};

const removeToasts = () => Array.from(document.getElementsByClassName('vdocs-toast')).forEach(oldToast => oldToast.remove());

export const showToast = (text: string, config: IToastConfig = {}) => {
  if (typeof document === 'undefined') {
    return;
  }

  removeToasts();

  const { duration = 5000, style = 'default' } = config;
  const color = Colors[style] || Colors.default;
  const icon = Icons[style] || Icons.default;

  const toast = document.createElement('div');
  toast.className = 'vdocs-toast';
  toast.style.cssText = `
display: flex; flex-direction: row; gap: 10px; align-items: center;
position: fixed; top: 20px; right: 20px; z-index: 2147483647; width: 50%; max-width: calc(100% - 40px);
color: #ffffff; background: ${color}; font-family: var(--vdocs-font-sans, 'Inter', sans-serif);
border-radius: var(--vdocs-radius-ctl, 4px); padding-left: 10px;
box-shadow: 0 3px 7px 2px rgba(0, 0, 0, 0.12), 0 10px 36px -4px rgba(77, 96, 232, 0.3);`;

  const iconEl = document.createElement('div');
  iconEl.className = 'vdocs-toast-icon';
  // Static markup from the Icons table above, never user-supplied content.
  iconEl.innerHTML = icon;

  const textEl = document.createElement('div');
  textEl.style.cssText = 'padding: 12px 12px 12px 0; display: flex; flex: 1;';
  textEl.textContent = text;

  const closeEl = document.createElement('div');
  closeEl.style.cssText = 'padding: 12px 10px; background: rgba(0, 0, 0, 0.2); cursor: pointer;';
  closeEl.textContent = '✕';
  closeEl.addEventListener('click', e => {
    e.stopPropagation();
    removeToasts();
  });

  toast.append(iconEl, textEl, closeEl);
  document.body.append(toast);

  setTimeout(removeToasts, duration);
};
