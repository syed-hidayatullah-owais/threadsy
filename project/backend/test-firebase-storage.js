// Test Firebase Storage Integration
import admin from './src/config/firebase.js';
import { bucket } from './src/config/firebase.js';

async function testFirebaseStorage() {
  try {
    // Create a simple text file for testing
    const testFileName = `test-${Date.now()}.txt`;
    const testFile = bucket.file(testFileName);
    
    // Upload test content
    await testFile.save('This is a test file to verify Firebase Storage integration.', {
      metadata: {
        contentType: 'text/plain',
      }
    });
    
    // Make the file public
    await testFile.makePublic();
    
    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${testFileName}`;
    
    console.log('✅ Firebase Storage test successful!');
    console.log('File uploaded to:', publicUrl);
    console.log('If you can access this URL in your browser, Firebase Storage is set up correctly.');
    
    // Clean up (optional)
    // await testFile.delete();
    // console.log('Test file deleted.');
    
    return publicUrl;
  } catch (error) {
    console.error('❌ Firebase Storage test failed:', error);
    throw error;
  }
}

// Run the test
testFirebaseStorage()
  .then(url => console.log('Test completed.'))
  .catch(err => console.error('Test failed:', err));
