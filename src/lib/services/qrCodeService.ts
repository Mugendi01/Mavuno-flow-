import QRCode from "qrcode";

export class QRCodeService {
  /**
   * Builds the canonical verification URL for a given receipt number.
   * e.g. https://yourdomain.com/verify/FP-20260922-000184
   */
  static buildVerificationURL(receiptNumber: string, baseUrl?: string): string {
    const origin =
      baseUrl ||
      (typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

    return `${origin}/verify/${encodeURIComponent(receiptNumber)}`;
  }

  /**
   * Generates a high-resolution QR code as a base64 Data URL (PNG).
   * Formatted with optimal error correction and quiet-zone margins for mobile scanning and printing.
   */
  static async generateQRCodeDataURL(
    payload: string,
    options?: { width?: number; margin?: number }
  ): Promise<string> {
    try {
      return await QRCode.toDataURL(payload, {
        errorCorrectionLevel: "H", // High error correction for robust camera scanning
        type: "image/png",
        margin: options?.margin ?? 2,
        width: options?.width ?? 320,
        color: {
          dark: "#1B4332", // MavunoFlow Deep Forest Green for branding & high contrast
          light: "#FFFFFF",
        },
      });
    } catch (err) {
      console.error("Failed to generate QR code Data URL:", err);
      // Fallback to simple black & white
      return await QRCode.toDataURL(payload);
    }
  }

  /**
   * Generates SVG string for lightweight vector embedding in PDF/HTML.
   */
  static async generateQRCodeSVG(payload: string): Promise<string> {
    return await QRCode.toString(payload, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 2,
      color: {
        dark: "#1B4332",
        light: "#FFFFFF",
      },
    });
  }
}
