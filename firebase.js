import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your own Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB8Kiooozxu1MFsRrpU4fnpDYSUsZPGv7A",
  authDomain: "aura-55447.firebaseapp.com",
  projectId: "aura-55447",
  storageBucket: "aura-55447.firebasestorage.app",
  messagingSenderId: "723937303605",
  appId: "1:723937303605:web:894300e6bd62a04f48657c",
  measurementId: "G-WV70CNTN51"
};

// Initialize Firebase only once
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

export { app, auth, storage, db };
