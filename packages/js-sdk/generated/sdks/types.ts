export type SdkSymbolKind = 'class' | 'interface' | 'method' | 'property' | 'enum' | 'function';

export type SdkPage = 'Endpoints' | 'Helpers';

export type SdkResource = 'function' | 'interface' | 'type' | 'class';

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
