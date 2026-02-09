const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteDemoVehicles() {
  try {
    console.log('Deleting demo vehicles...');

    // First, find vehicles with demo names
    const demoVehicles = await prisma.vehicle.findMany({
      where: {
        OR: [
          { name: { contains: 'Demo', mode: 'insensitive' } },
          { name: { contains: 'Test', mode: 'insensitive' } },
          { name: { contains: 'Vehicle', mode: 'insensitive' } },
          { name: { contains: 'Sedan One', mode: 'insensitive' } },
          { name: { contains: 'SUV Two', mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true }
    });

    console.log(`Found ${demoVehicles.length} demo vehicles`);

    for (const vehicle of demoVehicles) {
      console.log(`Processing: ${vehicle.name}`);
      
      // Delete associated bookings first
      const deletedBookings = await prisma.booking.deleteMany({
        where: { vehicleId: vehicle.id }
      });
      
      if (deletedBookings.count > 0) {
        console.log(`  Deleted ${deletedBookings.count} booking(s)`);
      }
      
      // Delete associated reviews
      const deletedReviews = await prisma.review.deleteMany({
        where: { vehicleId: vehicle.id }
      });
      
      if (deletedReviews.count > 0) {
        console.log(`  Deleted ${deletedReviews.count} review(s)`);
      }
      
      // Now delete the vehicle
      await prisma.vehicle.delete({
        where: { id: vehicle.id }
      });
      
      console.log(`  ✓ Deleted vehicle: ${vehicle.name}`);
    }

    console.log(`\n✓ Successfully deleted ${demoVehicles.length} demo vehicles and their associated data`);
  } catch (error) {
    console.error('Error deleting demo vehicles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteDemoVehicles();
