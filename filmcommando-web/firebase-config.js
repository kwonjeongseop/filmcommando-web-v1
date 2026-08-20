// Firebase SDK 초기화 및 공통 설정
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyAPYrNtF0hTbsBJ2DEtKqYCSXfG9vg8X-U",
  authDomain: "filmcommando-f28bd.firebaseapp.com",
  projectId: "filmcommando-f28bd",
  storageBucket: "filmcommando-f28bd.firebasestorage.app",
  messagingSenderId: "189292652077",
  appId: "1:189292652077:web:08ba7e41d9e6980e303aa4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
