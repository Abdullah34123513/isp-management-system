#!/usr/bin/env node

/**
 * Test script for PPPoE user synchronization functionality
 * This script tests the PPPoE user sync feature by simulating the API calls
 */

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_ROUTER = {
  host: '192.168.1.1',
  apiUser: 'admin',
  apiPassword: 'password',
  label: 'Test Router'
};

// Test data
const testCredentials = {
  username: 'admin',
  password: 'admin123'
};

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: testCredentials.username,
        password: testCredentials.password
      })
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Login successful');
    return data;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
}

async function testAddRouter() {
  try {
    console.log('🌐 Adding test router...');
    const response = await fetch(`${BASE_URL}/api/routers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-session' // Add session cookie
      },
      body: JSON.stringify(TEST_ROUTER)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to add router: ${errorData.error}`);
    }

    const router = await response.json();
    console.log('✅ Router added successfully:', router.id);
    return router;
  } catch (error) {
    console.error('❌ Failed to add router:', error.message);
    throw error;
  }
}

async function testSyncPPPoEUsers(routerId) {
  try {
    console.log('🔄 Syncing PPPoE users...');
    const response = await fetch(`${BASE_URL}/api/routers/${routerId}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-session' // Add session cookie
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to sync PPPoE users: ${errorData.error}`);
    }

    const result = await response.json();
    console.log('✅ PPPoE users synced successfully:');
    console.log(`   - Total synced: ${result.syncedCount}`);
    console.log(`   - New users: ${result.createdCount}`);
    console.log(`   - Updated users: ${result.updatedCount}`);
    console.log(`   - Last sync: ${new Date(result.lastSync).toLocaleString()}`);
    
    return result;
  } catch (error) {
    console.error('❌ Failed to sync PPPoE users:', error.message);
    throw error;
  }
}

async function testGetCustomers() {
  try {
    console.log('👥 Fetching customers...');
    const response = await fetch(`${BASE_URL}/api/customers`, {
      headers: {
        'Cookie': 'next-auth.session-token=test-session' // Add session cookie
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch customers: ${response.status}`);
    }

    const customers = await response.json();
    console.log(`✅ Found ${customers.length} customers:`);
    
    customers.forEach((customer, index) => {
      console.log(`   ${index + 1}. ${customer.username} (${customer.status}) - Router: ${customer.router.label}`);
    });
    
    return customers;
  } catch (error) {
    console.error('❌ Failed to fetch customers:', error.message);
    throw error;
  }
}

async function testGetRouters() {
  try {
    console.log('🔧 Fetching routers...');
    const response = await fetch(`${BASE_URL}/api/routers`, {
      headers: {
        'Cookie': 'next-auth.session-token=test-session' // Add session cookie
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch routers: ${response.status}`);
    }

    const routers = await response.json();
    console.log(`✅ Found ${routers.length} routers:`);
    
    routers.forEach((router, index) => {
      console.log(`   ${index + 1}. ${router.label} (${router.host}) - Customers: ${router._count.customers}`);
    });
    
    return routers;
  } catch (error) {
    console.error('❌ Failed to fetch routers:', error.message);
    throw error;
  }
}

async function cleanupRouter(routerId) {
  try {
    console.log('🗑️  Cleaning up test router...');
    const response = await fetch(`${BASE_URL}/api/routers/${routerId}`, {
      method: 'DELETE',
      headers: {
        'Cookie': 'next-auth.session-token=test-session' // Add session cookie
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete router: ${response.status}`);
    }

    console.log('✅ Router deleted successfully');
  } catch (error) {
    console.error('❌ Failed to delete router:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting PPPoE sync functionality tests...\n');
  
  let testRouter = null;
  
  try {
    // Step 1: Get current state
    await testGetRouters();
    console.log('');
    await testGetCustomers();
    console.log('');
    
    // Step 2: Add a test router
    testRouter = await testAddRouter();
    console.log('');
    
    // Step 3: Sync PPPoE users
    const syncResult = await testSyncPPPoEUsers(testRouter.id);
    console.log('');
    
    // Step 4: Verify customers were created/updated
    await testGetCustomers();
    console.log('');
    
    // Step 5: Verify router was updated
    await testGetRouters();
    console.log('');
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  } finally {
    // Cleanup
    if (testRouter) {
      console.log('');
      await cleanupRouter(testRouter.id);
    }
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (response.ok) {
      console.log('✅ Server is running');
      return true;
    }
  } catch (error) {
    console.error('❌ Server is not running or not accessible');
    console.error('Please make sure the development server is running on http://localhost:3001');
    process.exit(1);
  }
}

// Main execution
async function main() {
  await checkServer();
  console.log('');
  await runTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  login,
  testAddRouter,
  testSyncPPPoEUsers,
  testGetCustomers,
  testGetRouters,
  cleanupRouter,
  runTests
};