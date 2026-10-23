import { NextRequest, NextResponse } from "next/server";
import { AuthContextService } from "@/lib/services/authContext";
import { FeedInventoryService } from "@/lib/services/feedInventoryService";
import { logAuditAction } from "@/lib/services/auditService";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createPurchaseSchema = z.object({
  feedProductId: z.string().min(1, "Feed product is required"),
  enterpriseId: z.string().optional().nullable(),
  purchaseDate: z.string().optional(),
  supplierName: z.string().min(1, "Supplier name is required"),
  quantity: z.number().positive("Quantity must be greater than zero"),
  unit: z.string().min(1, "Unit is required"),
  bagWeightKg: z.number().positive().optional().nullable(),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
  paymentMethod: z.string().optional(),
  paymentStatus: z.string().optional(),
  invoiceRef: z.string().optional().nullable(),
  batchNumber: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  storageLocation: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "RECEIVED", "CANCELLED"]).optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmIdParam = searchParams.get("farmId");
    const feedProductId = searchParams.get("feedProductId") || undefined;
    const enterpriseId = searchParams.get("enterpriseId") || undefined;
    const status = searchParams.get("status") || undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 100;

    const context = await AuthContextService.getActiveContext(farmIdParam);
    const purchases = await FeedInventoryService.getPurchases(context.farm.id, {
      feedProductId,
      enterpriseId,
      status,
      limit,
    });

    return NextResponse.json({ success: true, purchases });
  } catch (error: any) {
    console.error("GET /api/livestock/purchases error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load purchases" },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmIdParam = searchParams.get("farmId");

    const context = await AuthContextService.getActiveContext(farmIdParam);
    if (!context.canEdit) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Insufficient farm permissions." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = createPurchaseSchema.parse(body);

    const purchase = await FeedInventoryService.recordPurchase(
      context.farm.id,
      context.user.id,
      validated
    );

    await logAuditAction({
      farmId: context.farm.id,
      entityType: "FeedPurchase",
      entityId: purchase.id,
      action: "CREATE",
      actorId: context.user.id,
      newValues: purchase,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ success: true, purchase }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/livestock/purchases error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record purchase" },
      { status: 400 }
    );
  }
}
