import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "dummy",
    authDomain: "cognita-44dbd.firebaseapp.com",
    projectId: "cognita-44dbd",
    storageBucket: "cognita-44dbd.firebasestorage.app",
    messagingSenderId: "dummy",
    appId: "dummy"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
    const classId = 'CEGEOL120';
    console.log("Checking Assessments for " + classId);
    const q1 = query(collection(db, "assessments"), where("classId", "==", classId));
    const snap1 = await getDocs(q1);
    console.log("Found Assessments:", snap1.size);
    
    console.log("Checking Attendance for " + classId);
    const q2 = query(collection(db, "attendance_sessions"), where("classId", "==", classId));
    const snap2 = await getDocs(q2);
    console.log("Found Sessions:", snap2.size);
}
test();
