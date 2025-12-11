// backend/utils/encryption.js
import crypto from "crypto";

const KEY = process.env.MASTER_ENCRYPTION_KEY || null; // should be 32 bytes (hex or raw)
const IV_LENGTH = 16;

function keyAvailable() {
  return !!KEY;
}


export function encryptVal(str) {
  if (str === null || str === undefined) return null;

  
  if (!keyAvailable()) {
    
    console.warn(
      "[ENCRYPTION] MASTER_ENCRYPTION_KEY not set — storing value as plaintext (dev only)."
    );
    return String(str);
  }

  
  const keyBuf = Buffer.from(KEY, "utf8");
  if (keyBuf.length !== 32) {
    throw new Error(
      `MASTER_ENCRYPTION_KEY must be 32 bytes. Current length: ${keyBuf.length}`
    );
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", keyBuf, iv);

  let encrypted = cipher.update(String(str), "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
}

export function decryptVal(enc) {
  if (enc === null || enc === undefined) return null;

  
  if (!keyAvailable()) {
   
    console.warn("[ENCRYPTION] MASTER_ENCRYPTION_KEY not set — returning plaintext (dev only).");
    return String(enc);
  }

  const keyBuf = Buffer.from(KEY, "utf8");
  if (keyBuf.length !== 32) {
    throw new Error(
      `MASTER_ENCRYPTION_KEY must be 32 bytes. Current length: ${keyBuf.length}`
    );
  }

  const [ivHex, encrypted] = String(enc).split(":");
  if (!ivHex || !encrypted) throw new Error("Invalid encrypted payload format");

  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", keyBuf, iv);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
