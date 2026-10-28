// Clean-code limits from rules 01 and 02 of this specification, enforced on the repository's own code.
// TypeScript is pinned below 6.1 here only because typescript-eslint 8 declares that peer range;
// the Node.js template itself type-checks with its own TypeScript version.
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const cleanCode = {
  complexity: ["error", 10],
  "max-depth": ["error", 3],
  "max-nested-callbacks": ["error", 3],
  "max-params": ["error", 4],
  "max-lines-per-function": ["error", { max: 60, skipBlankLines: true, skipComments: true }],
  "consistent-return": "error",
  eqeqeq: "error",
  "no-shadow": "error",
  "no-var": "error",
  "prefer-const": "error",
};

export default [
  { ignores: ["**/node_modules/**"] },
  { files: ["**/*.mjs"], languageOptions: { globals: globals.node }, ...js.configs.recommended },
  ...tseslint.configs.strict.map((config) => ({ ...config, files: ["**/*.ts"] })),
  { files: ["**/*.mjs", "**/*.ts"], languageOptions: { globals: globals.node }, rules: cleanCode },
  { files: ["**/*.test.*"], rules: { "max-lines-per-function": "off", "max-nested-callbacks": ["error", 4] } },
];
