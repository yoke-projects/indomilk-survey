// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyDtE4yLc1KY9I1Lw9z9hz0gVTR5XJxdHss",
    authDomain: "indomilk-survey.firebaseapp.com",
    projectId: "indomilk-survey",
    storageBucket: "indomilk-survey.firebasestorage.app",
    messagingSenderId: "887694933363",
    appId: "1:887694933363:web:7db45a041e08320d105906",
    databaseURL: "https://indomilk-survey-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi Realtime Database
const db = getDatabase(app);

export { db };