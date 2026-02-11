import { auth, db } from '../core/config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    doc,
    setDoc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { setUser, getUser } from '../core/store.js';

export const registerUser = async (email, password, role, displayName, course) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save role and profile to Firestore
        await setDoc(doc(db, "users", user.uid), {
            email: email,
            role: role || 'student', // Default fallback
            displayName: displayName || '',
            course: course || '',
            createdAt: new Date().toISOString()
        });

        // Also update the Auth profile immediately (optional but good for consistency)
        // Note: We'd need to import updateProfile from firebase/auth for this, but Firestore is enough for our app logic

        return { user, role };
    } catch (error) {
        throw error;
    }
};

export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Fetch role
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            return { user, ...userDoc.data() };
        } else {
            // Fallback if no doc (shouldn't happen for valid users)
            return { user, role: 'student' };
        }
    } catch (error) {
        throw error;
    }
};

export const loginWithGoogle = async (role = 'student') => {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if user exists in Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            return { user, ...userDoc.data() };
        } else {
            // If new user, save with default role (or passed role)
            // Note: For Google Login, we might defaulting to Student if not specified, 
            // or we could prompt. For now assuming 'student' default for safety unless logic changes.
            const newUser = {
                email: user.email,
                role: role,
                createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newUser);
            return { user, ...newUser };
        }
    } catch (error) {
        throw error;
    }
};

export const logoutUser = async () => {
    await signOut(auth);
    setUser(null);
};

export const updateUserProfile = async (uid, data) => {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, data);

        // Update local store
        const currentUser = getUser();
        if (currentUser && currentUser.user.uid === uid) {
            setUser({ ...currentUser, ...data });
        }
    } catch (error) {
        // If doc doesn't exist (e.g. older user), set it
        if (error.code === 'not-found' || error.message.includes('No document to update')) {
            await setDoc(doc(db, "users", uid), {
                email: getUser()?.user.email, // Try to preserve email
                ...data
            }, { merge: true });

            const currentUser = getUser();
            if (currentUser && currentUser.user.uid === uid) {
                setUser({ ...currentUser, ...data });
            }
        } else {
            throw error;
        }
    }
};

export const observeAuthChanges = (callback) => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Re-fetch role on reload
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = { user, ...userDoc.data() };
                setUser(userData);
                if (callback) callback(userData);
            } else {
                setUser({ user, role: 'student' });
                if (callback) callback({ user, role: 'student' });
            }
        } else {
            setUser(null);
            if (callback) callback(null);
        }
    });
};
