import eslint from "@eslint/js";
import vitest from "@vitest/eslint-plugin";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/"],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["tests/**/*"],
    ...vitest.configs.recommended,
  },
);
