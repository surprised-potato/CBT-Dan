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
    writeBatch
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

export const getQuestions = async (filters = {}) => {
    try {
        let q = collection(db, COLLECTION_NAME);

        // Basic filtering (can be expanded)
        if (filters.topic) {
            q = query(q, where("topic", "==", filters.topic));
        }

        // Order by creation usually
        // Note: Enabling orderBy might require a Firestore Index if combined with 'where'
        // q = query(q, orderBy("createdAt", "desc")); 

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching questions: ", error);
        throw error;
    }
};

/**
 * Fetches all questions to derive unique Courses and Topics.
 * Returns: { courses: ['CE101', 'Math'], topics: {'CE101': ['Vectors', 'Truss'], 'Math': [...] } }
 */
export const getHierarchy = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        const courses = new Set();
        const hierarchy = {}; // { 'CourseName': Set('Topic1', 'Topic2') }

        querySnapshot.forEach(doc => {
            const data = doc.data();
            const course = data.course || 'Uncategorized';
            const topic = data.topic || 'General';

            courses.add(course);

            if (!hierarchy[course]) {
                hierarchy[course] = new Set();
            }
            hierarchy[course].add(topic);
        });

        // Convert Sets to Arrays for easier consumption
        const topicsByCourse = {};
        for (const [course, topicSet] of Object.entries(hierarchy)) {
            topicsByCourse[course] = Array.from(topicSet).sort();
        }

        return {
            courses: Array.from(courses).sort(),
            topics: topicsByCourse
        };
    } catch (error) {
        console.error("Error fetching hierarchy:", error);
        return { courses: [], topics: {} };
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

export const getQuestionById = async (id) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
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
                batch.set(newDocRef, {
                    ...q,
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
