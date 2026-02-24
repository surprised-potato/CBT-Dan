/**
 * Set a browser cookie.
 * @param {string} name - Name of the cookie.
 * @param {string} value - Value to store.
 * @param {number} days - Number of days until expiration.
 */
export const setCookie = (name, value, days = 7) => {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (encodeURIComponent(value) || "") + expires + "; path=/; samesite=Lax";
};

/**
 * Get a browser cookie by name.
 * @param {string} name - Name of the cookie.
 * @returns {string|null} - Cookie value or null if not found.
 */
export const getCookie = (name) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
};

/**
 * Delete a browser cookie.
 * @param {string} name - Name of the cookie.
 */
export const deleteCookie = (name) => {
    document.cookie = name + '=; Max-Age=-99999999; path=/;';
};
