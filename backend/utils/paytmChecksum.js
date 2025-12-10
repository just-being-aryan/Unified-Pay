import crypto from "crypto";

class PaytmChecksum {
  static async generateSignature(body, merchantKey) {
    const salt = PaytmChecksum.generateRandomString(4);
    const bodyString = typeof body === "string" ? body : JSON.stringify(body);

    const toSign = bodyString + "|" + salt;
    const sha256 = crypto.createHash("sha256").update(toSign).digest("hex");
    const hashString = sha256 + salt;

    return PaytmChecksum.encrypt(hashString, merchantKey);
  }

  static generateRandomString(length) {
    return crypto.randomBytes(length).toString("hex").substr(0, length);
  }

  static encrypt(input, key) {
    const keyBytes = crypto.createHash("sha256").update(key).digest();
    const key16 = keyBytes.slice(0, 16);

    const cipher = crypto.createCipheriv("AES-128-CBC", key16, Buffer.alloc(16, 0));
    let encrypted = cipher.update(input, "utf8", "base64");
    encrypted += cipher.final("base64");

    return encrypted;
  }
}

export default PaytmChecksum;
