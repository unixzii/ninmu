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
    rules: { eqeqeq: "error" },
  },
  {
    files: ["tests/**/*"],
    ...vitest.configs.recommended,
  },
);
