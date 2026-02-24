// Simple centralized store
const state = {
    currentUser: null,
    theme: 'light',
    isAuthInitialized: false
};

const listeners = [];

export const getUser = () => {
    return state.currentUser;
};

export const setUser = (user) => {
    state.currentUser = user;
    notify();
};

// Generic state helper if needed later
export const getState = () => {
    return { ...state };
};

export const setAuthInitialized = (val) => {
    state.isAuthInitialized = val;
    notify();
};

export const isAuthReady = () => state.isAuthInitialized;

export const subscribe = (listener) => {
    listeners.push(listener);
};

const notify = () => {
    listeners.forEach(l => l(state));
};
