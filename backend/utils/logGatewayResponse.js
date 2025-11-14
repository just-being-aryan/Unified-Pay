import GatewayResponseLog from "../models/gatewayResponseLog.model.js";

export const logGatewayResponse = async ({
  gateway,
  type,
  transactionId,
  requestPayload,
  responsePayload,
  statusCode,
  message,
}) => {
  try {
    await GatewayResponseLog.create({
      gateway,
      type,
      transactionId,
      requestPayload,
      responsePayload,
      statusCode,
      message,
    });
  } catch (err) {
    console.error("Error logging gateway response:", err.message);
  }
};
