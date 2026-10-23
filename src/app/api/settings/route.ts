import { NextRequest, NextResponse } from "next/server";
import { AuthContextService } from "@/lib/services/authContext";
import { prisma } from "@/lib/prisma";
import { logAuditAction } from "@/lib/services/auditService";
import { z } from "zod";

export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  farmName: z.string().min(2, "Farm name must be at least 2 characters").optional(),
  locationCounty: z.string().min(2, "Location is required").optional(),
  currency: z.string().length(3, "Currency must be 3 characters").optional(),
  farmSizeAcres: z.number().nullable().optional(),
  reportEmail: z.string().email("Invalid email address").optional(),
  reportDay: z.number().min(1).max(7).optional(),
  reportTime: z.string().optional(), // "HH:MM" e.g. "07:00"
  emailEnabled: z.boolean().optional(),
  farmId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmIdParam = searchParams.get("farmId");

    const context = await AuthContextService.getActiveContext(farmIdParam);
    const farmId = context.farm.id;
    const userId = context.user.id;

    // Fetch report preference
    const pref = await prisma.reportPreference.findFirst({
      where: { farmId, userId },
    });

    // Fetch team members
    const members = await prisma.farmMember.findMany({
      where: { farmId },
      include: { user: true },
      orderBy: { joinedAt: "asc" },
    });

    const reportTimeStr = pref?.timeOfDay || "07:00";

    return NextResponse.json({
      success: true,
      farm: {
        id: context.farm.id,
        name: context.farm.name,
        slug: context.farm.slug,
        locationCounty: context.farm.locationCounty,
        currency: context.farm.currency,
        farmSizeAcres: context.farm.farmSizeAcres,
        timezone: context.farm.timezone,
      },
      preferences: {
        reportEmail: pref?.emailAddress || context.user.email,
        reportDay: pref?.dayOfWeek ?? 1,
        reportTime: reportTimeStr,
        emailEnabled: pref?.isEnabled ?? true,
      },
      teamMembers: members.map((m) => ({
        id: m.id,
        name: m.user.fullName,
        email: m.user.email,
        role: m.role,
        status: "Active",
      })),
      canEdit: context.canEdit,
    });
  } catch (error: any) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = settingsSchema.parse(body);

    const context = await AuthContextService.getActiveContext(validated.farmId);
    if (!context.canEdit) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Only Owner or Manager can edit farm settings" },
        { status: 403 }
      );
    }

    const farmId = context.farm.id;
    const userId = context.user.id;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Farm profile if provided
      const farmUpdate: any = {};
      if (validated.farmName) farmUpdate.name = validated.farmName;
      if (validated.locationCounty) farmUpdate.locationCounty = validated.locationCounty;
      if (validated.currency) farmUpdate.currency = validated.currency;
      if (validated.farmSizeAcres !== undefined) farmUpdate.farmSizeAcres = validated.farmSizeAcres;

      let updatedFarm = context.farm;
      if (Object.keys(farmUpdate).length > 0) {
        updatedFarm = await tx.farm.update({
          where: { id: farmId },
          data: farmUpdate,
        });
      }

      // 2. Update / Upsert Report Preference
      const pref = await tx.reportPreference.upsert({
        where: {
          farmId_userId: { farmId, userId },
        },
        create: {
          farmId,
          userId,
          isEnabled: validated.emailEnabled ?? true,
          dayOfWeek: validated.reportDay ?? 1,
          timeOfDay: validated.reportTime || "07:00",
          emailAddress: validated.reportEmail || context.user.email,
          timezone: context.farm.timezone,
        },
        update: {
          isEnabled: validated.emailEnabled !== undefined ? validated.emailEnabled : undefined,
          dayOfWeek: validated.reportDay !== undefined ? validated.reportDay : undefined,
          timeOfDay: validated.reportTime !== undefined ? validated.reportTime : undefined,
          emailAddress: validated.reportEmail !== undefined ? validated.reportEmail : undefined,
        },
      });

      // 3. Log Audit
      await logAuditAction(
        {
          farmId,
          entityType: "SETTINGS",
          entityId: farmId,
          action: "UPDATE",
          actorId: userId,
          newValues: { farm: farmUpdate, preferences: pref },
        },
        tx
      );

      return { farm: updatedFarm, preferences: pref };
    });

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully to database",
      data: result,
    });
  } catch (error: any) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update settings" },
      { status: 400 }
    );
  }
}
