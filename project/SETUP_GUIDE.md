# Threadsy Project Setup Guide

This guide will help you set up and run the Threadsy wardrobe application on your local machine. The project consists of a React Native/Expo frontend and a Node.js/Express backend.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v8 or higher) or **yarn**
- **Git** (to clone the repository)
- **MongoDB** (local installation or MongoDB Atlas account)
- **Expo Go** app installed on your mobile device (for testing)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/syed-hidayatullah-owais/threadsy.git
cd threadsy
```

### 2. Setting Up the Backend

#### Install Dependencies

```bash
cd backend
npm install
```

#### Set Up Environment Variables

Create a `.env` file in the `backend` directory based on the provided `.env.example`:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration - Replace with your actual MongoDB connection string
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/threadsy

# JWT Configuration - Use a strong, unique secret
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# Firebase Configuration - Get these from your Firebase project settings
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="your-private-key-with-quotes-and-newlines"
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_STORAGE_BUCKET=your-storage-bucket
```

> **Note:** For MongoDB, you can either:
> - Set up a free MongoDB Atlas cluster and use its connection string
> - Use a local MongoDB instance with `mongodb://localhost:27017/threadsy`

#### Firebase Credentials

You need to obtain Firebase Admin SDK credentials:

1. Ask the project admin for the Firebase credential JSON files or create your own Firebase project
2. Place the files in the `backend/credentials/` directory:
   - `threadsy-460105-4743d651f289.json` - Google Cloud credentials
   - `threadsy-f5fae-firebase-adminsdk-fbsvc-bc7cdab147.json` - Firebase Admin SDK credentials

If you create your own Firebase project, update the `.env` file with your project details.

### 3. Setting Up the Frontend

#### Install Dependencies

Navigate to the project root directory and install dependencies:

```bash
cd ../
npm install
```

#### Set Up Environment Variables

Create a `.env` file in the project root with:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

> **Note:** If you're testing on a physical device, replace `localhost` with your computer's local IP address (e.g., `192.168.1.100`).

#### Setting Up Firebase for the Frontend

1. Obtain the `google-services.json` file from the project admin or your Firebase console
2. Place it in the root directory of the project

### 4. Running the Application

#### Start the Backend Server

```bash
cd backend
npm run dev
```

The backend server will start at http://localhost:3000.

#### Start the Frontend (Expo) Application

In a new terminal, from the project root:

```bash
npm run dev
```

Expo will start and provide options to:
- Run on Android device/emulator
- Run on iOS simulator
- Run in web browser
- Scan QR code with Expo Go (easiest for testing on a physical device)

## Troubleshooting Common Issues

### Connection Issues

If the app can't connect to the backend:
1. Ensure your backend is running
2. Check that the `EXPO_PUBLIC_API_URL` in your frontend `.env` file points to the correct IP and port
3. If using a physical device, make sure your phone is on the same WiFi network as your development machine

### MongoDB Connection Issues

If you see MongoDB connection errors:
1. Verify your MongoDB URI is correct in the backend `.env` file
2. Ensure your IP address is whitelisted in MongoDB Atlas (if using Atlas)

### Firebase Issues

If you encounter Firebase errors:
1. Verify that all Firebase env variables are correctly set
2. Check that the credential files are properly placed in the credentials directory
3. Ensure your Firebase project has Storage enabled

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Firebase Documentation](https://firebase.google.com/docs)

## Contact

If you have any issues setting up the project, contact the repository owner for assistance.
