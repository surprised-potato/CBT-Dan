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
export const normalize = (str) => {
    return String(str || '').trim().toLowerCase();
};

export const checkCorrectness = (q, studentAns, keyAns) => {
    // If student answer is empty, it's immediately wrong (prevents matching null keys)
    if (studentAns === undefined || studentAns === null || (typeof studentAns === 'string' && studentAns.trim() === '')) {
        return false;
    }

    if (Array.isArray(keyAns)) {
        if (Array.isArray(studentAns)) {
            if (studentAns.length !== keyAns.length) return false;
            if (q.type === 'MULTI_ANSWER') {
                return studentAns.every(v => keyAns.includes(v)) && keyAns.every(v => studentAns.includes(v));
            } else if (q.type === 'MATCHING') {
                return studentAns.every((v, idx) => {
                    const def = keyAns[idx]?.definition;
                    return def && normalize(v) === normalize(def);
                });
            } else if (q.type === 'ORDERING') {
                return studentAns.every((v, idx) => {
                    const key = keyAns[idx];
                    return key && normalize(v) === normalize(key);
                });
            }
            return studentAns.every((val, idx) => normalize(val) === normalize(keyAns[idx]));
        } else if (typeof studentAns === 'string') {
            // Identification with variants
            return keyAns.some(variant => normalize(studentAns) === normalize(variant));
        }
    }
    return normalize(studentAns) === normalize(keyAns);
};

export const formatAnswer = (q, ans) => {
    if (!ans) return '<span class="italic opacity-50 text-red-400">NO DATA TRANSMITTED</span>';
    if (Array.isArray(ans)) {
        if (q.type === 'MULTI_ANSWER') {
            return ans.map(v => {
                const choice = q.choices.find(c => c.id === v);
                return choice ? choice.text : v;
            }).join(', ');
        }
        if (q.type === 'MATCHING') {
            const terms = q.matchingTerms || (q.pairs || []).map(p => p.term);
            return ans.map((v, i) => {
                const val = typeof v === 'object' && v !== null ? (v.definition || v.text || JSON.stringify(v)) : v;
                return `${terms[i] || '?'} → ${val}`;
            }).join('<br>');
        }
        if (q.type === 'ORDERING') {
            return ans.map((v, i) => `${i + 1}. ${v}`).join(', ');
        }
        return ans.join(', ');
    }
    if (q.type === 'MCQ') {
        const choice = q.choices ? q.choices.find(c => c.id === ans) : null;
        return choice ? choice.text : ans;
    }
    if (q.type === 'TRUE_FALSE') return ans === 'true' ? 'TRUE' : 'FALSE';
    return ans;
};

export const gradeSubmission = async (submissionId) => {
    try {
        // 1. Fetch Submission
        const subRef = doc(db, COL_SUBS, submissionId);
        const subSnap = await getDoc(subRef);
        if (!subSnap.exists()) throw new Error("Submission not found");
        const submission = subSnap.data();

        // 2. Fetch Answer Key
        const keyRef = doc(db, COL_KEYS, submission.assessmentId);
        const keySnap = await getDoc(keyRef);
        if (!keySnap.exists()) throw new Error("Answer key not found");
        const keys = keySnap.data().answers;

        // 3. Fetch Assessment Content
        const contentRef = doc(db, COL_CONTENT, submission.assessmentId);
        const contentSnap = await getDoc(contentRef);
        const startData = contentSnap.exists() ? contentSnap.data() : { questions: [] };

        // 4. Calculate Score
        let score = 0;
        let totalPoints = 0;
        const studentAnswers = submission.answers || {};

        for (const [qId, correctAnswer] of Object.entries(keys)) {
            const studentAnswer = studentAnswers[qId];
            const qObj = startData.questions.find(q => q.id === qId);
            if (!qObj) continue;

            const p = qObj.sectionPoints !== undefined ? qObj.sectionPoints : (qObj.points !== undefined ? qObj.points : 1);
            const points = parseInt(p);
            totalPoints += points;

            if (checkCorrectness(qObj, studentAnswer, correctAnswer)) {
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
        const submissions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // Dynamically fetch最新 user profiles to override frozen 'Unknown' names
        const userCache = {};
        await Promise.all(submissions.map(async (sub) => {
            if (sub.studentId && !userCache[sub.studentId]) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', sub.studentId));
                    userCache[sub.studentId] = userDoc.exists() ? userDoc.data() : null;
                } catch (e) {
                    userCache[sub.studentId] = null;
                }
            }
        }));

        return submissions.map(sub => {
            const userData = userCache[sub.studentId];
            if (userData) {
                sub.studentName = userData.displayName || sub.studentName;
                sub.studentEmail = userData.email || sub.studentEmail;
            }

            // Fallback strategy if name is still unresolved
            if (!sub.studentName || sub.studentName === 'Unknown' || sub.studentName.trim() === '') {
                sub.studentName = sub.studentEmail ? sub.studentEmail.split('@')[0] : 'Unknown';
            }
            return sub;
        });

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
