// A simple script to create an admin user
const { PrismaClient } = require('@prisma/client');
const crypto = require('../src/utils/crypto');
const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Default admin password - should be changed after first login
    const defaultPassword = 'admin123';
    
    // Hash the password
    const { hash: passwordHash, salt: passwordSalt } = await crypto.hashPassword(defaultPassword);
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@torquex.com' },
      update: { 
        role: 'ADMIN',
        passwordHash,
        passwordSalt
      },
      create: {
        clerkId: `manual-admin-${Date.now()}`,
        name: 'Admin User',
        email: 'admin@torquex.com',
        role: 'ADMIN',
        passwordHash,
        passwordSalt
      }
    });
    
    console.log('Admin user created/updated:', adminUser.email);
    console.log('Default password:', defaultPassword);
    console.log('⚠️  Please change this password after first login!');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();