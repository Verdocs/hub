type SdkSymbolKind = 'class' | 'interface' | 'method' | 'property' | 'enum' | 'function';

interface SdkParam {
  name: string;
  type: string;
  description: string;
  optional: boolean;
  default: string | null;
}

interface SdkSymbol {
  kind: SdkSymbolKind;
  name: string;
  signature: string;
  summary: string;
  params: SdkParam[];
  returns?: {type: string; description: string};
  throws: {type: string; description: string}[];
  examples: {language: string; code: string}[];
  deprecated: boolean;
  since?: string;
}

interface SdkGroup {
  id: string;
  name: string;
  summary: string;
  symbols: Record<string, SdkSymbol>;
}

interface Sdk {
  language: string;
  package: string;
  version: string;
  groups: Record<string, SdkGroup>;
}