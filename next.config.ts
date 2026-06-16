import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output "standalone" cria um servidor mínimo (Node-only) para Docker.
  // Reduz drasticamente o tamanho da imagem (de ~1GB para ~200MB).
  output: "standalone",

  // Fixa a raiz do projeto (evita confusão com lockfiles fora da pasta).
  turbopack: {
    root: __dirname,
  },

  // Hostnames permitidos quando usarmos next/image (admin). O portal usa <img>
  // simples por compatibilidade, mas mantemos pra futuro.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
