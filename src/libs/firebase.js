// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAAtmP5dB8gKBA8AKxv54RAY4iXRo0U9vo",
  authDomain: "edutest-cc39a.firebaseapp.com",
  projectId: "edutest-cc39a",
  storageBucket: "edutest-cc39a.firebasestorage.app",
  messagingSenderId: "50922601615",
  appId: "1:50922601615:web:a7559210b93e73d79204fa",
  measurementId: "G-V6XNK9MJX3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const provider = new GoogleAuthProvider()

export { app, auth, provider }