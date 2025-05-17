# Quick Start Guide for Threadsy

This is a simplified quick start guide for running the Threadsy application. For detailed instructions, please refer to the `SETUP_GUIDE.md` file.

## Step 1: Install Required Software
- Node.js & npm: https://nodejs.org/ (v16+ recommended)
- Git: https://git-scm.com/downloads
- Expo Go app on your mobile device

## Step 2: Backend Setup
```bash
cd backend
npm install
cp .env.template .env
# Edit the .env file with your actual credentials
npm run dev
```

## Step 3: Frontend Setup
```bash
# From project root
npm install
cp .env.template .env
# Edit the .env file if needed
npm run dev
```

## Step 4: Connect and Run
- Scan the QR code with Expo Go app (iOS: Camera app, Android: Expo Go app)
- Or run on web browser by pressing 'w' in the Expo CLI

## Important Notes
- You need MongoDB (Atlas or local) and Firebase project set up
- Place Firebase credential files in backend/credentials/
- If testing on a physical device, update EXPO_PUBLIC_API_URL with your computer's IP address

For troubleshooting and detailed instructions, see `SETUP_GUIDE.md`
