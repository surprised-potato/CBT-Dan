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
        const sectionAnswerBanks = {}; // sectorIdx -> [shuffled choices]

        for (let i = 0; i < config.sections.length; i++) {
            const section = config.sections[i];
            const qRef = collection(db, 'questions');
            let q = qRef;

            if (section.course) {
                q = query(q, where("course", "==", section.course));
            }

            if (section.topics && section.topics.length > 0) {
                q = query(q, where("topic", "in", section.topics));
            }

            const snapshot = await getDocs(q);
            let candidates = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            // Filter by type if specified
            if (section.type && section.type !== 'ALL') {
                candidates = candidates.filter(c => c.type === section.type);
            }

            // --- Difficulty Distribution Logic ---
            let selectedForSection = [];
            const dist = section.distribution || { EASY: 5, MODERATE: 0, DIFFICULT: 0 };
            const diffs = ['EASY', 'MODERATE', 'DIFFICULT'];

            for (const diff of diffs) {
                const countNeeded = dist[diff] || 0;
                if (countNeeded <= 0) continue;

                const diffCandidates = candidates.filter(c => (c.difficulty || 'EASY') === diff);

                if (diffCandidates.length < countNeeded) {
                    throw new Error(`Insufficient ${diff} questions in ${section.course || 'selected domain'}. Requested: ${countNeeded}, Found: ${diffCandidates.length}`);
                }

                diffCandidates.sort(() => Math.random() - 0.5);
                selectedForSection = [...selectedForSection, ...diffCandidates.slice(0, countNeeded)];
            }

            // Global Answer Bank Logic
            if (section.answerBankMode) {
                const bankSet = new Set(section.distractors || []);
                selectedForSection.forEach(sq => {
                    const isID = sq.type === 'IDENTIFICATION' || (sq.type === 'MCQ' && (!sq.choices || sq.choices.length === 0));
                    if (isID) {
                        (sq.correct_answers || []).forEach(ans => bankSet.add(ans));
                    }
                });
                sectionAnswerBanks[i] = Array.from(bankSet).sort(() => Math.random() - 0.5);
            }

            // Label questions
            const labeled = selectedForSection.map(sq => ({
                ...sq,
                sectionIdx: i,
                sectionTitle: section.title || 'Untitled Section',
                sectionPoints: section.pointsPerQuestion || sq.points || 1
            }));

            allSelectedQuestions = [...allSelectedQuestions, ...labeled];
        }

        if (allSelectedQuestions.length === 0) {
            throw new Error("No questions found for the selected criteria.");
        }

        // 2. SPLIT DATA
        const contentPayload = {
            title: config.title,
            authorId: config.authorId,
            assignedClassIds: config.assignedClassIds || [],
            status: 'draft',
            createdAt: new Date().toISOString(),
            questionCount: allSelectedQuestions.length,
            settings: config.settings || { oneAtATime: false, randomizeOrder: false },
            sections: config.sections.map((s, i) => ({
                title: s.title,
                topics: s.topics,
                distribution: s.distribution,
                pointsPerQuestion: s.pointsPerQuestion,
                answerBank: sectionAnswerBanks[i] || null,
                answerBankMode: s.answerBankMode || false
            })),
            questions: allSelectedQuestions.map(q => {
                // Remove sensitive data (correct answers)
                const { correct_answers, correct_answer, ...safeQ } = q;

                // For MATCHING, we need the terms and definitions but shoudn't reveal the pairs
                if (q.type === 'MATCHING') {
                    const pairs = q.pairs || [];
                    safeQ.matchingTerms = pairs.map(p => p.term);
                    safeQ.matchingDefinitions = pairs.map(p => p.definition).sort(() => Math.random() - 0.5);
                    delete safeQ.pairs; // Remove the correlated pairs
                }

                // For ORDERING, we need the items but should shuffle them
                if (q.type === 'ORDERING') {
                    safeQ.orderingItems = [...(q.items || [])].sort(() => Math.random() - 0.5);
                    delete safeQ.items; // Remove the ordered items
                }

                return safeQ;
            })
        };

        const keysPayload = {
            assessmentId: null,
            answers: allSelectedQuestions.reduce((acc, q) => {
                let keyAnswer = q.correct_answers || q.correct_answer;

                if (Array.isArray(keyAnswer)) {
                    if (q.type === 'MCQ' || q.type === 'TRUE_FALSE') {
                        keyAnswer = keyAnswer[0];
                    }
                }

                if (keyAnswer === undefined) {
                    console.warn(`[Assessment Engine] Question ${q.id} (${q.type}) has no defined correct answer. Defaulting to NULL.`);
                    keyAnswer = null;
                }

                acc[q.id] = keyAnswer;
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
            const ids = a.assignedClassIds || (a.assignedClassId ? [a.assignedClassId] : []);
            if (ids.length === 0) return true; // Public
            return ids.some(id => enrolledClassIds.includes(id));
        });

    } catch (error) {
        console.error("Error fetching active assessments:", error);
        throw error;
    }
};

export const getAssessmentsByClass = async (classId) => {
    try {
        // Simple query without orderBy to avoid composite index requirement
        const q = query(
            collection(db, COL_CONTENT),
            where("assignedClassId", "==", classId)
        );
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort client-side by createdAt descending
        return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
        console.error("Error fetching class assessments:", error);
        throw error;
    }
};

export const updateAssessmentConfig = async (id, updates) => {
    // updates: { sections?, settings?, assignedClassIds?, title? }
    try {
        const allowedFields = ['sections', 'settings', 'assignedClassIds', 'title'];
        const sanitized = {};
        for (const key of allowedFields) {
            if (updates[key] !== undefined) sanitized[key] = updates[key];
        }
        await updateDoc(doc(db, COL_CONTENT, id), sanitized);
    } catch (error) {
        console.error("Error updating assessment config:", error);
        throw error;
    }
};

export const cloneAssessment = async (id, assignedClassIds = null) => {
    try {
        // 1. Get original content and keys
        const contentSnap = await getDoc(doc(db, COL_CONTENT, id));
        const keysSnap = await getDoc(doc(db, COL_KEYS, id));

        if (!contentSnap.exists()) throw new Error("Assessment not found");

        const content = contentSnap.data();
        const keys = keysSnap.exists() ? keysSnap.data() : { answers: {} };

        // 2. Create new documents with fresh ID
        const batch = writeBatch(db);
        const newRef = doc(collection(db, COL_CONTENT));
        const newId = newRef.id;

        const clonedContent = {
            ...content,
            title: `${content.title} (COPY)`,
            status: 'draft',
            createdAt: new Date().toISOString(),
            // Use provided classIds or keep original
            assignedClassIds: assignedClassIds !== null ? assignedClassIds : (content.assignedClassIds || [])
        };
        // Remove legacy field if present
        delete clonedContent.assignedClassId;

        batch.set(doc(db, COL_CONTENT, newId), clonedContent);
        batch.set(doc(db, COL_KEYS, newId), { ...keys, assessmentId: newId });

        await batch.commit();
        return newId;

    } catch (error) {
        console.error("Error cloning assessment:", error);
        throw error;
    }
};

export const getAssessmentWithKeys = async (id) => {
    try {
        const [contentSnap, keySnap] = await Promise.all([
            getDoc(doc(db, COL_CONTENT, id)),
            getDoc(doc(db, COL_KEYS, id))
        ]);

        if (!contentSnap.exists()) throw new Error("Assessment content not found");

        const content = { id: contentSnap.id, ...contentSnap.data() };
        const keys = keySnap.exists() ? keySnap.data().answers : null;

        return { ...content, keys };
    } catch (error) {
        console.error("Error fetching assessment with keys:", error);
        throw error;
    }
};
