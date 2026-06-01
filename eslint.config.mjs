import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Scripts (CommonJS)
    "scripts/**",
  ]),
  {
    rules: {
      // React Compiler rules that are overly strict for data-fetching patterns.
      // Pattern `useEffect(() => { loadData() }, [loadData])` where loadData is
      // a useCallback that internally calls setState is valid and well-established.
      "react-hooks/set-state-in-effect": "warn",
      // Existing manual memoization that the compiler cannot preserve — warn, not error.
      "react-hooks/preserve-manual-memoization": "warn",
      // react-hook-form's watch() is flagged by the compiler — warn only.
      "react-hooks/incompatible-library": "warn",
    },
  },
]);

export default eslintConfig;
