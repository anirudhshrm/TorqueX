const axios = require('axios');

const baseURL = 'http://localhost:3000';

async function populateCache() {
  console.log('🔄 Populating Redis cache...\n');
  
  const endpoints = [
    { url: '/', name: 'Homepage (Featured Vehicles)' },
    { url: '/vehicles', name: 'Vehicles List' },
    { url: '/deals', name: 'Active Deals' },
    { url: '/vehicles?type=SUV', name: 'SUV Vehicles' },
    { url: '/vehicles?type=Sedan', name: 'Sedan Vehicles' },
  ];
  
  for (const endpoint of endpoints) {
    try {
      await axios.get(`${baseURL}${endpoint.url}`);
      console.log(`✅ Cached: ${endpoint.name} (${endpoint.url})`);
    } catch (error) {
      console.log(`❌ Failed: ${endpoint.name} - ${error.message}`);
    }
  }
  
  console.log('\n✨ Cache population complete!');
  console.log('📊 Visit http://localhost:3000/admin/dashboard to see cached data\n');
}

populateCache().catch(console.error);
