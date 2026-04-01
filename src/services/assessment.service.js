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
    updateDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getQuestionsMetadata, getQuestionsByIds } from './question-bank.service.js';

// Collection Constants
const COL_CONTENT = 'assessment_content'; // Public(ish) - Questions only
const COL_KEYS = 'assessment_keys';       // Private - Answers only

export const generateQuestionsForSections = async (sections) => {
    let selectedMetas = [];

    // Pass 1: Select IDs based on metadata
    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        
        // Fetch candidates (Metadata only)
        const candidates = await getQuestionsMetadata({ 
            course: section.course,
            topic: (section.topics && section.topics.length === 1) ? section.topics[0] : null
        });

        let pool = candidates;
        // Client-side multi-topic filter if needed
        if (section.topics && section.topics.length > 1) {
            pool = pool.filter(c => section.topics.includes(c.topic));
        }
        // Type filter
        if (section.type && section.type !== 'ALL') {
            pool = pool.filter(c => c.type === section.type);
        }

        const dist = section.distribution || { ANY: 5, EASY: 0, MODERATE: 0, DIFFICULT: 0 };
        const diffs = ['EASY', 'MODERATE', 'DIFFICULT'];
        const sectionSelectedIds = new Set();

        // 1. Fixed Difficulties
        for (const diff of diffs) {
            const countNeeded = dist[diff] || 0;
            if (countNeeded <= 0) continue;

            const diffCandidates = pool.filter(c => (c.difficulty || 'EASY') === diff);
            if (diffCandidates.length < countNeeded) {
                throw new Error(`Insufficient ${diff} questions in ${section.course || 'selected domain'}. Requested: ${countNeeded}, Found: ${diffCandidates.length}`);
            }

            diffCandidates.sort(() => Math.random() - 0.5);
            const chosen = diffCandidates.slice(0, countNeeded);
            chosen.forEach(c => {
                sectionSelectedIds.add(c.id);
                selectedMetas.push({ ...c, sectionIdx: i, sectionTitle: section.title || 'Untitled Section', sectionPoints: section.pointsPerQuestion || 1 });
            });
        }

        // 2. ANY Difficulty
        const anyNeeded = dist.ANY || 0;
        if (anyNeeded > 0) {
            const remainingPool = pool.filter(c => !sectionSelectedIds.has(c.id));
            if (remainingPool.length < anyNeeded) {
                throw new Error(`Insufficient pool for Mixed Difficulty in ${section.course || 'selected domain'}. Requested: ${anyNeeded}, Available: ${remainingPool.length}`);
            }
            remainingPool.sort(() => Math.random() - 0.5);
            const chosenAny = remainingPool.slice(0, anyNeeded);
            chosenAny.forEach(c => {
                selectedMetas.push({ ...c, sectionIdx: i, sectionTitle: section.title || 'Untitled Section', sectionPoints: section.pointsPerQuestion || 1 });
            });
        }
    }

    if (selectedMetas.length === 0) throw new Error("No questions found for criteria.");

    // Pass 2: Fetch full content for selected IDs ONLY
    const fullQuestions = await getQuestionsByIds(selectedMetas.map(m => m.id));
    
    // Map metadata back to full content (preserving section data)
    const allSelectedQuestions = selectedMetas.map(m => {
        const full = fullQuestions.find(f => f.id === m.id);
        return { ...full, ...m };
    });

    // Pass 3: Global Answer Bank Logic
    const sectionAnswerBanks = {};
    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        if (section.answerBankMode) {
            const sectionQs = allSelectedQuestions.filter(sq => sq.sectionIdx === i);
            const bankSet = new Set(section.distractors || []);
            sectionQs.forEach(sq => {
                const isID = sq.type === 'IDENTIFICATION' || (sq.type === 'MCQ' && (!sq.choices || sq.choices.length === 0));
                if (isID) (sq.correct_answers || []).forEach(ans => bankSet.add(ans));
            });
            sectionAnswerBanks[i] = Array.from(bankSet).sort(() => Math.random() - 0.5);
        }
    }

    return { allSelectedQuestions, sectionAnswerBanks };
};

const _generateUnlockPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pwd = '';
    for (let i = 0; i < 6; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    return pwd;
};

/**
 * Summarization logic for Teacher view
 */
export const getTeacherAssessmentsSummary = async (authorId) => {
    try {
        const docSnap = await getDoc(doc(db, 'system_stats', `assessments_${authorId}`));
        if (docSnap.exists()) return docSnap.data().list || [];
        return await regenerateTeacherAssessmentsSummary(authorId);
    } catch (e) {
        console.error("Error fetching assessment summary:", e);
        return [];
    }
};

export const regenerateTeacherAssessmentsSummary = async (authorId) => {
    try {
        const assessments = await getAssessments(authorId); // Full fetch (expensive, but only once)
        const summary = assessments.map(a => ({
            id: a.id,
            title: a.title,
            status: a.status,
            createdAt: a.createdAt,
            questionCount: a.questionCount,
            assignedClassIds: a.assignedClassIds || []
        }));
        await setDoc(doc(db, 'system_stats', `assessments_${authorId}`), { list: summary });
        return summary;
    } catch (e) {
        console.error("Error regenerating summary:", e);
        return [];
    }
};

export const generateAssessment = async (config) => {
    // config: { title, sections: [{ title, course, topics, type, distribution, pointsPerQuestion }], authorId }
    try {
        const { allSelectedQuestions, sectionAnswerBanks } = await generateQuestionsForSections(config.sections);

        // Auto-generate unlock password if not already set
        const settings = config.settings || { oneAtATime: false, randomizeOrder: false };
        if (!settings.unlockPassword) {
            settings.unlockPassword = _generateUnlockPassword();
        }

        // 2. SPLIT DATA
        const contentPayload = {
            title: config.title,
            authorId: config.authorId,
            assignedClassIds: config.assignedClassIds || [],
            status: 'draft',
            createdAt: new Date().toISOString(),
            questionCount: allSelectedQuestions.length,
            settings,
            sections: config.sections.map((s, i) => ({
                title: s.title,
                topics: s.topics,
                distribution: s.distribution,
                pointsPerQuestion: s.pointsPerQuestion,
                answerBank: sectionAnswerBanks[i] || null,
                answerBankMode: s.answerBankMode || false,
                course: s.course || null,
                type: s.type || 'ALL'
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
                let keyAnswer = q.correct_answers || q.correct_answer || q.pairs || q.items;

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
        
        // Update summary in background
        regenerateTeacherAssessmentsSummary(config.authorId);

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
        const docSnap = await getDoc(doc(db, COL_CONTENT, id));
        const authorId = docSnap.exists() ? docSnap.data().authorId : null;

        const batch = writeBatch(db);
        batch.delete(doc(db, COL_CONTENT, id));
        batch.delete(doc(db, COL_KEYS, id));
        await batch.commit();

        if (authorId) regenerateTeacherAssessmentsSummary(authorId);
    } catch (error) {
        console.error("Error deleting assessment:", error);
        throw error;
    }
};

export const getActiveAssessmentsSummary = async () => {
    try {
        const docSnap = await getDoc(doc(db, 'system_stats', 'active_assessments'));
        if (docSnap.exists()) return docSnap.data().list || [];
        return await regenerateActiveAssessmentsSummary();
    } catch (e) {
        console.error("Error fetching active summary:", e);
        return [];
    }
};

export const regenerateActiveAssessmentsSummary = async () => {
    try {
        const q = query(
            collection(db, COL_CONTENT),
            where("status", "==", "active"),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                title: data.title,
                questionCount: data.questionCount,
                assignedClassIds: data.assignedClassIds || (data.assignedClassId ? [data.assignedClassId] : []),
                createdAt: data.createdAt
            };
        });
        await setDoc(doc(db, 'system_stats', 'active_assessments'), { list });
        return list;
    } catch (e) {
        console.error("Error regenerating active summary:", e);
        return [];
    }
};

export const updateAssessmentTitle = async (id, title) => {
    try {
        const docRef = doc(db, COL_CONTENT, id);
        await updateDoc(docRef, { title });
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            regenerateTeacherAssessmentsSummary(data.authorId);
            if (data.status === 'active') regenerateActiveAssessmentsSummary();
        }
    } catch (error) {
        console.error("Error updating assessment:", error);
        throw error;
    }
};

export const toggleAssessmentStatus = async (id, status) => {
    try {
        const docRef = doc(db, COL_CONTENT, id);
        await updateDoc(docRef, { status });
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            regenerateTeacherAssessmentsSummary(docSnap.data().authorId);
            // Always refresh active summary when status changes
            regenerateActiveAssessmentsSummary();
        }
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
        const q = query(
            collection(db, COL_CONTENT),
            where("assignedClassId", "==", classId)
        );
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
        console.error("Error fetching class assessments:", error);
        throw error;
    }
};

export const updateAssessmentConfig = async (id, updates) => {
    try {
        const allowedFields = ['sections', 'settings', 'assignedClassIds', 'title', 'questions'];
        const sanitized = {};
        for (const key of allowedFields) {
            if (updates[key] !== undefined) sanitized[key] = updates[key];
        }
        const docRef = doc(db, COL_CONTENT, id);
        await updateDoc(docRef, sanitized);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) regenerateTeacherAssessmentsSummary(docSnap.data().authorId);
    } catch (error) {
        console.error("Error updating assessment config:", error);
        throw error;
    }
};

export const reconfigureAssessmentSections = async (id, newSections) => {
    try {
        const contentSnap = await getDoc(doc(db, COL_CONTENT, id));
        if (!contentSnap.exists()) throw new Error("Assessment not found");

        const content = contentSnap.data();
        if (content.status !== 'draft') {
            throw new Error("Cannot reconfigure an active assessment.");
        }

        const { allSelectedQuestions, sectionAnswerBanks } = await generateQuestionsForSections(newSections);

        const updatedQuestions = allSelectedQuestions.map(q => {
            const { correct_answers, correct_answer, ...safeQ } = q;
            if (q.type === 'MATCHING') {
                const pairs = q.pairs || [];
                safeQ.matchingTerms = pairs.map(p => p.term);
                safeQ.matchingDefinitions = pairs.map(p => p.definition).sort(() => Math.random() - 0.5);
                delete safeQ.pairs;
            }
            if (q.type === 'ORDERING') {
                safeQ.orderingItems = [...(q.items || [])].sort(() => Math.random() - 0.5);
                delete safeQ.items;
            }
            return safeQ;
        });

        const updatedAnswers = allSelectedQuestions.reduce((acc, q) => {
            let keyAnswer = q.correct_answers || q.correct_answer || q.pairs || q.items;
            if (Array.isArray(keyAnswer) && (q.type === 'MCQ' || q.type === 'TRUE_FALSE')) {
                keyAnswer = keyAnswer[0];
            }
            if (keyAnswer === undefined) keyAnswer = null;
            acc[q.id] = keyAnswer;
            return acc;
        }, {});

        const batch = writeBatch(db);

        batch.update(doc(db, COL_CONTENT, id), {
            sections: newSections.map((s, i) => ({
                title: s.title,
                topics: s.topics,
                distribution: s.distribution,
                pointsPerQuestion: s.pointsPerQuestion,
                answerBank: sectionAnswerBanks[i] || null,
                answerBankMode: s.answerBankMode || false,
                course: s.course || null,
                type: s.type || 'ALL'
            })),
            questions: updatedQuestions,
            questionCount: updatedQuestions.length
        });

        batch.update(doc(db, COL_KEYS, id), { answers: updatedAnswers });

        await batch.commit();
        regenerateTeacherAssessmentsSummary(content.authorId);

    } catch (error) {
        console.error("Error reconfiguring assessment sections:", error);
        throw error;
    }
};

export const cloneAssessment = async (id, assignedClassIds = null) => {
    try {
        const contentSnap = await getDoc(doc(db, COL_CONTENT, id));
        const keysSnap = await getDoc(doc(db, COL_KEYS, id));

        if (!contentSnap.exists()) throw new Error("Assessment not found");

        const content = contentSnap.data();
        const keys = keysSnap.exists() ? keysSnap.data() : { answers: {} };

        const batch = writeBatch(db);
        const newRef = doc(collection(db, COL_CONTENT));
        const newId = newRef.id;

        const clonedContent = {
            ...content,
            title: `${content.title} (COPY)`,
            status: 'draft',
            createdAt: new Date().toISOString(),
            assignedClassIds: assignedClassIds !== null ? assignedClassIds : (content.assignedClassIds || [])
        };
        delete clonedContent.assignedClassId;

        batch.set(doc(db, COL_CONTENT, newId), clonedContent);
        batch.set(doc(db, COL_KEYS, newId), { ...keys, assessmentId: newId });

        await batch.commit();
        regenerateTeacherAssessmentsSummary(content.authorId);
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
