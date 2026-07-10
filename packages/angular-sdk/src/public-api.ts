export { provideVerdocs, injectVerdocsEndpoint, VERDOCS_ENDPOINT, type VerdocsConfig } from './lib/provide-verdocs';
export { VerdocsSessionService, createSessionSignals, type ISessionSignals } from './lib/session';
export { VerdocsTemplatesService, type ITemplatesPage, type ITemplatesQuery } from './lib/templates';

export { VerdocsAuthComponent, type TAuthMode } from './lib/components/auth.component';
export {
  VerdocsTemplatesListComponent,
  type TAllowedTemplateAction,
  type TStarredFilter,
} from './lib/components/templates-list/templates-list.component';

export { VerdocsButtonComponent } from './lib/controls/button.component';
export { VerdocsTextInputComponent } from './lib/controls/text-input.component';
export { VerdocsSpinnerComponent } from './lib/controls/spinner.component';
export { VerdocsQuickFilterComponent, type IFilterOption } from './lib/controls/quick-filter.component';
export { VerdocsDropdownComponent, type IMenuOption } from './lib/controls/dropdown.component';
export { VerdocsPaginationComponent } from './lib/controls/pagination.component';

export { showToast, type IToastConfig } from './lib/toast';
export { SDKError, type IAuthStatus, type ITemplateEvent } from './lib/types';
