import { db } from '../core/config.js';
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    updateDoc,
    doc,
    arrayUnion,
    arrayRemove,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const COLLECTION = 'classes';

// Helper to generate random 6-char code
const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export const createClass = async (name, section, teacherId) => {
    try {
        const code = generateCode();
        const payload = {
            name,
            section,
            teacherId,
            code,
            students: [], // Array of UIDs
            pendingStudents: [],
            createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, COLLECTION), payload);
        return { id: docRef.id, ...payload };
    } catch (error) {
        throw error;
    }
};

export const getClassesByTeacher = async (teacherId, includeHidden = false) => {
    try {
        const q = query(collection(db, COLLECTION), where("teacherId", "==", teacherId));
        const querySnapshot = await getDocs(q);
        const classes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Filter out hidden classes unless explicitly requested
        return includeHidden ? classes : classes.filter(c => !c.hidden);
    } catch (error) {
        throw error;
    }
};

export const softDeleteClass = async (classId) => {
    try {
        await updateDoc(doc(db, COLLECTION, classId), { hidden: true });
    } catch (error) {
        throw error;
    }
};

export const restoreClass = async (classId) => {
    try {
        await updateDoc(doc(db, COLLECTION, classId), { hidden: false });
    } catch (error) {
        throw error;
    }
};

export const joinClass = async (code, studentId, email) => {
    try {
        // Find class by code
        const q = query(collection(db, COLLECTION), where("code", "==", code));
        const snapshot = await getDocs(q);

        if (snapshot.empty) throw new Error("Invalid Class Code");

        const classDoc = snapshot.docs[0];
        const classData = classDoc.data();

        // Check if already joined (Handle both string UIDs and Object UIDs for backward compatibility)
        const isStudent = classData.students.some(s => (typeof s === 'string' ? s : s.uid) === studentId);
        const isPending = classData.pendingStudents.some(s => (typeof s === 'string' ? s : s.uid) === studentId);

        if (isStudent || isPending) {
            throw new Error("Already joined or pending.");
        }

        // Add to pending (Store Object)
        await updateDoc(doc(db, COLLECTION, classDoc.id), {
            pendingStudents: arrayUnion({ uid: studentId, email: email || 'No Email' })
        });

        return classDoc.id;
    } catch (error) {
        throw error;
    }
};

export const approveStudent = async (classId, student) => {
    try {
        const classRef = doc(db, COLLECTION, classId);
        // Remove from pending, Add to approved
        await updateDoc(classRef, {
            pendingStudents: arrayRemove(student),
            students: arrayUnion(student)
        });
    } catch (error) {
        throw error;
    }
};

export const rejectStudent = async (classId, student) => {
    try {
        const classRef = doc(db, COLLECTION, classId);
        await updateDoc(classRef, {
            pendingStudents: arrayRemove(student)
        });
    } catch (error) {
        throw error;
    }
};

export const getStudentClasses = async (studentId) => {
    try {
        // Query classes where 'students' array contains an object with uid == studentId
        // Firestore limitation: array-contains requires knowing the EXACT object if keying by object.
        // We stored { uid: "...", email: "..." }. Checking exact object is brittle if email changes.
        // Actually earlier code used `arrayUnion(student)`.

        // ALTERNATIVE: Since we can't easily query array of objects by partial match in simple mode,
        // we'll fetch ALL classes and filter client side (OK for small scale)
        // OR we should have stored a simpler `studentIds` array.

        // Let's assume for this MVP we fetch all.
        const snapshot = await getDocs(collection(db, COLLECTION));
        const classes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        return classes.filter(c =>
            c.students && c.students.some(s => (typeof s === 'string' ? s : s.uid) === studentId)
        );
    } catch (error) {
        console.error("Error fetching student classes:", error);
        return [];
    }
};
