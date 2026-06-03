import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAbG8oIWF2Yr5BVNMCbKmj10pnPkrZ6c_Y",
  authDomain: "librarymanagement-fb5c9.firebaseapp.com",
  projectId: "librarymanagement-fb5c9",
  storageBucket: "librarymanagement-fb5c9.firebasestorage.app",
  messagingSenderId: "11036184504",
  appId: "1:11036184504:web:555ee22a4003cbdc94494d",
  measurementId: "G-MVK20L154F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
