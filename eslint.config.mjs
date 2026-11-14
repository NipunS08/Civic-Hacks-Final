import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Native images use static Metro requires and accessibilityLabel, not DOM alt.
  { files: ["apps/mobile/**/*.tsx"], rules: {
    "@typescript-eslint/no-require-imports": "off",
    "jsx-a11y/alt-text": "off",
  } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "apps/mobile/.expo/**",
    "apps/mobile/dist/**",
    "apps/mobile/dist-native/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
