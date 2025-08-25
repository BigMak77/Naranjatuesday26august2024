// eslint.config.mjs
import next from "eslint-config-next";

export default [
  // Next.js rules (includes TS/React configs)
  ...next,

  // Your project-specific tweaks
  {
    ignores: [
      "**/node_modules/**",
      ".next/**",
      "postcss.config.*",
      "next.config.*",
      // "tailwind.config.*", // removed tailwind reference
      "eslint.config.*" // avoid self-lint recursion
    ],
  },
];