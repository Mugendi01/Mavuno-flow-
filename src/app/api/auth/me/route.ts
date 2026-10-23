import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SessionService } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        memberships: {
          include: {
            farm: {
              include: {
                enterprises: {
                  include: { enterpriseType: true },
                  where: { status: "ACTIVE" },
                },
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!user) {
      await SessionService.clearSessionCookie();
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    const membership = user.memberships[0];
    const farm = membership?.farm;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        onboardingCompleted:
          (user as any).onboardingCompleted !== undefined
            ? Boolean((user as any).onboardingCompleted)
            : user.memberships.length > 0,
      },
      farm: farm
        ? {
            id: farm.id,
            name: farm.name,
            slug: farm.slug,
            locationCounty: farm.locationCounty,
            currency: farm.currency,
            farmSizeAcres: farm.farmSizeAcres,
            primaryEnterpriseId: farm.primaryEnterpriseId,
            enterprises: farm.enterprises.map((e) => ({
              id: e.id,
              name: e.name,
              code: e.enterpriseType.code,
              icon: e.enterpriseType.icon,
            })),
          }
        : null,
      role: membership?.role || "OWNER",
    });
  } catch (error: any) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { authenticated: false, error: error.message },
      { status: 500 }
    );
  }
}
