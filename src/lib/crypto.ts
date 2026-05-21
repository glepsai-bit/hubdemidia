// Criptografia simétrica para as chaves de API dos usuários (BYOK).
// As chaves NUNCA são salvas em texto puro — só o ciphertext vai para o banco (AiKey.encrypted).
//
// Requer a env ENCRYPTION_KEY: 32 bytes em hex (64 chars). Gere com:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
import crypto from "node:crypto";

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY ausente ou inválida (esperado 64 chars hex = 32 bytes).",
    );
  }
  return Buffer.from(hex, "hex");
}

/** Criptografa um texto. Formato de saída: iv:authTag:ciphertext (hex). */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

/** Descriptografa o formato gerado por encrypt(). */
export function decrypt(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(":");
  if (!ivHex || !tagHex || !dataHex) throw new Error("Payload criptografado inválido.");
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}
