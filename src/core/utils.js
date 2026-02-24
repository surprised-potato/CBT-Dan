/**
 * Checks if the user's display name is missing or empty.
 * @param {Object} user - The user object from the store.
 * @returns {Boolean} - Returns true if the profile is incomplete.
 */
export const isProfileIncomplete = (user) => {
    if (!user) return false;
    const name = user.displayName || '';
    return name.trim() === '';
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
            const title = modal.querySelector('h2');
            if (title && !title.dataset.enforced) {
                title.innerHTML += '<span class="block text-[10px] text-orange-500 mt-2 uppercase tracking-widest animate-pulse">Action Required: Protocol requires personnel name</span>';
                title.dataset.enforced = "true";
            }
        }
    }
};
