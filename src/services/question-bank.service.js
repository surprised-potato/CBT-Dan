import { db } from '../core/config.js';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    doc,
    getDoc,
    query,
    where,
    orderBy,
    writeBatch,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const COLLECTION_NAME = 'questions';

export const addQuestion = async (questionData) => {
    try {
        // Enforce timestamp
        const payload = {
            ...questionData,
            createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
        return docRef.id;
    } catch (error) {
        console.error("Error adding question: ", error);
        throw error;
    }
};

/**
 * Fetches only metadata for filtering.
 * Note: Firestore still charges a full document read, but we save bandwidth.
 */
export const getQuestionsMetadata = async (filters = {}) => {
    try {
        const qData = await getQuestions(filters);
        return qData.map(q => ({
            id: q.id,
            type: q.type,
            difficulty: q.difficulty,
            topic: q.topic,
            course: q.course
        }));
    } catch (error) {
        console.error("Error fetching metadata:", error);
        return [];
    }
};

export const getQuestionsByIds = async (ids) => {
    const BATCH_SIZE = 30;
    const results = [];
    try {
        for (let i = 0; i < ids.length; i += BATCH_SIZE) {
            const chunk = ids.slice(i, i + BATCH_SIZE);
            const q = query(collection(db, COLLECTION_NAME), where("__name__", "in", chunk));
            const snap = await getDocs(q);
            snap.forEach(d => results.push({ id: d.id, ...d.data() }));
        }
        return results;
    } catch (error) {
        console.error("Error fetching bulk questions:", error);
        return [];
    }
};

/**
 * Fetches optimized summary from a single document to save reads.
 * Structure: system_stats/question_bank
 */
export const getQuestionBankSummary = async () => {
    try {
        const docSnap = await getDoc(doc(db, 'system_stats', 'question_bank'));
        if (docSnap.exists()) {
            return docSnap.data();
        }
        // Fallback: Regenerate if missing
        return await regenerateQuestionBankSummary();
    } catch (error) {
        console.error("Error fetching summary:", error);
        return { courses: [], topics: {}, counts: {} };
    }
};

export const regenerateQuestionBankSummary = async () => {
    const data = await getHierarchy();
    try {
        await setDoc(doc(db, 'system_stats', 'question_bank'), data);
    } catch (e) {
        console.warn("Failed to cache summary (permissions?):", e);
    }
    return data;
};

/**
 * Internal helper to fetch all metadata. High read cost.
 */
export const getHierarchy = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        const courses = new Set();
        const hierarchy = {}; // { 'CourseName': Set('Topic1', 'Topic2') }
        const counts = {}; // { 'course|topic|type|difficulty': count }

        querySnapshot.forEach(doc => {
            const data = doc.data();
            const course = data.course || 'Uncategorized';
            const topic = data.topic || 'General';
            const type = data.type || 'ALL';
            let difficulty = data.difficulty || 'ANY';

            // Normalize legacy 'MEDIUM' difficulty
            if (difficulty === 'MEDIUM') difficulty = 'MODERATE';

            courses.add(course);

            if (!hierarchy[course]) {
                hierarchy[course] = new Set();
            }
            hierarchy[course].add(topic);

            // Build composite count keys
            const keys = [
                `${course}|${topic}|${type}|${difficulty}`,
                `${course}|${topic}|ALL|${difficulty}`,
                `${course}|${topic}|${type}|ANY`,
                `${course}|${topic}|ALL|ANY`,
            ];
            keys.forEach(k => { counts[k] = (counts[k] || 0) + 1; });
        });

        // Convert Sets to Arrays for easier consumption
        const topicsByCourse = {};
        for (const [course, topicSet] of Object.entries(hierarchy)) {
            topicsByCourse[course] = Array.from(topicSet).sort();
        }

        return {
            courses: Array.from(courses).sort(),
            topics: topicsByCourse,
            counts: counts
        };
    } catch (error) {
        console.error("Error fetching hierarchy:", error);
        return { courses: [], topics: {}, counts: {} };
    }
};

export const deleteQuestion = async (id) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
        console.error("Error deleting question:", error);
        throw error;
    }
};

export const updateQuestion = async (id, data) => {
    try {
        const questionRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(questionRef, {
            ...data,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error updating question:", error);
        throw error;
    }
};

export const repairQuestion = async (id, data) => {
    try {
        const questionRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(questionRef, {
            ...data,
            repairedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error repairing question:", error);
        throw error;
    }
};

export const renameTopic = async (course, oldTopic, newTopic) => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where("course", "==", course),
            where("topic", "==", oldTopic)
        );
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        
        snapshot.docs.forEach(d => {
            batch.update(doc(db, COLLECTION_NAME, d.id), {
                topic: newTopic,
                updatedAt: new Date().toISOString()
            });
        });
        
        await batch.commit();
    } catch (error) {
        console.error("Error renaming topic:", error);
        throw error;
    }
};

export const renameCourse = async (oldCourse, newCourse) => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where("course", "==", oldCourse)
        );
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        
        snapshot.docs.forEach(d => {
            batch.update(doc(db, COLLECTION_NAME, d.id), {
                course: newCourse,
                updatedAt: new Date().toISOString()
            });
        });
        
        await batch.commit();
    } catch (error) {
        console.error("Error renaming course:", error);
        throw error;
    }
};

export const getQuestionById = async (id) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Normalize legacy 'MEDIUM' difficulty
            if (data.difficulty === 'MEDIUM') data.difficulty = 'MODERATE';
            return { id: docSnap.id, ...data };
        } else {
            throw new Error("No such document!");
        }
    } catch (error) {
        console.error("Error getting question:", error);
        throw error;
    }
};
export const bulkAddQuestions = async (questions) => {
    const BATCH_LIMIT = 500;
    try {
        const timestamp = new Date().toISOString();
        const colRef = collection(db, COLLECTION_NAME);

        for (let i = 0; i < questions.length; i += BATCH_LIMIT) {
            const batch = writeBatch(db);
            const chunk = questions.slice(i, i + BATCH_LIMIT);

            chunk.forEach(q => {
                const newDocRef = doc(colRef);
                const normalizedQ = { ...q };
                if (normalizedQ.difficulty === 'MEDIUM') normalizedQ.difficulty = 'MODERATE';

                batch.set(newDocRef, {
                    ...normalizedQ,
                    createdAt: timestamp
                });
            });

            await batch.commit();
        }
    } catch (error) {
        console.error("Error in bulk add:", error);
        throw error;
    }
};
