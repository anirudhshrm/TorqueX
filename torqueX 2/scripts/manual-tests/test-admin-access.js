const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  // Find admin user
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@torquex.com' }
  });
  
  console.log('Admin user:', admin);
  console.log('Role:', admin?.role);
  console.log('Is ADMIN?:', admin?.role === 'ADMIN');
  
  await prisma.$disconnect();
}

test();
