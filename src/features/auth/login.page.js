import { renderLoginUI } from './login.ui.js';
import { loginUser, loginWithGoogle, resetPassword } from '../../services/auth.service.js';
import { setUser } from '../../core/store.js';
import { renderLoadingSpinner } from '../../shared/spinner.js';

export const LoginPage = () => {
    const app = document.getElementById('app');
    app.innerHTML = renderLoginUI();

    const form = document.getElementById('login-form');
    const errorMsg = document.getElementById('error-msg');
    const forgotStatus = document.getElementById('forgot-password-status');
    const submitBtn = document.getElementById('login-submit-btn');

    // Password Visibility Toggle
    form.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('[data-toggle-for]');
        if (toggleBtn) {
            const inputId = toggleBtn.getAttribute('data-toggle-for');
            const input = document.getElementById(inputId);
            const eyeOn = toggleBtn.querySelector('.eye-on');
            const eyeOff = toggleBtn.querySelector('.eye-off');

            if (input.type === 'password') {
                input.type = 'text';
                eyeOn.classList.add('hidden');
                eyeOff.classList.remove('hidden');
            } else {
                input.type = 'password';
                eyeOn.classList.remove('hidden');
                eyeOff.classList.add('hidden');
            }
        }
    });

    // Forgot Password Flow
    const forgotLink = document.getElementById('forgot-password-link');
    forgotLink.addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        forgotStatus.classList.remove('hidden', 'bg-green-50', 'text-green-600', 'border-green-100', 'bg-red-50', 'text-red-600', 'border-red-100');
        forgotStatus.innerHTML = renderLoadingSpinner('', 'blue-600');

        if (!email) {
            forgotStatus.classList.add('bg-red-50', 'text-red-600', 'border-red-100');
            forgotStatus.innerHTML = '<span class="text-[9px] font-black uppercase tracking-widest">Enter email first</span>';
            return;
        }

        try {
            await resetPassword(email);
            forgotStatus.classList.add('bg-green-50', 'text-green-600', 'border-green-100');
            forgotStatus.innerHTML = '<span class="text-[9px] font-black uppercase tracking-widest">Reset link sent to email</span>';
        } catch (error) {
            console.error("Reset Error:", error);
            forgotStatus.classList.add('bg-red-50', 'text-red-600', 'border-red-100');
            const msg = error.code === 'auth/user-not-found' ? 'User not found' : 'Check email format';
            forgotStatus.innerHTML = `<span class="text-[9px] font-black uppercase tracking-widest">${msg}</span>`;
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Reset state
        errorMsg.classList.add('hidden');
        errorMsg.textContent = '';
        forgotStatus.classList.add('hidden');

        const originalContent = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = renderLoadingSpinner('Signing in...');

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const userData = await loginUser(email, password);
            setUser(userData);

            if (userData.role === 'teacher') {
                window.location.hash = '#teacher-dash';
            } else {
                window.location.hash = '#student-dash';
            }
        } catch (error) {
            console.error("Login Error:", error);
            errorMsg.textContent = mapAuthError(error.code);
            errorMsg.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalContent;
        }
    });

    // Google Login Logic
    const googleBtn = document.getElementById('google-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            errorMsg.classList.add('hidden');
            const originalContent = googleBtn.innerHTML;
            googleBtn.disabled = true;
            googleBtn.innerHTML = renderLoadingSpinner('Connecting...', 'blue-600');

            try {
                const userData = await loginWithGoogle('student');
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
                googleBtn.innerHTML = originalContent;
            }
        });
    }
};

const mapAuthError = (code) => {
    switch (code) {
        case 'auth/user-not-found': return "No account found with that email.";
        case 'auth/wrong-password': return "Incorrect password. Try again or reset it.";
        case 'auth/invalid-email': return "Please enter a valid email address.";
        case 'auth/too-many-requests': return "Too many attempts. Please wait a moment.";
        case 'auth/network-request-failed': return "Network error. Check your connection.";
        case 'auth/user-disabled': return "This account has been disabled.";
        default: return "Sign-in failed. Please try again.";
    }
};
