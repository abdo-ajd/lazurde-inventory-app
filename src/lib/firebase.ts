// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ==========================================================================================
// TODO: YOUR FIREBASE CONFIGURATION
// ==========================================================================================
// 1. Go to your Firebase project console: https://console.firebase.google.com/
// 2. In your project settings, find your web app's configuration.
// 3. Copy the config object and paste it here, replacing the placeholder values.
// ==========================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyYOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:your-app-id"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
