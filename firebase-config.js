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
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
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
