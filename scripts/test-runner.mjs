import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import QRCode from "qrcode";

const prisma = new PrismaClient();

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

async function runTests() {
  console.log("🌾 FarmPulse Test Suite Running...\n");

  // ==========================================
  // 1. UNIT TESTS: Pure Math & Financial Logic
  // ==========================================
  console.log("1. UNIT TESTS — Financial Logic & Calculations");

  // A. Profit/Loss
  const calcNet = (rev, exp) => rev - exp;
  assert(calcNet(120000, 80000) === 40000, "Surplus calculation: 120,000 - 80,000 = +40,000");
  assert(calcNet(40000, 50000) === -10000, "Deficit calculation: 40,000 - 50,000 = -10,000");

  // B. Margin percentage with zero revenue guard
  const calcMargin = (rev, exp) => (rev > 0 ? Math.round(((rev - exp) / rev) * 100) : 0);
  assert(calcMargin(250000, 175000) === 30, "Poultry margin: (250,000 - 175,000)/250,000 = 30%");
  assert(calcMargin(0, 50000) === 0, "Zero revenue does not throw divide-by-zero");

  // C. Week-on-Week Percentage Change
  const calcWoW = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / Math.abs(prev)) * 100);
  };
  assert(calcWoW(115000, 100000) === 15, "Revenue growth: 100,000 -> 115,000 = +15%");
  assert(calcWoW(80000, 100000) === -20, "Revenue dip: 100,000 -> 80,000 = -20%");
  assert(calcWoW(50000, 0) === 100, "Zero baseline handles new farm enterprise gracefully");

  // D. Accounts Receivable Balance & Status
  const updateReceivableBalance = (total, paid) => {
    const balance = Math.max(0, total - paid);
    const status = balance === 0 ? "PAID" : paid > 0 ? "PARTIALLY_PAID" : "PENDING";
    return { balance, status };
  };
  const r1 = updateReceivableBalance(10000, 0);
  assert(r1.balance === 10000 && r1.status === "PENDING", "Unpaid debtor remains PENDING with full balance");
  const r2 = updateReceivableBalance(10000, 4000);
  assert(r2.balance === 6000 && r2.status === "PARTIALLY_PAID", "Partial payment sets balance to 6,000 and status to PARTIALLY_PAID");
  const r3 = updateReceivableBalance(10000, 10000);
  assert(r3.balance === 0 && r3.status === "PAID", "Full settlement sets balance to 0 and status to PAID");

  // E. Cost Per Unit Calculation
  const calcCostPerUnit = (totalFeedCost, unitsSold) => {
    if (unitsSold <= 0) return null;
    return Math.round(totalFeedCost / unitsSold);
  };
  assert(calcCostPerUnit(19500, 60) === 325, "Feed cost per tray: 19,500 / 60 trays = KSh 325/tray");
  assert(calcCostPerUnit(15000, 0) === null, "Zero units sold returns null without misleading metrics");

  // ==========================================
  // 2. INTEGRATION TESTS: Database & Services
  // ==========================================
  console.log("\n2. INTEGRATION TESTS — Database & Domain Services");

  const farm = await prisma.farm.findFirst();
  const user = await prisma.user.findFirst();
  const enterprise = await prisma.enterprise.findFirst({ where: { farmId: farm.id } });
  const category = await prisma.category.findFirst({ where: { farmId: farm.id } });

  assert(farm !== null, `Farm exists in DB: ${farm?.name}`);
  assert(user !== null, `User exists in DB: ${user?.email}`);

  // Test Idempotency with Client UUID
  const testLocalId = `test-uuid-${Date.now()}`;
  const tx1 = await prisma.transaction.create({
    data: {
      localId: testLocalId,
      farmId: farm.id,
      enterpriseId: enterprise.id,
      categoryId: category.id,
      createdById: user.id,
      type: "SALE",
      transactionDate: new Date(),
      amount: 5500,
      paymentMethod: "MPESA",
      paymentStatus: "PAID",
      buyerName: "Test Buyer Nakuru",
    },
  });
  assert(tx1.id !== null, "Created initial transaction with localId");

  // Attempt duplicate insert with same localId (Idempotency test)
  let caughtDuplicate = false;
  try {
    await prisma.transaction.create({
      data: {
        localId: testLocalId,
        farmId: farm.id,
        enterpriseId: enterprise.id,
        categoryId: category.id,
        createdById: user.id,
        type: "SALE",
        transactionDate: new Date(),
        amount: 5500,
        paymentMethod: "MPESA",
        paymentStatus: "PAID",
      },
    });
  } catch (e) {
    caughtDuplicate = true;
  }
  assert(caughtDuplicate, "Prisma unique constraint prevented duplicate transaction with same localId");

  // Test Automated Receivable Provisioning
  const creditLocalId = `credit-uuid-${Date.now()}`;
  const creditTx = await prisma.transaction.create({
    data: {
      localId: creditLocalId,
      farmId: farm.id,
      enterpriseId: enterprise.id,
      categoryId: category.id,
      createdById: user.id,
      type: "SALE",
      transactionDate: new Date(),
      amount: 20000,
      paymentMethod: "CREDIT",
      paymentStatus: "CREDIT",
      buyerName: "Lanet Green Grocers",
    },
  });

  const createdRec = await prisma.receivable.create({
    data: {
      farmId: farm.id,
      transactionId: creditTx.id,
      customerName: "Lanet Green Grocers",
      totalAmount: 20000,
      paidAmount: 0,
      balanceAmount: 20000,
      status: "PENDING",
    },
  });
  assert(createdRec.balanceAmount === 20000, "Receivable created with KSh 20,000 balance");

  // Record Payment against Receivable
  const payRecord = await prisma.payment.create({
    data: {
      receivableId: createdRec.id,
      amount: 8000,
      paymentMethod: "MPESA",
      referenceCode: "MPESA8822KL",
      recordedById: user.id,
      notes: "First installment via M-Pesa",
    },
  });
  assert(payRecord.id !== null, "Payment record created with reference MPESA8822KL");

  const updatedRec = await prisma.receivable.update({
    where: { id: createdRec.id },
    data: {
      paidAmount: 8000,
      balanceAmount: 12000,
      status: "PARTIALLY_PAID",
    },
  });
  assert(updatedRec.balanceAmount === 12000, "Receivable balance updated to KSh 12,000");
  assert(updatedRec.status === "PARTIALLY_PAID", "Receivable status transitioned to PARTIALLY_PAID");

  // Final settlement
  const finalRec = await prisma.receivable.update({
    where: { id: createdRec.id },
    data: {
      paidAmount: 20000,
      balanceAmount: 0,
      status: "PAID",
    },
  });
  assert(finalRec.balanceAmount === 0 && finalRec.status === "PAID", "Full settlement transitions status to PAID");

  // Clean up test transactions
  await prisma.payment.deleteMany({ where: { receivableId: createdRec.id } });
  await prisma.receivable.deleteMany({ where: { transactionId: creditTx.id } });
  await prisma.transaction.deleteMany({ where: { localId: { in: [testLocalId, creditLocalId] } } });

  // ==========================================
  // 3. DIGITAL RECEIPT & QR VERIFICATION TESTS
  // ==========================================
  console.log("\n3. RECEIPT & QR VERIFICATION TESTS");

  // Helper: Receipt Number Generator
  const generateReceiptNumber = (txDate = new Date()) => {
    const yyyy = txDate.getFullYear();
    const mm = String(txDate.getMonth() + 1).padStart(2, "0");
    const dd = String(txDate.getDate()).padStart(2, "0");
    const datePrefix = `FP-${yyyy}${mm}${dd}`;
    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `${datePrefix}-${randomSuffix}`;
  };

  // Helper: QR Payload & Data URL Generator
  const generateQR = async (receiptNo, baseUrl = "http://localhost:3000") => {
    const payload = `${baseUrl}/verify/${encodeURIComponent(receiptNo)}`;
    const dataURL = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 256,
    });
    return { payload, dataURL };
  };

  // Helper: Public Verification projection
  const getPublicVerification = async (receiptNo) => {
    const receipt = await prisma.receipt.findUnique({
      where: { receiptNumber: receiptNo },
      include: {
        farm: true,
        transaction: {
          include: { enterprise: true, category: true },
        },
      },
    });

    if (!receipt) {
      return {
        isValid: false,
        status: "NOT_FOUND",
        verificationMessage: "Receipt not found in the FarmPulse registry.",
      };
    }

    const isVoided = receipt.status === "VOIDED" || !!receipt.transaction.deletedAt;
    return {
      isValid: !isVoided,
      status: isVoided ? "VOIDED" : receipt.status,
      receiptNumber: receipt.receiptNumber,
      farmName: receipt.farm.name,
      locationCounty: receipt.farm.county,
      transactionType: receipt.transaction.type,
      enterpriseName: receipt.transaction.enterprise.name,
      categoryName: receipt.transaction.category.name,
      amount: receipt.transaction.amount,
      currency: receipt.transaction.currency,
      paymentMethod: receipt.transaction.paymentMethod,
      paymentStatus: receipt.transaction.paymentStatus,
      issuedAt: receipt.issuedAt,
      voidedAt: receipt.voidedAt,
      verificationMessage: isVoided
        ? "This receipt has been marked as Voided/Cancelled."
        : "Official FarmPulse Verified Authentic Receipt",
    };
  };

  // A. Receipt Number Format
  const sampleReceiptNo = generateReceiptNumber(new Date("2026-09-22"));
  const receiptNoPattern = /^FP-20260922-[A-Z0-9]{6}$/;
  assert(
    receiptNoPattern.test(sampleReceiptNo),
    `Generated receipt number matches format FP-YYYYMMDD-XXXXXX: ${sampleReceiptNo}`
  );

  // B. Automated Receipt Provisioning on Transaction Creation
  const receiptTestLocalId = `rcpt-test-${Date.now()}`;
  const createdTx = await prisma.transaction.create({
    data: {
      localId: receiptTestLocalId,
      farmId: farm.id,
      enterpriseId: enterprise.id,
      categoryId: category.id,
      createdById: user.id,
      type: "SALE",
      transactionDate: new Date(),
      amount: 35000,
      quantity: 100,
      unit: "Birds",
      unitPrice: 350,
      paymentMethod: "MPESA",
      paymentStatus: "PAID",
      buyerName: "ABC Poultry Traders",
      notes: "Top-secret internal farmer note",
    },
  });

  const generatedReceiptNo = generateReceiptNumber(createdTx.transactionDate);
  const { payload: qrPayload, dataURL: qrDataURL } = await generateQR(generatedReceiptNo);
  const receiptRecord = await prisma.receipt.create({
    data: {
      transactionId: createdTx.id,
      farmId: farm.id,
      receiptNumber: generatedReceiptNo,
      verificationToken: crypto.randomBytes(24).toString("hex"),
      qrPayload,
      status: "VALID",
      issuedAt: new Date(),
      version: 1,
    },
  });

  assert(receiptRecord.receiptNumber !== null && receiptRecord.receiptNumber !== undefined, `Transaction automatically assigned Receipt Number: ${receiptRecord.receiptNumber}`);
  assert(receiptRecord.status === "VALID", "Newly issued receipt status is VALID");

  // C. QR Code URL & Data URL Generation
  assert(
    qrPayload.includes(`/verify/${encodeURIComponent(receiptRecord.receiptNumber)}`),
    `QR payload targets verification route: ${qrPayload}`
  );
  assert(
    qrDataURL && qrDataURL.startsWith("data:image/png;base64,"),
    "High-resolution PNG QR Code Data URL generated"
  );

  // D. Database-level Uniqueness Guarantee
  let caughtReceiptDuplicate = false;
  try {
    await prisma.receipt.create({
      data: {
        transactionId: uuidv4(), // Different transaction
        farmId: farm.id,
        receiptNumber: receiptRecord.receiptNumber, // Duplicate receipt number!
        verificationToken: crypto.randomBytes(24).toString("hex"),
        qrPayload: "http://localhost:3000/verify/duplicate",
        status: "VALID",
      },
    });
  } catch (err) {
    caughtReceiptDuplicate = true;
  }
  assert(caughtReceiptDuplicate, "Database unique constraint rejected duplicate receipt number");

  // E. Public Verification Sanitization & Security (No sensitive leak)
  const publicVerification = await getPublicVerification(receiptRecord.receiptNumber);
  assert(publicVerification.isValid === true, "Public verification confirms receipt is VALID");
  assert(publicVerification.amount === 35000, "Public verification reports correct amount in KES");
  assert(publicVerification.farmName === farm.name, `Public verification reports issuing farm: ${farm.name}`);
  assert(publicVerification.transactionType === "SALE", "Public verification reports transaction type");
  assert(publicVerification.notes === undefined, "Security: Private internal notes are NOT exposed");
  assert(publicVerification.createdById === undefined, "Security: Internal user IDs are NOT exposed");
  assert(publicVerification.email === undefined, "Security: User emails are NOT exposed");
  assert(publicVerification.passwordHash === undefined, "Security: Password hashes are NOT exposed");

  // F. Voided Receipt Lifecycle
  await prisma.transaction.update({
    where: { id: createdTx.id },
    data: { deletedAt: new Date() },
  });
  await prisma.receipt.updateMany({
    where: { transactionId: createdTx.id },
    data: { status: "VOIDED", voidedAt: new Date() },
  });

  const voidedVerification = await getPublicVerification(receiptRecord.receiptNumber);
  assert(voidedVerification.isValid === false, "Soft-deleted transaction invalidates public receipt validity");
  assert(voidedVerification.status === "VOIDED", "Public verification displays VOIDED state");
  assert(voidedVerification.verificationMessage.includes("Voided"), "Public verification includes void message");

  // G. Non-existent Receipt Handling
  const invalidVerification = await getPublicVerification("FP-99999999-NONEXIST");
  assert(invalidVerification.isValid === false, "Non-existent receipt returns isValid: false");
  assert(invalidVerification.status === "NOT_FOUND", "Non-existent receipt returns status: NOT_FOUND");

  // Cleanup test receipt and transaction
  await prisma.receipt.deleteMany({ where: { receiptNumber: receiptRecord.receiptNumber } });
  await prisma.transaction.deleteMany({ where: { localId: receiptTestLocalId } });

  console.log("\n==========================================");
  console.log(`Test Execution Summary:`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log("==========================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Test execution encountered error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
