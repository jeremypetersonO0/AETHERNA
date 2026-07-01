import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, getDocs, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBqzoLRsEXrjTPFw_Cin5bcDdQZlOD4das",
  authDomain: "aetherna-b1376.firebaseapp.com",
  projectId: "aetherna-b1376",
  storageBucket: "aetherna-b1376.firebasestorage.app",
  messagingSenderId: "248543593062",
  appId: "1:248543593062:web:d8bd91f42783fc2920e3a7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// 💾 FUNGSI 1: Menyimpan chat baru berdasarkan User ID yang sedang login
export async function saveToFirestore(sender, text, fileName = null) {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.error("Tidak ada user yang login. Chat tidak disimpan.");
            return;
        }

        await addDoc(collection(db, "chat_history"), {
            userId: user.uid, // Disimpan agar chat tidak tertukar antar user
            sender: sender,
            message: text,
            fileName: fileName,
            timestamp: serverTimestamp()
        });
        console.log("Chat berhasil dicatat di Firestore!");
    } catch (error) {
        console.error("Gagal mencatat ke database:", error);
    }
}

// 🔄 FUNGSI 2: Mengambil riwayat bubble chat milik user yang sedang aktif
export async function getChatHistory() {
    try {
        const user = auth.currentUser;
        if (!user) return [];

        const q = query(
            collection(db, "chat_history"), 
            where("userId", "==", user.uid), 
            orderBy("timestamp", "asc")
        );
        
        const querySnapshot = await getDocs(q);
        let chats = [];
        querySnapshot.forEach((doc) => {
            chats.push(doc.data());
        });
        return chats;
    } catch (error) {
        console.error("Gagal mengambil riwayat chat:", error);
        return [];
    }
}