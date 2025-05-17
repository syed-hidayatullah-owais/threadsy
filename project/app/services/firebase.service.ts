import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  uploadBytesResumable
} from 'firebase/storage';
import { Platform } from 'react-native';

// Firebase configuration
import Constants from 'expo-constants';

const firebaseConfig = {
  // Get Firebase config from app.config.js
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  appId: Constants.expoConfig?.extra?.firebaseAppId
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const storage = getStorage(app);

/**
 * Firebase authentication service
 */
export const firebaseAuth = {
  /**
   * Register a new user with email and password
   * @param email User's email
   * @param password User's password
   * @param displayName User's display name
   * @returns User object
   */
  register: async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with display name
      await updateProfile(userCredential.user, {
        displayName
      });
      
      return userCredential.user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  /**
   * Sign in a user with email and password
   * @param email User's email
   * @param password User's password
   * @returns User object
   */
  login: async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  /**
   * Sign out the current user
   */
  logout: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
  
  /**
   * Send a password reset email
   * @param email User's email
   */
  resetPassword: async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  },
  
  /**
   * Listen for authentication state changes
   * @param callback Function to call when auth state changes
   * @returns Unsubscribe function
   */
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },
  
  /**
   * Get the current authenticated user
   * @returns Current user or null if not authenticated
   */
  getCurrentUser: () => {
    return auth.currentUser;
  }
};

/**
 * Firebase storage service
 */
export const firebaseStorage = {
  /**
   * Upload a file to Firebase Storage from a local URI
   * @param uri Local URI of the file
   * @param path Destination path in storage
   * @param onProgress Progress callback (optional)
   * @returns Download URL of the uploaded file
   */
  uploadFile: async (
    uri: string, 
    path: string,
    onProgress?: (progress: number) => void
  ) => {
    try {
      // Convert the file URI to blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Create a storage reference
      const storageRef = ref(storage, path);
      
      if (onProgress) {
        // Use resumable upload to track progress
        const uploadTask = uploadBytesResumable(storageRef, blob);
        
        // Set up progress listener
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            throw error;
          }
        );
        
        // Wait for upload to complete
        await uploadTask;
      } else {
        // Use simple upload without progress tracking
        await uploadBytes(storageRef, blob);
      }
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  },

  /**
   * Upload a blob directly to Firebase Storage (useful for tests and direct data uploads)
   * @param path Destination path in storage
   * @param blob Blob data to upload
   * @returns Upload result with reference that can be used to get download URL
   */
  uploadBlob: async (path: string, blob: Blob) => {
    try {
      // Create a storage reference
      const storageRef = ref(storage, path);
      
      // Upload blob directly
      const uploadResult = await uploadBytes(storageRef, blob);
      
      return uploadResult;
    } catch (error) {
      console.error('Blob upload error:', error);
      throw error;
    }
  },
  
  /**
   * Get the download URL for a storage reference or path
   * @param refOrPath Storage reference or path string
   * @returns Download URL
   */
  getDownloadURL: async (refOrPath: any) => {
    try {
      // If path is a string, create a reference
      const storageRef = typeof refOrPath === 'string' ? ref(storage, refOrPath) : refOrPath;
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Get download URL error:', error);
      throw error;
    }
  },
  
  /**
   * Get the download URL for a file (alias for backward compatibility)
   * @param path Path to the file in storage
   * @returns Download URL
   */
  getFileURL: async (path: string) => {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Get file URL error:', error);
      throw error;
    }
  }
};
