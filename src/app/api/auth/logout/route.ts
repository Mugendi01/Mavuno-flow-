import { NextRequest, NextResponse } from "next/server";
import { SessionService } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await SessionService.clearSessionCookie();
    return NextResponse.json({
      success: true,
      message: "Logged out successfully.",
      redirectUrl: "/",
    });
  } catch (error: any) {
    console.error("POST /api/auth/logout error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Logout failed" },
      { status: 500 }
    );
  }
}
