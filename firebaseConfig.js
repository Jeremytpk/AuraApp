// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB8Kiooozxu1MFsRrpU4fnpDYSUsZPGv7A",
  authDomain: "aura-55447.firebaseapp.com",
  projectId: "aura-55447",
  storageBucket: "aura-55447.firebasestorage.app",
  messagingSenderId: "723937303605",
  appId: "1:723937303605:web:894300e6bd62a04f48657c",
  measurementId: "G-WV70CNTN51"
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };