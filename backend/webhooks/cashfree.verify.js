import crypto from "crypto";

// Verifies Cashfree webhook using HMAC-SHA256 + Base64

export default function cashfreeVerify(rawBody, headers) {
  try {
    const providedSignature = headers["x-cf-signature"];
    if (!providedSignature) {
      console.warn("⚠️ Cashfree webhook missing signature!");
      return false;
    }

    const secret = process.env.CASHFREE_WEBHOOK_SECRET;
    if (!secret) throw new Error("CASHFREE_WEBHOOK_SECRET missing");

    const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("base64");

    return computedSignature === providedSignature;
  } catch (err) {
    console.error("Cashfree Signature Verify Error:", err);
    return false;
  }
}
