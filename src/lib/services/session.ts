import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "farmpulse_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "farmpulse-auth-token-secret-production-key-2026";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  userId: string;
  email: string;
  fullName: string;
  farmId?: string;
  onboardingCompleted: boolean;
  exp: number;
}

export class SessionService {
  /**
   * Signs a payload into a secure HMAC-SHA256 token.
   */
  static signToken(payload: Omit<SessionPayload, "exp">): string {
    const exp = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
    const fullPayload: SessionPayload = { ...payload, exp };
    const dataStr = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
    const signature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(dataStr)
      .digest("base64url");
    return `${dataStr}.${signature}`;
  }

  /**
   * Verifies and decodes a session token.
   */
  static verifyToken(token: string): SessionPayload | null {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [dataStr, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(dataStr)
      .digest("base64url");

    if (signature !== expectedSig) {
      return null;
    }

    try {
      const decoded = JSON.parse(Buffer.from(dataStr, "base64url").toString("utf-8")) as SessionPayload;
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp < now) {
        return null;
      }
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Sets the session cookie on the current request context.
   */
  static async setSessionCookie(payload: Omit<SessionPayload, "exp">) {
    const token = this.signToken(payload);
    const cookieStore = cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_SECONDS,
      path: "/",
    });
    return token;
  }

  /**
   * Reads and verifies the active session from cookies.
   */
  static async getSession(): Promise<SessionPayload | null> {
    try {
      const cookieStore = cookies();
      const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      if (!token) return null;
      return this.verifyToken(token);
    } catch {
      return null;
    }
  }

  /**
   * Clears the session cookie (logout).
   */
  static async clearSessionCookie() {
    try {
      const cookieStore = cookies();
      cookieStore.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      });
    } catch {
      // In case cookies() cannot be modified in current context
    }
  }

  static getCookieName() {
    return SESSION_COOKIE_NAME;
  }
}
