/**
 * Seed Demo Merchants for QRypto Hackathon
 * 
 * Run this script to populate the MerchantMap table with demo merchants
 * that will allow QRIS payments to be processed via Xendit
 * 
 * Usage: npx ts-node prisma/seed-merchants.ts
 * Or: npx tsx prisma/seed-merchants.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Demo merchants for hackathon
// Replace these with actual QRIS merchant data you want to support
const demoMerchants = [
  {
    nmid: "ID1026471004881",           // NMID extracted from JejaKriya QRIS
    merchantName: "JejaKriya",
    bankCode: "BCA",
    accountNumber: "1234567890",        // Replace with your test account
    accountName: "JEJA KRIYA STORE",
    description: "Demo merchant - JejaKriya Tangerang",
  },
  {
    nmid: "ID1020000000001",            // Sample NMID
    merchantName: "TOKO SANJAYA",       // From sample QRIS
    bankCode: "BNI",
    accountNumber: "0987654321",        // Replace with your test account
    accountName: "TOKO SANJAYA",
    description: "Demo merchant - Toko Sanjaya Jakarta",
  },
  {
    nmid: "ID1020000000002",
    merchantName: "Kopi Kenangan",
    bankCode: "MANDIRI",
    accountNumber: "1122334455",
    accountName: "PT KOPI KENANGAN INDONESIA",
    description: "Demo merchant - Kopi Kenangan",
  },
  {
    nmid: "ID1020000000003",
    merchantName: "Indomaret",
    bankCode: "BRI",
    accountNumber: "5566778899",
    accountName: "PT INDOMARCO PRISMATAMA",
    description: "Demo merchant - Indomaret",
  },
  {
    // Fallback merchant - for any unregistered QRIS
    // This can be your own account for receiving test payments
    nmid: null,
    merchantName: "DEFAULT_MERCHANT",
    bankCode: "BCA",
    accountNumber: "9999999999",        // Your "donation" account
    accountName: "QRYPTO TREASURY",
    description: "Default fallback merchant for unregistered QRIS",
  },
];

async function seedMerchants() {
  console.log("🌱 Seeding demo merchants...\n");

  for (const merchant of demoMerchants) {
    try {
      // Upsert: update if exists, create if not
      const result = await prisma.merchantMap.upsert({
        where: { 
          nmid: merchant.nmid || `default-${merchant.merchantName}`,
        },
        update: {
          merchantName: merchant.merchantName,
          bankCode: merchant.bankCode,
          accountNumber: merchant.accountNumber,
          accountName: merchant.accountName,
          description: merchant.description,
          isActive: true,
        },
        create: {
          nmid: merchant.nmid,
          merchantName: merchant.merchantName,
          bankCode: merchant.bankCode,
          accountNumber: merchant.accountNumber,
          accountName: merchant.accountName,
          description: merchant.description,
          isActive: true,
        },
      });

      console.log(`✅ ${merchant.merchantName}`);
      console.log(`   NMID: ${merchant.nmid || "(none - name-based matching)"}`);
      console.log(`   Bank: ${merchant.bankCode} - ${merchant.accountNumber}`);
      console.log(`   ID: ${result.id}\n`);
    } catch (error) {
      console.error(`❌ Failed to seed ${merchant.merchantName}:`, error);
    }
  }

  console.log("🎉 Demo merchants seeded successfully!\n");
  console.log("📝 Next steps:");
  console.log("   1. Replace account numbers with your Xendit sandbox accounts");
  console.log("   2. Add real QRIS NMIDs from merchants you want to support");
  console.log("   3. Set XENDIT_SECRET_KEY in your .env file");
}

async function main() {
  try {
    await seedMerchants();
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
