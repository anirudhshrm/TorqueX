#!/usr/bin/env node
/**
 * Test script to verify vehicles via database
 */
const { PrismaClient } = require('@prisma/client');

async function main() {
  try {
    console.log('🔍 Checking database for demo vehicles...');
    const prisma = new PrismaClient();
    
    const vehicles = await prisma.vehicle.findMany({
      where: {
        name: {
          contains: 'Demo',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        type: true,
        pricePerDay: true,
        images: true,
        features: true,
        specs: true
      }
    });
    
    console.log(`\n📊 Found ${vehicles.length} demo vehicle(s) in database:`);
    vehicles.forEach(v => {
      console.log(`\n  ✅ ${v.name}`);
      console.log(`     ID: ${v.id}`);
      console.log(`     Type: ${v.type}`);
      console.log(`     Price: $${v.pricePerDay}/day`);
      console.log(`     Images: ${v.images.length} image(s) - ${v.images.join(', ')}`);
      console.log(`     Features: ${v.features.join(', ')}`);
      console.log(`     Specs:`, v.specs);
    });
    
    // Check if images exist on disk
    console.log('\n📁 Checking if image files exist on disk:');
    const fs = require('fs');
    const path = require('path');
    vehicles.forEach(v => {
      v.images.forEach(imgPath => {
        const fullPath = path.join(process.cwd(), 'public', imgPath);
        const exists = fs.existsSync(fullPath);
        console.log(`  ${exists ? '✅' : '❌'} ${imgPath} ${exists ? 'exists' : 'NOT FOUND'}`);
      });
    });
    
    await prisma.$disconnect();

    console.log('\n✅ Test complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
    }
  }
}

main();
