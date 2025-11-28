import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBPctamWdHhnOMVtd1lGJsho3R6tTQqeFs",
  authDomain: "bionexa-b6b06.firebaseapp.com",
  projectId: "bionexa-b6b06",
  storageBucket: "bionexa-b6b06.firebasestorage.app",
  messagingSenderId: "671216681730",
  appId: "1:671216681730:web:8d98f382036cd44521381b",
  measurementId: "G-V01BCQCXQK"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);