import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin user
  const defaultPassword = 'admin123'; // Change this in production
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);

  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@isp.local',
    },
  });

  console.log('✅ Default admin user created:');
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('   ⚠️  Please change the default password after first login!');

  // Create some sample plans
  const basicPlan = await prisma.plan.upsert({
    where: { name: 'Basic' },
    update: {},
    create: {
      name: 'Basic',
      price: 29.99,
      billingCycle: 'MONTHLY',
      rateLimit: '5M/5M',
      profileName: 'basic',
      description: 'Basic internet plan with 5Mbps download/upload',
    },
  });

  const standardPlan = await prisma.plan.upsert({
    where: { name: 'Standard' },
    update: {},
    create: {
      name: 'Standard',
      price: 49.99,
      billingCycle: 'MONTHLY',
      rateLimit: '10M/10M',
      profileName: 'standard',
      description: 'Standard internet plan with 10Mbps download/upload',
    },
  });

  const premiumPlan = await prisma.plan.upsert({
    where: { name: 'Premium' },
    update: {},
    create: {
      name: 'Premium',
      price: 79.99,
      billingCycle: 'MONTHLY',
      rateLimit: '20M/20M',
      profileName: 'premium',
      description: 'Premium internet plan with 20Mbps download/upload',
    },
  });

  console.log('✅ Sample plans created:');
  console.log('   - Basic: $29.99/month (5M/5M)');
  console.log('   - Standard: $49.99/month (10M/10M)');
  console.log('   - Premium: $79.99/month (20M/20M)');

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });