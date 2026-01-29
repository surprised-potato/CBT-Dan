import { db } from '../core/config.js';
import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const COLLECTION = 'submissions';

export const submitTest = async (assessmentId, studentId, answers, studentProfile) => {
    try {
        const payload = {
            assessmentId,
            studentId,
            studentName: studentProfile?.displayName || 'Unknown',
            studentEmail: studentProfile?.email || 'Unknown',
            answers, // { q1: 'choice_id', q2: 'true', ... }
            submittedAt: new Date().toISOString(),
            serverTimestamp: serverTimestamp(),
            score: null, // Will be graded later
            status: 'submitted'
        };

        const docRef = await addDoc(collection(db, COLLECTION), payload);
        return docRef.id;
    } catch (error) {
        console.error("Submission Error:", error);
        throw error;
    }
};

export const checkSubmission = async (assessmentId, studentId) => {
    try {
        const q = query(
            collection(db, COLLECTION),
            where("assessmentId", "==", assessmentId),
            where("studentId", "==", studentId)
        );
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error("Error checking submission:", error);
        return false;
    }
};
