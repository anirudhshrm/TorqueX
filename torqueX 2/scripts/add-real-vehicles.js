const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addVehicles() {
  try {
    console.log('Adding vehicles with real images...');

    const vehicles = [
      {
        name: 'Tesla Model 3',
        type: 'Sedan',
        description: 'Electric sedan with autopilot, premium interior, and exceptional performance. Zero emissions, instant acceleration.',
        pricePerDay: 120,
        availability: true,
        specs: {},
        images: [
          'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80',
          'https://images.unsplash.com/photo-1561580125-028ee3bd62eb?w=800&q=80'
        ]
      },
      {
        name: 'BMW X5',
        type: 'SUV',
        description: 'Luxury SUV with spacious interior, advanced safety features, and powerful engine. Perfect for family trips.',
        pricePerDay: 150,
        availability: true,
        specs: {},
        images: [
          'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
          'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80'
        ]
      },
      {
        name: 'Mercedes-Benz C-Class',
        type: 'Sedan',
        description: 'Premium sedan with elegant design, cutting-edge technology, and superior comfort. Ultimate luxury experience.',
        pricePerDay: 140,
        availability: true,
        specs: {},
        images: [
          'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80',
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80'
        ]
      },
      {
        name: 'Porsche 911',
        type: 'Sports Car',
        description: 'Iconic sports car with thrilling performance, precision handling, and timeless design. Pure driving excitement.',
        pricePerDay: 300,
        availability: true,
        specs: {},
        images: [
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
          'https://images.unsplash.com/photo-1614162692292-7ac56d7f4eab?w=800&q=80'
        ]
      },
      {
        name: 'Audi Q7',
        type: 'SUV',
        description: 'Sophisticated SUV with three rows, premium materials, and advanced tech. Comfort meets capability.',
        pricePerDay: 160,
        availability: true,
        specs: {},
        images: [
          'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80',
          'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80'
        ]
      },
      {
        name: 'Range Rover Sport',
        type: 'SUV',
        description: 'Luxury off-road SUV with commanding presence, refined interior, and exceptional versatility. Adventure ready.',
        pricePerDay: 200,
        availability: true,
        specs: {},
        images: [
          'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80',
          'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80'
        ]
      },
      {
        name: 'Ford Mustang GT',
        type: 'Sports Car',
        description: 'American muscle car with powerful V8, aggressive styling, and exhilarating exhaust note. Classic performance.',
        pricePerDay: 180,
        availability: true,
        specs: {},
        images: [
          'https://images.unsplash.com/photo-1584345604476-8ec5f8ec03e4?w=800&q=80',
          'https://images.unsplash.com/photo-1541443131876-44b03de101c5?w=800&q=80'
        ]
      },
      {
        name: 'Lexus ES 350',
        type: 'Sedan',
        description: 'Refined luxury sedan with exceptional reliability, quiet cabin, and smooth ride. Japanese craftsmanship.',
        pricePerDay: 110,
        availability: true,
        specs: {},
        images: [
          'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&q=80',
          'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80'
        ]
      },
      {
        name: 'Jeep Wrangler',
        type: 'SUV',
        description: 'Legendary off-roader with removable doors, rugged capability, and iconic design. Built for adventure.',
        pricePerDay: 130,
        availability: true,
        specs: {},
        images: [
          'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80',
          'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80'
        ]
      },
      {
        name: 'Chevrolet Corvette',
        type: 'Sports Car',
        description: 'Mid-engine supercar with stunning performance, aggressive looks, and incredible value. American dream machine.',
        pricePerDay: 250,
        availability: true,
        specs: {},
        images: [
          'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80'
        ]
      }
    ];

    for (const vehicle of vehicles) {
      const created = await prisma.vehicle.create({
        data: vehicle
      });
      console.log(`✓ Added: ${created.name} ($${created.pricePerDay}/day)`);
    }

    console.log(`\n✓ Successfully added ${vehicles.length} vehicles with images!`);
  } catch (error) {
    console.error('Error adding vehicles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addVehicles();
