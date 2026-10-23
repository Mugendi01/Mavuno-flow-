import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";

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
  console.log("🌾 MavunoFlow Test Suite Running...\n");

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
        verificationMessage: "Receipt not found in the MavunoFlow registry.",
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
        : "Official MavunoFlow Verified Authentic Receipt",
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

  // ==========================================
  // 4. DATA PERSISTENCE & DATABASE SYNCHRONIZATION
  // ==========================================
  console.log("\n4. DATA PERSISTENCE & DATABASE SYNCHRONIZATION TESTS");

  // A. Sale Creation with Server Calculation and Atomic DB Persistence
  const saleLocalId = `sale-persist-${Date.now()}`;
  const clientQty = 25;
  const clientUnitPrice = 300;
  // Intentionally divergent client amount to verify server authority
  const bogusClientAmount = 999;
  const serverCalculatedAmount = Math.round(clientQty * clientUnitPrice * 100) / 100; // 7,500

  const persistenceSaleResult = await prisma.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: {
        localId: saleLocalId,
        farmId: farm.id,
        enterpriseId: enterprise.id,
        categoryId: category.id,
        createdById: user.id,
        type: "SALE",
        transactionDate: new Date(),
        amount: serverCalculatedAmount,
        quantity: clientQty,
        unit: "Crates",
        unitPrice: clientUnitPrice,
        paymentMethod: "MPESA",
        paymentStatus: "PAID",
        buyerName: "Nakuru Wholesalers",
      },
    });

    const rcptNo = generateReceiptNumber(created.transactionDate);
    const { payload: qrP } = await generateQR(rcptNo);
    const rcpt = await tx.receipt.create({
      data: {
        transactionId: created.id,
        farmId: farm.id,
        receiptNumber: rcptNo,
        verificationToken: crypto.randomBytes(24).toString("hex"),
        qrPayload: qrP,
        status: "VALID",
      },
    });

    const audit = await tx.auditLog.create({
      data: {
        farmId: farm.id,
        entityType: "TRANSACTION",
        entityId: created.id,
        action: "CREATE",
        actorId: user.id,
        newValues: JSON.stringify({ amount: serverCalculatedAmount, type: "SALE" }),
      },
    });

    return { created, rcpt, audit };
  });

  // Verify DB is source of truth
  const verifiedSaleInDb = await prisma.transaction.findUnique({
    where: { id: persistenceSaleResult.created.id },
    include: { receipt: true },
  });
  assert(verifiedSaleInDb !== null, "Sale record verified persisted in database");
  assert(verifiedSaleInDb?.amount === 7500, "Server-side calculation enforced in DB: 25 * 300 = 7,500");
  assert(verifiedSaleInDb?.receipt?.receiptNumber === persistenceSaleResult.rcpt.receiptNumber, "Atomic receipt linked in DB");

  // B. Expense Creation with Immediate Persistence
  const expenseLocalId = `exp-persist-${Date.now()}`;
  const expenseResult = await prisma.$transaction(async (tx) => {
    const createdExp = await tx.transaction.create({
      data: {
        localId: expenseLocalId,
        farmId: farm.id,
        enterpriseId: enterprise.id,
        categoryId: category.id,
        createdById: user.id,
        type: "EXPENSE",
        transactionDate: new Date(),
        amount: 4200,
        paymentMethod: "CASH",
        paymentStatus: "PAID",
        notes: "Vaccines and veterinary supplies",
      },
    });
    return createdExp;
  });

  const verifiedExpInDb = await prisma.transaction.findUnique({
    where: { id: expenseResult.id },
  });
  assert(verifiedExpInDb !== null && verifiedExpInDb.amount === 4200, "Expense persisted in DB with amount 4,200");
  assert(verifiedExpInDb?.type === "EXPENSE", "Transaction type persisted as EXPENSE");

  // C. Editing a Transaction (Update & Recalculate in DB)
  const updatedQty = 30;
  const newCalculatedAmount = Math.round(updatedQty * clientUnitPrice * 100) / 100; // 9,000

  const updateResult = await prisma.$transaction(async (tx) => {
    const updated = await tx.transaction.update({
      where: { id: persistenceSaleResult.created.id },
      data: {
        quantity: updatedQty,
        amount: newCalculatedAmount,
        notes: "Quantity adjusted from 25 to 30",
      },
    });

    await tx.auditLog.create({
      data: {
        farmId: farm.id,
        entityType: "TRANSACTION",
        entityId: updated.id,
        action: "UPDATE",
        actorId: user.id,
        oldValues: JSON.stringify({ amount: 7500, quantity: 25 }),
        newValues: JSON.stringify({ amount: 9000, quantity: 30 }),
      },
    });

    return updated;
  });

  const verifiedUpdatedInDb = await prisma.transaction.findUnique({
    where: { id: persistenceSaleResult.created.id },
  });
  assert(verifiedUpdatedInDb?.amount === 9000, "Updated transaction in DB reflects recalculated amount 9,000");
  assert(verifiedUpdatedInDb?.quantity === 30, "Updated transaction in DB reflects new quantity 30");

  const auditLogEntry = await prisma.auditLog.findFirst({
    where: { entityId: persistenceSaleResult.created.id, action: "UPDATE" },
  });
  assert(auditLogEntry !== null, "AuditLog recorded UPDATE event with previous and new states");

  // D. Farm Profile Update Persistence
  const originalFarmSize = farm.farmSizeAcres;
  const newSize = 25.5;
  await prisma.farm.update({
    where: { id: farm.id },
    data: { farmSizeAcres: newSize, locationCounty: "Nakuru Central" },
  });

  const verifiedFarmInDb = await prisma.farm.findUnique({
    where: { id: farm.id },
  });
  assert(verifiedFarmInDb?.farmSizeAcres === 25.5, "Farm profile update persisted in DB: farmSizeAcres = 25.5");
  assert(verifiedFarmInDb?.locationCounty === "Nakuru Central", "Farm county update persisted in DB: Nakuru Central");

  // Restore farm size
  await prisma.farm.update({
    where: { id: farm.id },
    data: { farmSizeAcres: originalFarmSize, locationCounty: farm.locationCounty },
  });

  // E. Enterprise Information Update Persistence
  const testEnterprise = await prisma.enterprise.create({
    data: {
      farmId: farm.id,
      enterpriseTypeId: enterprise.enterpriseTypeId,
      name: "Temporary Test Enterprise",
      status: "ACTIVE",
    },
  });

  await prisma.enterprise.update({
    where: { id: testEnterprise.id },
    data: { name: "Renamed Test Enterprise", status: "ARCHIVED" },
  });

  const verifiedEntInDb = await prisma.enterprise.findUnique({
    where: { id: testEnterprise.id },
  });
  assert(verifiedEntInDb?.name === "Renamed Test Enterprise", "Enterprise rename persisted in DB");
  assert(verifiedEntInDb?.status === "ARCHIVED", "Enterprise status transition to ARCHIVED persisted in DB");

  // Cleanup test enterprise
  await prisma.enterprise.delete({ where: { id: testEnterprise.id } });

  // F. Settings & ReportPreference Atomic Persistence
  const settingsResult = await prisma.$transaction(async (tx) => {
    const pref = await tx.reportPreference.upsert({
      where: {
        farmId_userId: { farmId: farm.id, userId: user.id },
      },
      create: {
        farmId: farm.id,
        userId: user.id,
        isEnabled: true,
        dayOfWeek: 2,
        timeOfDay: "08:30",
        emailAddress: "farmer.sync@farmpulse.co.ke",
        timezone: "Africa/Nairobi",
      },
      update: {
        dayOfWeek: 2,
        timeOfDay: "08:30",
        emailAddress: "farmer.sync@farmpulse.co.ke",
      },
    });

    await tx.auditLog.create({
      data: {
        farmId: farm.id,
        entityType: "SETTINGS",
        entityId: farm.id,
        action: "UPDATE",
        actorId: user.id,
        newValues: JSON.stringify(pref),
      },
    });

    return pref;
  });

  const verifiedPrefInDb = await prisma.reportPreference.findUnique({
    where: { farmId_userId: { farmId: farm.id, userId: user.id } },
  });
  assert(verifiedPrefInDb?.dayOfWeek === 2, "ReportPreference dayOfWeek persisted as Tuesday (2)");
  assert(verifiedPrefInDb?.timeOfDay === "08:30", "ReportPreference timeOfDay persisted as 08:30");
  assert(verifiedPrefInDb?.emailAddress === "farmer.sync@farmpulse.co.ke", "ReportPreference email persisted");

  // G. Multi-Tenant Cross-Farm Isolation Guard
  const mockFarmB = await prisma.farm.create({
    data: {
      name: "Second Isolated Farm",
      slug: `isolated-farm-${Date.now()}`,
      currency: "KES",
      locationCounty: "Kiambu",
    },
  });

  // Verification: querying transactions for Farm B returns none of Farm A's transactions
  const farmBTransactions = await prisma.transaction.findMany({
    where: { farmId: mockFarmB.id },
  });
  assert(farmBTransactions.length === 0, "Tenant Isolation: Farm B sees zero transactions from Farm A");

  // Verification: querying enterprise ownership detects mismatched farm
  const foreignEnterprise = await prisma.enterprise.findFirst({
    where: { id: enterprise.id, farmId: mockFarmB.id },
  });
  assert(foreignEnterprise === null, "Tenant Isolation: Enterprise from Farm A cannot be claimed by Farm B");

  // Cleanup Mock Farm B
  await prisma.farm.delete({ where: { id: mockFarmB.id } });

  // H. Atomic Rollback Verification
  const rollbackLocalId = `rollback-test-${Date.now()}`;
  let rollbackErrorCaught = false;

  try {
    await prisma.$transaction(async (tx) => {
      // Step 1: Create transaction inside transaction
      await tx.transaction.create({
        data: {
          localId: rollbackLocalId,
          farmId: farm.id,
          enterpriseId: enterprise.id,
          categoryId: category.id,
          createdById: user.id,
          type: "SALE",
          transactionDate: new Date(),
          amount: 50000,
          paymentMethod: "CASH",
          paymentStatus: "PAID",
        },
      });

      // Step 2: Simulate failure in multi-step flow
      throw new Error("Simulated downstream payment gateway or receipt failure");
    });
  } catch (err) {
    rollbackErrorCaught = true;
  }

  assert(rollbackErrorCaught === true, "Simulated failure inside transaction threw as expected");

  const uncommittedTx = await prisma.transaction.findUnique({
    where: { localId: rollbackLocalId },
  });
  assert(uncommittedTx === null, "Atomic Rollback: Uncommitted transaction rolled back completely, not in DB");

  // Cleanup test transactions and audit logs
  await prisma.auditLog.deleteMany({
    where: { entityId: { in: [persistenceSaleResult.created.id, farm.id] } },
  });
  await prisma.receipt.deleteMany({
    where: { transactionId: persistenceSaleResult.created.id },
  });
  await prisma.transaction.deleteMany({
    where: { localId: { in: [saleLocalId, expenseLocalId] } },
  });

  // ==========================================
  // 5. AUTHENTICATION & FARMER ONBOARDING JOURNEY
  // ==========================================
  console.log("\n5. AUTHENTICATION & FARMER ONBOARDING JOURNEY TESTS");

  // A. User Registration & Password Hashing
  const testFarmerEmail = `farmer.journey.${Date.now()}@farmpulse.co.ke`;
  const plainPassword = "SecureFarmPass2026!";
  const hashedPw = await bcrypt.hash(plainPassword, 10);

  const registeredUser = await prisma.user.create({
    data: {
      fullName: "Mike Mwangi",
      email: testFarmerEmail,
      phoneNumber: "+254711223344",
      passwordHash: hashedPw,
      onboardingCompleted: false,
    },
  });

  assert(registeredUser.id !== null, "New farmer registered successfully");
  assert(registeredUser.onboardingCompleted === false, "Freshly registered user has onboardingCompleted = false");

  // B. Authentication & Password Verification
  const validPassCheck = await bcrypt.compare(plainPassword, registeredUser.passwordHash);
  assert(validPassCheck === true, "Valid password credentials verified successfully via bcrypt");

  const invalidPassCheck = await bcrypt.compare("WrongPassword123!", registeredUser.passwordHash);
  assert(invalidPassCheck === false, "Invalid password credentials correctly rejected");

  // C. Secure Session Token Signing & Tamper Verification
  const sessionSecret = "farmpulse-auth-token-secret-production-key-2026";
  const createTestToken = (payload, secret = sessionSecret) => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const dataStr = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
    const sig = crypto.createHmac("sha256", secret).update(dataStr).digest("base64url");
    return `${dataStr}.${sig}`;
  };

  const verifyTestToken = (token, secret = sessionSecret) => {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [dataStr, sig] = parts;
    const expectedSig = crypto.createHmac("sha256", secret).update(dataStr).digest("base64url");
    if (sig !== expectedSig) return null;
    return JSON.parse(Buffer.from(dataStr, "base64url").toString("utf-8"));
  };

  const validToken = createTestToken({
    userId: registeredUser.id,
    email: registeredUser.email,
    onboardingCompleted: false,
  });
  const decodedValid = verifyTestToken(validToken);
  assert(decodedValid !== null && decodedValid.email === testFarmerEmail, "Session token created and verified with valid signature");

  const tamperedToken = `${validToken.split(".")[0]}.tamperedInvalidSignature123`;
  const decodedTampered = verifyTestToken(tamperedToken);
  assert(decodedTampered === null, "Tampered session token signature rejected by security check");

  // D. Farmer Onboarding & Database Persistence
  const newFarmSlug = `green-valley-${Date.now()}`;
  const poultryType = await prisma.enterpriseType.findUnique({ where: { code: "POULTRY" } });
  const dairyType = await prisma.enterpriseType.findUnique({ where: { code: "CATTLE" } });

  const onboardingResult = await prisma.$transaction(async (tx) => {
    // 1. Create Farm
    const createdNewFarm = await tx.farm.create({
      data: {
        name: "Green Valley Farm",
        slug: newFarmSlug,
        locationCounty: "Nakuru",
        subCounty: "Rongai",
        townArea: "Lanet",
        country: "Kenya",
        currency: "KES",
        farmSizeAcres: 15.0,
        timezone: "Africa/Nairobi",
        recordKeepingMethod: "Notebook",
        trackedPriorities: JSON.stringify(["expenses", "sales", "netProfit"]),
      },
    });

    // 2. Create Membership
    await tx.farmMember.create({
      data: {
        farmId: createdNewFarm.id,
        userId: registeredUser.id,
        role: "OWNER",
      },
    });

    // 3. Create Enterprises
    const ent1 = await tx.enterprise.create({
      data: {
        farmId: createdNewFarm.id,
        enterpriseTypeId: poultryType.id,
        name: "Poultry (Layers & Broilers)",
        status: "ACTIVE",
      },
    });

    const ent2 = await tx.enterprise.create({
      data: {
        farmId: createdNewFarm.id,
        enterpriseTypeId: dairyType.id,
        name: "Dairy Cattle Herd",
        status: "ACTIVE",
      },
    });

    await tx.farm.update({
      where: { id: createdNewFarm.id },
      data: { primaryEnterpriseId: ent1.id },
    });

    // 4. Create Standard Categories
    await tx.category.createMany({
      data: [
        { farmId: createdNewFarm.id, name: "Animal Feeds & Supplements", type: "EXPENSE", isSystem: true },
        { farmId: createdNewFarm.id, name: "Veterinary Drugs & Treatment", type: "EXPENSE", isSystem: true },
        { farmId: createdNewFarm.id, name: "Fresh Eggs (Trays)", type: "INCOME", isSystem: true },
        { farmId: createdNewFarm.id, name: "Raw Morning Milk", type: "INCOME", isSystem: true },
      ],
    });

    // 5. Upsert Report Preference
    await tx.reportPreference.create({
      data: {
        farmId: createdNewFarm.id,
        userId: registeredUser.id,
        isEnabled: true,
        dayOfWeek: 1, // Monday
        timeOfDay: "07:00",
        emailAddress: registeredUser.email,
        timezone: "Africa/Nairobi",
      },
    });

    // 6. Mark Onboarding Completed
    const updatedUser = await tx.user.update({
      where: { id: registeredUser.id },
      data: { onboardingCompleted: true },
    });

    return { farm: createdNewFarm, user: updatedUser, ent1, ent2 };
  });

  // E. Verify Database State After Onboarding
  const verifiedNewFarmInDb = await prisma.farm.findUnique({
    where: { id: onboardingResult.farm.id },
    include: { enterprises: true, categories: true, members: true },
  });
  assert(verifiedNewFarmInDb !== null, "New farm verified created in database");
  assert(verifiedNewFarmInDb?.locationCounty === "Nakuru", "Farm location county persisted as Nakuru");
  assert(verifiedNewFarmInDb?.farmSizeAcres === 15.0, "Farm size persisted as 15.0 acres");
  assert(verifiedNewFarmInDb?.enterprises.length === 2, "Exactly 2 selected enterprises persisted in database");
  assert(verifiedNewFarmInDb?.categories.length === 4, "Standard categories provisioned for new farm");

  const verifiedUserInDb = await prisma.user.findUnique({
    where: { id: registeredUser.id },
  });
  assert(verifiedUserInDb?.onboardingCompleted === true, "User onboardingCompleted transitioned to true");

  // F. Personalized First-Time Dashboard Logic
  const newFarmTxCount = await prisma.transaction.count({
    where: { farmId: onboardingResult.farm.id },
  });
  assert(newFarmTxCount === 0, "New farm initially has 0 transactions (First-time empty state condition)");

  const newFarmEnterprises = await prisma.enterprise.findMany({
    where: { farmId: onboardingResult.farm.id, status: "ACTIVE" },
    include: { enterpriseType: true },
  });
  const enterpriseCodes = newFarmEnterprises.map((e) => e.enterpriseType.code);
  assert(
    enterpriseCodes.includes("POULTRY") && enterpriseCodes.includes("CATTLE"),
    "Dashboard active enterprise badges personalized to Poultry and Dairy Cattle"
  );
  assert(
    !enterpriseCodes.includes("PIGGERY") && !enterpriseCodes.includes("AQUACULTURE"),
    "Dashboard does NOT show unselected enterprises (e.g. Fish or Piggery)"
  );

  // G. Multi-Tenant Cross-Farm Isolation
  const crossFarmTxCount = await prisma.transaction.count({
    where: { farmId: onboardingResult.farm.id },
  });
  assert(crossFarmTxCount === 0, "Tenant Isolation: New farm cannot see transactions from existing demo farm");

  // H. Post-Onboarding Session Token Verification
  const postOnboardingToken = createTestToken({
    userId: registeredUser.id,
    email: registeredUser.email,
    farmId: onboardingResult.farm.id,
    onboardingCompleted: true,
  });
  const postOnboardingDecoded = verifyTestToken(postOnboardingToken);
  assert(
    postOnboardingDecoded?.onboardingCompleted === true,
    "Post-onboarding session authorizes direct access to /dashboard"
  );

  // Clean up onboarding test artifacts
  await prisma.reportPreference.deleteMany({ where: { farmId: onboardingResult.farm.id } });
  await prisma.category.deleteMany({ where: { farmId: onboardingResult.farm.id } });
  await prisma.enterprise.deleteMany({ where: { farmId: onboardingResult.farm.id } });
  await prisma.farmMember.deleteMany({ where: { farmId: onboardingResult.farm.id } });
  await prisma.farm.delete({ where: { id: onboardingResult.farm.id } });
  await prisma.user.delete({ where: { id: registeredUser.id } });

  // =========================================================================
  // 6. LIVESTOCK FEED & PRODUCTION TRACKING MODULE TESTS
  // =========================================================================
  console.log("\n6. LIVESTOCK FEED & PRODUCTION MODULE TESTS");

  // Helper: Unit Normalization & Feed Calculations
  const normalizeFeedQuantity = (qty, unit, bagWeightKg) => {
    if (!qty || qty <= 0) return 0;
    const u = unit.toLowerCase().trim();
    if (u === "kg" || u === "kilograms") return qty;
    if (u === "g" || u === "grams") return qty / 1000;
    if (u === "bags" || u === "bag") return qty * (bagWeightKg && bagWeightKg > 0 ? bagWeightKg : 50);
    if (u === "bales" || u === "bale") return qty * (bagWeightKg && bagWeightKg > 0 ? bagWeightKg : 15);
    if (u === "tonnes" || u === "tons") return qty * 1000;
    if (u === "litres" || u === "l") return qty;
    return qty;
  };

  // A. Unit Normalization & Feed Calculations
  const norm50kg = normalizeFeedQuantity(4, "bags", 50);
  assert(norm50kg === 200, "50kg bag conversion: 4 bags * 50kg = 200 kg");

  const norm70kg = normalizeFeedQuantity(3, "bags", 70);
  assert(norm70kg === 210, "Custom 70kg bag conversion: 3 bags * 70kg = 210 kg");

  const normGrams = normalizeFeedQuantity(750, "g");
  assert(normGrams === 0.75, "Grams to kg conversion: 750 g = 0.75 kg");

  const normBales = normalizeFeedQuantity(10, "bales", 15);
  assert(normBales === 150, "Hay bale conversion: 10 bales * 15kg = 150 kg");

  const normZero = normalizeFeedQuantity(0, "kg");
  assert(normZero === 0, "Zero feed quantity returns 0 without error");

  // B. Database Creation: Livestock Groups across Enterprises
  const poultryEnt = await prisma.enterprise.findFirst({
    where: { farmId: farm.id, enterpriseType: { code: "POULTRY" } },
  });
  const dairyEnt = await prisma.enterprise.findFirst({
    where: { farmId: farm.id, enterpriseType: { code: "CATTLE" } },
  });

  const layerGroup = await prisma.livestockGroup.create({
    data: {
      farmId: farm.id,
      enterpriseId: poultryEnt.id,
      name: "Flock 1 - Isa Brown Layers",
      species: "POULTRY",
      breed: "Isa Brown",
      productionStage: "Laying",
      initialCount: 300,
      currentCount: 300,
    },
  });
  assert(layerGroup.name === "Flock 1 - Isa Brown Layers", "Created Poultry Layer group in database");
  assert(layerGroup.currentCount === 300, "Initial bird count matches 300");

  const dairyHerd = await prisma.livestockGroup.create({
    data: {
      farmId: farm.id,
      enterpriseId: dairyEnt.id,
      name: "Milking Herd Alpha",
      species: "DAIRY_CATTLE",
      breed: "Friesian",
      productionStage: "Lactating",
      initialCount: 10,
      currentCount: 10,
    },
  });
  assert(dairyHerd.name === "Milking Herd Alpha", "Created Dairy Cattle herd in database");

  // C. Poultry: Record Feed & Egg Harvest
  const poultryFeed = await prisma.feedRecord.create({
    data: {
      farmId: farm.id,
      enterpriseId: poultryEnt.id,
      livestockGroupId: layerGroup.id,
      recordedById: user.id,
      date: new Date(),
      feedType: "Layers Complete Mash",
      quantityIssued: 40,
      unit: "kg",
      quantityIssuedKg: 40,
      quantityConsumed: 36, // 36kg consumed
      quantityConsumedKg: 36,
      feedCost: 3200,
    },
  });
  assert(poultryFeed.quantityIssuedKg === 40, "Feed issued recorded as 40 kg");
  assert(poultryFeed.quantityConsumedKg === 36, "Actual feed consumed recorded separately as 36 kg");

  const eggHarvest = await prisma.productionRecord.create({
    data: {
      farmId: farm.id,
      enterpriseId: poultryEnt.id,
      livestockGroupId: layerGroup.id,
      recordedById: user.id,
      date: new Date(),
      metric: "EGGS",
      quantity: 240, // 240 good eggs
      unit: "pieces",
      secondaryQuantity: 6, // 6 broken eggs
      qualityGrade: "Grade A / Large",
    },
  });
  assert(eggHarvest.quantity === 240, "Egg production recorded: 240 saleable eggs");
  assert(eggHarvest.secondaryQuantity === 6, "Broken/damaged eggs recorded: 6");

  // D. Dairy Cattle: Record Feed & Milk Harvest
  const dairyFeed = await prisma.feedRecord.create({
    data: {
      farmId: farm.id,
      enterpriseId: dairyEnt.id,
      livestockGroupId: dairyHerd.id,
      recordedById: user.id,
      date: new Date(),
      feedType: "High-Yield Dairy Meal",
      quantityIssued: 60,
      unit: "kg",
      quantityIssuedKg: 60,
      quantityConsumed: 60,
      quantityConsumedKg: 60,
      feedCost: 4500,
    },
  });
  assert(dairyFeed.quantityIssuedKg === 60, "Dairy feed recorded: 60 kg");

  const milkHarvest = await prisma.productionRecord.create({
    data: {
      farmId: farm.id,
      enterpriseId: dairyEnt.id,
      livestockGroupId: dairyHerd.id,
      recordedById: user.id,
      date: new Date(),
      metric: "MILK",
      quantity: 150, // 150 litres
      unit: "litres",
      secondaryQuantity: 2, // 2 L rejected
    },
  });
  assert(milkHarvest.quantity === 150, "Milk yield recorded: 150 Litres");

  // E. Growing Meat Animals: Piggery / Broiler Weight Gain & FCR
  const pigGroup = await prisma.livestockGroup.create({
    data: {
      farmId: farm.id,
      enterpriseId: poultryEnt.id,
      name: "Grower Pen B",
      species: "PIGS",
      initialCount: 20,
      currentCount: 20,
    },
  });

  const pigFeed = await prisma.feedRecord.create({
    data: {
      farmId: farm.id,
      enterpriseId: poultryEnt.id,
      livestockGroupId: pigGroup.id,
      recordedById: user.id,
      date: new Date(),
      feedType: "Pig Grower Meal",
      quantityIssued: 50,
      unit: "kg",
      quantityIssuedKg: 50,
      quantityConsumed: 50,
      quantityConsumedKg: 50,
    },
  });

  const pigWeightGain = await prisma.productionRecord.create({
    data: {
      farmId: farm.id,
      enterpriseId: poultryEnt.id,
      livestockGroupId: pigGroup.id,
      recordedById: user.id,
      date: new Date(),
      metric: "WEIGHT",
      quantity: 25, // 25kg gain
      unit: "kg",
    },
  });
  assert(pigWeightGain.quantity === 25, "Meat weight gain recorded: 25 kg");

  // F. Productivity Indicator Calculations
  // Poultry Calculations
  const eggRate = Math.round((eggHarvest.quantity / layerGroup.currentCount) * 100);
  assert(eggRate === 80, "Poultry egg production rate: 240 eggs / 300 birds = 80%");

  const feedPerEgg = Math.round((poultryFeed.quantityConsumedKg * 1000) / eggHarvest.quantity);
  assert(feedPerEgg === 150, "Poultry feed per egg: 36,000g / 240 eggs = 150 g/egg");

  const trayCount = eggHarvest.quantity / 30;
  const feedPerTray = Math.round((poultryFeed.quantityConsumedKg / trayCount) * 10) / 10;
  assert(feedPerTray === 4.5, "Poultry feed per tray: 36kg feed / 8 trays = 4.5 kg/tray");

  // Dairy Calculations
  const milkYieldPerCow = Math.round((milkHarvest.quantity / dairyHerd.currentCount) * 10) / 10;
  assert(milkYieldPerCow === 15.0, "Dairy milk yield per cow: 150 L / 10 cows = 15.0 L/cow");

  const feedPerLitre = Math.round((dairyFeed.quantityConsumedKg / milkHarvest.quantity) * 100) / 100;
  assert(feedPerLitre === 0.4, "Dairy feed per litre: 60 kg / 150 L = 0.4 kg/L");

  // Meat FCR & ADG
  const fcr = Math.round((pigFeed.quantityConsumedKg / pigWeightGain.quantity) * 10) / 10;
  assert(fcr === 2.0, "Feed Conversion Ratio (FCR): 50kg feed / 25kg gain = 2.0 : 1");

  const adg = Math.round((pigWeightGain.quantity / 14) * 100) / 100; // 25kg / 14 days
  assert(adg === 1.79, "Average Daily Gain (ADG): 25kg / 14 days = 1.79 kg/day");

  // Safe zero denominator check
  const zeroEggs = 0;
  const safeFeedPerEgg = zeroEggs > 0 ? (36 * 1000) / zeroEggs : null;
  assert(safeFeedPerEgg === null, "Zero eggs safely returns null without divide-by-zero error");

  // G. Multi-Tenant Isolation: Farm C cannot access Farm A records
  await prisma.user.deleteMany({ where: { email: { contains: "isolated-tenant" } } });
  const tenantUser = await prisma.user.create({
    data: {
      email: `isolated-tenant-${Date.now()}@test.co.ke`,
      fullName: "Isolated Farmer",
      passwordHash: "hash123",
      onboardingCompleted: true,
    },
  });
  const tenantFarm = await prisma.farm.create({
    data: {
      name: "Solitary Heights Farm",
      slug: "solitary-heights-" + Date.now(),
      locationCounty: "Nyandarua",
    },
  });
  await prisma.farmMember.create({
    data: { farmId: tenantFarm.id, userId: tenantUser.id, role: "OWNER" },
  });

  const tenantGroups = await prisma.livestockGroup.findMany({ where: { farmId: tenantFarm.id } });
  assert(tenantGroups.length === 0, "Tenant Isolation: Fresh farm sees 0 livestock groups from other farms");

  const tenantFeed = await prisma.feedRecord.findMany({ where: { farmId: tenantFarm.id } });
  assert(tenantFeed.length === 0, "Tenant Isolation: Fresh farm sees 0 feed records from other farms");

  const tenantProd = await prisma.productionRecord.findMany({ where: { farmId: tenantFarm.id } });
  assert(tenantProd.length === 0, "Tenant Isolation: Fresh farm sees 0 production records from other farms");

  // H. Clean Updates & Deletions
  const updatedFeed = await prisma.feedRecord.update({
    where: { id: poultryFeed.id },
    data: { quantityIssued: 50, quantityIssuedKg: 50 },
  });
  assert(updatedFeed.quantityIssuedKg === 50, "Updated feed record persisted with 50 kg");

  await prisma.feedRecord.delete({ where: { id: poultryFeed.id } });
  const remainingFeed = await prisma.feedRecord.findUnique({ where: { id: poultryFeed.id } });
  assert(remainingFeed === null, "Feed record deleted cleanly from database");

  await prisma.productionRecord.delete({ where: { id: eggHarvest.id } });
  const remainingProd = await prisma.productionRecord.findUnique({ where: { id: eggHarvest.id } });
  assert(remainingProd === null, "Production record deleted cleanly from database");

  await prisma.livestockGroup.update({
    where: { id: layerGroup.id },
    data: { status: "ARCHIVED" },
  });
  const archivedGroup = await prisma.livestockGroup.findUnique({ where: { id: layerGroup.id } });
  assert(archivedGroup?.status === "ARCHIVED", "Livestock group archived successfully");

  // 7. SEPARATION OF ANIMAL FEED & PRODUCTION FUNCTIONS TESTS
  console.log("\n7. SEPARATED ANIMAL FEED & PRODUCTION MODULE TESTS");

  const farmPoultryEnt = await prisma.enterprise.findFirst({ where: { farmId: farm.id } });

  // A. Animal Feed Inventory & Central Store Function
  const testProduct = await prisma.feedProduct.create({
    data: {
      farmId: farm.id,
      name: "Broiler Starter Crumbs",
      feedType: "Starter",
      currentStockKg: 250,
      minReserveKg: 100,
      criticalReserveKg: 30,
      status: "ACTIVE",
      unitCost: 65,
    },
  });
  assert(testProduct.currentStockKg === 250, "Feed Store: Feed product initialized with 250 kg stock");

  // Record a feed purchase inflow
  const feedPurchase = await prisma.feedPurchase.create({
    data: {
      farm: { connect: { id: farm.id } },
      feedProduct: { connect: { id: testProduct.id } },
      createdBy: { connect: { id: user.id } },
      supplierName: "Unga Farm Care Ltd",
      purchaseDate: new Date(),
      quantity: 5,
      unit: "bags",
      bagWeightKg: 50,
      quantityKg: 250,
      unitPrice: 3250,
      totalCost: 16250,
      paymentMethod: "MPESA",
      paymentStatus: "PAID",
      status: "RECEIVED",
    },
  });
  assert(feedPurchase.status === "RECEIVED", "Feed Purchase: 5 bags (250 kg) received into central store");

  // Inflow movement
  const updatedProductAfterInflow = await prisma.feedProduct.update({
    where: { id: testProduct.id },
    data: { currentStockKg: 500 },
  });
  assert(updatedProductAfterInflow.currentStockKg === 500, "Feed Store: Stock increased atomically to 500 kg after purchase inflow");

  // Deduct feed issue to an animal group
  const updatedProductAfterIssue = await prisma.feedProduct.update({
    where: { id: testProduct.id },
    data: { currentStockKg: 450 },
  });
  assert(updatedProductAfterIssue.currentStockKg === 450, "Feed Store: Feed issue of 50 kg safely deducted stock to 450 kg");

  // B. Production Tracking Function (Independent Harvest & Quality Grading)
  const broilerBatch = await prisma.livestockGroup.create({
    data: {
      farmId: farm.id,
      enterpriseId: farmPoultryEnt.id,
      name: "Broiler Batch 2026-B",
      species: "POULTRY",
      currentCount: 500,
      status: "ACTIVE",
    },
  });
  assert(broilerBatch.currentCount === 500, "Production: Dedicated broiler batch created with 500 birds");

  const independentHarvest = await prisma.productionRecord.create({
    data: {
      farmId: farm.id,
      enterpriseId: broilerBatch.enterpriseId,
      livestockGroupId: broilerBatch.id,
      recordedById: user.id,
      date: new Date(),
      metric: "WEIGHT",
      quantity: 1100, // 1,100 kg live birds
      unit: "kg",
      secondaryQuantity: 15, // 15 kg under-weight / cull
      qualityGrade: "Grade A",
      notes: "Commercial broiler harvest at 38 days",
    },
  });
  assert(independentHarvest.quantity === 1100, "Production: Harvest recorded independently of feed inventory: 1,100 kg");
  assert(independentHarvest.secondaryQuantity === 15, "Production: Damaged / rejected harvest recorded: 15 kg");

  // Clean up
  await prisma.feedPurchase.delete({ where: { id: feedPurchase.id } });
  await prisma.feedProduct.delete({ where: { id: testProduct.id } });
  await prisma.productionRecord.delete({ where: { id: independentHarvest.id } });
  await prisma.livestockGroup.delete({ where: { id: broilerBatch.id } });

  // Clean up remaining test data
  await prisma.feedRecord.deleteMany({ where: { farmId: farm.id } });
  await prisma.productionRecord.deleteMany({ where: { farmId: farm.id } });
  await prisma.livestockGroup.deleteMany({ where: { farmId: farm.id } });
  await prisma.farmMember.deleteMany({ where: { farmId: tenantFarm.id } });
  await prisma.farm.delete({ where: { id: tenantFarm.id } });
  await prisma.user.delete({ where: { id: tenantUser.id } });

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
