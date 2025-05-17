import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
};

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: firebaseConfig.projectId,
    privateKey: firebaseConfig.privateKey,
    clientEmail: firebaseConfig.clientEmail
  }),
  storageBucket: firebaseConfig.storageBucket
});

export const storage = admin.storage();
export const bucket = storage.bucket();

export default admin;