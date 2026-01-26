import crypto from "crypto";

export function generateIdrxHeaders(
  apiKey: string,
  apiSecret: string,
  body?: any,
) {
  const timestamp = Date.now().toString();

  // Logic: Some IDRX endpoints sign with body, others just timestamp.
  const payload = body ? apiKey + timestamp + JSON.stringify(body) : timestamp;

  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(payload)
    .digest("hex");

  return {
    "idrx-api-key": apiKey,
    "idrx-api-sig": signature,
    "idrx-api-ts": timestamp,
  };
}
