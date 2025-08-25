module.exports = {
  // ...your existing config
  plugins: ["unused-imports"],
  rules: {
    /* 1) Allow common shorthand expressions to slash 9k+ “unused expressions” */
    "@typescript-eslint/no-unused-expressions": ["error", {
      allowShortCircuit: true,       // e.g. cond && doThing()
      allowTernary: true,            // e.g. cond ? a() : b()
      allowTaggedTemplates: true
    }],

    /* 2) Prefer ESM, but don’t block merge while you migrate */
    "@typescript-eslint/no-require-imports": "warn", // (we'll codemod later)

    /* 3) Auto-fix 'any' -> 'unknown' where safe; ignore rest arg patterns */
    "@typescript-eslint/no-explicit-any": ["warn", {
      fixToUnknown: true,
      ignoreRestArgs: true
    }],

    /* 4) Remove unused imports automatically; soften unused vars for now */
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": ["warn", {
      args: "after-used",
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_"
    }],

    /* 5) Function type → safer signature; keep as warn initially */
    "@typescript-eslint/no-unsafe-function-type": "warn",

    /* 6) {} type → better alternatives (warn first, we can auto-fix) */
    "@typescript-eslint/no-empty-object-type": "warn",

    /* 7) this aliasing—warn so you can convert to arrows as you touch files */
    "@typescript-eslint/no-this-alias": ["warn", {
      allowDestructuring: true,
      allowedNames: [] // add ["self","that"] if you must keep some
    }]
  }
}