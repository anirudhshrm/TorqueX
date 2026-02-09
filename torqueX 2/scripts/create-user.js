// A simple script to create regular users with passwords
const { PrismaClient } = require('@prisma/client');
const crypto = require('../src/utils/crypto');
const prisma = new PrismaClient();

async function createUsers() {
  try {
    // Regular user
    const userPassword = 'user123';
    const { hash: userHash, salt: userSalt } = await crypto.hashPassword(userPassword);
    
    const regularUser = await prisma.user.upsert({
      where: { email: 'user@torquex.com' },
      update: { 
        role: 'USER',
        passwordHash: userHash,
        passwordSalt: userSalt
      },
      create: {
        clerkId: `manual-user-${Date.now()}`,
        name: 'Regular User',
        email: 'user@torquex.com',
        role: 'USER',
        passwordHash: userHash,
        passwordSalt: userSalt
      }
    });
    
    console.log('Regular user created/updated:', regularUser.email);
    console.log('Password:', userPassword);
    
    // Test user 1
    const test1Password = 'test123';
    const { hash: test1Hash, salt: test1Salt } = await crypto.hashPassword(test1Password);
    
    const test1 = await prisma.user.upsert({
      where: { email: 'test1@torquex.com' },
      update: { 
        role: 'USER',
        passwordHash: test1Hash,
        passwordSalt: test1Salt
      },
      create: {
        clerkId: `manual-test1-${Date.now()}`,
        name: 'Test User 1',
        email: 'test1@torquex.com',
        role: 'USER',
        passwordHash: test1Hash,
        passwordSalt: test1Salt
      }
    });
    
    console.log('Test user 1 created/updated:', test1.email);
    console.log('Password:', test1Password);
    
    // Test user 2
    const test2Password = 'test123';
    const { hash: test2Hash, salt: test2Salt } = await crypto.hashPassword(test2Password);
    
    const test2 = await prisma.user.upsert({
      where: { email: 'test2@torquex.com' },
      update: { 
        role: 'USER',
        passwordHash: test2Hash,
        passwordSalt: test2Salt
      },
      create: {
        clerkId: `manual-test2-${Date.now()}`,
        name: 'Test User 2',
        email: 'test2@torquex.com',
        role: 'USER',
        passwordHash: test2Hash,
        passwordSalt: test2Salt
      }
    });
    
    console.log('Test user 2 created/updated:', test2.email);
    console.log('Password:', test2Password);
    
    console.log('\n✅ All users created successfully!');
  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUsers();
