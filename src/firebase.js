// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyADUHCKuEGHAm0ovdywreqQAgqDMRyZk58",
  authDomain: "syslis.firebaseapp.com",
  projectId: "syslis",
  storageBucket: "syslis.firebasestorage.app",
  messagingSenderId: "41730309928",
  appId: "1:41730309928:web:d3cee091272664ce1c5a1d",
  measurementId: "G-KGY8SWXEHK"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
// eslint-disable-next-line no-unused-vars
const analytics = getAnalytics(app);

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// ✅ Exportation
export { db, auth, storage };
