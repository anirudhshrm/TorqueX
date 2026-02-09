#!/usr/bin/env node
/**
 * TorqueX E2E Testing Demonstration
 * Shows off Jest + Puppeteer capabilities
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🎭 TorqueX E2E Testing Demonstration\n');

const demos = [
  {
    name: 'Homepage Navigation Tests',
    description: 'Watch Puppeteer navigate through your website automatically',
    command: 'npm run test:e2e:headed -- --testNamePattern="should navigate" --verbose'
  },
  {
    name: 'Responsive Design Tests', 
    description: 'See Puppeteer test different screen sizes automatically',
    command: 'npm run test:e2e:headed -- --testNamePattern="responsive" --verbose'
  },
  {
    name: 'Form Interaction Tests',
    description: 'Watch Puppeteer fill forms and interact with UI elements',
    command: 'npm run test:e2e:headed -- --testNamePattern="filter" --verbose'
  },
  {
    name: 'All Local Tests (Fast)',
    description: 'Run all 46 tests in headless mode for speed',
    command: 'npm run test:e2e'
  },
  {
    name: 'Production Testing',
    description: 'Test against live Railway deployment',
    command: 'BASE_URL=https://torquex-production.up.railway.app npm run test:e2e -- --testNamePattern="should load"'
  }
];

function runDemo(demo) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Running: ${demo.name}`);
    console.log(`📝 ${demo.description}`);
    console.log(`⚡ Command: ${demo.command}\n`);
    
    const child = spawn('sh', ['-c', demo.command], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    child.on('close', (code) => {
      console.log(`\n✅ ${demo.name} completed with code ${code}\n`);
      console.log('='.repeat(60));
      resolve(code);
    });
    
    child.on('error', reject);
  });
}

async function runDemos() {
  console.log('Available demonstrations:');
  demos.forEach((demo, i) => {
    console.log(`${i + 1}. ${demo.name} - ${demo.description}`);
  });
  
  console.log('\nTo run a specific demo, use:');
  console.log('node demo-tests.js [number]\n');
  
  const demoIndex = parseInt(process.argv[2]) - 1;
  
  if (demoIndex >= 0 && demoIndex < demos.length) {
    await runDemo(demos[demoIndex]);
  } else if (process.argv[2] === 'all') {
    console.log('Running all demonstrations...\n');
    for (const demo of demos) {
      await runDemo(demo);
    }
  } else {
    console.log('💡 Quick start: Run a fast demonstration');
    await runDemo(demos[3]); // All local tests
  }
}

runDemos().catch(console.error);