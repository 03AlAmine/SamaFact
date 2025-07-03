// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDYEz7Kz_H9Q57qnpFnP6lebW12rFkT180",
  authDomain: "mentafact.firebaseapp.com",
  projectId: "mentafact",
  storageBucket: "mentafact.firebasestorage.app",
  messagingSenderId: "927707293074",
  appId: "1:927707293074:web:0d1622176bec28e948cd4b",
  measurementId: "G-8PBFXDJNBC"
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
// eslint-disable-next-line no-unused-vars
const analytics = getAnalytics(app);

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);


// ✅ Exportation
export { db, auth, storage, firebaseConfig };
