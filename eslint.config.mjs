import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // Phase X: design-system guardrails. Block patterns that bypass shared
      // components or break theme tokens. See docs/DESIGN-SYSTEM.md.
      "no-restricted-syntax": [
        "error",
        {
          // window.confirm() / confirm() — use useConfirm() from @/lib/hooks/use-confirm
          selector: "CallExpression[callee.name='confirm']",
          message: "Use the useConfirm() hook from @/lib/hooks/use-confirm — never window.confirm.",
        },
        {
          selector: "CallExpression[callee.object.name='window'][callee.property.name='confirm']",
          message: "Use the useConfirm() hook from @/lib/hooks/use-confirm — never window.confirm.",
        },
        {
          selector: "CallExpression[callee.name='alert']",
          message: "Use the useToast() hook from @/components/shared — never window.alert.",
        },
        {
          selector: "CallExpression[callee.object.name='window'][callee.property.name='alert']",
          message: "Use the useToast() hook from @/components/shared — never window.alert.",
        },
        {
          selector: "CallExpression[callee.name='prompt']",
          message: "Open a styled <Modal> with a FormInput — never window.prompt.",
        },
      ],
    },
  },
];

export default eslintConfig;
