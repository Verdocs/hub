/// <reference types="node" />
/* tslint:disable:no-console */

import {writeFileSync} from 'node:fs';

// @ts-ignore - docs.json may not exist yet in CI
import docsJson from '../../docs.json';
import {SdkPreamble} from './SdkPreamble';
import type {SdkPage, SdkParam, SdkResource, SdkSymbol, SdkSymbolKind} from './types';

// This is the JS extractor from the SDK docs pipeline (docs/sdk-docs-generation.md). It walks the
// same TypeDoc reflection (docs.json) that generate-openapi.ts walks, but instead of an OpenAPI
// spec it emits the normalized "sdk-api" model: groups holding function symbols, each carrying the
// signature, params, return, and example the reference page renders. The merge step downstream
// fuses this with the python and csharp models by @sdkOperation.
//
// Tags read here (all optional in source today; sensible fallbacks apply until they are added). Every
// SDK tag is sdk-prefixed so it can never cross into the OpenAPI pipeline, which reads @group / @api:
//   @sdkOperation <group>.<fn>   the cross-language merge key; falls back to <groupSlug>.<name>
//   @sdkPage <Endpoints|Helpers> which reference page; falls back to @api -> Endpoints, else Helpers
//   @sdkGettingStarted           presence flag; also feature the symbol on Getting Started
//   @sdkGroup <Section>          the sidebar section
//   @sdkLanguage <lang>          overrides the inferred snippet language; rarely needed
//   @deprecated / @since         render a badge and a version note
// We still read @api here only as a hint to place untagged HTTP wrappers on the Endpoints page.
// The example snippet is the fenced code block in the doc comment; its language comes from the fence.

interface IBlockTagContent {
  kind: 'text' | 'code';
  text: string;
}

interface IBlockTag {
  tag: string;
  content: IBlockTagContent[];
}

// TypeDoc ReflectionKind values we care about. See typedoc ReflectionKind.
const TYPEDOC_FUNCTION_KIND = 64;
const TYPEDOC_CLASS_KIND = 128;
const TYPEDOC_INTERFACE_KIND = 256;
const TYPEDOC_METHOD_KIND = 2048;
const TYPEDOC_TYPE_ALIAS_KIND = 2097152;

const DOCUMENTABLE_KINDS = new Set([
  TYPEDOC_FUNCTION_KIND,
  TYPEDOC_CLASS_KIND,
  TYPEDOC_INTERFACE_KIND,
  TYPEDOC_METHOD_KIND,
  TYPEDOC_TYPE_ALIAS_KIND,
]);

const SDK_PAGES: SdkPage[] = ['Endpoints', 'Helpers'];

export const joinTagContent = (content: IBlockTagContent[]) => content.map((c) => c.text).join('');

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// A fenced block looks like "```typescript\n...code...\n```". Everything else in a summary (plain
// prose, inline `code`) is left for the summary text.
const isFencedCode = (part: IBlockTagContent) => part.kind === 'code' && /^```/.test(part.text.trim());

const parseFencedCode = (text: string) => {
  const match = text.trim().match(/^```([\w-]*)\r?\n([\s\S]*?)```$/);
  if (!match) {
    return null;
  }

  return {language: (match[1] || 'typescript').toLowerCase(), code: match[2].replace(/\s+$/, '')};
};

const getSummaryText = (comment: any) =>
  (comment?.summary || [])
    .filter((part: IBlockTagContent) => !isFencedCode(part))
    .map((part: IBlockTagContent) => part.text)
    .join('')
    .trim();

const findTag = (comment: any, name: string): IBlockTag | undefined =>
  (comment?.blockTags || []).find((tag: IBlockTag) => tag.tag === name);

const inferResource = (typedocKind: number): SdkResource => {
  switch (typedocKind) {
    case TYPEDOC_CLASS_KIND:
      return 'class';
    case TYPEDOC_INTERFACE_KIND:
      return 'interface';
    case TYPEDOC_TYPE_ALIAS_KIND:
      return 'type';
    case TYPEDOC_FUNCTION_KIND:
    case TYPEDOC_METHOD_KIND:
    default:
      return 'function';
  }
};

const inferSymbolKind = (typedocKind: number): SdkSymbolKind => {
  switch (typedocKind) {
    case TYPEDOC_CLASS_KIND:
      return 'class';
    case TYPEDOC_INTERFACE_KIND:
      return 'interface';
    case TYPEDOC_METHOD_KIND:
      return 'method';
    case TYPEDOC_TYPE_ALIAS_KIND:
      return 'type';
    case TYPEDOC_FUNCTION_KIND:
    default:
      return 'function';
  }
};

// Render a TypeDoc type node back to a TS-ish string. We cover the shapes the SDK surface actually
// uses (references with generics, arrays, unions, literals); anything exotic falls back to its name.
const typeToString = (type: any): string => {
  if (!type) {
    return 'void';
  }

  switch (type.type) {
    case 'intrinsic':
      return type.name;
    case 'reference': {
      const args = type.typeArguments?.length ? `<${type.typeArguments.map(typeToString).join(', ')}>` : '';
      return `${type.name}${args}`;
    }
    case 'array':
      return `${typeToString(type.elementType)}[]`;
    case 'union':
      return type.types.map(typeToString).join(' | ');
    case 'intersection':
      return type.types.map(typeToString).join(' & ');
    case 'literal':
      return typeof type.value === 'string' ? `'${type.value}'` : String(type.value);
    case 'tuple':
      return `[${(type.elements || []).map(typeToString).join(', ')}]`;
    case 'query':
      return typeToString(type.queryType);
    case 'typeOperator':
      return `${type.operator} ${typeToString(type.target)}`;
    case 'indexedAccess':
      return `${typeToString(type.objectType)}[${typeToString(type.indexType)}]`;
    case 'reflection':
    case 'mapped':
      return 'object';
    case 'predicate':
      return 'boolean';
    default:
      return type.name || 'unknown';
  }
};

const extractParams = (signature: any): SdkParam[] =>
  (signature?.parameters || []).map((param: any) => {
    const hasDefault = param.defaultValue !== undefined && param.defaultValue !== null;
    return {
      name: param.name,
      type: typeToString(param.type),
      description: getSummaryText(param.comment),
      optional: param.flags?.isOptional === true || hasDefault,
      default: hasDefault ? String(param.defaultValue) : null,
    };
  });

const buildSignature = (name: string, params: SdkParam[], returnType: string) => {
  const rendered = params
    .map((param) => {
      const optionalMarker = param.optional && param.default === null ? '?' : '';
      const defaultSuffix = param.default === null ? '' : ` = ${param.default}`;
      return `${param.name}${optionalMarker}: ${param.type}${defaultSuffix}`;
    })
    .join(', ');

  return `${name}(${rendered}): ${returnType}`;
};

const extractExamples = (comment: any) => {
  const examples: {language: string; code: string}[] = [];

  (comment?.summary || []).forEach((part: IBlockTagContent) => {
    if (!isFencedCode(part)) {
      return;
    }
    const parsed = parseFencedCode(part.text);
    if (parsed) {
      examples.push(parsed);
    }
  });

  (comment?.blockTags || []).forEach((tag: IBlockTag) => {
    if (tag.tag !== '@example') {
      return;
    }
    const raw = joinTagContent(tag.content);
    examples.push(parseFencedCode(raw) || {language: 'typescript', code: raw.trim()});
  });

  return examples;
};

const processChild = (child: Record<string, any>) => {
  const {name, kind, comment, flags} = child as {name: string; kind: number; comment: any; flags: any};

  if (!DOCUMENTABLE_KINDS.has(kind) || !comment) {
    return;
  }

  let group = '';
  let sdkOperation = '';
  let page = '';
  let language = 'typescript';
  let hasApi = false;
  let deprecated = flags?.isDeprecated === true;
  let since: string | undefined;

  // Modifier tags (e.g. @sdkGettingStarted) land on comment.modifierTags; block tags stay on blockTags.
  const modifierTags: string[] = comment?.modifierTags
    ? Array.isArray(comment.modifierTags)
      ? comment.modifierTags
      : [...comment.modifierTags]
    : [];
  const gettingStarted = modifierTags.includes('@sdkGettingStarted');

  (comment.blockTags || []).forEach((tag: IBlockTag) => {
    const text = (tag.content?.[0]?.text || '').trim();

    switch (tag.tag) {
      case '@sdkGroup':
        group = text;
        break;
      case '@sdkOperation':
        sdkOperation = text;
        break;
      case '@sdkPage':
        page = text;
        break;
      case '@sdkLanguage':
        language = text.toLowerCase();
        break;
      case '@api':
        hasApi = true;
        break;
      case '@deprecated':
        deprecated = true;
        break;
      case '@since':
        since = text;
        break;
    }
  });

  const groupName = group || 'Ungrouped';
  const groupId = slugify(groupName);

  // @sdkOperation is the authored merge key. Until every symbol has one we derive the
  // <group>.<functionName> shape the spec prescribes so the model is still usable.
  const operationId = sdkOperation || `${groupId}.${name}`;

  // @sdkPage is authored, but when absent the presence of an @api tag tells us it is an HTTP call.
  const resolvedPage: SdkPage = SDK_PAGES.includes(page as SdkPage) ? (page as SdkPage) : hasApi ? 'Endpoints' : 'Helpers';

  const resolvedResource = inferResource(kind);

  const signature = child.signatures?.[0];
  const params = extractParams(signature);
  const returnType = typeToString(signature?.type);
  const returnsTag = findTag(comment, '@returns') || findTag(comment, '@return');
  const examples = extractExamples(comment).map((example) => ({...example, language: language || example.language}));

  // Classes and interfaces do not have a call signature the same way functions do; keep the name.
  const renderedSignature =
    resolvedResource === 'function' || kind === TYPEDOC_METHOD_KIND
      ? buildSignature(name, params, returnType)
      : name;

  const symbol: SdkSymbol = {
    sdkOperation: operationId,
    kind: inferSymbolKind(kind),
    name,
    page: resolvedPage,
    gettingStarted,
    resource: resolvedResource,
    signature: renderedSignature,
    summary: getSummaryText(comment),
    params,
    returns:
      resolvedResource === 'function' || kind === TYPEDOC_METHOD_KIND
        ? {type: returnType, description: returnsTag ? joinTagContent(returnsTag.content).trim() : ''}
        : undefined,
    throws: [],
    examples,
    deprecated,
    ...(since ? {since} : {}),
  };

  const groupEntry = (SdkPreamble.groups[groupId] = SdkPreamble.groups[groupId] || {
    id: groupId,
    name: groupName,
    summary: '',
    symbols: {},
  });

  if (groupEntry.symbols[operationId]) {
    console.warn(`Duplicate @sdkOperation "${operationId}" (${groupEntry.symbols[operationId].name} and ${name}). The later one wins.`);
  }

  groupEntry.symbols[operationId] = symbol;
};

const processEntry = (child: Record<string, any>) => {
  processChild(child);
  if (child.children) {
    return child.children.map(processEntry);
  }
};

const generateSdkDocs = async () => {
  console.log('Generating SDK docs');
  processEntry(docsJson);
};

generateSdkDocs()
  .then(() => {
    console.log('Done generating SDK docs');
    writeFileSync('./sdk-docs.json', JSON.stringify(SdkPreamble, null, 2));
    process.exit(0);
  })
  .catch((e) => {
    console.log('[generate-sdks]: Error - ', e);
    process.exit(-1);
  });
