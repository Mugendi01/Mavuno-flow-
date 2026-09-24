import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting FarmPulse Kenyan Agriculture Seeder...");

  // 1. Enterprise Types
  const enterpriseTypesData = [
    { name: "Poultry", code: "POULTRY", icon: "Egg" },
    { name: "Dairy Cattle", code: "CATTLE", icon: "Milk" },
    { name: "Aquaculture", code: "AQUACULTURE", icon: "Fish" },
    { name: "Goats & Sheep", code: "GOATS_SHEEP", icon: "Beef" },
    { name: "Piggery", code: "PIGGERY", icon: "Layers" },
    { name: "Crops & Fodder", code: "CROPS", icon: "Sprout" },
  ];

  for (const type of enterpriseTypesData) {
    await prisma.enterpriseType.upsert({
      where: { code: type.code },
      update: {},
      create: type,
    });
  }
  console.log("✅ Seeded Enterprise Types");

  // 2. Demo User
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const demoUser = await prisma.user.upsert({
    where: { email: "farmer@farmpulse.co.ke" },
    update: {},
    create: {
      email: "farmer@farmpulse.co.ke",
      passwordHash,
      fullName: "John Kiprop",
      phoneNumber: "+254712345678",
      emailVerified: new Date(),
    },
  });
  console.log("✅ Seeded Demo User: farmer@farmpulse.co.ke");

  // 3. Demo Farm
  const demoFarm = await prisma.farm.upsert({
    where: { slug: "baraka-agri-ventures" },
    update: {},
    create: {
      name: "Baraka Agri-Ventures",
      slug: "baraka-agri-ventures",
      locationCounty: "Nakuru County",
      country: "Kenya",
      currency: "KES",
      farmSizeAcres: 12.5,
      timezone: "Africa/Nairobi",
    },
  });
  console.log("✅ Seeded Demo Farm: Baraka Agri-Ventures");

  // Farm Membership
  await prisma.farmMember.upsert({
    where: {
      farmId_userId: {
        farmId: demoFarm.id,
        userId: demoUser.id,
      },
    },
    update: {},
    create: {
      farmId: demoFarm.id,
      userId: demoUser.id,
      role: "OWNER",
    },
  });

  // 4. Activate Enterprises for Baraka Agri-Ventures
  const poultryType = await prisma.enterpriseType.findUnique({ where: { code: "POULTRY" } });
  const dairyType = await prisma.enterpriseType.findUnique({ where: { code: "CATTLE" } });
  const fishType = await prisma.enterpriseType.findUnique({ where: { code: "AQUACULTURE" } });
  const cropsType = await prisma.enterpriseType.findUnique({ where: { code: "CROPS" } });

  const poultry = await prisma.enterprise.create({
    data: {
      farmId: demoFarm.id,
      enterpriseTypeId: poultryType.id,
      name: "Layers & Kienyeji Unit",
      status: "ACTIVE",
    },
  });

  const dairy = await prisma.enterprise.create({
    data: {
      farmId: demoFarm.id,
      enterpriseTypeId: dairyType.id,
      name: "Friesian Dairy Herd",
      status: "ACTIVE",
    },
  });

  const fish = await prisma.enterprise.create({
    data: {
      farmId: demoFarm.id,
      enterpriseTypeId: fishType.id,
      name: "Tilapia Ponds (Ponds A & B)",
      status: "ACTIVE",
    },
  });

  const crops = await prisma.enterprise.create({
    data: {
      farmId: demoFarm.id,
      enterpriseTypeId: cropsType.id,
      name: "Boma Rhodes & Maize Silage",
      status: "ACTIVE",
    },
  });
  console.log("✅ Activated Enterprises for Baraka Agri-Ventures");

  // 5. Standard Categories
  const categoriesData = [
    // Expenses
    { name: "Feed (Commercial Pellets & Mash)", type: "EXPENSE", isSystem: true },
    { name: "Veterinary, Drugs & Dewormers", type: "EXPENSE", isSystem: true },
    { name: "Vaccines (Newcastle, Gumboro)", type: "EXPENSE", isSystem: true },
    { name: "Labour & Casual Wages", type: "EXPENSE", isSystem: true },
    { name: "Transport & Boda Delivery", type: "EXPENSE", isSystem: true },
    { name: "Agrovet Equipment & Disinfectants", type: "EXPENSE", isSystem: true },
    { name: "Seeds, Fertilizer & Top-Dressing", type: "EXPENSE", isSystem: true },
    { name: "Electricity, Solar & Borehole Fuel", type: "EXPENSE", isSystem: true },
    { name: "Stock Purchase (Day-Old Chicks)", type: "EXPENSE", isSystem: true },
    { name: "Pond Maintenance & Liming", type: "EXPENSE", isSystem: true },
    // Income
    { name: "Fresh Eggs (Trays)", type: "INCOME", isSystem: true },
    { name: "Raw Morning & Evening Milk", type: "INCOME", isSystem: true },
    { name: "Harvested Whole Tilapia", type: "INCOME", isSystem: true },
    { name: "Culled Layers / Live Birds", type: "INCOME", isSystem: true },
    { name: "Boma Rhodes Hay Bales", type: "INCOME", isSystem: true },
    { name: "Compost & Farmyard Manure", type: "INCOME", isSystem: true },
  ];

  const categoriesMap = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({
      data: {
        farmId: demoFarm.id,
        name: cat.name,
        type: cat.type,
        isSystem: cat.isSystem,
      },
    });
    categoriesMap[cat.name] = created.id;
  }
  console.log("✅ Seeded Agricultural Categories");

  // 6. Realistic Historical & Current Transactions
  const now = new Date();
  const daysAgo = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  };

  const seedTransactions = [
    // Today
    {
      localId: uuidv4(),
      farmId: demoFarm.id,
      enterpriseId: poultry.id,
      categoryId: categoriesMap["Fresh Eggs (Trays)"],
      createdById: demoUser.id,
      type: "SALE",
      transactionDate: daysAgo(0),
      amount: 14400,
      quantity: 40,
      unit: "Tray",
      unitPrice: 360,
      paymentMethod: "MPESA",
      paymentStatus: "PAID",
      salesChannel: "Market Wholesale",
      buyerName: "Mama Njeri Bakery Nakuru",
      notes: "40 trays delivered early morning. Paid via M-Pesa Till.",
    },
    {
      localId: uuidv4(),
      farmId: demoFarm.id,
      enterpriseId: dairy.id,
      categoryId: categoriesMap["Raw Morning & Evening Milk"],
      createdById: demoUser.id,
      type: "SALE",
      transactionDate: daysAgo(0),
      amount: 9800,
      quantity: 140,
      unit: "Litre",
      unitPrice: 70,
      paymentMethod: "BANK",
      paymentStatus: "PAID",
      salesChannel: "Dairy Cooperative",
      buyerName: "Nakuru Farmers Co-op",
      notes: "Morning delivery 140L chilled.",
    },
    {
      localId: uuidv4(),
      farmId: demoFarm.id,
      enterpriseId: poultry.id,
      categoryId: categoriesMap["Feed (Commercial Pellets & Mash)"],
      createdById: demoUser.id,
      type: "EXPENSE",
      transactionDate: daysAgo(1),
      amount: 19500,
      quantity: 6,
      unit: "Bag",
      unitPrice: 3250,
      paymentMethod: "MPESA",
      paymentStatus: "PAID",
      notes: "6 bags Layers Complete Mash from Unga Farm Care.",
    },
    // 2 days ago: Credit sale creating Accounts Receivable
    {
      localId: uuidv4(),
      farmId: demoFarm.id,
      enterpriseId: poultry.id,
      categoryId: categoriesMap["Culled Layers / Live Birds"],
      createdById: demoUser.id,
      type: "SALE",
      transactionDate: daysAgo(2),
      amount: 32000,
      quantity: 40,
      unit: "Piece",
      unitPrice: 800,
      paymentMethod: "CREDIT",
      paymentStatus: "PARTIALLY_PAID",
      salesChannel: "Restaurant",
      buyerName: "Green Hills Hotel Lanet",
      notes: "40 live mature layers supplied on credit. 50% deposit paid.",
    },
    // 3 days ago
    {
      localId: uuidv4(),
      farmId: demoFarm.id,
      enterpriseId: dairy.id,
      categoryId: categoriesMap["Veterinary, Drugs & Dewormers"],
      createdById: demoUser.id,
      type: "EXPENSE",
      transactionDate: daysAgo(3),
      amount: 4500,
      quantity: 1,
      unit: "Trip",
      unitPrice: 4500,
      paymentMethod: "MPESA",
      paymentStatus: "PAID",
      notes: "Dr. Omondi Vet visit for routine deworming & mastitis check.",
    },
    // 4 days ago
    {
      localId: uuidv4(),
      farmId: demoFarm.id,
      enterpriseId: fish.id,
      categoryId: categoriesMap["Harvested Whole Tilapia"],
      createdById: demoUser.id,
      type: "SALE",
      transactionDate: daysAgo(4),
      amount: 28500,
      quantity: 95,
      unit: "Kg",
      unitPrice: 300,
      paymentMethod: "MPESA",
      paymentStatus: "PAID",
      salesChannel: "Direct customer",
      buyerName: "Lakeview Fish Traders",
      notes: "Pond A selective harvest, average weight 450g.",
    },
    // 5 days ago: Expense Labour
    {
      localId: uuidv4(),
      farmId: demoFarm.id,
      enterpriseId: crops.id,
      categoryId: categoriesMap["Labour & Casual Wages"],
      createdById: demoUser.id,
      type: "EXPENSE",
      transactionDate: daysAgo(5),
      amount: 8000,
      quantity: 4,
      unit: "Day",
      unitPrice: 2000,
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      notes: "Weeding and silage compaction casuals.",
    },
    // 8 days ago (Previous week baseline)
    {
      localId: uuidv4(),
      farmId: demoFarm.id,
      enterpriseId: poultry.id,
      categoryId: categoriesMap["Fresh Eggs (Trays)"],
      createdById: demoUser.id,
      type: "SALE",
      transactionDate: daysAgo(8),
      amount: 18000,
      quantity: 50,
      unit: "Tray",
      unitPrice: 360,
      paymentMethod: "MPESA",
      paymentStatus: "PAID",
      notes: "Bulk weekend order.",
    },
    {
      localId: uuidv4(),
      farmId: demoFarm.id,
      enterpriseId: dairy.id,
      categoryId: categoriesMap["Feed (Commercial Pellets & Mash)"],
      createdById: demoUser.id,
      type: "EXPENSE",
      transactionDate: daysAgo(9),
      amount: 15000,
      quantity: 5,
      unit: "Bag",
      unitPrice: 3000,
      paymentMethod: "MPESA",
      paymentStatus: "PAID",
      notes: "Dairy meal concentrate 50kg bags.",
    },
  ];

  for (const txData of seedTransactions) {
    const tx = await prisma.transaction.create({
      data: txData,
    });

    // If Credit or Partially Paid, create Receivable!
    if (txData.paymentStatus === "PARTIALLY_PAID" || txData.paymentStatus === "CREDIT") {
      const isPartial = txData.paymentStatus === "PARTIALLY_PAID";
      const paid = isPartial ? 16000 : 0;
      const balance = txData.amount - paid;

      const rec = await prisma.receivable.create({
        data: {
          farmId: demoFarm.id,
          transactionId: tx.id,
          customerName: txData.buyerName || "Debtor",
          customerPhone: "+254722998877",
          totalAmount: txData.amount,
          paidAmount: paid,
          balanceAmount: balance,
          dueDate: daysAgo(-7), // Due in 7 days
          status: isPartial ? "PARTIALLY_PAID" : "PENDING",
        },
      });

      if (paid > 0) {
        await prisma.payment.create({
          data: {
            receivableId: rec.id,
            amount: paid,
            paymentDate: daysAgo(2),
            paymentMethod: "MPESA",
            referenceCode: "QKL89TY71Z",
            recordedById: demoUser.id,
            notes: "Initial deposit upon bird collection",
          },
        });
      }
    }

    // Automatically generate unique Receipt for each seeded transaction
    const dateStr = txData.transactionDate.toISOString().slice(0, 10).replace(/-/g, "");
    const receiptNum = `FP-${dateStr}-${uuidv4().slice(0, 6).toUpperCase()}`;
    await prisma.receipt.create({
      data: {
        transactionId: tx.id,
        farmId: demoFarm.id,
        receiptNumber: receiptNum,
        verificationToken: uuidv4(),
        qrPayload: `http://localhost:3000/verify/${receiptNum}`,
        status: "VALID",
        issuedAt: txData.transactionDate,
      },
    });
  }
  console.log("✅ Seeded Transactions, Receipts and Accounts Receivable");

  // 7. Report Preference
  await prisma.reportPreference.upsert({
    where: {
      farmId_userId: {
        farmId: demoFarm.id,
        userId: demoUser.id,
      },
    },
    update: {},
    create: {
      farmId: demoFarm.id,
      userId: demoUser.id,
      isEnabled: true,
      dayOfWeek: 1, // Monday
      timeOfDay: "07:00",
      emailAddress: "farmer@farmpulse.co.ke",
      timezone: "Africa/Nairobi",
    },
  });
  console.log("✅ Seeded Weekly Report Preference (Monday 07:00 AM Africa/Nairobi)");

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
