#!/usr/bin/env node
/**
 * Script to add two sample vehicles with placeholder images.
 * Run with: node scripts/add-vehicles.js
 */
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function writePlaceholderImage(filename) {
  const outPath = path.join(process.cwd(), 'public', 'images', 'vehicles', filename);
  // 1x1 transparent PNG
  const data = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
    'base64'
  );
  fs.writeFileSync(outPath, data);
  return `/images/vehicles/${filename}`;
}

async function main() {
  // Ensure dir exists
  const uploadDir = path.join(process.cwd(), 'public', 'images', 'vehicles');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const img1 = `vehicle-${Date.now()}-1.png`;
  const img2 = `vehicle-${Date.now()}-2.png`;

  const imgPath1 = await writePlaceholderImage(img1);
  const imgPath2 = await writePlaceholderImage(img2);

  // Create two vehicles matching current prisma schema
  const v1 = await prisma.vehicle.create({
    data: {
      name: 'Demo Vehicle One',
      type: 'car',
      specs: { make: 'DemoMake', model: 'DemoModel', year: 2020 },
      pricePerDay: 49.99,
      images: [imgPath1],
      description: 'This is a demo vehicle added by script.',
      features: ['air conditioning', 'automatic']
    }
  });

  const v2 = await prisma.vehicle.create({
    data: {
      name: 'Demo Vehicle Two',
      type: 'car',
      specs: { make: 'DemoMake', model: 'DemoModel2', year: 2021 },
      pricePerDay: 59.99,
      images: [imgPath2],
      description: 'This is another demo vehicle added by script.',
      features: ['gps', 'manual']
    }
  });

  console.log('Created vehicles:', v1.id, v2.id);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
