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
            <div class="w-16 h-1 bg-purple-premium rounded-full animate-pulse mb-8"></div>
            <p class="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] animate-pulse">Initialising Secure Session...</p>
        </div>
    `;

    try {
        const isTeacher = user.role === 'teacher';

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
                            <h2 class="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tight">Access Locked</h2>
                            <p class="text-xs font-black text-gray-600 mb-10 uppercase tracking-widest leading-loose">Telemetry has already been transmitted from this asset sector.</p>
                            <button onclick="window.location.hash='#student-dash'" class="w-full bg-purple-premium text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all">Return to Dashboard</button>
                        </div>
                    </div>
                `;
                return;
            }
        }

        const assessment = await getAssessment(assessmentId);
        const settings = assessment.settings || { oneAtATime: false, randomizeOrder: false };
        const storageKey = `session_${assessmentId}_${user.user.uid}`;
        const savedState = JSON.parse(localStorage.getItem(storageKey) || '{}');

        let questions = assessment.questions;
        let currentIdx = settings.oneAtATime ? (savedState.lastIdx || 0) : 0;
        const answers = savedState.answers || {};

        // 1. Shuffling Logic (Persist order in session)
        if (settings.randomizeOrder) {
            if (savedState.shuffledIds) {
                // Restore saved order
                questions = savedState.shuffledIds.map(id => questions.find(q => q.id === id)).filter(Boolean);
            } else {
                // New shuffle
                questions = [...questions].sort(() => Math.random() - 0.5);
                savedState.shuffledIds = questions.map(q => q.id);
                localStorage.setItem(storageKey, JSON.stringify({ ...savedState, shuffledIds: savedState.shuffledIds }));
            }
        }

        const renderHeader = () => `
            <header class="glass-panel sticky top-0 z-50 px-6 py-4 border-b border-white/20">
                <div class="max-w-4xl mx-auto flex justify-between items-center">
                    <div class="flex items-center gap-6">
                        ${isTeacher ? `<button onclick="window.location.hash='#details?id=${assessmentId}'" class="p-3 glass-panel rounded-xl text-purple-600 hover:text-purple-800 transition-all shadow-sm"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg></button>` : ''}
                        <div>
                            <h1 class="text-[9px] font-black text-purple-600 uppercase tracking-[0.4em] mb-1">Operational Interface</h1>
                            <p class="text-lg font-black text-gray-900 truncate max-w-[150px] md:max-w-md uppercase tracking-tight">${assessment.title}</p>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-4">
                        <div class="px-6 py-2 glass-panel rounded-2xl border border-purple-100/50 shadow-inner group">
                            <div id="timer" class="font-mono font-black text-purple-600 text-lg tracking-tighter">00:00</div>
                        </div>
                    </div>
                </div>
                <!-- Progress Bar -->
                <div class="absolute bottom-0 left-0 w-full h-[2px] bg-gray-100/50">
                    <div id="progress-bar" class="h-full bg-purple-premium transition-all duration-1000" style="width: 0%"></div>
                </div>
            </header>
        `;

        const renderNavigation = () => {
            if (!settings.oneAtATime) return '';
            const isLast = currentIdx === questions.length - 1;
            const isFirst = currentIdx === 0;

            return `
                <div class="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-white/20 z-50">
                    <div class="max-w-4xl mx-auto flex justify-between items-center gap-6">
                        <button id="prev-btn" class="flex-1 max-w-[140px] p-5 glass-panel rounded-2xl font-black text-[10px] uppercase tracking-widest text-purple-400 hover:text-purple-600 transition-all disabled:opacity-30 border border-transparent hover:border-purple-100" ${isFirst ? 'disabled' : ''}>Back</button>
                        
                        <div class="hidden md:flex gap-2 flex-grow justify-center overflow-x-auto px-4 no-scrollbar">
                            ${questions.map((q, i) => `
                                <button data-jump="${i}" class="w-2.5 h-2.5 rounded-full transition-all ${i === currentIdx ? 'bg-purple-premium w-8' : (answers[q.id] ? 'bg-purple-200' : 'bg-gray-100')}"></button>
                            `).join('')}
                        </div>
                        
                        <div class="flex flex-col items-center md:hidden">
                            <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">${currentIdx + 1} / ${questions.length}</span>
                        </div>

                        ${isLast
                    ? `<button id="submit-trigger" class="flex-1 max-w-[200px] bg-purple-premium text-white p-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl active:scale-95 transition-all">Transmit Telemetry</button>`
                    : `<button id="next-btn" class="flex-1 max-w-[140px] bg-white border border-purple-100 text-purple-600 p-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-sm hover:shadow-md active:scale-95 transition-all">Advance</button>`
                }
                    </div>
                </div>
            `;
        };

        const renderQuestion = (q, index) => {
            const getQuestionUI = (content) => `
                <div class="bg-white p-10 rounded-[50px] border border-white shadow-2xl shadow-purple-50/50 relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-purple-50/50 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div class="relative z-10">
                        <div class="flex items-center justify-between mb-8">
                            <div class="flex items-center gap-4">
                                <div class="w-8 h-8 bg-purple-premium rounded-xl flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-purple-100">
                                    ${index + 1}
                                </div>
                                <div class="w-12 h-1 bg-gray-100 rounded-full"></div>
                                <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Item Index ${index + 1} of ${questions.length}</span>
                            </div>
                            ${settings.oneAtATime ? `<span class="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-purple-100">Sequential Lock</span>` : ''}
                        </div>
                        ${content}
                    </div>
                </div>
            `;

            if (q.type === 'MCQ') return getQuestionUI(renderMCQ(q, index + 1));
            if (q.type === 'TRUE_FALSE') return getQuestionUI(renderTrueFalse(q, index + 1));
            if (q.type === 'IDENTIFICATION') return getQuestionUI(renderIdentification(q, index + 1));
            return `<div class="p-8 bg-red-50 text-red-500 rounded-3xl border border-red-100 uppercase font-black text-xs tracking-widest text-center">Telemetry Corruption: ${q.type}</div>`;
        };

        const updateUI = () => {
            app.innerHTML = `
                <div class="min-h-screen ${settings.oneAtATime ? 'pb-40' : 'pb-32'}">
                    ${renderHeader()}
                    <main class="max-w-3xl mx-auto p-4 mt-8">
                        <form id="assessment-form">
                            <div id="questions-container" class="space-y-10">
                                ${settings.oneAtATime
                    ? renderQuestion(questions[currentIdx], currentIdx)
                    : questions.map((q, i) => renderQuestion(q, i)).join('')
                }
                            </div>

                            ${!settings.oneAtATime ? `
                                <div class="mt-16 pt-12 border-t border-gray-100 flex flex-col items-center">
                                    <button type="submit" id="submit-btn" class="w-full max-w-md bg-purple-premium text-white p-6 rounded-3xl font-black uppercase text-sm tracking-[0.3em] shadow-2xl shadow-purple-200/50 hover:shadow-purple-300 hover:-translate-y-1 active:scale-[0.98] transition-all">Transmit Telemetry</button>
                                    <p class="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mt-8">Persistent sync active with cloud buffers</p>
                                </div>
                            ` : ''}
                        </form>
                    </main>
                    ${renderNavigation()}
                </div>
            `;

            // Re-hydrate answers
            Object.keys(answers).forEach(qId => {
                const val = answers[qId];
                const radio = document.querySelector(`input[name="q-${qId}"][value="${val}"]`);
                if (radio) radio.checked = true;
                const input = document.querySelector(`input[name="q-${qId}"]`);
                if (input) input.value = val;
            });

            // Listeners
            const form = document.getElementById('assessment-form');
            form.onchange = (e) => {
                if (e.target.name?.startsWith('q-')) {
                    const qId = e.target.name.replace('q-', '');
                    answers[qId] = e.target.value;
                    localStorage.setItem(storageKey, JSON.stringify({ ...JSON.parse(localStorage.getItem(storageKey) || '{}'), answers, lastIdx: currentIdx }));
                }
            };
            form.oninput = (e) => {
                if (e.target.type === 'text' && e.target.name?.startsWith('q-')) {
                    const qId = e.target.name.replace('q-', '');
                    answers[qId] = e.target.value;
                    localStorage.setItem(storageKey, JSON.stringify({ ...JSON.parse(localStorage.getItem(storageKey) || '{}'), answers, lastIdx: currentIdx }));
                }
            };

            if (settings.oneAtATime) {
                document.getElementById('prev-btn')?.addEventListener('click', () => {
                    if (currentIdx > 0) { currentIdx--; updateUI(); }
                });
                document.getElementById('next-btn')?.addEventListener('click', () => {
                    if (currentIdx < questions.length - 1) { currentIdx++; updateUI(); }
                });
                document.getElementById('submit-trigger')?.addEventListener('click', () => {
                    form.requestSubmit();
                });
                document.querySelectorAll('[data-jump]').forEach(btn => {
                    btn.onclick = () => { currentIdx = parseInt(btn.dataset.jump); updateUI(); };
                });
            }

            form.onsubmit = async (e) => {
                e.preventDefault();
                if (!confirm("FINALISE TRANSMISSION PROTOCOL?")) return;

                const btn = document.getElementById('submit-btn') || document.getElementById('submit-trigger');
                btn.disabled = true;
                btn.textContent = 'TRANSMITTING...';

                try {
                    await submitTest(assessmentId, user.user.uid, answers, {
                        displayName: user.displayName,
                        email: user.email || user.user.email
                    });
                    localStorage.removeItem(storageKey);
                    window.location.hash = '#student-dash';
                } catch (err) {
                    alert("TRANSMISSION FAILURE: " + err.message);
                    btn.disabled = false;
                    btn.textContent = 'RETRY TRANSMISSION';
                }
            };
        };

        // Timer Logic
        let startTime = savedState.startTime || Date.now();
        if (!savedState.startTime) {
            localStorage.setItem(storageKey, JSON.stringify({ ...savedState, startTime }));
        }

        const tick = () => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
            const ss = String(elapsed % 60).padStart(2, '0');
            const timerEl = document.getElementById('timer');
            const progressEl = document.getElementById('progress-bar');

            if (timerEl) timerEl.textContent = `${mm}:${ss}`;
            if (progressEl) {
                // For a progress bar that fills up over time (e.g. 60 mins max for visual effect, or just continuous)
                const maxTime = 3600; // 1 hour reference
                const perc = Math.min((elapsed / maxTime) * 100, 100);
                progressEl.style.width = `${perc}%`;
            }
        };

        updateUI();
        setInterval(tick, 1000);
        tick();

    } catch (error) {
        console.error(error);
        app.innerHTML = `<div class="p-20 text-center glass-panel rounded-[40px] font-black text-red-500 uppercase tracking-widest m-8">CRITICAL INTERFACE FAILURE: ${error.message}</div>`;
    }
};
