/**
 * Add Vehicle Requests Script
 * Creates sample vehicle requests from users
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addVehicleRequests() {
  try {
    console.log('🚗 Adding vehicle requests...\n');

    // Get a regular user (not admin)
    const users = await prisma.user.findMany({
      where: {
        role: 'USER'
      },
      take: 2
    });

    if (users.length === 0) {
      console.log('❌ No regular users found. Please create users first.');
      console.log('Run: npm run create:test-users');
      return;
    }

    // Vehicle request 1: Luxury SUV
    const request1 = await prisma.vehicleRequest.create({
      data: {
        userId: users[0].id,
        make: 'Range Rover',
        model: 'Velar',
        year: 2024,
        type: 'SUV',
        description: 'Looking for a luxury Range Rover Velar for a 2-week vacation trip. Prefer black or white color with all premium features. Needed in 7 days.',
        status: 'PENDING'
      }
    });

    console.log('✅ Vehicle Request 1 created:');
    console.log(`   User: ${users[0].name} (${users[0].email})`);
    console.log(`   Vehicle: ${request1.year} ${request1.make} ${request1.model}`);
    console.log(`   Type: ${request1.type}`);
    console.log(`   Status: ${request1.status}`);
    console.log(`   ID: ${request1.id}\n`);

    // Vehicle request 2: Sports Car
    const request2 = await prisma.vehicleRequest.create({
      data: {
        userId: users.length > 1 ? users[1].id : users[0].id,
        make: 'Lamborghini',
        model: 'Huracán',
        year: 2023,
        type: 'Sports',
        description: 'Need a Lamborghini Huracán for a special weekend event. Must have full insurance coverage and delivery service. Needed in 2 weeks.',
        status: 'PENDING'
      }
    });

    console.log('✅ Vehicle Request 2 created:');
    console.log(`   User: ${users.length > 1 ? users[1].name : users[0].name} (${users.length > 1 ? users[1].email : users[0].email})`);
    console.log(`   Vehicle: ${request2.year} ${request2.make} ${request2.model}`);
    console.log(`   Type: ${request2.type}`);
    console.log(`   Status: ${request2.status}`);
    console.log(`   ID: ${request2.id}\n`);

    console.log('✨ Successfully created 2 vehicle requests!');
    console.log('\n📋 Next steps:');
    console.log('   1. Visit: http://localhost:3000/admin/vehicle-requests');
    console.log('   2. Review and approve/reject the requests');
    console.log(`   3. Request IDs: ${request1.id}, ${request2.id}`);

    return { request1, request2 };

  } catch (error) {
    console.error('❌ Error creating vehicle requests:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addVehicleRequests()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
