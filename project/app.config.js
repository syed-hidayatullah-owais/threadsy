export default {
  name: 'Threadsy',
  slug: 'threadsy',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'threadsy',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: ['**/*'],
  extra: {
    // Firebase configuration values from google-services.json
    firebaseApiKey: process.env.FIREBASE_API_KEY || "AIzaSyCxQeCc7bs7HOH4CUyWdQ_Rk3ZVRJ4kBYQ",
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN || "threadsy-f5fae.firebaseapp.com",
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "threadsy-f5fae",
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || "threadsy-f5fae.appspot.com",
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "734007055400",
    firebaseAppId: process.env.FIREBASE_APP_ID || "1:734007055400:android:d217de18c86881d09dd11d",
    // API URL
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:3000/api'
  },
  ios: {
    supportsTablet: true
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff'
    }
  },
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/images/favicon.png'
  },
  plugins: ['expo-router'],
  experiments: {
    typedRoutes: true
  }
};