import { getAssessment } from '../../services/assessment.service.js';
import { loginUser, loginWithGoogle, registerUser } from '../../services/auth.service.js';
import { getUser, setUser } from '../../core/store.js';
import { checkSubmission, submitTest } from '../../services/submission.service.js';
import { renderLoadingSpinner } from '../../shared/spinner.js';
import { renderMCQ } from '../question-bank/types/mcq.js';
import { renderTrueFalse } from '../question-bank/types/true-false.js';
import { renderIdentification } from '../question-bank/types/identification.js';
import { renderMultiAnswer } from '../question-bank/types/multi-answer.js';
import { renderMatching } from '../question-bank/types/matching.js';
import { renderOrdering } from '../question-bank/types/ordering.js';
import { calculateDistance, requestGeolocation, getGeolocationErrorHelp, canRequestFullscreen, isIOS } from '../../core/utils.js';

export const ExamPage = async () => {
    const app = document.getElementById('app');
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const assessmentId = params.get('id');

    if (!assessmentId) {
        app.innerHTML = '<div class="p-20 text-center glass-panel rounded-[40px] font-black text-red-500 uppercase tracking-widest m-8">INVALID EXAM LINK — NO ASSESSMENT ID</div>';
        return;
    }

    const user = getUser();

    // If user is already logged in, go straight to the taker
    if (user) {
        return await _loadExam(app, assessmentId, user);
    }

    // ─── Inline Auth UI ───
    app.innerHTML = `
    <div class="relative flex items-center justify-center min-h-screen px-4 py-12 overflow-hidden bg-[#020617]">
        <!-- Dynamic Mesh Background -->
        <div class="bg-premium-gradient-fixed"></div>
        <div class="mesh-blob top-[-10%] left-[-10%] bg-purple-600/10"></div>
        <div class="mesh-blob bottom-[-20%] right-[-10%] bg-indigo-600/10 animate-[mesh-float_25s_infinite_alternate]"></div>

        <!-- Glassmorphism Main Card -->
        <div class="glass-panel p-10 rounded-[60px] w-full max-w-md animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000 relative overflow-hidden ring-1 ring-white/10 shadow-[0_32px_120px_-15px_rgba(0,0,0,0.5)]">
            <div class="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>

            <div class="text-center mb-8 relative z-10">
                <div class="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-[0_15px_35px_rgba(147,51,234,0.3)] relative ring-1 ring-white/20">
                    <svg class="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <h1 class="text-3xl font-black text-white tracking-tighter uppercase mb-2">Exam Access</h1>
                <p class="text-purple-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Sign in to begin</p>
            </div>

            <!-- Login Form -->
            <div id="auth-login-view" class="relative z-10">
                <form id="exam-login-form" class="space-y-4">
                    <div class="space-y-2">
                        <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] block ml-2">Email</label>
                        <input type="email" id="exam-email" placeholder="you@school.edu" required class="w-full p-5 bg-white/5 border border-white/10 rounded-[22px] text-white font-bold outline-none focus:border-purple-500/50 transition-colors placeholder:text-white/15">
                    </div>
                    <div class="space-y-2">
                        <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] block ml-2">Password</label>
                        <input type="password" id="exam-password" placeholder="••••••••" required class="w-full p-5 bg-white/5 border border-white/10 rounded-[22px] text-white font-bold outline-none focus:border-purple-500/50 transition-colors placeholder:text-white/15">
                    </div>

                    <div id="exam-login-error" class="text-red-400 text-[10px] font-black uppercase tracking-widest hidden text-center bg-red-500/10 py-4 px-6 rounded-2xl border border-red-500/20"></div>

                    <button type="submit" id="exam-login-btn" class="w-full bg-purple-600 text-white p-6 rounded-[28px] font-black uppercase text-xs tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(147,51,234,0.4)] hover:-translate-y-1 active:scale-95 transition-all border border-white/20 flex items-center justify-center gap-3">
                        <span>Sign In & Begin</span>
                    </button>
                </form>

                <div class="flex items-center gap-4 my-6">
                    <div class="h-px flex-1 bg-white/10"></div>
                    <span class="text-[9px] font-black text-white/20 uppercase tracking-widest">Or</span>
                    <div class="h-px flex-1 bg-white/10"></div>
                </div>

                <button id="exam-google-btn" class="w-full bg-white/5 border border-white/10 text-white p-5 rounded-[28px] font-black uppercase text-[10px] tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                    <svg class="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Sign in with Google
                </button>

                <p class="mt-8 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/20 leading-loose">
                    Don't have an account? <button id="show-register" class="text-purple-400 hover:text-purple-300 transition-colors ml-1 underline underline-offset-8 decoration-purple-500/30">Register</button>
                </p>
            </div>

            <!-- Register Form (hidden by default) -->
            <div id="auth-register-view" class="relative z-10 hidden">
                <form id="exam-register-form" class="space-y-4">
                    <div class="space-y-2">
                        <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] block ml-2">Full Name</label>
                        <input type="text" id="exam-reg-name" placeholder="Juan Dela Cruz" required class="w-full p-5 bg-white/5 border border-white/10 rounded-[22px] text-white font-bold outline-none focus:border-purple-500/50 transition-colors placeholder:text-white/15">
                    </div>
                    <div class="space-y-2">
                        <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] block ml-2">Email</label>
                        <input type="email" id="exam-reg-email" placeholder="you@school.edu" required class="w-full p-5 bg-white/5 border border-white/10 rounded-[22px] text-white font-bold outline-none focus:border-purple-500/50 transition-colors placeholder:text-white/15">
                    </div>
                    <div class="space-y-2">
                        <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] block ml-2">Course / Department</label>
                        <input type="text" id="exam-reg-course" placeholder="e.g. BSCS, Engineering" required class="w-full p-5 bg-white/5 border border-white/10 rounded-[22px] text-white font-bold outline-none focus:border-purple-500/50 transition-colors placeholder:text-white/15">
                    </div>
                    <div class="space-y-2">
                        <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] block ml-2">Password</label>
                        <input type="password" id="exam-reg-pass" placeholder="••••••••" required minlength="6" class="w-full p-5 bg-white/5 border border-white/10 rounded-[22px] text-white font-bold outline-none focus:border-purple-500/50 transition-colors placeholder:text-white/15">
                    </div>

                    <div id="exam-reg-error" class="text-red-400 text-[10px] font-black uppercase tracking-widest hidden text-center bg-red-500/10 py-4 px-6 rounded-2xl border border-red-500/20"></div>

                    <button type="submit" id="exam-reg-btn" class="w-full bg-purple-600 text-white p-6 rounded-[28px] font-black uppercase text-xs tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(147,51,234,0.4)] hover:-translate-y-1 active:scale-95 transition-all border border-white/20 flex items-center justify-center gap-3">
                        <span>Register & Begin</span>
                    </button>
                </form>

                <p class="mt-8 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/20 leading-loose">
                    Already have an account? <button id="show-login" class="text-purple-400 hover:text-purple-300 transition-colors ml-1 underline underline-offset-8 decoration-purple-500/30">Sign In</button>
                </p>
            </div>
        </div>
    </div>
    `;

    // ─── Auth View Switching ───
    document.getElementById('show-register').onclick = () => {
        document.getElementById('auth-login-view').classList.add('hidden');
        document.getElementById('auth-register-view').classList.remove('hidden');
    };
    document.getElementById('show-login').onclick = () => {
        document.getElementById('auth-register-view').classList.add('hidden');
        document.getElementById('auth-login-view').classList.remove('hidden');
    };

    // ─── Login Handler ───
    document.getElementById('exam-login-form').onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('exam-email').value;
        const password = document.getElementById('exam-password').value;
        const err = document.getElementById('exam-login-error');
        const btn = document.getElementById('exam-login-btn');
        const originalContent = btn.innerHTML;

        err.classList.add('hidden');
        btn.disabled = true;
        btn.innerHTML = renderLoadingSpinner('Signing in...');

        try {
            const userData = await loginUser(email, password);
            setUser(userData);
            await _loadExam(app, assessmentId, userData);
        } catch (error) {
            console.error('Exam login error:', error);
            err.textContent = _mapAuthError(error.code);
            err.classList.remove('hidden');
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    };

    // ─── Google Login Handler ───
    document.getElementById('exam-google-btn').onclick = async () => {
        const err = document.getElementById('exam-login-error');
        const btn = document.getElementById('exam-google-btn');
        const originalContent = btn.innerHTML;

        err.classList.add('hidden');
        btn.disabled = true;
        btn.innerHTML = renderLoadingSpinner('Connecting...', 'blue-600');

        try {
            const userData = await loginWithGoogle('student');
            setUser(userData);
            await _loadExam(app, assessmentId, userData);
        } catch (error) {
            console.error('Google login error:', error);
            err.textContent = 'Google Sign-In failed.';
            err.classList.remove('hidden');
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    };

    // ─── Register Handler ───
    document.getElementById('exam-register-form').onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('exam-reg-name').value;
        const email = document.getElementById('exam-reg-email').value;
        const course = document.getElementById('exam-reg-course').value;
        const password = document.getElementById('exam-reg-pass').value;
        const err = document.getElementById('exam-reg-error');
        const btn = document.getElementById('exam-reg-btn');
        const originalContent = btn.innerHTML;

        err.classList.add('hidden');
        btn.disabled = true;
        btn.innerHTML = renderLoadingSpinner('Creating account...');

        try {
            const result = await registerUser(email, password, 'student', name, course);
            // After registration, login to get the full user data
            const userData = await loginUser(email, password);
            setUser(userData);
            await _loadExam(app, assessmentId, userData);
        } catch (error) {
            console.error('Exam register error:', error);
            err.textContent = error.message.toUpperCase();
            err.classList.remove('hidden');
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    };
};

// ────────────────────────────────────────────────────
// _loadExam — Delegates to the full TakerPage logic inline
// This re-implements the TakerPage flow but is accessible
// from the #exam route without class-enrollment checks
// ────────────────────────────────────────────────────
const _loadExam = async (app, assessmentId, user) => {
    const isTeacher = user.role === 'teacher';

    app.innerHTML = `
        <div class="min-h-screen flex flex-col items-center justify-center">
            <div class="w-16 h-1 bg-purple-premium rounded-full animate-pulse mb-8"></div>
            <p class="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] animate-pulse">Initialising Exam Session...</p>
        </div>
    `;

    try {
        // Check if student already submitted
        if (!isTeacher) {
            const hasTaken = await checkSubmission(assessmentId, user.user.uid);
            if (hasTaken) {
                app.innerHTML = `
                    <div class="min-h-screen flex flex-col items-center justify-center p-6">
                        <div class="bg-white p-12 rounded-[50px] shadow-2xl shadow-purple-100 border border-white max-w-md w-full text-center relative overflow-hidden">
                            <div class="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
                            <div class="w-20 h-20 bg-green-50 rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-inner border border-green-100">
                                <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <h2 class="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tight">Already Submitted</h2>
                            <p class="text-xs font-black text-gray-600 mb-10 uppercase tracking-widest leading-loose">You have already completed this assessment.</p>
                            <button onclick="window.location.hash='#student-dash'" class="w-full bg-purple-premium text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all">Return to Dashboard</button>
                        </div>
                    </div>
                `;
                return;
            }
        }

        const assessment = await getAssessment(assessmentId);

        if (assessment.status !== 'active' && !isTeacher) {
            app.innerHTML = `
                <div class="min-h-screen flex flex-col items-center justify-center p-6">
                    <div class="bg-white p-12 rounded-[50px] shadow-2xl shadow-amber-100 border border-white max-w-md w-full text-center">
                        <div class="w-20 h-20 bg-amber-50 rounded-[28px] flex items-center justify-center mx-auto mb-8 border border-amber-100">
                            <svg class="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                        <h2 class="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">Exam Not Available</h2>
                        <p class="text-xs font-black text-gray-600 mb-10 uppercase tracking-widest leading-loose">This assessment is not currently active. Please contact your proctor.</p>
                        <button onclick="window.location.hash='#student-dash'" class="w-full bg-purple-premium text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl">Return to Dashboard</button>
                    </div>
                </div>
            `;
            return;
        }

        // ─── Redirect to the existing taker page with the same ID ───
        // The taker page already handles everything: anti-cheat, persistence, timers, etc.
        // We simply redirect to it now that the user is authenticated.
        window.location.hash = `#taker?id=${assessmentId}`;

    } catch (error) {
        console.error('Exam load error:', error);
        app.innerHTML = `<div class="p-20 text-center glass-panel rounded-[40px] font-black text-red-500 uppercase tracking-widest m-8">CRITICAL ERROR: ${error.message}</div>`;
    }
};

const _mapAuthError = (code) => {
    switch (code) {
        case 'auth/user-not-found': return "No account found with that email.";
        case 'auth/wrong-password': return "Incorrect password.";
        case 'auth/invalid-email': return "Please enter a valid email address.";
        case 'auth/too-many-requests': return "Too many attempts. Please wait.";
        case 'auth/network-request-failed': return "Network error. Check your connection.";
        case 'auth/user-disabled': return "This account has been disabled.";
        case 'auth/invalid-credential': return "Invalid credentials. Please try again.";
        default: return "Sign-in failed. Please try again.";
    }
};
