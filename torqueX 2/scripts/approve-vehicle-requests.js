/**
 * Approve Vehicle Requests Script
 * Approves all pending vehicle requests
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function approveVehicleRequests() {
  try {
    console.log('✅ Approving vehicle requests...\n');

    // Get all pending vehicle requests
    const pendingRequests = await prisma.vehicleRequest.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        user: true
      }
    });

    if (pendingRequests.length === 0) {
      console.log('ℹ️  No pending vehicle requests found.');
      return;
    }

    console.log(`Found ${pendingRequests.length} pending request(s):\n`);

    // Approve each request
    for (const request of pendingRequests) {
      const updated = await prisma.vehicleRequest.update({
        where: { id: request.id },
        data: {
          status: 'APPROVED',
          adminComment: 'Request approved. We will contact you shortly to finalize the details and arrange the vehicle.'
        }
      });

      console.log(`✅ Approved Request ID: ${updated.id}`);
      console.log(`   User: ${request.user.name} (${request.user.email})`);
      console.log(`   Vehicle: ${updated.year} ${updated.make} ${updated.model}`);
      console.log(`   Type: ${updated.type}`);
      console.log(`   Status: ${updated.status}`);
      console.log(`   Admin Comment: ${updated.adminComment}\n`);
    }

    console.log(`✨ Successfully approved ${pendingRequests.length} vehicle request(s)!`);
    console.log('\n📋 You can view them at: http://localhost:3000/admin/vehicle-requests?status=approved');

  } catch (error) {
    console.error('❌ Error approving vehicle requests:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
approveVehicleRequests()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
