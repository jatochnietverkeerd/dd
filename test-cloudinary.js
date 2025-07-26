// Test single image upload to Cloudinary
const fs = require('fs');
const path = require('path');

async function testCloudinaryUpload() {
  try {
    // Get first available image
    const imageFile = 'uploads/image-1753541678248-587243212.jpeg';
    
    if (!fs.existsSync(imageFile)) {
      console.log('Image file not found:', imageFile);
      return;
    }
    
    // Login first
    const loginResponse = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ddcars', password: 'DD44carstore' })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login successful, token received');
    
    // Create form data
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(imageFile);
    const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
    formData.append('image', blob, 'test-image.jpeg');
    formData.append('folder', 'ddcars');
    
    // Upload to Cloudinary
    console.log('Uploading image to Cloudinary...');
    const uploadResponse = await fetch('http://localhost:5000/api/admin/upload-cloudinary', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${loginData.token}`
      },
      body: formData
    });
    
    console.log('Upload response status:', uploadResponse.status);
    const uploadResult = await uploadResponse.text();
    console.log('Upload result:', uploadResult);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testCloudinaryUpload();