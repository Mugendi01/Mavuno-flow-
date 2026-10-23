import { NextRequest, NextResponse } from "next/server";
import { TransactionService } from "@/lib/services/transactionService";
import { AuthContextService } from "@/lib/services/authContext";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  farmId: z.string().optional(),
  actorId: z.string().optional(),
  enterpriseId: z.string().optional(),
  categoryId: z.string().optional(),
  type: z.enum(["EXPENSE", "SALE"]).optional(),
  transactionDate: z.string().optional(),
  amount: z.number().positive().optional(),
  quantity: z.number().optional().nullable(),
  unit: z.string().optional().nullable(),
  unitPrice: z.number().optional().nullable(),
  paymentMethod: z.enum(["CASH", "MPESA", "BANK", "CREDIT", "OTHER"]).optional(),
  paymentStatus: z.enum(["PAID", "PARTIALLY_PAID", "CREDIT"]).optional(),
  salesChannel: z.string().optional().nullable(),
  buyerName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tx = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: {
        enterprise: true,
        category: true,
        createdBy: true,
        receivable: true,
        receipt: true,
      },
    });

    if (!tx || tx.isDeleted) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      transaction: TransactionService.mapToDTO(tx),
    });
  } catch (error: any) {
    console.error("GET /api/transactions/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch transaction" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = updateSchema.parse(body);

    const authContext = await AuthContextService.getActiveContext(validated.farmId);
    const farmId = authContext.farm.id;
    const actorId = validated.actorId || authContext.user.id;

    const updated = await TransactionService.updateTransaction(
      params.id,
      farmId,
      actorId,
      validated
    );

    return NextResponse.json({ success: true, transaction: updated });
  } catch (error: any) {
    console.error("PUT /api/transactions/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update transaction" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const farmIdParam = searchParams.get("farmId");
    const actorIdParam = searchParams.get("actorId");

    const authContext = await AuthContextService.getActiveContext(farmIdParam);
    const farmId = authContext.farm.id;
    const actorId = actorIdParam || authContext.user.id;

    const deleted = await TransactionService.softDeleteTransaction(
      params.id,
      farmId,
      actorId
    );

    return NextResponse.json({ success: true, transaction: deleted });
  } catch (error: any) {
    console.error("DELETE /api/transactions/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
