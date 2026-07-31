import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

// Read env variables from .env.local
const envFile = fs.readFileSync(".env.local", "utf-8");
const envVars = {};
envFile.split("\n").forEach(line => {
  if (line && line.includes("=")) {
    const [key, val] = line.split("=");
    envVars[key.trim()] = val.trim();
  }
});

const firebaseConfig = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkDb() {
  const snapshot = await getDocs(collection(db, "finance"));
  console.log("Total docs:", snapshot.docs.length);
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(data.title, data.amount, data.createdAt ? new Date(data.createdAt.seconds * 1000).toISOString() : "no date");
  });
}

checkDb().catch(console.error);
