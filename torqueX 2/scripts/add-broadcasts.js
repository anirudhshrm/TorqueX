#!/usr/bin/env node
/**
 * Script to add sample broadcasts
 * Run with: node scripts/add-broadcasts.js
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Get admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!admin) {
    console.error('No admin user found. Please create an admin user first.');
    process.exit(1);
  }

  // Create sample broadcasts
  const broadcast1 = await prisma.broadcast.create({
    data: {
      adminId: admin.id,
      title: 'New Vehicles Added!',
      message: 'Check out our latest collection of premium vehicles now available for booking.',
      userTarget: 'ALL'
    }
  });

  const broadcast2 = await prisma.broadcast.create({
    data: {
      adminId: admin.id,
      title: 'Special Weekend Offer',
      message: 'Book any vehicle this weekend and get 20% off! Limited time offer.',
      userTarget: 'ALL'
    }
  });

  const broadcast3 = await prisma.broadcast.create({
    data: {
      adminId: admin.id,
      title: 'Redis Caching Enabled',
      message: 'Our platform now uses Redis for faster performance and better user experience!',
      userTarget: 'ALL'
    }
  });

  console.log('Created broadcasts:', broadcast1.id, broadcast2.id, broadcast3.id);
  console.log('✓ 3 broadcasts added successfully!');
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
