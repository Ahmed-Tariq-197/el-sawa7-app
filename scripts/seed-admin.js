/**
 * ElSawa7 Admin Seed Script
 * 
 * This script creates an admin user using the Supabase service role.
 * Run with: node scripts/seed-admin.js
 * 
 * Required environment variables:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key (NOT the anon key)
 * - ADMIN_EMAIL: Email for the admin account
 * - ADMIN_PASSWORD: Password for the admin account (min 8 chars)
 * - ADMIN_NAME: Display name for the admin
 * - ADMIN_PHONE: Egyptian phone number (01XXXXXXXXX or +20XXXXXXXXXX)
 * 
 * Example:
 * SUPABASE_URL=https://xxx.supabase.co \
 * SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 * ADMIN_EMAIL=admin@elsawa7.com \
 * ADMIN_PASSWORD=SecurePassword123! \
 * ADMIN_NAME="Admin User" \
 * ADMIN_PHONE=01015556416 \
 * node scripts/seed-admin.js
 */

const https = require('https');
const url = require('url');

// Get environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '01015556416';

// Validate required env vars
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Missing required environment variables.');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD');
  process.exit(1);
}

// Validate password
if (ADMIN_PASSWORD.length < 8) {
  console.error('Password must be at least 8 characters');
  process.exit(1);
}

// Validate phone
const phoneRegex = /^(\+20|0)[1-9][0-9]{9}$/;
if (!phoneRegex.test(ADMIN_PHONE.replace(/\s/g, ''))) {
  console.error('Invalid Egyptian phone number format');
  process.exit(1);
}

async function makeRequest(endpoint, method, body) {
  const parsedUrl = url.parse(`${SUPABASE_URL}${endpoint}`);
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function seedAdmin() {
  console.log('🚀 Creating admin user...');
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Name: ${ADMIN_NAME}`);

  try {
    // Step 1: Create user in Auth
    console.log('\n📝 Step 1: Creating auth user...');
    const authResult = await makeRequest('/auth/v1/admin/users', 'POST', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: ADMIN_NAME,
        phone: ADMIN_PHONE,
        role: 'admin',
      },
    });

    if (authResult.status !== 200 && authResult.status !== 201) {
      if (authResult.data?.message?.includes('already been registered')) {
        console.log('   ⚠️  User already exists, continuing...');
        
        // Get existing user
        const listResult = await makeRequest('/auth/v1/admin/users', 'GET', null);
        const existingUser = listResult.data?.users?.find(u => u.email === ADMIN_EMAIL);
        
        if (!existingUser) {
          throw new Error('Could not find existing user');
        }
        
        return await addAdminRole(existingUser.id);
      }
      throw new Error(`Auth creation failed: ${JSON.stringify(authResult.data)}`);
    }

    const userId = authResult.data.id;
    console.log(`   ✅ Auth user created: ${userId}`);

    // Step 2: Add admin role
    await addAdminRole(userId);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

async function addAdminRole(userId) {
  console.log('\n📝 Step 2: Adding admin role...');
  
  const roleResult = await makeRequest('/rest/v1/user_roles', 'POST', {
    user_id: userId,
    role: 'admin',
  });

  if (roleResult.status !== 201 && roleResult.status !== 200) {
    if (roleResult.data?.message?.includes('duplicate key')) {
      console.log('   ⚠️  Admin role already exists');
    } else {
      console.warn(`   ⚠️  Role insert warning: ${JSON.stringify(roleResult.data)}`);
    }
  } else {
    console.log('   ✅ Admin role added');
  }

  // Step 3: Log the action
  console.log('\n📝 Step 3: Logging action...');
  await makeRequest('/rest/v1/audit_logs', 'POST', {
    table_name: 'user_roles',
    action: 'admin_seeded',
    record_id: userId,
    new_data: { email: ADMIN_EMAIL, name: ADMIN_NAME },
  });
  console.log('   ✅ Action logged');

  console.log('\n🎉 Admin user created successfully!');
  console.log('   You can now log in at /login with your credentials.');
  console.log('   Access the admin dashboard at /admin');
}

seedAdmin();
