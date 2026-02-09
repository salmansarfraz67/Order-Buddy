// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJmJM-2m8hkxpUw6JhKuBynu5m2XteMcI",
  authDomain: "seller-buddy-e3275.firebaseapp.com",
  projectId: "seller-buddy-e3275",
  storageBucket: "seller-buddy-e3275.firebasestorage.app",
  messagingSenderId: "143274470596",
  appId: "1:143274470596:web:9b50780b66f77528462d91"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);