import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSubscriptionPlans() {
  const subscriptionPlans = [
    {
      id: 'basic-plan',
      name: 'Basic Access',
      description: 'Perfect for individuals getting started with digital services',
      price: 2500, // NGN 2,500 monthly
      currency: 'NGN',
      billingCycle: 'monthly',
      features: [
        'Access to basic apps (Chat, News, Community)',
        '5GB cloud storage',
        'Basic AI assistance',
        'Standard support',
        'Mobile app access',
      ],
      isActive: true,
      trialDays: 7,
      setupFee: 0,
    },
    {
      id: 'pro-plan',
      name: 'Professional',
      description: 'Ideal for professionals and small businesses',
      price: 7500, // NGN 7,500 monthly
      currency: 'NGN',
      billingCycle: 'monthly',
      features: [
        'All basic features',
        'Access to all 10 OS apps',
        '50GB cloud storage',
        'Advanced AI with neural core',
        'Priority support',
        'Advanced analytics',
        'Multi-currency wallet',
        'Basic marketplace features',
      ],
      isActive: true,
      trialDays: 14,
      setupFee: 0,
    },
    {
      id: 'business-plan',
      name: 'Business',
      description: 'Complete solution for growing businesses',
      price: 15000, // NGN 15,000 monthly
      currency: 'NGN',
      billingCycle: 'monthly',
      features: [
        'All professional features',
        'Unlimited cloud storage',
        'Premium AI with quantum processing',
        '24/7 premium support',
        'Advanced marketplace with vendor tools',
        'Business analytics dashboard',
        'Team collaboration tools',
        'Custom integrations',
        'White-label options',
        'Dedicated account manager',
      ],
      isActive: true,
      trialDays: 30,
      setupFee: 5000,
    },
    {
      id: 'enterprise-plan',
      name: 'Enterprise',
      description: 'Tailored solutions for large organizations',
      price: 50000, // NGN 50,000 monthly
      currency: 'NGN',
      billingCycle: 'monthly',
      features: [
        'All business features',
        'Unlimited everything',
        'Custom AI models',
        'Enterprise-grade security',
        'Custom marketplace development',
        'API access',
        'Custom branding',
        'SLA guarantees',
        'On-premise deployment options',
        'Custom feature development',
        'Dedicated infrastructure',
      ],
      isActive: true,
      trialDays: 30,
      setupFee: 25000,
    },
    // Quarterly plans (10% discount)
    {
      id: 'pro-quarterly',
      name: 'Professional Quarterly',
      description: 'Professional plan with quarterly billing (10% discount)',
      price: 20250, // NGN 20,250 quarterly (7,500 * 3 * 0.9)
      currency: 'NGN',
      billingCycle: 'quarterly',
      features: [
        'All Professional features',
        '10% quarterly discount',
        'Priority feature requests',
        'Quarterly business review',
      ],
      isActive: true,
      trialDays: 14,
      setupFee: 0,
    },
    // Yearly plans (20% discount)
    {
      id: 'pro-yearly',
      name: 'Professional Yearly',
      description: 'Professional plan with yearly billing (20% discount)',
      price: 72000, // NGN 72,000 yearly (7,500 * 12 * 0.8)
      currency: 'NGN',
      billingCycle: 'yearly',
      features: [
        'All Professional features',
        '20% yearly discount',
        'Priority feature requests',
        'Annual business review',
        'Free setup consultation',
      ],
      isActive: true,
      trialDays: 14,
      setupFee: 0,
    },
  ];

  console.log('Seeding subscription plans...');

  for (const plan of subscriptionPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: plan.id },
      update: {
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        billingCycle: plan.billingCycle,
        features: JSON.stringify(plan.features),
        isActive: plan.isActive,
        trialDays: plan.trialDays,
        setupFee: plan.setupFee,
      },
      create: {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        billingCycle: plan.billingCycle,
        features: JSON.stringify(plan.features),
        isActive: plan.isActive,
        trialDays: plan.trialDays,
        setupFee: plan.setupFee,
      },
    });
    console.log(`✓ Subscription plan created/updated: ${plan.name}`);
  }

  console.log('Subscription plans seeding completed!');
}

async function main() {
  try {
    await seedSubscriptionPlans();
  } catch (error) {
    console.error('Error seeding subscription plans:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();