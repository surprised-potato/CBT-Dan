/**
 * Checks if the user's display name is missing or empty.
 * @param {Object} user - The user object from the store.
 * @returns {Boolean} - Returns true if the profile is incomplete.
 */
export const isProfileIncomplete = (user) => {
    if (!user) return false;
    const name = String(user.displayName || '').trim().toLowerCase();

    const placeholders = ['', 'unknown', 'null', 'undefined', 'n/a', 'student', 'teacher', 'test name'];
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

// ──────────────────────────────────
// Device / Platform Helpers
// ──────────────────────────────────

/**
 * Detect iOS devices (iPhone, iPad, iPod).
 */
export const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

/**
 * Check whether the Fullscreen API is available.
 */
export const canRequestFullscreen = () => !!(
    document.documentElement.requestFullscreen ||
    document.documentElement.webkitRequestFullscreen
);

/**
 * Build a user-friendly geolocation error message with device-specific instructions.
 */
export const getGeolocationErrorHelp = (error) => {
    const ios = isIOS();
    const base = {
        1: { // PERMISSION_DENIED
            title: 'Location Access Denied',
            message: ios
                ? 'Open your iPhone <b>Settings → Privacy & Security → Location Services</b>, ensure it is <b>ON</b>, then scroll to <b>Safari Websites</b> and set it to <b>"While Using"</b>.'
                : 'Tap the <b>🔒 lock icon</b> in your browser address bar → <b>Permissions → Location → Allow</b>. Then try again.',
        },
        2: { // POSITION_UNAVAILABLE
            title: 'Location Unavailable',
            message: 'Your device could not determine its location. Please ensure <b>GPS / Location Services</b> are enabled and you are not in Airplane mode.',
        },
        3: { // TIMEOUT
            title: 'Location Request Timed Out',
            message: 'It took too long to get your location. Please move to an area with better GPS reception and try again.',
        }
    };
    return base[error && error.code] || { title: 'Location Error', message: (error && error.message) || 'An unknown error occurred while accessing your location.' };
};

/**
 * Request geolocation with a promise wrapper. Uses relaxed accuracy on retry.
 * @param {boolean} highAccuracy - Use high accuracy (default true).
 * @param {number} timeout - Timeout in ms (default 15000).
 * @returns {Promise<GeolocationPosition>}
 */
export const requestGeolocation = (highAccuracy = true, timeout = 15000) => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject({ code: 2, message: 'Geolocation is not supported by this browser.' });
            return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: highAccuracy,
            timeout: timeout,
            maximumAge: 60000
        });
    });
};
