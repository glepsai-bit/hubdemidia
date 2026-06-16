// Aceita apenas URLs http(s) ou caminhos locais (/uploads/...) para usar como src de imagem.
// Bloqueia javascript:, data:, file:, vbscript: etc. para defesa em profundidade.
export function safeImageUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const v = input.trim();
  if (!v) return null;
  if (v.startsWith("/")) return v; // caminho local (ex.: /uploads/x.png)
  if (/^https?:\/\//i.test(v)) return v;
  return null;
}
