import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting comprehensive database seeding...')

  // Hash passwords
  const hashedPassword = await bcrypt.hash('password123', 12)
  const adminPassword = await bcrypt.hash('admin123', 12)

  // Create system user
  const systemUser = await prisma.user.upsert({
    where: { email: 'system@dorce.ai' },
    update: {},
    create: {
      email: 'system@dorce.ai',
      phone: '+2348000000000',
      firstName: 'System',
      lastName: 'Account',
      passwordHash: hashedPassword,
      role: 'SUPERADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      isActive: true,
      isBlocked: false,
    },
  })

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@dorce.ai' },
    update: {},
    create: {
      email: 'admin@dorce.ai',
      phone: '+2348000000001',
      firstName: 'Admin',
      lastName: 'User',
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
      isActive: true,
      isBlocked: false,
    },
  })

  // Create test users
  const testUsers = []
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.upsert({
      where: { email: `user${i}@dorce.ai` },
      update: {},
      create: {
        email: `user${i}@dorce.ai`,
        phone: `+23480000000${i.toString().padStart(2, '0')}`,
        firstName: `Test${i}`,
        lastName: `User${i}`,
        passwordHash: hashedPassword,
        role: 'USER',
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
        isBlocked: false,
        nin: `1234567890${i.toString().padStart(2, '0')}`,
        bvn: `1234567890${i.toString().padStart(2, '0')}`,
        ninVerified: i % 2 === 0,
        bvnVerified: i % 3 === 0,
      },
    })
    testUsers.push(user)
  }

  // Create merchant users
  const merchantUsers = []
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.upsert({
      where: { email: `merchant${i}@dorce.ai` },
      update: {},
      create: {
        email: `merchant${i}@dorce.ai`,
        phone: `+2348000000${(i + 10).toString().padStart(2, '0')}`,
        firstName: `Merchant${i}`,
        lastName: `User${i}`,
        passwordHash: hashedPassword,
        role: 'MERCHANT',
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
        isBlocked: false,
      },
    })
    merchantUsers.push(user)
  }

  console.log('✅ Users created')

  // Create subscription plans
  const subscriptionPlans = await Promise.all([
    prisma.subscriptionPlan.upsert({
      where: { id: 'basic-plan' },
      update: {},
      create: {
        id: 'basic-plan',
        name: 'Basic Plan',
        description: 'Basic access to Dorce.ai services',
        price: 1000.00,
        currency: 'NGN',
        billingCycle: 'monthly',
        features: JSON.stringify(['Basic wallet', 'Limited transactions', 'Basic support']),
        isActive: true,
        trialDays: 7,
      },
    }),
    prisma.subscriptionPlan.upsert({
      where: { id: 'premium-plan' },
      update: {},
      create: {
        id: 'premium-plan',
        name: 'Premium Plan',
        description: 'Premium access with advanced features',
        price: 5000.00,
        currency: 'NGN',
        billingCycle: 'monthly',
        features: JSON.stringify(['Advanced wallet', 'Unlimited transactions', 'Priority support', 'Advanced analytics', 'Business tools']),
        isActive: true,
        trialDays: 14,
      },
    }),
    prisma.subscriptionPlan.upsert({
      where: { id: 'enterprise-plan' },
      update: {},
      create: {
        id: 'enterprise-plan',
        name: 'Enterprise Plan',
        description: 'Full enterprise-grade access',
        price: 20000.00,
        currency: 'NGN',
        billingCycle: 'monthly',
        features: JSON.stringify(['Enterprise wallet', 'Unlimited transactions', '24/7 support', 'Advanced analytics', 'Business tools', 'API access', 'Custom integrations']),
        isActive: true,
        trialDays: 30,
      },
    }),
  ])

  console.log('✅ Subscription plans created')

  // Create subscriptions for users
  for (const user of testUsers.slice(0, 5)) {
    await prisma.subscription.upsert({
      where: { id: `sub-${user.id}` },
      update: {},
      create: {
        id: `sub-${user.id}`,
        userId: user.id,
        planId: subscriptionPlans[0].id,
        status: 'active',
        startDate: new Date(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
      },
    })
  }

  console.log('✅ Subscriptions created')

  // Create wallets for users
  const wallets = []
  for (const user of [...testUsers, ...merchantUsers]) {
    const wallet = await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        balance: BigInt(Math.floor(Math.random() * 100000) + 10000), // Random balance between 100-1000 NGN
      },
    })
    wallets.push(wallet)
  }

  console.log('✅ Wallets created')

  // Create wallet transactions
  for (let i = 0; i < 50; i++) {
    const user = testUsers[Math.floor(Math.random() * testUsers.length)]
    const wallet = wallets.find(w => w.userId === user.id)
    
    await prisma.walletTransaction.upsert({
      where: { id: `tx-${i}` },
      update: {},
      create: {
        id: `tx-${i}`,
        walletId: wallet.id,
        userId: user.id,
        type: ['TOPUP', 'WITHDRAWAL', 'TRANSFER', 'PURCHASE'][Math.floor(Math.random() * 4)] as any,
        amount: BigInt(Math.floor(Math.random() * 5000) + 100),
        description: `Test transaction ${i}`,
        reference: `REF${Date.now()}${i}`,
        status: ['SUCCESS', 'PENDING', 'FAILED'][Math.floor(Math.random() * 3)] as any,
        paymentMethod: ['paystack', 'flutterwave', 'remita'][Math.floor(Math.random() * 3)],
      },
    })
  }

  console.log('✅ Wallet transactions created')

  // Create telecom products
  const telecomProducts = await Promise.all([
    prisma.product.upsert({
      where: { id: 'mtn-airtime' },
      update: {},
      create: {
        id: 'mtn-airtime',
        name: 'MTN Airtime',
        category: 'AIRTIME',
        description: 'MTN Nigeria airtime top-up',
        provider: 'MTN',
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'glo-airtime' },
      update: {},
      create: {
        id: 'glo-airtime',
        name: 'Glo Airtime',
        category: 'AIRTIME',
        description: 'Glo Nigeria airtime top-up',
        provider: 'Glo',
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'airtel-airtime' },
      update: {},
      create: {
        id: 'airtel-airtime',
        name: 'Airtel Airtime',
        category: 'AIRTIME',
        description: 'Airtel Nigeria airtime top-up',
        provider: 'Airtel',
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { id: '9mobile-airtime' },
      update: {},
      create: {
        id: '9mobile-airtime',
        name: '9mobile Airtime',
        category: 'AIRTIME',
        description: '9mobile Nigeria airtime top-up',
        provider: '9mobile',
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'mtn-data' },
      update: {},
      create: {
        id: 'mtn-data',
        name: 'MTN Data',
        category: 'DATA',
        description: 'MTN Nigeria data bundles',
        provider: 'MTN',
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 'ikedc-electricity' },
      update: {},
      create: {
        id: 'ikedc-electricity',
        name: 'IKEDC Electricity',
        category: 'ELECTRICITY',
        description: 'Ikeja Electric bill payment',
        provider: 'IKEDC',
        isActive: true,
      },
    }),
  ])

  console.log('✅ Telecom products created')

  // Create recharge transactions
  for (let i = 0; i < 30; i++) {
    const user = testUsers[Math.floor(Math.random() * testUsers.length)]
    const product = telecomProducts[Math.floor(Math.random() * telecomProducts.length)]
    
    await prisma.rechargeTransaction.upsert({
      where: { id: `recharge-${i}` },
      update: {},
      create: {
        id: `recharge-${i}`,
        productId: product.id,
        userId: user.id,
        amount: BigInt(Math.floor(Math.random() * 5000) + 100),
        phone: user.phone,
        network: product.provider,
        reference: `REF${Date.now()}${i}`,
        status: ['SUCCESS', 'PENDING', 'FAILED'][Math.floor(Math.random() * 3)] as any,
      },
    })
  }

  console.log('✅ Recharge transactions created')

  // Create electricity transactions
  for (let i = 0; i < 15; i++) {
    const user = testUsers[Math.floor(Math.random() * testUsers.length)]
    
    await prisma.electricityTransaction.upsert({
      where: { id: `electricity-${i}` },
      update: {},
      create: {
        id: `electricity-${i}`,
        userId: user.id,
        meterNumber: `1234567890${i.toString().padStart(2, '0')}`,
        disco: ['IKEDC', 'EKEDC', 'AEDC', 'PHED'][Math.floor(Math.random() * 4)],
        amount: BigInt(Math.floor(Math.random() * 10000) + 1000),
        token: `TOKEN${Date.now()}${i}`,
        reference: `REF${Date.now()}${i}`,
        status: ['SUCCESS', 'PENDING', 'FAILED'][Math.floor(Math.random() * 3)] as any,
      },
    })
  }

  console.log('✅ Electricity transactions created')

  // Create stores for merchants
  const stores = []
  for (let i = 0; i < merchantUsers.length; i++) {
    const merchant = merchantUsers[i]
    const store = await prisma.store.upsert({
      where: { id: `store-${merchant.id}` },
      update: {},
      create: {
        id: `store-${merchant.id}`,
        userId: merchant.id,
        name: `Test Store ${i + 1}`,
        slug: `test-store-${i + 1}`,
        description: `This is test store number ${i + 1}`,
        phone: merchant.phone,
        email: merchant.email,
        address: `123 Test Street, Lagos`,
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        isActive: true,
        isVerified: i % 2 === 0,
        totalSales: BigInt(Math.floor(Math.random() * 1000000)),
        totalOrders: Math.floor(Math.random() * 100),
        rating: Math.floor(Math.random() * 5) + 1,
        reviewCount: Math.floor(Math.random() * 50),
      },
    })
    stores.push(store)
  }

  console.log('✅ Stores created')

  // Create store products
  const products = []
  for (let i = 0; i < 20; i++) {
    const store = stores[Math.floor(Math.random() * stores.length)]
    const product = await prisma.storeProduct.upsert({
      where: { id: `product-${i}` },
      update: {},
      create: {
        id: `product-${i}`,
        storeId: store.id,
        name: `Test Product ${i + 1}`,
        slug: `test-product-${i + 1}`,
        description: `This is test product number ${i + 1}`,
        shortDescription: `Short description for product ${i + 1}`,
        sku: `SKU${Date.now()}${i}`,
        category: ['ELECTRONICS', 'FASHION', 'HOME_AND_GARDEN', 'BOOKS_AND_MEDIA'][Math.floor(Math.random() * 4)] as any,
        price: BigInt(Math.floor(Math.random() * 50000) + 1000),
        compareAtPrice: BigInt(Math.floor(Math.random() * 60000) + 1500),
        costPrice: BigInt(Math.floor(Math.random() * 40000) + 500),
        currency: 'NGN',
        weight: Math.floor(Math.random() * 1000) + 100,
        isActive: true,
        isFeatured: i % 3 === 0,
        rating: Math.floor(Math.random() * 5) + 1,
        reviewCount: Math.floor(Math.random() * 20),
        viewCount: Math.floor(Math.random() * 1000),
      },
    })
    products.push(product)
  }

  console.log('✅ Store products created')

  // Create orders
  for (let i = 0; i < 25; i++) {
    const user = testUsers[Math.floor(Math.random() * testUsers.length)]
    const store = stores[Math.floor(Math.random() * stores.length)]
    const product = products[Math.floor(Math.random() * products.length)]
    
    const order = await prisma.order.upsert({
      where: { id: `order-${i}` },
      update: {},
      create: {
        id: `order-${i}`,
        userId: user.id,
        storeId: store.id,
        orderNumber: `ORD${Date.now()}${i}`,
        status: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'][Math.floor(Math.random() * 5)] as any,
        subtotal: BigInt(Math.floor(Math.random() * 50000) + 5000),
        shippingCost: BigInt(Math.floor(Math.random() * 2000) + 500),
        taxAmount: BigInt(Math.floor(Math.random() * 3000) + 200),
        discountAmount: BigInt(Math.floor(Math.random() * 5000)),
        totalAmount: BigInt(Math.floor(Math.random() * 60000) + 6000),
        currency: 'NGN',
        paymentStatus: ['PENDING', 'SUCCESS', 'FAILED'][Math.floor(Math.random() * 3)] as any,
        shippingAddress: JSON.stringify({
          street: '123 Test Street',
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria',
          postalCode: '100001',
        }),
        billingAddress: JSON.stringify({
          street: '123 Test Street',
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria',
          postalCode: '100001',
        }),
      },
    })

    // Create order items
    await prisma.orderItem.upsert({
      where: { id: `order-item-${i}` },
      update: {},
      create: {
        id: `order-item-${i}`,
        orderId: order.id,
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: Math.floor(Math.random() * 5) + 1,
        unitPrice: product.price,
        totalPrice: BigInt(Number(product.price) * (Math.floor(Math.random() * 5) + 1)),
      },
    })
  }

  console.log('✅ Orders created')

  // Create loan applications
  for (let i = 0; i < 15; i++) {
    const user = testUsers[Math.floor(Math.random() * testUsers.length)]
    
    await prisma.loanApplication.upsert({
      where: { id: `loan-${i}` },
      update: {},
      create: {
        id: `loan-${i}`,
        userId: user.id,
        amount: BigInt(Math.floor(Math.random() * 500000) + 50000),
        purpose: ['Business expansion', 'Emergency', 'Education', 'Home improvement'][Math.floor(Math.random() * 4)],
        tenure: [3, 6, 12, 24][Math.floor(Math.random() * 4)],
        interestRate: [5, 10, 15, 20][Math.floor(Math.random() * 4)],
        identityScore: Math.floor(Math.random() * 100),
        financialScore: Math.floor(Math.random() * 100),
        behavioralScore: Math.floor(Math.random() * 100),
        repaymentScore: Math.floor(Math.random() * 100),
        finalScore: Math.floor(Math.random() * 100),
        status: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'][Math.floor(Math.random() * 4)] as any,
        approvedAmount: BigInt(Math.floor(Math.random() * 400000) + 30000),
        riskLevel: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
        guarantorName: `Guarantor ${i}`,
        guarantorPhone: `+2348000000${(i + 20).toString().padStart(2, '0')}`,
        guarantorEmail: `guarantor${i}@dorce.ai`,
        workAddress: `Work Address ${i}`,
      },
    })
  }

  console.log('✅ Loan applications created')

  // Create CAC applications
  for (let i = 0; i < 10; i++) {
    const user = testUsers[Math.floor(Math.random() * testUsers.length)]
    
    await prisma.cACApplication.upsert({
      where: { id: `cac-${i}` },
      update: {},
      create: {
        id: `cac-${i}`,
        userId: user.id,
        businessName: `Test Business ${i + 1} Limited`,
        businessType: 'LIMITED_LIABILITY_COMPANY',
        registrationType: 'NEW_REGISTRATION',
        status: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'][Math.floor(Math.random() * 4)] as any,
        proposedNames: [`Test Business ${i + 1} Limited`, `TB${i + 1} Ltd`, `TestBiz ${i + 1} Limited`],
        companyAddress: `123 Business Street, Lagos`,
        companyEmail: `business${i}@dorce.ai`,
        companyPhone: `+2348000000${(i + 30).toString().padStart(2, '0')}`,
        directors: JSON.stringify([
          { name: `Director ${i}`, email: `director${i}@dorce.ai`, phone: `+2348000000${(i + 40).toString().padStart(2, '0')}` }
        ]),
        shareholders: JSON.stringify([
          { name: `Shareholder ${i}`, shares: 100 }
        ]),
        shareCapital: BigInt(1000000),
        processingFee: BigInt(50000),
        serviceCharge: BigInt(10000),
        totalAmount: BigInt(60000),
      },
    })
  }

  console.log('✅ CAC applications created')

  // Create conversations and messages
  for (let i = 0; i < 10; i++) {
    const user = testUsers[Math.floor(Math.random() * testUsers.length)]
    
    const conversation = await prisma.conversation.upsert({
      where: { id: `conversation-${i}` },
      update: {},
      create: {
        id: `conversation-${i}`,
        userId: user.id,
        title: `Test Conversation ${i + 1}`,
        status: 'active',
      },
    })

    // Create messages for each conversation
    for (let j = 0; j < 5; j++) {
      await prisma.message.upsert({
        where: { id: `message-${i}-${j}` },
        update: {},
        create: {
          id: `message-${i}-${j}`,
          conversationId: conversation.id,
          userId: user.id,
          content: `This is test message ${j + 1} in conversation ${i + 1}`,
          role: j % 2 === 0 ? 'user' : 'assistant',
          intent: ['none', 'buy_airtime', 'wallet_topup', 'check_balance'][Math.floor(Math.random() * 4)] as any,
        },
      })
    }
  }

  console.log('✅ Conversations and messages created')

  // Create fraud alerts
  for (let i = 0; i < 8; i++) {
    const user = testUsers[Math.floor(Math.random() * testUsers.length)]
    
    await prisma.fraudAlert.upsert({
      where: { id: `fraud-${i}` },
      update: {},
      create: {
        id: `fraud-${i}`,
        userId: user.id,
        rule: ['Suspicious login', 'Unusual transaction', 'Multiple failed attempts', 'Geographic anomaly'][Math.floor(Math.random() * 4)],
        severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)] as any,
        description: `Test fraud alert ${i + 1}`,
        status: ['OPEN', 'REVIEWING', 'APPROVED', 'BLOCKED', 'RESOLVED'][Math.floor(Math.random() * 5)] as any,
      },
    })
  }

  console.log('✅ Fraud alerts created')

  // Create AI request logs
  for (let i = 0; i < 20; i++) {
    const user = testUsers[Math.floor(Math.random() * testUsers.length)]
    
    await prisma.aIRequestLog.upsert({
      where: { id: `ai-${i}` },
      update: {},
      create: {
        id: `ai-${i}`,
        userId: user.id,
        provider: ['OpenAI', 'OpenRouter', 'NeuralCore'][Math.floor(Math.random() * 3)],
        model: ['gpt-4', 'gpt-3.5-turbo', 'claude-3'][Math.floor(Math.random() * 3)],
        prompt: `Test prompt ${i + 1}`,
        completion: `Test completion ${i + 1}`,
        inputTokens: Math.floor(Math.random() * 1000) + 100,
        outputTokens: Math.floor(Math.random() * 500) + 50,
        totalTokens: Math.floor(Math.random() * 1500) + 150,
        costInCents: Math.floor(Math.random() * 100) + 10,
        status: ['SUCCESS', 'FAILED'][Math.floor(Math.random() * 2)] as any,
      },
    })
  }

  console.log('✅ AI request logs created')

  // Create ledger accounts for enhanced schema
  const ledgerAccounts = await Promise.all([
    prisma.ledgerAccount.upsert({
      where: { id: 'system-control' },
      update: {},
      create: {
        id: 'system-control',
        accountNumber: '1000000001',
        accountType: 'SYSTEM_CONTROL',
        currency: 'NGN',
        balance: BigInt(0),
        isActive: true,
        isSystem: true,
        description: 'System Control Account',
      },
    }),
    prisma.ledgerAccount.upsert({
      where: { id: 'customer-deposits' },
      update: {},
      create: {
        id: 'customer-deposits',
        accountNumber: '2000000001',
        accountType: 'CUSTOMER_DEPOSIT',
        currency: 'NGN',
        balance: BigInt(0),
        isActive: true,
        isSystem: true,
        description: 'Customer Deposits Liability',
      },
    }),
  ])

  console.log('✅ Ledger accounts created')

  // Create audit logs
  for (let i = 0; i < 30; i++) {
    const user = testUsers[Math.floor(Math.random() * testUsers.length)]
    
    await prisma.auditLog.upsert({
      where: { id: `audit-${i}` },
      update: {},
      create: {
        id: `audit-${i}`,
        userId: user.id,
        requestId: `REQ${Date.now()}${i}`,
        action: ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN'][Math.floor(Math.random() * 5)] as any,
        resourceType: ['USER', 'WALLET', 'TRANSACTION', 'ORDER', 'PRODUCT'][Math.floor(Math.random() * 5)] as any,
        resourceId: `resource-${i}`,
        resourceDisplay: `Test Resource ${i + 1}`,
        actionDetails: JSON.stringify({ test: `action-${i}` }),
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255) + 1}`,
        userAgent: 'Mozilla/5.0 (Test Browser)',
        geographicLocation: 'Lagos, Nigeria',
        riskScore: Math.floor(Math.random() * 100),
        serviceName: 'dorce-ai-backend',
        environment: 'development',
        version: '1.0.0',
        logHash: `hash-${Date.now()}${i}`,
      },
    })
  }

  console.log('✅ Audit logs created')

  // Create security events
  for (let i = 0; i < 15; i++) {
    const user = testUsers[Math.floor(Math.random() * testUsers.length)]
    
    await prisma.securityEvent.upsert({
      where: { id: `security-${i}` },
      update: {},
      create: {
        id: `security-${i}`,
        eventType: ['LOGIN_ANOMALY', 'TRANSACTION_ANOMALY', 'BRUTE_FORCE_ATTEMPT', 'SUSPICIOUS_API_USAGE'][Math.floor(Math.random() * 4)] as any,
        severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)] as any,
        title: `Security Event ${i + 1}`,
        description: `Test security event ${i + 1}`,
        eventData: JSON.stringify({ test: `security-${i}` }),
        userId: user.id,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255) + 1}`,
        userAgent: 'Mozilla/5.0 (Test Browser)',
        geographicLocation: 'Lagos, Nigeria',
        blocked: Math.random() > 0.5,
        investigationStatus: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'FALSE_POSITIVE'][Math.floor(Math.random() * 4)] as any,
      },
    })
  }

  console.log('✅ Security events created')

  console.log('🎉 Comprehensive database seeding completed successfully!')
  console.log('📊 Summary:')
  console.log(`   - System Users: 2 (System, Admin)`)
  console.log(`   - Test Users: ${testUsers.length}`)
  console.log(`   - Merchant Users: ${merchantUsers.length}`)
  console.log(`   - Subscription Plans: ${subscriptionPlans.length}`)
  console.log(`   - Wallets: ${wallets.length}`)
  console.log(`   - Telecom Products: ${telecomProducts.length}`)
  console.log(`   - Stores: ${stores.length}`)
  console.log(`   - Store Products: ${products.length}`)
  console.log(`   - Additional entities: Transactions, Orders, Loans, CAC Applications, Conversations, Fraud Alerts, AI Logs, Ledger Accounts, Audit Logs, Security Events`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })