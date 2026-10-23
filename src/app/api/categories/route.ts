import { NextRequest, NextResponse } from "next/server";
import { AuthContextService } from "@/lib/services/authContext";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmIdParam = searchParams.get("farmId");
    const typeParam = searchParams.get("type"); // EXPENSE | INCOME
    const enterpriseIdParam = searchParams.get("enterpriseId");

    const context = await AuthContextService.getActiveContext(farmIdParam);
    const farmId = context.farm.id;

    const where: any = {
      OR: [{ farmId }, { farmId: null }],
    };

    if (typeParam && (typeParam === "EXPENSE" || typeParam === "INCOME")) {
      where.type = typeParam;
    }

    if (enterpriseIdParam) {
      // Find enterprise's type
      const enterprise = await prisma.enterprise.findUnique({
        where: { id: enterpriseIdParam },
      });
      if (enterprise) {
        where.AND = [
          {
            OR: [
              { enterpriseTypeId: enterprise.enterpriseTypeId },
              { enterpriseTypeId: null },
            ],
          },
        ];
      }
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({
      success: true,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        enterpriseTypeId: c.enterpriseTypeId,
        isSystem: c.isSystem,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
