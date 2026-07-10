export { VerdocsProvider, type VerdocsProviderProps } from './provider/VerdocsProvider';
export { useVerdocs } from './provider/VerdocsContext';
export { useSession, type ISessionState } from './hooks/useSession';
export { useTemplates, useToggleTemplateStar } from './hooks/useTemplates';

export { VerdocsAuth, type VerdocsAuthProps, type TAuthMode } from './components/VerdocsAuth/VerdocsAuth';
export {
  VerdocsTemplatesList,
  type VerdocsTemplatesListProps,
  type TAllowedTemplateAction,
  type TStarredFilter,
} from './components/VerdocsTemplatesList/VerdocsTemplatesList';

export { Button, type ButtonProps } from './controls/Button';
export { TextInput, type TextInputProps } from './controls/TextInput';
export { Spinner, type SpinnerProps } from './controls/Spinner';
export { QuickFilter, type QuickFilterProps, type IFilterOption } from './controls/QuickFilter';
export { Dropdown, type DropdownProps, type IMenuOption } from './controls/Dropdown';
export { Pagination, type PaginationProps } from './controls/Pagination';

export { showToast, type IToastConfig } from './utils/toast';
export { SDKError, type IAuthStatus, type ITemplateEvent } from './types';
