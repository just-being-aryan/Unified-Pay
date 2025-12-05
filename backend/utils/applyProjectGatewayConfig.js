// backend/utils/applyProjectGatewayConfig.js
import Project from "../models/project.model.js";
import { decryptVal } from "./encryption.js";

export async function applyProjectGatewayConfig(input) {
  if (!input.projectId) return input;

  const project = await Project.findById(input.projectId).lean();
  if (!project) return input;

  const gw = project.gatewayConfigs?.[input.gateway];
  if (!gw || !gw.enabled) {
    throw new Error(`Gateway '${input.gateway}' is not enabled for this project`);
  }

  console.log("PROJECT.gatewayConfigs =", project.gatewayConfigs);
  console.log("Trying gateway =", input.gateway);

  // -------------------------------------------------------
  // STEP 1 — Decrypt raw fields stored in DB
  // -------------------------------------------------------
  const raw = {};
  for (const [k, enc] of Object.entries(gw.config || {})) {
    raw[k] = enc ? decryptVal(enc) : null;
  }

  // -------------------------------------------------------
  // STEP 2 — Normalize config depending on gateway
  // -------------------------------------------------------
  let normalized = {};

  switch (input.gateway) {
    case "payu":
      normalized = {
        key: raw.merchantKey || null,
        salt: raw.merchantSalt || null,
        baseUrl: raw.baseUrl || "https://test.payu.in/_payment",
      };
      break;

    case "cashfree":
      normalized = {
        clientId: raw.clientId || null,
        clientSecret: raw.clientSecret || null,
        baseUrl: raw.baseUrl || "https://sandbox.cashfree.com/pg",
      };
      break;

    case "razorpay":
      normalized = {
        keyId: raw.keyId || null,
        keySecret: raw.keySecret || null,
      };
      break;

    case "paypal":
      normalized = {
        clientId: raw.clientId || null,
        secret: raw.secret || null,
        baseUrl: raw.baseUrl || null,
      };
      break;

    case "paytm":
      normalized = {
        mid: raw.mid || null,
        merchantKey: raw.merchantKey || null,
        website: raw.website || null,
        industry: raw.industry || null,
        channelId: raw.channelId || null,
      };
      break;

    default:
      normalized = raw;
  }

  input.config = normalized;

  // -------------------------------------------------------
  // STEP 3 — Safe redirect URL override
  // -------------------------------------------------------

  // Override only if callback URLs include an actual path ("/something")
  // Avoid overwriting with bare domain like "https://abc.ngrok-free.dev"
  const cb = project.callbacks || {};

  const hasValidPath = (url) =>
    typeof url === "string" && url.includes("/") && url.split("/").length > 3;

  // SUCCESS URL
  if (hasValidPath(cb.successUrl)) {
    input.redirect.successUrl = cb.successUrl;
  }

  // FAILURE URL
  if (hasValidPath(cb.failureUrl)) {
    input.redirect.failureUrl = cb.failureUrl;
  }

  // NOTIFY URL (webhook)
  if (hasValidPath(cb.webhookUrl)) {
    input.redirect.notifyUrl = cb.webhookUrl;
  }

  return input;
}
