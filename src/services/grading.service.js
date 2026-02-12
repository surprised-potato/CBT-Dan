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
            // Priority: Question Point -> Section/Wizard Config -> Default 1
            const p = q.points !== undefined ? q.points : (q.sectionPoints !== undefined ? q.sectionPoints : 1);
            pointsMap[q.id] = parseInt(p);
        });

        // 4. Calculate Score
        let score = 0;
        let totalPoints = 0;
        const studentAnswers = submission.answers || {};

        for (const [qId, correctAnswer] of Object.entries(keys)) {
            const studentAnswer = studentAnswers[qId];
            const qObj = startData.questions.find(q => q.id === qId);

            // FIX: Prioritize Section Points (Wizard Config) over Question Default
            // q.sectionPoints comes from the Wizard. q.points comes from the Bank.
            const p = qObj.sectionPoints !== undefined ? qObj.sectionPoints : (qObj.points !== undefined ? qObj.points : 1);
            const points = parseInt(p);

            totalPoints += points;

            let isCorrect = false;

            if (Array.isArray(correctAnswer)) {
                if (Array.isArray(studentAnswer)) {
                    // MULTI_ANSWER, MATCHING, ORDERING
                    if (studentAnswer.length === correctAnswer.length) {
                        if (qObj?.type === 'MULTI_ANSWER') {
                            // Order independent
                            isCorrect = studentAnswer.every(val => correctAnswer.includes(val)) &&
                                correctAnswer.every(val => studentAnswer.includes(val));
                        } else if (qObj?.type === 'MATCHING') {
                            // Must match the definition in each pair
                            isCorrect = studentAnswer.every((val, idx) => normalize(val) === normalize(correctAnswer[idx].definition));
                        } else if (qObj?.type === 'ORDERING') {
                            // Must match the item in sequence
                            isCorrect = studentAnswer.every((val, idx) => normalize(val) === normalize(correctAnswer[idx]));
                        } else {
                            // General list fallback
                            isCorrect = studentAnswer.every((val, idx) => normalize(val) === normalize(correctAnswer[idx]));
                        }
                    }
                } else if (typeof studentAnswer === 'string') {
                    // Identification with variants
                    isCorrect = correctAnswer.some(variant => normalize(studentAnswer) === normalize(variant));
                }
            } else {
                // Standard Single Match (MCQ Choice ID, True/False, or Legacy Identification)
                if (normalize(studentAnswer) === normalize(correctAnswer)) {
                    isCorrect = true;
                }
            }

            if (isCorrect) score += points;
        }

        // 5. Update Submission
        await updateDoc(subRef, {
            score: score,
            totalPoints: totalPoints,
            status: 'graded',
            gradedAt: new Date().toISOString()
        });

        console.log(`[Grading] Submission ${submissionId} graded. Score: ${score}/${totalPoints}`);
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

// --- Retroactive Fix Tools ---

export const regradeAssessment = async (assessmentId) => {
    try {
        console.log(`[Regrade] Starting regrade for Assessment: ${assessmentId}`);
        // Fetch ALL submissions, regardless of status
        const q = query(
            collection(db, COL_SUBS),
            where("assessmentId", "==", assessmentId)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log(`[Regrade] No submissions found for ${assessmentId}`);
            return 0;
        }

        console.log(`[Regrade] Found ${snapshot.size} submissions. Processing...`);

        // Process in chunks to avoid overwhelming the network/browser
        const chunks = [];
        const chunkSize = 5;
        for (let i = 0; i < snapshot.docs.length; i += chunkSize) {
            chunks.push(snapshot.docs.slice(i, i + chunkSize));
        }

        let totalProcessed = 0;
        for (const chunk of chunks) {
            await Promise.all(chunk.map(doc => gradeSubmission(doc.id)));
            totalProcessed += chunk.length;
            console.log(`[Regrade] Processed ${totalProcessed}/${snapshot.size}`);
        }

        console.log(`[Regrade] Completed for ${assessmentId}`);
        return totalProcessed;

    } catch (error) {
        console.error(`Error regrading assessment ${assessmentId}:`, error);
        throw error;
    }
};

export const regradeAllAssessments = async () => {
    try {
        console.log("[Regrade All] Starting global regrade...");

        // 1. Get all assessments
        const snapshot = await getDocs(collection(db, COL_CONTENT));
        const assessments = snapshot.docs.map(d => d.id);

        console.log(`[Regrade All] Found ${assessments.length} assessments.`);

        let totalSubmissions = 0;
        for (const assessmentId of assessments) {
            const count = await regradeAssessment(assessmentId);
            totalSubmissions += count;
        }

        console.log(`[Regrade All] COMPLETE. Total submissions updated: ${totalSubmissions}`);
        return totalSubmissions;

    } catch (error) {
        console.error("Error in global regrade:", error);
        throw error;
    }
};

// Expose to window for manual triggering via console
window.regradeAllAssessments = regradeAllAssessments;
window.regradeAssessment = regradeAssessment;
