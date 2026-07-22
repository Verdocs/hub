import pkg from '../../package.json';
import type {Sdk} from './types';

// The JS extractor emits one single-language model (the "sdk-api" model in the spec). The
// merge step in @verdocs/sdk-docs fuses this with the python and csharp models by
// @sdkOperation. See docs/sdk-docs-generation.md.
export const SdkPreamble: Sdk = {
  language: 'typescript',
  package: pkg.name,
  version: pkg.version,
  groups: {},
};
