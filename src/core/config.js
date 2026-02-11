// Firebase Configuration
// TODO: Replace with your actual Firebase project keys
const firebaseConfig = {

    apiKey: "AIzaSyC8jJ6a_K4jj2PC3Ee4f3cfrF3mBSU0XFo",

    authDomain: "cbt-qb.firebaseapp.com",

    projectId: "cbt-qb",

    storageBucket: "cbt-qb.firebasestorage.app",

    messagingSenderId: "276863805381",

    appId: "1:276863805381:web:5c01adcda02f18a115cdac"

};


// Import Firebase from CDN (Modular SDK)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let app, auth, db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error) {
    console.error("Firebase Initialization Error (Did you set the keys?):", error);
}

export { app, auth, db };
