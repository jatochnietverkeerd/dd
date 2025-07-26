// Test migration script
const fs = require('fs');

async function testMigration() {
  try {
    // Get admin token
    const loginResponse = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ddcars', password: 'DD44carstore' })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login result:', loginData);
    
    if (!loginData.token) {
      console.error('No token received');
      return;
    }
    
    // Run migration
    console.log('🚀 Starting migration...');
    const migrationResponse = await fetch('http://localhost:5000/api/admin/migrate-to-cloudinary', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Migration response status:', migrationResponse.status);
    const migrationText = await migrationResponse.text();
    console.log('Migration response:', migrationText);
    
    // Check vehicles after migration
    const vehiclesResponse = await fetch('http://localhost:5000/api/admin/vehicles', {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    
    const vehicles = await vehiclesResponse.json();
    console.log('Vehicles after migration:');
    vehicles.forEach(v => {
      console.log(`- ${v.brand} ${v.model}: ${v.images?.length || 0} images`);
      if (v.images) {
        v.images.forEach((img, i) => {
          console.log(`  ${i + 1}. ${img.substring(0, 80)}...`);
        });
      }
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testMigration();