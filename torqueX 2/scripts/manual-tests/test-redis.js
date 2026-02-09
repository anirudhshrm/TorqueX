const { initRedis, setCache, getCache } = require('./src/utils/redis');

async function test() {
  console.log('Testing Redis cache...');
  
  // Initialize Redis first
  await initRedis();
  console.log('Redis initialized');
  
  // Test write
  const success = await setCache('test:torquex:key', { message: 'Hello from TorqueX!' }, 60);
  console.log('Write success:', success);
  
  // Test read
  const value = await getCache('test:torquex:key');
  console.log('Read value:', value);
  
  process.exit(0);
}

test();
