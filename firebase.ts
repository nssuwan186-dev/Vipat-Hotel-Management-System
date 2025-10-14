import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// IMPORTANT: In a production app, you would use environment variables for this
const firebaseConfig = {
  apiKey: "AIzaSyBgcWG4msQQu6dM4JliicNiOoTficVcK_U",
  authDomain: "sigma-sunlight-470611-g7.firebaseapp.com",
  projectId: "sigma-sunlight-470611-g7",
  storageBucket: "sigma-sunlight-470611-g7.firebasestorage.app",
  messagingSenderId: "699876753839",
  appId: "1:699876753839:web:7dc923fd377a0378d1ef5a"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);