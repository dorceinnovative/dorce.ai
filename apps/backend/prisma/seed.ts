import { PrismaClient, UserRole, TransactionStatus, ProductCategory, KYCStatus } from "@prisma/client"
import * as bcrypt from "bcrypt"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create admin user
  const adminPassword = await bcrypt.hash("AdminPass123!", 10)
  const admin = await prisma.user.create({
    data: {
      email: "admin@dorce.ai",
      phone: "+2349000000001",
      passwordHash: adminPassword,
      firstName: "Admin",
      lastName: "User",
      role: UserRole.ADMIN,
      emailVerified: true,
      phoneVerified: true,
      wallet: { create: { balance: 1000000 } }, // 10,000 NGN
    },
  })

  // Create merchant user
  const merchantPassword = await bcrypt.hash("MerchantPass123!", 10)
  const merchant = await prisma.user.create({
    data: {
      email: "merchant@dorce.ai",
      phone: "+2349000000002",
      passwordHash: merchantPassword,
      firstName: "Merchant",
      lastName: "User",
      role: UserRole.MERCHANT,
      emailVerified: true,
      phoneVerified: true,
      wallet: { create: { balance: 500000 } }, // 5,000 NGN
    },
  })

  // Create merchant profile
  await prisma.merchant.create({
    data: {
      userId: merchant.id,
      businessName: "Dorce Merchant Store",
      businessType: "Retail",
      apiKey: "pk_test_" + Math.random().toString(36).substring(2, 15),
      apiKeyHash: await bcrypt.hash("pk_test_key", 10),
      isActive: true,
      bankName: "First Bank",
      bankAccountNumber: "1234567890",
      bankAccountName: "Dorce Merchant",
    },
  })

  // Create regular user
  const userPassword = await bcrypt.hash("UserPass123!", 10)
  const user = await prisma.user.create({
    data: {
      email: "user@dorce.ai",
      phone: "+2349000000003",
      passwordHash: userPassword,
      firstName: "John",
      lastName: "Doe",
      role: UserRole.USER,
      emailVerified: true,
      phoneVerified: true,
      wallet: { create: { balance: 250000 } }, // 2,500 NGN
      kyc: {
        create: {
          bvn: "1234567890",
          nin: "12345678901",
          status: KYCStatus.APPROVED,
          approvedAt: new Date(),
        },
      },
    },
  })

  // Create products (airtime and data)
  const products = [
    {
      name: "MTN Airtime ₦500",
      category: ProductCategory.AIRTIME,
      provider: "MTN",
      price: 50000,
      icon: "📱",
    },
    {
      name: "Airtel Airtime ₦1000",
      category: ProductCategory.AIRTIME,
      provider: "Airtel",
      price: 100000,
      icon: "📱",
    },
    {
      name: "Glo Data 1GB",
      category: ProductCategory.DATA,
      provider: "Globacom",
      price: 75000,
      icon: "🌐",
    },
    {
      name: "9mobile Airtime ₦500",
      category: ProductCategory.AIRTIME,
      provider: "9mobile",
      price: 50000,
      icon: "📱",
    },
    {
      name: "EKEDC Electricity Topup",
      category: ProductCategory.ELECTRICITY,
      provider: "EKEDC",
      price: 0,
      icon: "⚡",
    },
  ]

  for (const product of products) {
    await prisma.product.create({
      data: product,
    })
  }

  // Create sample transactions
  await prisma.walletTransaction.create({
    data: {
      walletId: user.wallet!.id,
      userId: user.id,
      type: "TOPUP",
      amount: 100000,
      description: "Wallet top-up via Paystack",
      reference: `TXN_${Date.now()}`,
      status: TransactionStatus.SUCCESS,
      paystackReference: "ps_" + Math.random().toString(36).substring(2, 15),
    },
  })

  // Create fraud alert (simulation)
  await prisma.fraudAlert.create({
    data: {
      userId: user.id,
      rule: "multiple_failed_transactions",
      severity: "MEDIUM",
      description: "User attempted 3 failed transactions in 10 minutes",
      status: "REVIEWING",
      metadata: {
        failedCount: 3,
        timeWindow: "10 minutes",
      },
    },
  })

  console.log("✅ Database seeded successfully")
  console.log("\n📋 Sample Credentials:")
  console.log("   Admin: admin@dorce.ai / AdminPass123!")
  console.log("   Merchant: merchant@dorce.ai / MerchantPass123!")
  console.log("   User: user@dorce.ai / UserPass123!")
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
