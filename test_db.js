import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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
    const users = await getDocs(collection(db, "users"));
    users.forEach(doc => {
        if(doc.data().email === 'testteacher@test.com') {
            console.log("Found teacher:", doc.id, doc.data());
        }
    });
}
test();
