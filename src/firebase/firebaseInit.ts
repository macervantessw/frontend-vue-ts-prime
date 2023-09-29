import { initializeApp } from "firebase/app";

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  //...
};

const app = initializeApp(firebaseConfig);

import * as firebase from "firebase-admin";
import { FIREBASE_SERVICE_ACCOUNT_KEY, STORAGE_BUCKET } from "../config";

const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_KEY || "");
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount as firebase.ServiceAccount),
  storageBucket: STORAGE_BUCKET,
});

export const bucket = firebase.storage().bucket();
