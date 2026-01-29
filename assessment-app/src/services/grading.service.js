import { db } from '../core/config.js';
import {
    collection,
    doc,
    getDoc,
    updateDoc,
    getDocs,
    query,
    where,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const COL_KEYS = 'assessment_keys';
const COL_SUBS = 'submissions';
const COL_CONTENT = 'assessment_content';

// Helper: Normalize strings for comparison (Identification)
const normalize = (str) => {
    return String(str || '').trim().toLowerCase();
};

export const gradeSubmission = async (submissionId) => {
    try {
        // 1. Fetch Submission
        const subRef = doc(db, COL_SUBS, submissionId);
        const subSnap = await getDoc(subRef);

        if (!subSnap.exists()) throw new Error("Submission not found");
        const submission = subSnap.data();

        // 2. Fetch Answer Key
        // The key doc ID is the same as the assessment ID (we set it that way in assessment.service.js)
        const keyRef = doc(db, COL_KEYS, submission.assessmentId);
        const keySnap = await getDoc(keyRef);

        if (!keySnap.exists()) throw new Error("Answer key not found");
        const keys = keySnap.data().answers; // { qId: correct_answer, ... }

        // 3. Fetch Assessment Content (to get points per question if needed, or total questions)
        // For now assuming 1 point per question or we can fetch content to get specific points.
        // Let's simple fetch content to be robust about points.
        const contentRef = doc(db, COL_CONTENT, submission.assessmentId);
        const contentSnap = await getDoc(contentRef);
        const startData = contentSnap.exists() ? contentSnap.data() : { questions: [] };

        // Build a map of points: { qId: 5, ... }
        const pointsMap = {};
        startData.questions.forEach(q => {
            pointsMap[q.id] = parseInt(q.points || q.sectionPoints || 1);
        });

        // 4. Calculate Score
        let score = 0;
        let totalPoints = 0;
        const studentAnswers = submission.answers || {};

        for (const [qId, correctAnswer] of Object.entries(keys)) {
            const studentAnswer = studentAnswers[qId];
            const points = pointsMap[qId] || 1;
            totalPoints += points;

            // Comparison Logic
            let isCorrect = false;

            // Determine if strict or loose matching is needed based on answer type
            // But here we only have the raw correct answer value.
            // Assumption: key stores the raw correct value (ID for MCQ, "true" for bool, text for ID).

            if (normalize(studentAnswer) === normalize(correctAnswer)) {
                isCorrect = true;
                score += points;
            }
        }

        // 5. Update Submission
        await updateDoc(subRef, {
            score: score,
            totalPoints: totalPoints,
            status: 'graded',
            gradedAt: new Date().toISOString()
        });

        return { score, totalPoints };

    } catch (error) {
        console.error("Grading Error:", error);
        throw error;
    }
};

export const gradeAllSubmissions = async (assessmentId) => {
    try {
        const q = query(
            collection(db, COL_SUBS),
            where("assessmentId", "==", assessmentId),
            where("status", "==", "submitted") // Only grade ungraded ones
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) return 0;

        const results = await Promise.all(
            snapshot.docs.map(doc => gradeSubmission(doc.id))
        );

        return results.length;
    } catch (error) {
        console.error("Batch Grading Error:", error);
        throw error;
    }
};

export const getSubmissionsForAssessment = async (assessmentId) => {
    try {
        const q = query(
            collection(db, COL_SUBS),
            where("assessmentId", "==", assessmentId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("Error fetching submissions:", error);
        throw error;
    }
};
