// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyALy2bNT8vSPATkBJo7hinZOqshBH_MVlg",
  authDomain: "sleepwise-10827.firebaseapp.com",
  databaseURL: "https://sleepwise-10827-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "sleepwise-10827",
  storageBucket: "sleepwise-10827.appspot.com",
  messagingSenderId: "809399774595",
  appId: "1:809399774595:web:fa34b470d5d27e78475ab6",
  measurementId: "G-YYM98TL2T6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

export default app;
