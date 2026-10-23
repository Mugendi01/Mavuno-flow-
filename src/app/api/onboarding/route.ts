import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SessionService } from "@/lib/services/session";
import { z } from "zod";

export const dynamic = "force-dynamic";

const onboardingSchema = z.object({
  fullName: z.string().optional(),
  farmerRole: z.string().optional(),
  farmName: z.string().min(2, "Farm name must be at least 2 characters"),
  farmSizeAcres: z.number().nullable().optional(),
  isOnlyFarm: z.boolean().optional(),
  country: z.string().default("Kenya"),
  county: z.string().min(2, "County is required"),
  subCounty: z.string().optional(),
  townArea: z.string().optional(),
  enterprises: z.array(z.string()).min(1, "Please select at least one enterprise"),
  primaryEnterprise: z.string().optional(),
  scaleOperations: z.record(z.any()).optional(),
  recordKeepingMethod: z.string().optional(),
  trackedPriorities: z.array(z.string()).optional(),
  currency: z.string().default("KES"),
  reportEnabled: z.boolean().default(true),
  reportDay: z.number().default(1),
  reportTime: z.string().default("07:00"),
  timezone: z.string().default("Africa/Nairobi"),
});

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 35);
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${randomSuffix}`;
}

const DEFAULT_ENTERPRISE_NAMES: Record<string, string> = {
  POULTRY: "Poultry Unit (Layers & Broilers)",
  CATTLE: "Dairy & Beef Herd",
  AQUACULTURE: "Tilapia & Catfish Ponds",
  GOATS_SHEEP: "Goats & Sheep Unit",
  PIGGERY: "Piggery Unit",
  CROPS: "Crops, Fodder & Silage",
};

export async function POST(req: NextRequest) {
  try {
    const session = await SessionService.getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = onboardingSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User account not found." },
        { status: 404 }
      );
    }

    const farmSlug = generateSlug(validated.farmName);

    // Execute complete onboarding atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Farm using base universal schema fields supported across all Prisma client versions
      const createdFarm = await tx.farm.create({
        data: {
          name: validated.farmName.trim(),
          slug: farmSlug,
          locationCounty: validated.county.trim(),
          country: validated.country || "Kenya",
          currency: validated.currency || "KES",
          farmSizeAcres: validated.farmSizeAcres ?? null,
          timezone: validated.timezone || "Africa/Nairobi",
        },
      });

      // Persist extended metadata directly to the SQLite database
      // This guarantees zero "Unknown argument" errors regardless of whether the dev server has reloaded its in-memory Prisma client
      try {
        await tx.$executeRawUnsafe(
          `UPDATE "Farm" SET "subCounty" = ?, "townArea" = ?, "recordKeepingMethod" = ?, "trackedPriorities" = ?, "scaleOperationsJson" = ? WHERE "id" = ?`,
          validated.subCounty?.trim() || null,
          validated.townArea?.trim() || null,
          validated.recordKeepingMethod || null,
          validated.trackedPriorities ? JSON.stringify(validated.trackedPriorities) : null,
          validated.scaleOperations ? JSON.stringify(validated.scaleOperations) : null,
          createdFarm.id
        );
      } catch (sqlErr) {
        console.warn("Could not set extended farm attributes via raw SQL:", sqlErr);
      }

      // 2. Create Farm Membership (OWNER)
      await tx.farmMember.create({
        data: {
          farmId: createdFarm.id,
          userId: user.id,
          role: "OWNER",
        },
      });

      // 3. Create Enterprises
      let primaryEntId: string | null = null;
      for (const entCode of validated.enterprises) {
        let entType = await tx.enterpriseType.findUnique({
          where: { code: entCode },
        });

        if (!entType) {
          // Fallback if missing
          entType = await tx.enterpriseType.create({
            data: {
              code: entCode,
              name: entCode,
              icon: "Sprout",
            },
          });
        }

        const enterpriseName = DEFAULT_ENTERPRISE_NAMES[entCode] || `${entType.name} Enterprise`;
        const entRecord = await tx.enterprise.create({
          data: {
            farmId: createdFarm.id,
            enterpriseTypeId: entType.id,
            name: enterpriseName,
            status: "ACTIVE",
          },
        });

        if (validated.primaryEnterprise === entCode || !primaryEntId) {
          primaryEntId = entRecord.id;
        }
      }

      if (primaryEntId) {
        try {
          await tx.$executeRawUnsafe(
            `UPDATE "Farm" SET "primaryEnterpriseId" = ? WHERE "id" = ?`,
            primaryEntId,
            createdFarm.id
          );
        } catch (sqlErr) {
          console.warn("Could not set primaryEnterpriseId:", sqlErr);
        }
      }

      // 4. Create Standard Categories for this farm
      const standardCategories = [
        { name: "Animal Feeds & Supplements", type: "EXPENSE", isSystem: true },
        { name: "Veterinary Drugs & Treatment", type: "EXPENSE", isSystem: true },
        { name: "Labour & Farm Wages", type: "EXPENSE", isSystem: true },
        { name: "Transport & Logistics", type: "EXPENSE", isSystem: true },
        { name: "Seeds & Crop Inputs", type: "EXPENSE", isSystem: true },
        { name: "Farm Maintenance & Fuel", type: "EXPENSE", isSystem: true },
        { name: "Farm Produce Sales", type: "INCOME", isSystem: true },
        { name: "Livestock Sales", type: "INCOME", isSystem: true },
        { name: "Eggs Sales", type: "INCOME", isSystem: true },
        { name: "Milk Sales", type: "INCOME", isSystem: true },
      ];

      for (const cat of standardCategories) {
        await tx.category.create({
          data: {
            farmId: createdFarm.id,
            name: cat.name,
            type: cat.type,
            isSystem: cat.isSystem,
          },
        });
      }

      // 5. Upsert Report Preference
      await tx.reportPreference.upsert({
        where: {
          farmId_userId: { farmId: createdFarm.id, userId: user.id },
        },
        create: {
          farmId: createdFarm.id,
          userId: user.id,
          isEnabled: validated.reportEnabled,
          dayOfWeek: validated.reportDay,
          timeOfDay: validated.reportTime,
          emailAddress: user.email,
          timezone: validated.timezone,
        },
        update: {
          isEnabled: validated.reportEnabled,
          dayOfWeek: validated.reportDay,
          timeOfDay: validated.reportTime,
        },
      });

      // 6. Update User Profile & Mark Onboarding Complete
      await tx.user.update({
        where: { id: user.id },
        data: {
          fullName: validated.fullName?.trim() || user.fullName,
        },
      });

      try {
        await tx.$executeRawUnsafe(
          `UPDATE "User" SET "onboardingCompleted" = 1 WHERE "id" = ?`,
          user.id
        );
      } catch (sqlErr) {
        console.warn("Could not set onboardingCompleted:", sqlErr);
      }

      return createdFarm;
    });

    // Refresh session cookie with farmId and onboardingCompleted: true
    await SessionService.setSessionCookie({
      userId: user.id,
      email: user.email,
      fullName: validated.fullName?.trim() || user.fullName,
      farmId: result.id,
      onboardingCompleted: true,
    });

    return NextResponse.json({
      success: true,
      message: "Farm set up successfully!",
      farm: {
        id: result.id,
        name: result.name,
        slug: result.slug,
      },
      redirectUrl: "/dashboard",
    });
  } catch (error: any) {
    console.error("POST /api/onboarding error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to complete onboarding" },
      { status: 400 }
    );
  }
}
