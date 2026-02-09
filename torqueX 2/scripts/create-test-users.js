// Script to create test users and admin accounts
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('Creating test users and admin accounts...');
    
    // Create admin user
    const admin = await prisma.user.upsert({
      where: { email: 'admin@torquex.com' },
      update: { 
        role: 'ADMIN',
        name: 'Admin User'
      },
      create: {
        clerkId: `manual-admin-${Date.now()}`,
        name: 'Admin User',
        email: 'admin@torquex.com',
        role: 'ADMIN'
      }
    });
    
    console.log('Admin user created/updated:', admin);
    
    // Create regular user
    const user = await prisma.user.upsert({
      where: { email: 'user@torquex.com' },
      update: { 
        role: 'USER',
        name: 'Regular User'
      },
      create: {
        clerkId: `manual-user-${Date.now()}`,
        name: 'Regular User',
        email: 'user@torquex.com',
        role: 'USER'
      }
    });
    
    console.log('Regular user created/updated:', user);
    
    // Create test users
    const test1 = await prisma.user.upsert({
      where: { email: 'test1@torquex.com' },
      update: { 
        role: 'USER',
        name: 'Test User 1'
      },
      create: {
        clerkId: `manual-test1-${Date.now()}`,
        name: 'Test User 1',
        email: 'test1@torquex.com',
        role: 'USER'
      }
    });
    
    console.log('Test user 1 created/updated:', test1);
    
    const test2 = await prisma.user.upsert({
      where: { email: 'test2@torquex.com' },
      update: { 
        role: 'USER',
        name: 'Test User 2'
      },
      create: {
        clerkId: `manual-test2-${Date.now()}`,
        name: 'Test User 2',
        email: 'test2@torquex.com',
        role: 'USER'
      }
    });
    
    console.log('Test user 2 created/updated:', test2);
    
    console.log('All test users created successfully!');
    console.log('You can now use these credentials to log in to the application.');
    console.log('See CREDENTIALS.md for login details.');
    
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createTestUsers();