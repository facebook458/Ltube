8// firebase-config.js
// Firebase Configuration for EarningContent Platform

import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


  // IMPORTANT: Replace with your Firebase project credentials
  const firebaseConfig = {
  apiKey: "AIzaSyCptzsy7zjlv-a3BJPPEdWl9YIeXe2Oq4k",
  authDomain: "ltube-7d363.firebaseapp.com",
  databaseURL: "https://ltube-7d363-default-rtdb.firebaseio.com",
  projectId: "ltube-7d363",
  storageBucket: "ltube-7d363.firebasestorage.app",
  messagingSenderId: "787970159703",
  appId: "1:787970159703:web:052f99ab131a4edcb25f12",
  measurementId: "G-4YS2XCC6KC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

export default app;
