import crypto from "crypto";

/**
 * Validates Meta WhatsApp Webhook SHA-256 HMAC Signature
 * Header format: X-Hub-Signature-256: sha256=<hex_digest>
 * 
 * Uses constant-time comparison (crypto.timingSafeEqual) to prevent timing attacks.
 */
export function verifyWhatsAppWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined
): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  // In development placeholder mode, if app secret is not yet configured
  if (!appSecret || appSecret.includes("placeholder")) {
    if (process.env.NODE_ENV !== "production") {
      return true;
    }
    return false;
  }

  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expectedSignature = signatureHeader.slice(7); // Remove 'sha256=' prefix

  try {
    const hmac = crypto.createHmac("sha256", appSecret);
    hmac.update(rawBody, "utf8");
    const calculatedSignature = hmac.digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const calculatedBuffer = Buffer.from(calculatedSignature, "utf8");

    if (expectedBuffer.length !== calculatedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, calculatedBuffer);
  } catch (error) {
    console.error("WhatsApp signature verification exception:", error);
    return false;
  }
}
