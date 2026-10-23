import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { SessionService } from "@/lib/services/session";

export const dynamic = "force-dynamic";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);

    const emailNormalized = validated.email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists. Please log in." },
        { status: 409 }
      );
    }

    // Hash password securely
    const passwordHash = await bcrypt.hash(validated.password, 10);

    // Create user (onboardingCompleted defaults to false in database)
    const newUser = await prisma.user.create({
      data: {
        fullName: validated.fullName.trim(),
        email: emailNormalized,
        phoneNumber: validated.phoneNumber?.trim() || null,
        passwordHash,
      },
    });

    // Create session cookie
    await SessionService.setSessionCookie({
      userId: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      onboardingCompleted: false,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          onboardingCompleted: false,
        },
        redirectUrl: "/onboarding",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Registration failed" },
      { status: 400 }
    );
  }
}
