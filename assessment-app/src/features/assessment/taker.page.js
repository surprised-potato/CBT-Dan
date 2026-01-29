import { submitTest, checkSubmission } from '../../services/submission.service.js';
import { getAssessment } from '../../services/assessment.service.js';
import { getUser } from '../../core/store.js';
import { renderButton } from '../../shared/button.js';
import { renderMCQ } from '../question-bank/types/mcq.js';
import { renderTrueFalse } from '../question-bank/types/true-false.js';
import { renderIdentification } from '../question-bank/types/identification.js';

export const TakerPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();

    if (!user) {
        window.location.hash = '#login';
        return;
    }

    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const assessmentId = params.get('id');

    if (!assessmentId) {
        app.innerHTML = '<div class="p-20 text-center glass-panel rounded-[40px] font-black text-red-500 uppercase tracking-widest m-8">INVALID TELEMETRY LINK</div>';
        return;
    }

    app.innerHTML = `
        <div class="min-h-screen flex flex-col items-center justify-center">
            <div class="w-16 h-1 bg-blue-premium rounded-full animate-pulse mb-8"></div>
            <p class="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] animate-pulse">Initialising Secure Session...</p>
        </div>
    `;

    try {
        const isTeacher = user.role === 'teacher';

        if (!isTeacher) {
            const hasTaken = await checkSubmission(assessmentId, user.user.uid);
            if (hasTaken) {
                app.innerHTML = `
                    <div class="min-h-screen flex flex-col items-center justify-center p-6">
                        <div class="bg-white p-12 rounded-[50px] shadow-2xl shadow-blue-100 border border-white max-w-md w-full text-center relative overflow-hidden">
                             <div class="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
                            <div class="w-20 h-20 bg-green-50 rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-inner border border-green-100">
                                <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <h2 class="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tight">Access Locked</h2>
                            <p class="text-xs font-black text-gray-500 mb-10 uppercase tracking-widest leading-loose">Telemetry has already been transmitted from this asset sector.</p>
                            <button onclick="window.location.hash='#student-dash'" class="w-full bg-blue-premium text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all">Return to Dashboard</button>
                        </div>
                    </div>
                `;
                return;
            }
        }

        const assessment = await getAssessment(assessmentId);
        const storageKey = `session_${assessmentId}_${user.user.uid}`;
        const savedState = JSON.parse(localStorage.getItem(storageKey) || '{}');
        const answers = savedState.answers || {};

        app.innerHTML = `
            <div class="min-h-screen pb-32">
                <header class="glass-panel sticky top-0 z-50 px-6 py-6 border-b border-white/20">
                    <div class="max-w-4xl mx-auto flex justify-between items-center">
                        <div class="flex items-center gap-6">
                            ${user.role === 'teacher'
                ? `<button onclick="window.location.hash='#details?id=${assessmentId}'" class="p-3 glass-panel rounded-xl text-gray-500 hover:text-blue-600 transition-all shadow-sm">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                                   </button>`
                : ''
            }
                            <div>
                                <h1 class="text-[9px] font-black text-blue-600 uppercase tracking-[0.4em] mb-1">Operational Interface</h1>
                                <p class="text-lg font-black text-gray-900 truncate max-w-[200px] md:max-w-md uppercase tracking-tight">${assessment.title}</p>
                            </div>
                        </div>
                        <div class="px-6 py-3 glass-panel rounded-2xl border border-blue-100/50 shadow-inner">
                            <div id="timer" class="font-mono font-black text-blue-600 text-xl tracking-tighter">00:00</div>
                        </div>
                    </div>
                </header>

                <main class="max-w-4xl mx-auto p-4 mt-10">
                    <form id="assessment-form">
                        <div id="questions-container" class="space-y-10">
                            <!-- Questions Injected Here -->
                        </div>

                        <div class="mt-16 pt-12 border-t border-gray-100 flex flex-col items-center">
                            <button type="submit" id="submit-btn" class="w-full max-w-md bg-blue-premium text-white p-6 rounded-3xl font-black uppercase text-sm tracking-[0.3em] shadow-2xl shadow-blue-200/50 hover:shadow-blue-300 hover:-translate-y-1 active:scale-[0.98] transition-all">Transmit Telemetry</button>
                            <p class="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mt-8 animate-pulse">Auto-save sync active between local and cloud buffers</p>
                        </div>
                    </form>
                </main>
            </div>
        `;

        const container = document.getElementById('questions-container');

        container.innerHTML = assessment.questions.map((q, index) => {
            let html = '';
            // Wrap in premium container
            const getQuestionUI = (content) => `
                <div class="bg-white p-10 rounded-[50px] border border-white shadow-2xl shadow-blue-50/50 relative overflow-hidden group">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div class="relative z-10">
                        <div class="flex items-center gap-4 mb-8">
                            <div class="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center text-[10px] font-black text-gray-500 border border-gray-100 shadow-inner group-hover:bg-blue-premium group-hover:text-white transition-all">
                                ${index + 1}
                            </div>
                            <div class="w-12 h-1 bg-gray-100 rounded-full"></div>
                        </div>
                        ${content}
                    </div>
                </div>
            `;

            if (q.type === 'MCQ') html = getQuestionUI(renderMCQ(q, index + 1));
            else if (q.type === 'TRUE_FALSE') html = getQuestionUI(renderTrueFalse(q, index + 1));
            else if (q.type === 'IDENTIFICATION') html = getQuestionUI(renderIdentification(q, index + 1));
            else html = `<div class="p-8 bg-red-50 text-red-500 rounded-3xl border border-red-100 uppercase font-black text-xs tracking-widest text-center">Telemetry Corruption: ${q.type}</div>`;

            return html;
        }).join('');

        // Hydrate Answers
        Object.keys(answers).forEach(questionId => {
            const value = answers[questionId];
            const radio = document.querySelector(`input[name="q-${questionId}"][value="${value}"]`);
            if (radio) radio.checked = true;

            const input = document.querySelector(`input[name="q-${questionId}"]`);
            if (input) input.value = value;
        });

        const form = document.getElementById('assessment-form');
        const updateStorage = (qId, val) => {
            answers[qId] = val;
            localStorage.setItem(storageKey, JSON.stringify({
                answers,
                lastUpdated: new Date().toISOString()
            }));
        };

        form.addEventListener('change', (e) => {
            if (e.target.name && e.target.name.startsWith('q-')) {
                updateStorage(e.target.name.replace('q-', ''), e.target.value);
            }
        });

        form.addEventListener('input', (e) => {
            if (e.target.type === 'text' && e.target.name && e.target.name.startsWith('q-')) {
                updateStorage(e.target.name.replace('q-', ''), e.target.value);
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!confirm("FINALISE TRANSMISSION? This action will permanently lock your telemetry entry.")) return;

            const btn = document.getElementById('submit-btn');
            btn.disabled = true;
            btn.textContent = 'TRANSMITTING...';

            try {
                await submitTest(assessmentId, user.user.uid, answers, {
                    displayName: user.displayName,
                    email: user.email || user.user.email
                });

                localStorage.removeItem(storageKey);
                alert("TELEMETRY TRANSMISSION SUCCESSFUL");
                window.location.hash = '#student-dash';
            } catch (error) {
                console.error(error);
                alert("TRANSMISSION PROTOCOL FAILURE");
                btn.disabled = false;
                btn.textContent = 'TRANSMIT TELEMETRY';
            }
        });

    } catch (error) {
        console.error(error);
        app.innerHTML = `<div class="p-20 text-center glass-panel rounded-[40px] font-black text-red-500 uppercase tracking-widest m-8">CRITICAL INTERFACE FAILURE: ${error.message}</div>`;
    }
};
