// ============================================================
//  FIREBASE SETUP — แก้ไขไฟล์นี้เพียงอย่างเดียว
// ============================================================
//
//  วิธีตั้งค่า Firebase (ใช้เวลาประมาณ 5 นาที):
//
//  1. ไปที่ https://console.firebase.google.com
//  2. คลิก "Add project" → ตั้งชื่อ เช่น "pacman-ai-quiz" → Create
//  3. ใน Project Overview คลิก icon "</>" (Web app)
//  4. ตั้งชื่อ app → Register
//  5. คัดลอก firebaseConfig ที่ได้มาแทนค่าด้านล่าง
//
//  6. ไปที่ Build → Firestore Database → Create database
//     → เลือก "Start in test mode" → Next → Enable
//
//  7. ไปที่ Firestore → Rules → แก้ไขเป็น:
//     rules_version = '2';
//     service cloud.firestore {
//       match /databases/{database}/documents {
//         match /leaderboard/{doc} {
//           allow read: if true;
//           allow write: if true;
//         }
//       }
//     }
//     → Publish
//
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyD3xg-Da8QnO_PVwan6j4Z6XvDFQTFYIqM",
  authDomain: "pacman-ai-e0807.firebaseapp.com",
  projectId: "pacman-ai-e0807",
  storageBucket: "pacman-ai-e0807.firebasestorage.app",
  messagingSenderId: "417534076988",
  appId: "1:417534076988:web:a62ca61ca92b0cfee57b39",
  measurementId: "G-X2BPTKEPWK"
};

// ไม่ต้องแก้ไขส่วนด้านล่างนี้
let db = null;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  console.log("Firebase connected ✓");
} catch (e) {
  console.warn("Firebase not configured — leaderboard disabled:", e.message);
}
