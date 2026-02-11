import { renderButton } from '../../shared/button.js';
import { renderInput } from '../../shared/input.js';
import { registerUser } from '../../services/auth.service.js';

export const RegisterPage = () => {
    const app = document.getElementById('app');

    app.innerHTML = `
        <div class="flex items-center justify-center min-h-screen px-4">
            <div class="bg-white p-10 rounded-[40px] shadow-2xl shadow-blue-200/50 w-full max-w-md animate-in fade-in zoom-in duration-500 relative overflow-hidden border border-white">
                <div class="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>

                <div class="text-center mb-10 relative z-10">
                     <div class="w-20 h-20 bg-blue-premium rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100">
                        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h1 class="text-3xl font-black text-gray-900 tracking-tight uppercase">Initialise Account</h1>
                    <p class="text-gray-600 mt-2 text-xs font-black uppercase tracking-[0.2em]">Personnel Enrolment</p>
                </div>
                
                <form id="register-form" class="space-y-5 relative z-10">
                    ${renderInput({ id: 'reg-name', label: 'Full Personnel Name', placeholder: 'e.g. Johnathan Doe', required: true })}
                    ${renderInput({ id: 'reg-email', type: 'email', label: 'Registry Email', placeholder: 'user@school.edu', required: true })}
                    ${renderInput({ id: 'reg-course', label: 'Primary Course / Department', placeholder: 'e.g. BSCS, Engineering', required: true })}
                    ${renderInput({ id: 'reg-pass', type: 'password', label: 'Operational Key', placeholder: '••••••••', required: true })}
                    
                    <div class="flex items-center gap-3 py-2 bg-gray-50 px-4 rounded-xl border border-gray-100">
                        <input type="checkbox" id="reg-is-teacher" class="w-5 h-5 text-blue-600 rounded-lg border-gray-300 focus:ring-blue-500">
                        <label for="reg-is-teacher" class="text-[10px] font-black text-gray-700 uppercase tracking-widest cursor-pointer">Register as Instructor</label>
                    </div>

                    <div id="reg-error" class="text-red-500 text-[10px] font-black uppercase tracking-widest hidden text-center bg-red-50 py-3 rounded-xl border border-red-100"></div>

                    <button type="submit" class="w-full bg-blue-premium text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-200 hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all">Create Registry Entry</button>
                </form>
                
                  <p class="mt-8 text-center text-[10px] font-black uppercase tracking-widest text-gray-600 relative z-10">
                    Existing Personnel? <a href="#login" class="text-blue-600 hover:underline ml-1">Access Gateway</a>
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
        btn.textContent = 'Initialising...';
        err.classList.add('hidden');

        try {
            const { role: userRole } = await registerUser(email, password, role, name, course);

            if (userRole === 'teacher') {
                app.innerHTML = `
                    <div class="flex items-center justify-center min-h-screen px-4">
                        <div class="bg-white p-10 rounded-[40px] shadow-2xl shadow-blue-200/50 w-full max-w-md text-center animate-in fade-in zoom-in duration-500 border border-white">
                            <div class="w-20 h-20 bg-yellow-400 rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-yellow-100">
                                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <h1 class="text-3xl font-black text-gray-900 tracking-tight uppercase mb-4">Step 2: Authorization</h1>
                            <p class="text-gray-600 mb-8 text-sm font-medium leading-relaxed">
                                Your instructor account has been created, but requires <b>Authorization</b> by existing personnel before you can access the Teacher Console.
                            </p>
                            <div class="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-8">
                                <p class="text-[10px] font-black text-blue-800 uppercase tracking-widest leading-loose">
                                    Please inform your department head or a senior instructor to approve your registry entry via their dashboard.
                                </p>
                            </div>
                            <a href="#login" class="inline-block w-full bg-blue-premium text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-200 hover:shadow-2xl transition-all">Return to Gateway</a>
                        </div>
                    </div>
                `;
            } else {
                alert('Account Initialised! Proceed to Gateway.');
                window.location.hash = '#login';
            }
        } catch (error) {
            console.error(error);
            err.textContent = error.message.toUpperCase();
            err.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Create Registry Entry';
        }
    });
};
