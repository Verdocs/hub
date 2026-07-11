// Hub-local lint rules. These enforce the mechanically checkable parts of
// docs/standards/ until they can move into the published shared config
// (shared-config changes wait for an attended publish).

const noNonAscii = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban non-ASCII source characters (em-dashes, smart quotes, emoji). See docs/standards/comments.md.',
    },
    schema: [],
    messages: {
      nonAscii: 'Non-ASCII character U+{{code}} in source. Use plain ASCII, or a \\u escape inside string literals.',
    },
  },
  create(context) {
    return {
      Program() {
        const text = context.sourceCode.text;
        const pattern = /[^\x00-\x7F]/g;
        let match;
        while ((match = pattern.exec(text)) !== null) {
          context.report({
            loc: {
              start: context.sourceCode.getLocFromIndex(match.index),
              end: context.sourceCode.getLocFromIndex(match.index + match[0].length),
            },
            messageId: 'nonAscii',
            data: { code: match[0].codePointAt(0).toString(16).toUpperCase().padStart(4, '0') },
          });
        }
      },
    };
  },
};

export default {
  rules: {
    'no-non-ascii': noNonAscii,
  },
};
