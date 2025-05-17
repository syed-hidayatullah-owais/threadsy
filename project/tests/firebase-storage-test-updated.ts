// Test Firebase integration for frontend
import { firebaseStorage } from '../app/services/firebase.service';

const testFirebaseStorage = async () => {
  try {
    // Create a simple text file as a Blob
    const testData = 'This is a test file to verify frontend Firebase Storage integration.';
    const blob = new Blob([testData], { type: 'text/plain' });
    
    // Create a unique filename
    const testFileName = `test-frontend-${Date.now()}.txt`;
    
    // Upload the file
    console.log('Starting upload test...');
    const uploadResult = await firebaseStorage.uploadBlob(testFileName, blob);
    
    // Get the URL
    console.log('Upload successful, getting URL...');
    const downloadUrl = await firebaseStorage.getDownloadURL(uploadResult.ref);
    
    console.log('✅ Firebase Storage test from frontend successful!');
    console.log('File uploaded to:', downloadUrl);
    console.log('If you can access this URL in your browser, Firebase Storage is set up correctly.');
    
    return downloadUrl;
  } catch (error) {
    console.error('❌ Firebase Storage test failed:', error);
    throw error;
  }
};

// Export for use in the app
export default testFirebaseStorage;
