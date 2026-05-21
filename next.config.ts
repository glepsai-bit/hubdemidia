import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fixa a raiz do projeto (evita confusão com lockfiles fora da pasta).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
