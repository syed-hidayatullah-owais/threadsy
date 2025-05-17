// This file allows you to run the Firebase Storage test easily
import testFirebaseStorage from './firebase-storage-test';

// Run the test and show results
testFirebaseStorage()
  .then(url => {
    console.log('Test completed successfully!');
    console.log('You can view the uploaded file at:', url);
  })
  .catch(error => {
    console.error('Test failed:', error);
  });
