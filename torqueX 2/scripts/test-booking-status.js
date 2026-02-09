/**
 * Test script to create a pending booking and verify it can be updated
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Checking for existing bookings...\n');

    // Get a user and vehicle
    const user = await prisma.user.findFirst({
      where: { role: 'USER' }
    });

    const vehicle = await prisma.vehicle.findFirst({
      where: { availability: true }
    });

    if (!user || !vehicle) {
      console.error('❌ Need at least one user and one available vehicle');
      process.exit(1);
    }

    // Check for existing pending bookings
    let booking = await prisma.booking.findFirst({
      where: {
        status: 'PENDING'
      },
      include: {
        user: true,
        vehicle: true
      }
    });

    if (!booking) {
      console.log('📝 No pending bookings found. Creating a test booking...\n');

      // Create a test booking
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7); // Start 7 days from now
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 3); // 3-day rental

      booking = await prisma.booking.create({
        data: {
          userId: user.id,
          vehicleId: vehicle.id,
          startDate,
          endDate,
          totalPrice: vehicle.pricePerDay * 3,
          status: 'PENDING'
        },
        include: {
          user: true,
          vehicle: true
        }
      });

      console.log('✅ Created test booking:');
    } else {
      console.log('✅ Found existing pending booking:');
    }

    console.log(`   ID: ${booking.id}`);
    console.log(`   User: ${booking.user.name}`);
    console.log(`   Vehicle: ${booking.vehicle.name}`);
    console.log(`   Start: ${booking.startDate.toLocaleDateString()}`);
    console.log(`   End: ${booking.endDate.toLocaleDateString()}`);
    console.log(`   Price: $${booking.totalPrice.toFixed(2)}`);
    console.log(`   Status: ${booking.status}`);

    console.log('\n📋 To test the admin booking status update:');
    console.log(`   1. Open: http://localhost:3000/admin/bookings`);
    console.log(`   2. Find booking ID: ${booking.id.substring(0, 8)}...`);
    console.log(`   3. Change status from "Pending" to "Confirm"`);
    console.log(`   4. Check browser console and server logs for CSRF validation`);

    // Also check all bookings count
    const totalBookings = await prisma.booking.count();
    const pendingBookings = await prisma.booking.count({ where: { status: 'PENDING' } });
    const confirmedBookings = await prisma.booking.count({ where: { status: 'CONFIRMED' } });

    console.log('\n📊 Booking Statistics:');
    console.log(`   Total: ${totalBookings}`);
    console.log(`   Pending: ${pendingBookings}`);
    console.log(`   Confirmed: ${confirmedBookings}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
