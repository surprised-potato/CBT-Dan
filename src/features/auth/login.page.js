import { renderLoginUI } from './login.ui.js';
import { loginUser, loginWithGoogle } from '../../services/auth.service.js';
import { setUser } from '../../core/store.js';

export const LoginPage = () => {
    const app = document.getElementById('app');
    app.innerHTML = renderLoginUI();

    const form = document.getElementById('login-form');
    const errorMsg = document.getElementById('error-msg');
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Reset state
        errorMsg.classList.add('hidden');
        errorMsg.textContent = '';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const userData = await loginUser(email, password);
            setUser(userData); // Update store

            // Redirect based on role
            if (userData.role === 'teacher') {
                window.location.hash = '#teacher-dash';
            } else {
                window.location.hash = '#student-dash';
            }
        } catch (error) {
            console.error("Login Error:", error);
            errorMsg.textContent = "Invalid email or password.";
            errorMsg.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    });

    // Google Login Logic
    const googleBtn = document.getElementById('google-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            errorMsg.classList.add('hidden');
            googleBtn.disabled = true;
            googleBtn.textContent = 'Connecting...';

            try {
                const userData = await loginWithGoogle('student'); // Default to student on quick login
                setUser(userData);

                if (userData.role === 'teacher') {
                    window.location.hash = '#teacher-dash';
                } else {
                    window.location.hash = '#student-dash';
                }
            } catch (error) {
                console.error("Google Login Error:", error);
                errorMsg.textContent = "Google Sign-In failed.";
                errorMsg.classList.remove('hidden');
                googleBtn.disabled = false;
                googleBtn.textContent = 'Sign in with Google';
            }
        });
    }
};
