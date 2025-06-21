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
// Import the functions you need from the SDKs you need

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAbYXVUd12Zf81hT24xfuRtYVu4ONuTsdM",
  authDomain: "lazorde.firebaseapp.com",
  projectId: "lazorde",
  storageBucket: "lazorde.firebasestorage.app",
  messagingSenderId: "812678918588",
  appId: "1:812678918588:web:2246df6fb4f8b3477a3bb9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
