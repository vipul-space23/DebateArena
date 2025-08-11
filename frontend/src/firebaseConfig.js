// frontend/src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAGtaOFZfXINGmh1Wg39rv6g50jeI3bv7Q",
    authDomain: "debate-arena-fcac4.firebaseapp.com",
    databaseURL: "https://debate-arena-fcac4-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "debate-arena-fcac4",
    storageBucket: "debate-arena-fcac4.firebasestorage.app",
    messagingSenderId: "515898126308",
    appId: "1:515898126308:web:cbfed5bc1716cf9fc7a1f1",
    measurementId: "G-MLPVF43F0G"
  };

// Initialize Firebase
let app;
let db;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase initialized successfully (React).");
} catch (e) {
    console.error("Firebase initialization failed (React):", e);
    // Handle initialization error appropriately in your app logic if needed
    alert("CRITICAL ERROR: Cannot connect to Firebase backend services. The application may not function correctly.");
}


export { db, app }; // Export Firestore instance and the app object