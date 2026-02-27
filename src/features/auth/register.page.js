import { renderButton } from '../../shared/button.js';
import { renderInput } from '../../shared/input.js';
import { registerUser } from '../../services/auth.service.js';
import { renderLoadingSpinner } from '../../shared/spinner.js';

export const RegisterPage = () => {
    const app = document.getElementById('app');

    app.innerHTML = `
        <div class="flex items-center justify-center min-h-screen bg-premium-gradient px-4 py-12">
            <div class="bg-white p-10 rounded-[50px] shadow-2xl shadow-blue-200/50 w-full max-w-md animate-in fade-in zoom-in duration-500 relative overflow-hidden border border-white">
                <div class="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-full -mr-24 -mt-24 blur-3xl opacity-50"></div>

                <div class="text-center mb-10 relative z-10">
                    <div class="w-20 h-20 bg-blue-premium rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-400/30 relative ring-4 ring-blue-50">
                        <svg class="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h1 class="text-3xl font-black text-gray-900 tracking-tight uppercase">Create Account</h1>
                    <p class="text-gray-400 mt-2 text-[10px] font-black uppercase tracking-[0.4em]">Join the Platform</p>
                </div>
                
                <form id="register-form" class="space-y-5 relative z-10">
                    <!-- Segmented Role Picker -->
                    <div class="bg-gray-100 p-1.5 rounded-2xl flex relative mb-6">
                        <button type="button" data-role="student" class="flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all z-10 text-blue-600 bg-white shadow-sm rounded-xl" id="role-btn-student">Student</button>
                        <button type="button" data-role="teacher" class="flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all z-10 text-gray-500" id="role-btn-teacher">Instructor</button>
                        <input type="hidden" id="reg-role" value="student">
                    </div>

                    ${renderInput({ id: 'reg-name', label: 'Full Personnel Name', placeholder: 'e.g. Jonathan Doe', required: true })}
                    ${renderInput({ id: 'reg-email', type: 'email', label: 'Registry Email', placeholder: 'user@school.edu', required: true })}
                    ${renderInput({ id: 'reg-course', label: 'Primary Course / Department', placeholder: 'e.g. BSCS, Engineering', required: true })}
                    
                    <div class="space-y-4">
                        ${renderInput({ id: 'reg-pass', type: 'password', label: 'Operational Key', placeholder: '••••••••', required: true, showToggle: true })}
                        
                        <!-- Strength Meter -->
                        <div id="strength-container" class="px-2 space-y-2 opacity-0 transition-opacity">
                            <div class="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div id="strength-bar" class="h-full w-0 transition-all duration-500"></div>
                            </div>
                            <p id="strength-text" class="text-[8px] font-black uppercase tracking-widest text-gray-400">Strength: Weak</p>
                        </div>
                    </div>

                    <div id="reg-error" class="text-red-500 text-[10px] font-black uppercase tracking-widest hidden text-center bg-red-50 py-3 px-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-1"></div>

                    <button type="submit" id="reg-submit-btn" class="w-full bg-blue-premium text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-200 hover:shadow-2xl hover:shadow-blue-300 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3">
                        <span>Create Account</span>
                    </button>
                </form>
                
                <p class="mt-10 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 relative z-10">
                    Already have an account? <a href="#login" class="text-blue-600 hover:text-blue-800 transition-colors ml-1">Access Gateway</a>
                </p>
            </div>
        </div>
    `;

    const form = document.getElementById('register-form');
    const roleInput = document.getElementById('reg-role');
    const studentBtn = document.getElementById('role-btn-student');
    const teacherBtn = document.getElementById('role-btn-teacher');

    // --- Role Switching ---
    const updateRoleUI = (role) => {
        if (role === 'student') {
            studentBtn.classList.add('bg-white', 'shadow-sm', 'text-blue-600', 'rounded-xl');
            studentBtn.classList.remove('text-gray-500');
            teacherBtn.classList.remove('bg-white', 'shadow-sm', 'text-blue-600', 'rounded-xl');
            teacherBtn.classList.add('text-gray-500');
        } else {
            teacherBtn.classList.add('bg-white', 'shadow-sm', 'text-blue-600', 'rounded-xl');
            teacherBtn.classList.remove('text-gray-500');
            studentBtn.classList.remove('bg-white', 'shadow-sm', 'text-blue-600', 'rounded-xl');
            studentBtn.classList.add('text-gray-500');
        }
    };

    studentBtn.onclick = () => { roleInput.value = 'student'; updateRoleUI('student'); };
    teacherBtn.onclick = () => { roleInput.value = 'teacher'; updateRoleUI('teacher'); };

    // --- Password Toggle & Strength ---
    const passInput = document.getElementById('reg-pass');
    const strengthContainer = document.getElementById('strength-container');
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');

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

    passInput.addEventListener('input', () => {
        const val = passInput.value;
        if (!val) { strengthContainer.classList.add('opacity-0'); return; }
        strengthContainer.classList.remove('opacity-0');

        let strength = 0;
        if (val.length >= 6) strength += 25;
        if (val.length >= 10) strength += 25;
        if (/[A-Z]/.test(val) && /[a-z]/.test(val)) strength += 25;
        if (/[0-9]/.test(val) || /[^A-Za-z0-9]/.test(val)) strength += 25;

        strengthBar.style.width = strength + '%';
        if (strength <= 25) {
            strengthBar.className = 'h-full w-0 transition-all duration-500 bg-red-400';
            strengthText.textContent = 'Strength: Weak';
        } else if (strength <= 50) {
            strengthBar.className = 'h-full w-0 transition-all duration-500 bg-amber-400';
            strengthText.textContent = 'Strength: Fair';
        } else if (strength <= 75) {
            strengthBar.className = 'h-full w-0 transition-all duration-500 bg-blue-400';
            strengthText.textContent = 'Strength: Good';
        } else {
            strengthBar.className = 'h-full w-0 transition-all duration-500 bg-emerald-500';
            strengthText.textContent = 'Strength: Strong';
        }
    });

    // --- Submission ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const course = document.getElementById('reg-course').value;
        const password = passInput.value;
        const role = roleInput.value;

        const btn = document.getElementById('reg-submit-btn');
        const err = document.getElementById('reg-error');
        const originalContent = btn.innerHTML;

        btn.disabled = true;
        btn.innerHTML = renderLoadingSpinner('Initialising...');
        err.classList.add('hidden');

        try {
            const { role: userRole } = await registerUser(email, password, role, name, course);

            if (userRole === 'teacher') {
                app.innerHTML = `
                    <div class="flex items-center justify-center min-h-screen bg-premium-gradient px-4 py-8">
                        <div class="bg-white p-10 rounded-[50px] shadow-2xl shadow-blue-200/50 w-full max-w-md text-center animate-in fade-in zoom-in duration-500 border border-white">
                            <div class="w-20 h-20 bg-amber-400 rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-amber-100">
                                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <h1 class="text-3xl font-black text-gray-900 tracking-tight uppercase mb-4">Step 2: Authorization</h1>
                            <p class="text-gray-500 mb-8 text-sm font-medium leading-relaxed">
                                Your instructor account has been created, but requires <b>Authorization</b> by existing personnel before portal access.
                            </p>
                            <div class="bg-blue-50/50 p-6 rounded-[30px] border border-blue-100 mb-8">
                                <p class="text-[9px] font-black text-blue-800 uppercase tracking-widest leading-loose">
                                    Please inform your department head to approve your registry entry via their dashboard.
                                </p>
                            </div>
                            <a href="#login" class="inline-block w-full bg-blue-premium text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-200 hover:shadow-2xl transition-all">Return to Gateway</a>
                        </div>
                    </div>
                `;
            } else {
                app.innerHTML = `
                    <div class="flex items-center justify-center min-h-screen bg-premium-gradient px-4 py-8">
                        <div class="bg-white p-10 rounded-[50px] shadow-2xl shadow-blue-200/50 w-full max-w-md text-center animate-in fade-in zoom-in duration-500 border border-white">
                            <div class="w-20 h-20 bg-emerald-500 rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100">
                                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <h1 class="text-3xl font-black text-gray-900 tracking-tight uppercase mb-4">Account Ready</h1>
                            <p class="text-gray-500 mb-10 text-sm font-medium leading-relaxed">
                                Welcome aboard, <b>${name}</b>! Your Cognita registry entry has been successfully initialised.
                            </p>
                            <a href="#login" class="inline-block w-full bg-blue-premium text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-200 hover:shadow-2xl transition-all">Proceed to Gateway</a>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error(error);
            err.textContent = error.message.toUpperCase();
            err.classList.remove('hidden');
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    });
};
