// NOTE: This logic will probably be moving to the generator. (aka js-sdk)
import { readFile, writeFile } from 'node:fs/promises';
import fs from 'node:fs'
import path from 'node:path';
import { SdkSymbolKind, SdkSupportedLanguage, SdkPage, SdkParam, IApiVariant, IUnifiedSdkApi, IApiOperation } from './types'

const INPUT_PATH = path.resolve('./sdk-docs.json');
const OUTPUT_PATH = path.resolve('./unified-sdks.json');

// Expand this list when we start documenting classes, interfaces, etc.
const INCLUDED_KINDS: SdkSymbolKind[] = ['function'];

interface ISourceParam {
  name: string;
  type: string;
  description?: string;
  optional?: boolean;
  default?: string | null;
}

interface ISourceExample {
  language: string;
  code: string;
}

interface ISourceSymbol {
  sdkOperation: string;
  kind: SdkSymbolKind;
  name: string;
  page: SdkPage;
  gettingStarted?: boolean;
  signature: string;
  summary?: string;
  params?: ISourceParam[];
  returns?: {
    type: string;
    description?: string;
  };
  examples?: ISourceExample[];
  deprecated?: boolean;
}

interface ISourceGroup {
  id: string;
  name: string;
  symbols: Record<string, ISourceSymbol>;
}

interface ISourceSdkDocs {
  language: SdkSupportedLanguage;
  groups: Record<string, ISourceGroup>;
}


export const fetchSdkSchemas = () => {
  const sdkPath = path.resolve('../../sdks')
  const sdks: ISourceSdkDocs[] = []
  const languages = fs.readdirSync(sdkPath, { recursive: false })

  // Get the paths to each of the sdks' `sdk-docs.json`.
  languages.forEach((language) => {
    const formattedPath = `${sdkPath}/${language}/sdk-docs.json`

    try {
      const file = JSON.parse(fs.readFileSync(formattedPath, 'utf8'))
      sdks.push(file)
    } catch (error) {
      throw new Error(`Couldnt find file for (${language})`)
    }
  })
  return sdks
}

const mapParams = (params: ISourceParam[] | undefined): SdkParam[] | undefined => {
  if (!params || params.length === 0) {
    return undefined;
  }

  return params.map(param => {
    const mapped: SdkParam = {
      name: param.name,
      type: param.type,
      optional: !!param.optional,
      default: param.default || null,
      description: param.description ?? ''
    };

    if (param.description) {
      mapped.description = param.description;
    }

    if (param.default != null) {
      mapped.default = param.default;
    }

    return mapped;
  });
};

const mapVariant = (symbol: ISourceSymbol, language: SdkSupportedLanguage): IApiVariant => {
  const firstExample = symbol.examples?.[0];

  const variant: IApiVariant = {
    language,
    signature: symbol.signature,
    params: mapParams(symbol.params),
    deprecated: symbol.deprecated,
  };

  if (symbol.returns) {
    variant.returns = {
      type: symbol.returns.type,
      ...(symbol.returns.description ? { description: symbol.returns.description } : {}),
    };
  }

  if (firstExample) {
    variant.example = {
      language: (firstExample.language as SdkSupportedLanguage) || language,
      code: firstExample.code,
    };
  }

  return variant;
};

const mapSymbol = (symbol: ISourceSymbol, groupName: string, language: SdkSupportedLanguage): IApiOperation => {
  return {
    operationId: symbol.sdkOperation,
    group: groupName,
    page: symbol.page,
    gettingStarted: symbol.gettingStarted,
    summary: symbol.summary,
    variants: [mapVariant(symbol, language)],
  };
};

export const unifySdkSchemas = (sources: ISourceSdkDocs[]): IUnifiedSdkApi => {
  // Keyed by operationId so additional language dumps can merge variants later.
  const operationsById = new Map<string, IApiOperation>();

  for (const source of sources) {
    for (const group of Object.values(source.groups)) {
      for (const symbol of Object.values(group.symbols)) {
        if (!INCLUDED_KINDS.includes(symbol.kind)) {
          continue;
        }

        const existing = operationsById.get(symbol.sdkOperation);
        if (existing) {
          existing.variants.push(mapVariant(symbol, source.language));
          continue;
        }

        operationsById.set(symbol.sdkOperation, mapSymbol(symbol, group.name, source.language));
      }
    }
  }


  return {
    $schema: './sdk-unified.schema.json',
    operations: Array.from(operationsById.values()),
  };
};

const main = async () => {
  const source: ISourceSdkDocs = JSON.parse(await readFile(INPUT_PATH, 'utf8'));
  const sdkSources = fetchSdkSchemas()
  const unified = unifySdkSchemas([source, ...sdkSources]);

  await writeFile(OUTPUT_PATH, `${JSON.stringify(unified, null, 2)}\n`);

  console.log(
    `Unified ${unified.operations.length} operations (${INCLUDED_KINDS.join(', ')} only) → ${OUTPUT_PATH}`,
  );
};

main().catch(err => {
  console.error('Failed to unify SDK schema:', err);
  process.exit(1);
});
