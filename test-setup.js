#!/usr/bin/env node

/**
 * Simple test script to verify the facilitator setup
 * Run with: node test-setup.js
 */

const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runTests() {
  console.log(`Testing facilitator at ${BASE_URL}\n`);
  
  const tests = [
    {
      name: 'Health Check',
      path: '/health',
      expectedStatus: 200
    },
    {
      name: 'Root Endpoint',
      path: '/',
      expectedStatus: 200
    },
    {
      name: 'Supported Networks',
      path: '/supported',
      expectedStatus: 200
    },
    {
      name: 'Verify Endpoint Info',
      path: '/verify',
      expectedStatus: 200
    },
    {
      name: 'Settle Endpoint Info',
      path: '/settle',
      expectedStatus: 200
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      const result = await makeRequest(test.path);
      
      if (result.status === test.expectedStatus) {
        console.log(`✅ ${test.name}: PASSED (${result.status})`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: FAILED (expected ${test.expectedStatus}, got ${result.status})`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      failed++;
    }
  }

  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Your facilitator is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check your setup and try again.');
    process.exit(1);
  }
}

// Check if server is running
makeRequest('/health')
  .then(() => {
    console.log('Server is running, starting tests...\n');
    return runTests();
  })
  .catch((error) => {
    console.log('❌ Server is not running or not accessible.');
    console.log('Please start the server with: npm run dev');
    console.log('Then run this test again.');
    process.exit(1);
  });
