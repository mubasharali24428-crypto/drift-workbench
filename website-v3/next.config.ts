import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  trailingSlash: false,
  outputFileTracingRoot: import.meta.dirname,
};

export default config;
