import next from "eslint-config-next";

const config = [
  ...next,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "next-env.d.ts",
      "**/*.orig",
    ],
  },
];

export default config;
