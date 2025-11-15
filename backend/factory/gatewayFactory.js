import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gatewaysDir = path.join(__dirname, "../gateways");

const adapters = {};

const files = fs.readdirSync(gatewaysDir)
  .filter(file => file.endsWith(".gateway.js"));

for (const file of files) {
  const gatewayName = file.replace(".gateway.js", "").toLowerCase();
  const modulePath = path.join(gatewaysDir, file);

  
  const fileUrl = pathToFileURL(modulePath).href;
  const adapterModule = await import(fileUrl); 

  adapters[gatewayName] = adapterModule.default;
}

export default function gatewayFactory(gatewayName) {
  gatewayName = gatewayName?.toLowerCase();

  if (!gatewayName || !adapters[gatewayName]) {
    return {
      ok: false,
      message: "Unsupported gateway",
      adapter: null,
    };
  }

  return {
    ok: true,
    adapter: adapters[gatewayName],
  };
}