// Generates custom-elements.json for editors, docs tooling, and future
// framework wrappers. The litelement flag turns on the analyzer's Lit-aware
// handling of static properties.
export default {
  globs: [ 'src/**/*.ts' ],
  exclude: [ 'src/**/*.spec.ts', 'src/test/**' ],
  litelement: true,
  plugins: [
    // Our elements self-define through the register() helper (a guarded
    // customElements.define), which the analyzer's define-call detection
    // cannot see through. Treat register('vdocs-x', VdocsX) the same way the
    // core plugin treats customElements.define('vdocs-x', VdocsX).
    {
      name: 'verdocs-register-calls',
      analyzePhase({ ts, node, moduleDoc }) {
        if (node.kind !== ts.SyntaxKind.CallExpression) {
          return;
        }

        if (node.expression?.kind !== ts.SyntaxKind.Identifier || node.expression.text !== 'register') {
          return;
        }

        const [ tag, klass ] = node.arguments ?? [];
        if (tag?.kind !== ts.SyntaxKind.StringLiteral || klass?.kind !== ts.SyntaxKind.Identifier) {
          return;
        }

        const classDoc = moduleDoc.declarations?.find(declaration => declaration.name === klass.text);
        if (classDoc) {
          classDoc.tagName = tag.text;
          classDoc.customElement = true;
        }

        moduleDoc.exports = [
          ...moduleDoc.exports ?? [],
          {
            kind: 'custom-element-definition',
            name: tag.text,
            declaration: { name: klass.text, module: moduleDoc.path },
          },
        ];
      },
      moduleLinkPhase({ moduleDoc }) {
        // The core analyzer also picks up the raw customElements.define(tag,
        // ctor) inside the register() helper itself and records a definition
        // literally named "tag". Custom element names must contain a hyphen,
        // so anything without one is that artifact, not a real element.
        moduleDoc.exports = moduleDoc.exports?.filter(entry => entry.kind !== 'custom-element-definition' || entry.name.includes('-'));
      },
    },
  ],
};
