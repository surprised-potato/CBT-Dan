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
