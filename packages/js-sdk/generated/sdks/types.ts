export type SdkSymbolKind = 'method'|'function'|'class'|'interface'|'type'|'enum'|'namespace'|'property'|'event';

export type SdkPage = 'Endpoints' | 'Helpers';

export type SdkResource = 'function' | 'interface' | 'type' | 'class';

export type SdkSupportedLanguage = 'typescript' | 'python' | 'csharp';

export interface SdkParam {
  name: string;
  type: string;
  description: string;
  optional: boolean;
  default: string | null;
}

export interface SdkSymbol {
  sdkOperation: string;
  kind: SdkSymbolKind;
  name: string;
  page: SdkPage;
  gettingStarted: boolean;
  resource: SdkResource;
  signature: string;
  summary: string;
  params: SdkParam[];
  returns?: {type: string; description: string};
  throws: {type: string; description: string}[];
  examples: {language: string; code: string}[];
  deprecated: boolean;
  since?: string;
}

export interface SdkGroup {
  id: string;
  name: string;
  summary: string;
  symbols: Record<string, SdkSymbol>;
}

export interface Sdk {
  language: string;
  package: string;
  version: string;
  groups: Record<string, SdkGroup>;
}


// The schema which will be used for our SDK documentation
export interface IUnifiedSdkApi {
  $schema: string;
  operations: IApiOperation[];
}

interface IApiReturn {
  type: string;
  description?: string;
}

interface IApiExample {
  language: SdkSupportedLanguage;
  code: string;
}

export interface IApiOperation {
  operationId: string;
  group?: string;
  page: SdkPage;
  gettingStarted?: boolean;
  summary?: string;
  description?: string;
  variants: IApiVariant[];
}

export interface IApiVariant {
  language: SdkSupportedLanguage;
  signature: string;
  params?: SdkParam[];
  returns?: IApiReturn;
  example?: IApiExample;
  deprecated?: boolean;
  since?: string;
}
