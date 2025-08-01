#!/usr/bin/env node

/**
 * Simple authentication test script
 */

const BASE_URL = 'http://localhost:3001';

async function testAuth() {
  console.log('🔐 Testing authentication...');
  
  try {
    // Test login
    console.log('📝 Testing login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    console.log(`Login response status: ${loginResponse.status}`);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful:', loginData);
      
      // Extract session cookie
      const setCookieHeader = loginResponse.headers.get('set-cookie');
      if (setCookieHeader) {
        console.log('🍪 Session cookie received');
        
        // Test accessing protected route
        console.log('🔒 Testing protected route access...');
        const protectedResponse = await fetch(`${BASE_URL}/api/routers`, {
          headers: {
            'Cookie': setCookieHeader
          }
        });
        
        console.log(`Protected route response status: ${protectedResponse.status}`);
        
        if (protectedResponse.ok) {
          const routersData = await protectedResponse.json();
          console.log('✅ Successfully accessed protected route');
          console.log(`📡 Found ${routersData.length} routers`);
        } else {
          console.log('❌ Failed to access protected route');
        }
      } else {
        console.log('❌ No session cookie received');
      }
    } else {
      const errorData = await loginResponse.json();
      console.log('❌ Login failed:', errorData);
    }
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
  }
}

// Run the test
testAuth().catch(console.error);