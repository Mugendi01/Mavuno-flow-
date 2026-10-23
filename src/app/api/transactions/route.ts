import { NextRequest, NextResponse } from "next/server";
import { TransactionService } from "@/lib/services/transactionService";
import { z } from "zod";

const transactionSchema = z.object({
  localId: z.string().optional(),
  farmId: z.string().min(1, "Farm ID is required"),
  enterpriseId: z.string().min(1, "Enterprise is required"),
  categoryId: z.string().min(1, "Category is required"),
  createdById: z.string().min(1, "User ID is required"),
  type: z.enum(["EXPENSE", "SALE"]),
  transactionDate: z.string().min(1, "Transaction date is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  quantity: z.number().optional().nullable(),
  unit: z.string().optional().nullable(),
  unitPrice: z.number().optional().nullable(),
  paymentMethod: z.enum(["CASH", "MPESA", "BANK", "CREDIT", "OTHER"]),
  paymentStatus: z.enum(["PAID", "PARTIALLY_PAID", "CREDIT"]),
  salesChannel: z.string().optional().nullable(),
  buyerName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
});

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmId = searchParams.get("farmId");

    if (!farmId) {
      return NextResponse.json({ error: "Missing farmId parameter" }, { status: 400 });
    }

    const enterpriseId = searchParams.get("enterpriseId") || undefined;
    const type = (searchParams.get("type") as any) || undefined;
    const paymentStatus = searchParams.get("paymentStatus") || undefined;
    const paymentMethod = searchParams.get("paymentMethod") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 50;
    const offset = searchParams.get("offset") ? Number(searchParams.get("offset")) : 0;

    const data = await TransactionService.getTransactions({
      farmId,
      enterpriseId,
      type,
      paymentStatus,
      paymentMethod,
      dateFrom,
      dateTo,
      search,
      limit,
      offset,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = transactionSchema.parse(body);

    const result = await TransactionService.createTransaction({
      localId: validated.localId,
      farmId: validated.farmId,
      enterpriseId: validated.enterpriseId,
      categoryId: validated.categoryId,
      createdById: validated.createdById,
      type: validated.type,
      transactionDate: validated.transactionDate,
      amount: validated.amount,
      quantity: validated.quantity ?? undefined,
      unit: validated.unit ?? undefined,
      unitPrice: validated.unitPrice ?? undefined,
      paymentMethod: validated.paymentMethod,
      paymentStatus: validated.paymentStatus,
      salesChannel: validated.salesChannel ?? undefined,
      buyerName: validated.buyerName ?? undefined,
      notes: validated.notes ?? undefined,
      receiptUrl: validated.receiptUrl ?? undefined,
    });

    return NextResponse.json(
      { success: true, ...result },
      { status: result.isExisting ? 200 : 201 }
    );
  } catch (error: any) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create transaction" },
      { status: 400 }
    );
  }
}
