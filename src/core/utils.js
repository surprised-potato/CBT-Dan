/**
 * Checks if the user's display name is missing or empty.
 * @param {Object} user - The user object from the store.
 * @returns {Boolean} - Returns true if the profile is incomplete.
 */
export const isProfileIncomplete = (user) => {
    if (!user) return false;
    const name = String(user.displayName || '').trim().toLowerCase();

    const placeholders = ['', 'unknown', 'null', 'undefined', 'n/a', 'student', 'teacher'];
    return placeholders.includes(name);
};

/**
 * Ensures the profile modal is shown if the profile is incomplete.
 * @param {Object} user - The user object.
 * @param {String} modalId - The ID of the profile modal.
 */
export const enforceProfileCompletion = (user, modalId) => {
    if (isProfileIncomplete(user)) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');

            // Add custom visual cue to the modal header/content
            const title = modal.querySelector('h3'); // Modal header is usually h3
            if (title && !title.dataset.enforced) {
                title.classList.add('flex', 'flex-col');
                title.innerHTML += '<span class="block text-[10px] text-orange-600 mt-2 p-3 bg-orange-50 rounded-xl border border-orange-100 font-black uppercase tracking-widest animate-pulse">Action Required: Registry Requires Personnel Name</span>';
                title.dataset.enforced = "true";
            }

            // Disable close button if profile is incomplete to force action
            const closeBtn = document.getElementById(`${modalId}-close-btn`);
            if (closeBtn) {
                closeBtn.classList.add('hidden');
            }
        }
    }
};

/**
 * Haversine formula: calculates great-circle distance between two lat/lng points.
 * @returns {number} Distance in meters.
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const rs = Math.PI / 180;
    const φ1 = lat1 * rs;
    const φ2 = lat2 * rs;
    const Δφ = (lat2 - lat1) * rs;
    const Δλ = (lon2 - lon1) * rs;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Generates a random alphanumeric code of the given length.
 * @param {number} length - Length of the code (default 6).
 * @returns {string} Uppercase alphanumeric string.
 */
export const generateSecureCode = (length = 6) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0/O/1/I to avoid confusion
    let code = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
        code += chars[array[i] % chars.length];
    }
    return code;
};
