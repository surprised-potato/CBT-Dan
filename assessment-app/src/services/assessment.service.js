import { db } from '../core/config.js';
import {
    collection,
    writeBatch,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    deleteDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Collection Constants
const COL_CONTENT = 'assessment_content'; // Public(ish) - Questions only
const COL_KEYS = 'assessment_keys';       // Private - Answers only

export const generateAssessment = async (config) => {
    // config: { title, sections: [{ title, course, topics, type, distribution, pointsPerQuestion }], authorId }

    try {
        let allSelectedQuestions = [];

        // 1. Process each section
        for (const section of config.sections) {
            const qRef = collection(db, 'questions');
            let q = qRef;

            if (section.course) {
                q = query(q, where("course", "==", section.course));
            }

            // Support multiple topics if provided as an array
            if (section.topics && section.topics.length > 0) {
                // Firestore 'in' operator limited to 10 items.
                q = query(q, where("topic", "in", section.topics));
            } else if (section.topic) {
                q = query(q, where("topic", "==", section.topic));
            }

            const snapshot = await getDocs(q);
            let candidates = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            // Filter by type if specified
            if (section.type && section.type !== 'ALL') {
                candidates = candidates.filter(c => c.type === section.type);
            }

            // --- Difficulty Distribution Logic ---
            let selected = [];
            const dist = section.distribution || { EASY: section.count || 5, MODERATE: 0, DIFFICULT: 0 };

            const diffs = ['EASY', 'MODERATE', 'DIFFICULT'];
            for (const diff of diffs) {
                const countNeeded = dist[diff] || 0;
                if (countNeeded <= 0) continue;

                const diffCandidates = candidates.filter(c => (c.difficulty || 'EASY') === diff);
                // Randomize
                diffCandidates.sort(() => Math.random() - 0.5);
                selected = [...selected, ...diffCandidates.slice(0, countNeeded)];
            }

            // Fallback: If no distribution was provided but we have a count, pick random
            if (selected.length === 0 && section.count > 0) {
                candidates.sort(() => Math.random() - 0.5);
                selected = candidates.slice(0, section.count);
            }

            // Label questions with section info and specific points
            const labeled = selected.map(sq => ({
                ...sq,
                sectionTitle: section.title || 'Untitled Section',
                sectionPoints: section.pointsPerQuestion || sq.points || 1
            }));

            allSelectedQuestions = [...allSelectedQuestions, ...labeled];
        }

        if (allSelectedQuestions.length === 0) {
            throw new Error("No questions found for the selected criteria.");
        }

        // 2. SPLIT DATA (The Security Step)
        const contentPayload = {
            title: config.title,
            authorId: config.authorId,
            assignedClassId: config.assignedClassId || null,
            status: 'draft', // Default status
            createdAt: new Date().toISOString(),
            questionCount: allSelectedQuestions.length,
            settings: config.settings || { oneAtATime: false, randomizeOrder: false },
            sections: config.sections.map(s => ({
                title: s.title,
                topics: s.topics,
                distribution: s.distribution,
                pointsPerQuestion: s.pointsPerQuestion
            })),
            questions: allSelectedQuestions.map(q => {
                const { correct_answer, ...safeQ } = q;
                return safeQ;
            })
        };

        const keysPayload = {
            assessmentId: null,
            answers: allSelectedQuestions.reduce((acc, q) => {
                acc[q.id] = q.correct_answer;
                return acc;
            }, {})
        };

        // 3. Batch Write
        const batch = writeBatch(db);
        const contentRef = doc(collection(db, COL_CONTENT));
        const commonId = contentRef.id;

        batch.set(doc(db, COL_CONTENT, commonId), contentPayload);
        batch.set(doc(db, COL_KEYS, commonId), keysPayload);

        await batch.commit();
        return commonId;

    } catch (error) {
        console.error("Error generating assessment:", error);
        throw error;
    }
};

export const getAssessments = async (authorId) => {
    try {
        const q = query(
            collection(db, COL_CONTENT),
            where("authorId", "==", authorId),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("Error fetching assessments:", error);
        throw error;
    }
};

export const getAssessment = async (id) => {
    try {
        const docRef = doc(db, COL_CONTENT, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            throw new Error("Assessment not found");
        }
    } catch (error) {
        console.error("Error fetching assessment:", error);
        throw error;
    }
};

export const deleteAssessment = async (id) => {
    try {
        const batch = writeBatch(db);
        batch.delete(doc(db, COL_CONTENT, id));
        batch.delete(doc(db, COL_KEYS, id));
        await batch.commit();
    } catch (error) {
        console.error("Error deleting assessment:", error);
        throw error;
    }
};

export const updateAssessmentTitle = async (id, title) => {
    try {
        await updateDoc(doc(db, COL_CONTENT, id), { title });
    } catch (error) {
        console.error("Error updating assessment:", error);
        throw error;
    }
};

export const toggleAssessmentStatus = async (id, status) => {
    try {
        await updateDoc(doc(db, COL_CONTENT, id), { status });
    } catch (error) {
        console.error("Error toggling status:", error);
        throw error;
    }
};

export const getActiveAssessments = async (enrolledClassIds = []) => {
    try {
        const q = query(
            collection(db, COL_CONTENT),
            where("status", "==", "active"),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const allActive = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // Filter:
        // 1. If assignedClassId is null/missing -> Public -> Show
        // 2. If assignedClassId MATCHES one of enrolledClassIds -> Show
        // 3. Else -> Hide

        return allActive.filter(a => {
            if (!a.assignedClassId) return true; // Public
            return enrolledClassIds.includes(a.assignedClassId);
        });

    } catch (error) {
        console.error("Error fetching active assessments:", error);
        throw error;
    }
};

export const getAssessmentsByClass = async (classId) => {
    try {
        const q = query(
            collection(db, COL_CONTENT),
            where("assignedClassId", "==", classId),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("Error fetching class assessments:", error);
        throw error;
    }
};
