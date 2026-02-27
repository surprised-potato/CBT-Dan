import { renderButton } from '../../shared/button.js';
import { renderInput } from '../../shared/input.js';
import { registerUser } from '../../services/auth.service.js';
import { renderLoadingSpinner } from '../../shared/spinner.js';

export const RegisterPage = () => {
    const app = document.getElementById('app');

    app.innerHTML = `
        <div class="relative flex items-center justify-center min-h-screen px-4 py-12 overflow-hidden bg-[#020617]">
            <!-- Dynamic Mesh Background -->
            <div class="bg-premium-gradient"></div>
            <div class="mesh-blob top-[-10%] left-[-10%] bg-blue-600/10"></div>
            <div class="mesh-blob bottom-[-20%] right-[-10%] bg-indigo-600/10 animate-[mesh-float_25s_infinite_alternate]"></div>

            <!-- Glassmorphism Main Card -->
            <div class="glass-panel p-10 rounded-[60px] w-full max-w-md animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000 relative overflow-hidden ring-1 ring-white/10 shadow-[0_32px_120px_-15px_rgba(0,0,0,0.5)]">
                <!-- Inner Accent Glow -->
                <div class="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>

                <div class="text-center mb-10 relative z-10">
                    <div class="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-[0_15px_35px_rgba(37,99,235,0.3)] relative ring-1 ring-white/20">
                        <svg class="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h1 class="text-3xl font-black text-white tracking-tighter uppercase mb-2">Initialize</h1>
                    <p class="text-blue-400 text-[10px] font-black uppercase tracking-[0.5em] opacity-80">Join the Registry</p>
                </div>
                
                <form id="register-form" class="space-y-4 relative z-10">
                    <!-- Glass Segmented Role Picker -->
                    <div class="bg-white/5 p-1.5 rounded-[22px] flex relative mb-6 border border-white/5 backdrop-blur-md">
                        <button type="button" data-role="student" class="flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all z-10 text-white bg-white/10 shadow-lg rounded-[15px]" id="role-btn-student">Student</button>
                        <button type="button" data-role="teacher" class="flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all z-10 text-white/40" id="role-btn-teacher">Instructor</button>
                        <input type="hidden" id="reg-role" value="student">
                    </div>

                    ${renderInput({ id: 'reg-name', label: 'Personnel Name', placeholder: 'Jonathan Doe', required: true, classes: 'bg-white/5 border-white/5 text-white placeholder:text-white/20' })}
                    ${renderInput({ id: 'reg-email', type: 'email', label: 'Registry Liaison', placeholder: 'associate@cognita.io', required: true, classes: 'bg-white/5 border-white/5 text-white placeholder:text-white/20' })}
                    ${renderInput({ id: 'reg-course', label: 'Primary Domain', placeholder: 'e.g. Engineering', required: true, classes: 'bg-white/5 border-white/5 text-white placeholder:text-white/20' })}
                    
                    <div class="space-y-4">
                        ${renderInput({ id: 'reg-pass', type: 'password', label: 'Operational Key', placeholder: '••••••••', required: true, showToggle: true, classes: 'bg-white/5 border-white/5 text-white placeholder:text-white/20' })}
                        
                        <!-- Premium Strength Meter -->
                        <div id="strength-container" class="px-4 space-y-3 opacity-0 transition-opacity">
                            <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden backdrop-blur-sm">
                                <div id="strength-bar" class="h-full w-0 transition-all duration-700 shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div>
                            </div>
                            <p id="strength-text" class="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 text-right">Security Level: Low</p>
                        </div>
                    </div>

                    <div id="reg-error" class="text-red-400 text-[10px] font-black uppercase tracking-widest hidden text-center bg-red-500/10 py-4 px-6 rounded-2xl border border-red-500/20 backdrop-blur-md"></div>

                    <button type="submit" id="reg-submit-btn" class="w-full bg-blue-600 text-white p-6 rounded-[28px] font-black uppercase text-xs tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.5)] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/20 mt-4">
                        <span>Deploy Account</span>
                    </button>
                </form>
                
                <p class="mt-12 text-center text-[10px] font-black uppercase tracking-[0.3em] text-white/20 relative z-10 leading-loose">
                    Already Authenticated? <a href="#login" class="text-blue-400 hover:text-blue-300 transition-colors ml-2 underline underline-offset-8 decoration-blue-500/30">Portal Entry</a>
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
            studentBtn.classList.add('bg-white/10', 'shadow-lg', 'text-white', 'rounded-[15px]');
            studentBtn.classList.remove('text-white/40');
            teacherBtn.classList.remove('bg-white/10', 'shadow-lg', 'text-white', 'rounded-[15px]');
            teacherBtn.classList.add('text-white/40');
        } else {
            teacherBtn.classList.add('bg-white/10', 'shadow-lg', 'text-white', 'rounded-[15px]');
            teacherBtn.classList.remove('text-white/40');
            studentBtn.classList.remove('bg-white/10', 'shadow-lg', 'text-white', 'rounded-[15px]');
            studentBtn.classList.add('text-white/40');
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
            strengthBar.className = 'h-full transition-all duration-700 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]';
            strengthText.textContent = 'Security Level: Critical';
            strengthText.className = 'text-[9px] font-black uppercase tracking-[0.2em] text-red-400 text-right';
        } else if (strength <= 50) {
            strengthBar.className = 'h-full transition-all duration-700 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]';
            strengthText.textContent = 'Security Level: Moderate';
            strengthText.className = 'text-[9px] font-black uppercase tracking-[0.2em] text-amber-400 text-right';
        } else if (strength <= 75) {
            strengthBar.className = 'h-full transition-all duration-700 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]';
            strengthText.textContent = 'Security Level: High';
            strengthText.className = 'text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 text-right';
        } else {
            strengthBar.className = 'h-full transition-all duration-700 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
            strengthText.textContent = 'Security Level: Maximum';
            strengthText.className = 'text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400 text-right';
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
                    <div class="relative flex items-center justify-center min-h-screen px-4 py-8 overflow-hidden bg-[#020617]">
                        <div class="bg-premium-gradient"></div>
                        <div class="mesh-blob top-[-10%] right-[-10%] bg-blue-600/10"></div>
                        
                        <div class="glass-panel p-12 rounded-[60px] w-full max-w-md text-center animate-in fade-in zoom-in duration-1000 ring-1 ring-white/10 shadow-[0_32px_120px_-15px_rgba(0,0,0,0.5)]">
                            <div class="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-600 rounded-[35px] flex items-center justify-center mx-auto mb-10 shadow-[0_20px_50px_rgba(245,158,11,0.3)] relative">
                                <div class="absolute inset-0 bg-amber-400 rounded-[35px] animate-pulse opacity-20 blur-xl"></div>
                                <svg class="w-12 h-12 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <h1 class="text-3xl font-black text-white tracking-tighter uppercase mb-6">Credential Pending</h1>
                            <p class="text-slate-400 mb-10 text-sm font-medium leading-relaxed">
                                Your instructor account is initialized. Access to the **Cognita Domain** requires authorization from existing personnel.
                            </p>
                            <div class="bg-white/5 p-8 rounded-[40px] border border-white/5 mb-10 backdrop-blur-md">
                                <p class="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] leading-loose">
                                    Primary domain head must approve your registry entry before portal activation.
                                </p>
                            </div>
                            <a href="#login" class="inline-block w-full bg-blue-600 text-white p-6 rounded-[28px] font-black uppercase text-xs tracking-[0.3em] shadow-xl hover:-translate-y-1 transition-all border border-white/20">Return to Portal</a>
                        </div>
                    </div>
                `;
            } else {
                app.innerHTML = `
                    <div class="relative flex items-center justify-center min-h-screen px-4 py-8 overflow-hidden bg-[#020617]">
                        <div class="bg-premium-gradient"></div>
                        <div class="mesh-blob bottom-[-10%] left-[-10%] bg-emerald-600/10"></div>

                        <div class="glass-panel p-12 rounded-[60px] w-full max-w-md text-center animate-in fade-in zoom-in duration-1000 ring-1 ring-white/10 shadow-[0_32px_120px_-15px_rgba(0,0,0,0.5)]">
                            <div class="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-[35px] flex items-center justify-center mx-auto mb-10 shadow-[0_20px_50px_rgba(16,185,129,0.3)] relative">
                                <div class="absolute inset-0 bg-emerald-400 rounded-[35px] animate-pulse opacity-20 blur-xl"></div>
                                <svg class="w-12 h-12 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <h1 class="text-3xl font-black text-white tracking-tighter uppercase mb-6">Registry Ready</h1>
                            <p class="text-slate-400 mb-12 text-sm font-medium leading-relaxed">
                                Welcome, **${name}**. Your entry in the Cognita Registry is complete.
                            </p>
                            <a href="#login" class="inline-block w-full bg-blue-600 text-white p-6 rounded-[28px] font-black uppercase text-xs tracking-[0.3em] shadow-xl hover:-translate-y-1 transition-all border border-white/20">Access Portal</a>
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
