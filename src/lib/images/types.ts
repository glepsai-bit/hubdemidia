// Resultado de uma busca de imagem em banco grátis.
export interface ImageHit {
  url: string; // URL direta da imagem (será baixada e republicada em /uploads)
  source: "unsplash" | "pexels";
  width?: number;
  height?: number;
  credit?: string; // "Foto: Autor / Unsplash" (não é obrigatório por licença, mas mantemos)
}
