import { renderButton } from '../../shared/button.js';
import { renderInput } from '../../shared/input.js';
import { registerUser } from '../../services/auth.service.js';

export const RegisterPage = () => {
    const app = document.getElementById('app');

    // Quick inline UI for registration (since it's mostly dev-facing/MVP)
    app.innerHTML = `
        <div class="flex items-center justify-center min-h-screen bg-gray-50 px-4">
            <div class="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
                <div class="text-center mb-8">
                    <h1 class="text-3xl font-bold text-gray-900">Create Account</h1>
                    <p class="text-gray-500 mt-2">Join as student</p>
                </div>
                
                <form id="register-form" class="space-y-4">
                    ${renderInput({ id: 'reg-name', label: 'Full Name', placeholder: 'e.g. Juan Dela Cruz', required: true })}
                    ${renderInput({ id: 'reg-email', type: 'email', label: 'Email', required: true })}
                    ${renderInput({ id: 'reg-course', label: 'Course', placeholder: 'e.g. BSCS, BSIT', required: true })}
                    ${renderInput({ id: 'reg-pass', type: 'password', label: 'Password', required: true })}
                    
                    <!-- Hidden teacher toggle for dev/testing -->
                    <div class="flex items-center gap-2 mt-2">
                        <input type="checkbox" id="reg-is-teacher" class="w-4 h-4 text-blue-600 rounded">
                        <label for="reg-is-teacher" class="text-xs text-gray-400">Register as Teacher</label>
                    </div>

                    <div id="reg-error" class="text-red-500 text-sm hidden text-center"></div>

                    ${renderButton({ text: 'Register', type: 'submit', variant: 'primary' })}
                </form>
                
                 <p class="mt-6 text-center text-sm text-gray-600">
                    Already have an account? <a href="#login" class="text-blue-600 font-semibold hover:underline">Log in</a>
                </p>
            </div>
        </div>
    `;

    const form = document.getElementById('register-form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const course = document.getElementById('reg-course').value;
        const password = document.getElementById('reg-pass').value;
        const isTeacher = document.getElementById('reg-is-teacher').checked;

        const role = isTeacher ? 'teacher' : 'student';

        const btn = form.querySelector('button');
        const err = document.getElementById('reg-error');

        btn.disabled = true;
        btn.textContent = 'Creating...';
        err.classList.add('hidden');

        try {
            await registerUser(email, password, role, name, course);
            alert('Account created! Please log in.');
            window.location.hash = '#login';
        } catch (error) {
            console.error(error);
            err.textContent = error.message;
            err.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Register';
        }
    });
};
