import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { SessionService } from "@/lib/services/session";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = loginSchema.parse(body);

    const emailNormalized = validated.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: emailNormalized },
      include: {
        memberships: {
          include: { farm: true },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password. Please check your credentials." },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password. Please check your credentials." },
        { status: 401 }
      );
    }

    const primaryFarm = user.memberships[0]?.farm;
    const isOnboardingComplete =
      (user as any).onboardingCompleted !== undefined
        ? Boolean((user as any).onboardingCompleted)
        : user.memberships.length > 0;

    // Issue session cookie
    await SessionService.setSessionCookie({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      farmId: primaryFarm?.id,
      onboardingCompleted: isOnboardingComplete,
    });

    const redirectUrl = isOnboardingComplete ? "/dashboard" : "/onboarding";

    return NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        onboardingCompleted: !!user.onboardingCompleted,
      },
      farm: primaryFarm
        ? {
            id: primaryFarm.id,
            name: primaryFarm.name,
            slug: primaryFarm.slug,
          }
        : null,
      redirectUrl,
    });
  } catch (error: any) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Login failed" },
      { status: 400 }
    );
  }
}
