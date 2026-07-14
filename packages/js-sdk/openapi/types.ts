export const Kind = {
  PROJECT: 1,
  MODULE: 2,
  NAMESPACE: 4,
  ENUM: 8,
  ENUM_MEMBER: 16,
  VARIABLE: 32,
  FUNCTION: 64,
  CLASS: 128,
  INTERFACE: 256,
  CONSTRUCTOR: 512,
  PROPERTY: 1024,
  METHOD: 2048,
  CALL_SIGNATURE: 8388608, // last CallSignature value
  INDEX_SIGNATURE: 8192,
  CONSTRUCTOR_SIGNATURE: 16384,
  PARAMETER: 32768,
  TYPE_LITERAL: 65536,
  TYPE_PARAMETER: 131072,
  ACCESSOR: 262144,
  GET_SIGNATURE: 524288,
  SET_SIGNATURE: 1048576,
  OBJECT_LITERAL: 2097152,
  METHOD_SIGNATURE: 4194304,
} as const;

export type Kind = (typeof Kind)[keyof typeof Kind];

export interface IBlockTagContent {
  kind: 'text' | 'code';
  text: string;
}

export interface IBlockTag {
  tag: string; // '@category';
  content: IBlockTagContent[];
}