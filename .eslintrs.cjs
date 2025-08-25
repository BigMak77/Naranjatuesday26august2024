module.exports = {
  // ...
  plugins: ["unused-imports"],
  rules: {
    // 1) Shrink no-unused-expressions by allowing common idioms
    "@typescript-eslint/no-unused-expressions": ["error", {
      allowShortCircuit: true,       // cond && doThing()
      allowTernary: true,            // cond ? a() : b()
      allowTaggedTemplates: true
    }],

    // 2) ESM migration staged (we’ll codemod next)
    "@typescript-eslint/no-require-imports": "warn",

    // 3) Make 'any' fixable to unknown automatically
    "@typescript-eslint/no-explicit-any": ["warn", {
      fixToUnknown: true,
      ignoreRestArgs: true
    }],

    // 4) Auto-remove unused imports; keep unused vars as warn
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": ["warn", {
      args: "after-used",
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_"
    }],

    "@typescript-eslint/no-unsafe-function-type": "warn",
    "@typescript-eslint/no-empty-object-type": "warn",
    "@typescript-eslint/no-this-alias": ["warn", { allowDestructuring: true }]
  }
}
