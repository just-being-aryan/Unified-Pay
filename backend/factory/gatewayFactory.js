import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gatewaysDir = path.join(__dirname, "../gateways");
const adapters = {};

// Load all gateway modules
const files = fs
  .readdirSync(gatewaysDir)
  .filter((file) => file.endsWith(".gateway.js"));

for (const file of files) {
  const gatewayName = file.replace(".gateway.js", "").toLowerCase();
  const modulePath = path.join(gatewaysDir, file);
  const fileUrl = pathToFileURL(modulePath).href;

  const adapterModule = await import(fileUrl);
  adapters[gatewayName] = adapterModule.default; // plain object
}

// OPTIONAL: config normalization (keep it)
function normalizeConfig(gatewayName, rawConfig = {}) {
  const cfg = rawConfig.credentials || {};
  const mode = rawConfig.mode || rawConfig.environment || "test";

  switch (gatewayName) {
    case "payu":
      return {
        merchantKey: cfg.merchantKey || cfg.key || "",
        merchantSalt: cfg.merchantSalt || cfg.salt || "",
        mode,
      };

    case "razorpay":
      return {
        keyId: cfg.keyId || cfg.key_id || "",
        keySecret: cfg.keySecret || cfg.key_secret || "",
      };

    case "cashfree":
      return {
        clientId: cfg.clientId || cfg.client_id || "",
        clientSecret: cfg.clientSecret || cfg.client_secret || "",
        mode,
      };

    default:
      return rawConfig;
  }
}

// FIXED MAIN FUNCTION (NO NEW !!!)
export default function gatewayFactory(gatewayName, config = {}) {
  gatewayName = gatewayName?.toLowerCase();

  if (!gatewayName || !adapters[gatewayName]) {
    return {
      ok: false,
      message: `Unsupported gateway: ${gatewayName}`,
      adapter: null,
    };
  }

  const normalized = normalizeConfig(gatewayName, config);

  // RETURN PLAIN OBJECT + NORMALIZED CONFIG
  return {
    ok: true,
    adapter: {
      ...adapters[gatewayName], 
      config: normalized,
    },
  };
}
