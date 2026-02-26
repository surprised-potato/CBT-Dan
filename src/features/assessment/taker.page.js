import { submitTest, checkSubmission } from '../../services/submission.service.js';
import { getAssessment } from '../../services/assessment.service.js';
import { getUser } from '../../core/store.js';
import { renderButton } from '../../shared/button.js';
import { renderMCQ } from '../question-bank/types/mcq.js';
import { renderTrueFalse } from '../question-bank/types/true-false.js';
import { renderIdentification } from '../question-bank/types/identification.js';
import { renderMultiAnswer } from '../question-bank/types/multi-answer.js';
import { renderMatching } from '../question-bank/types/matching.js';
import { renderOrdering } from '../question-bank/types/ordering.js';

// Haversine formula to calculate distance between two lat/lng coordinates in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const rs = Math.PI / 180;
    const φ1 = lat1 * rs;
    const φ2 = lat2 * rs;
    const Δφ = (lat2 - lat1) * rs;
    const Δλ = (lon2 - lon1) * rs;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

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
        const { questions: rawQuestions, settings = { oneAtATime: false, randomizeOrder: false, shuffleChoices: false, timeLimit: 0, requireFullscreen: false, requireGeofence: false }, sections = [] } = assessment;
        const storageKey = `test_${assessmentId}_${user.user.uid}`;
        const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');

        // --- ANTI-CHEAT PRE-CHECKS ---
        if (!isTeacher && settings.requireGeofence) {
            app.innerHTML = `
                <div class="min-h-screen flex flex-col items-center justify-center p-6">
                    <div class="w-16 h-1 bg-blue-500 rounded-full animate-pulse mb-8"></div>
                    <p class="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] animate-pulse">Verifying Geospatial Permiter...</p>
                </div>
            `;

            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    });
                });

                const studentLat = position.coords.latitude;
                const studentLng = position.coords.longitude;
                const distance = calculateDistance(studentLat, studentLng, settings.geofenceLat, settings.geofenceLng);

                if (distance > settings.geofenceRadius) {
                    throw new Error(`Location outside authorized perimeter (Distance: ${Math.round(distance)}m > Allowed: ${settings.geofenceRadius}m)`);
                }
            } catch (err) {
                app.innerHTML = `
                    <div class="min-h-screen flex flex-col items-center justify-center p-6">
                        <div class="bg-white p-12 rounded-[50px] shadow-2xl shadow-blue-100 border border-white max-w-md w-full text-center">
                            <h2 class="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tight text-blue-600">Geospatial Lock</h2>
                            <p class="text-xs font-black text-gray-600 mb-10 uppercase tracking-widest leading-loose">Access Denied: ${err.message || 'Location access required'}</p>
                            <button onclick="window.location.hash='#student-dash'" class="w-full bg-blue-500 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em]">Return to Dashboard</button>
                        </div>
                    </div>
                `;
                return;
            }
        }

        let isFullscreenArmed = false;
        let isLockedOut = false;
        let unlockAttempts = 0;

        if (!isTeacher && settings.requireFullscreen) {
            app.innerHTML = `
                <div class="min-h-screen flex flex-col items-center justify-center p-6">
                    <div class="bg-white p-12 rounded-[50px] shadow-2xl shadow-red-100 border border-white max-w-md w-full text-center">
                        <div class="w-20 h-20 bg-red-50 rounded-[28px] flex items-center justify-center mx-auto mb-8">
                            <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        </div>
                        <h2 class="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight">STRICT LOCKOUT PROTOCOL</h2>
                        <p class="text-xs font-black text-red-500 mb-10 uppercase tracking-widest leading-loose">Leaving fullscreen or switching tabs will result in an immediate test lockout.</p>
                        <button id="enter-fs-btn" class="w-full bg-red-600 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all">Agree & Enter Fullscreen</button>
                    </div>
                </div>
            `;

            await new Promise(resolve => {
                document.getElementById('enter-fs-btn').onclick = async () => {
                    try {
                        await document.documentElement.requestFullscreen();
                        isFullscreenArmed = true;
                        resolve();
                    } catch (e) {
                        alert("Fullscreen required to proceed.");
                    }
                };
            });
        }
        // --- END ANTI-CHEAT PRE-CHECKS ---

        let questions = rawQuestions;
        let answers = saved.answers || {};
        let currentIdx = saved.lastIdx || 0;
        let elapsed = saved.elapsed || 0;

        // 1. Shuffling Logic (Persist order in session)
        if (settings.randomizeOrder) {
            if (saved.shuffledIds) {
                // Restore saved order
                questions = saved.shuffledIds.map(id => questions.find(q => q.id === id)).filter(Boolean);
            } else {
                // New shuffle
                questions = [...questions].sort(() => Math.random() - 0.5);
                saved.shuffledIds = questions.map(q => q.id);
                localStorage.setItem(storageKey, JSON.stringify({ ...saved, shuffledIds: saved.shuffledIds }));
            }
        }

        // 2. Choice Shuffling Logic (Persist order)
        if (settings.shuffleChoices) {
            questions.forEach(q => {
                if (q.type === 'MCQ' && q.choices) {
                    const choiceKey = `choices_${assessmentId}_${q.id}_${user.user.uid}`;
                    let order = JSON.parse(localStorage.getItem(choiceKey) || '[]');

                    if (order.length === q.choices.length) {
                        // Sort based on saved order
                        q.choices.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
                    } else {
                        // Shuffle and save
                        q.choices.sort(() => Math.random() - 0.5);
                        localStorage.setItem(choiceKey, JSON.stringify(q.choices.map(c => c.id)));
                    }
                }
            });
        }

        const renderHeader = () => {
            const progress = ((Object.keys(answers).length) / questions.length) * 100;

            // Timer Logic
            let timeDisplay = '--:--';
            if (settings.timeLimit && settings.timeLimit > 0) {
                const totalSeconds = settings.timeLimit * 60;
                const remaining = totalSeconds - elapsed;
                const m = Math.floor(remaining / 60);
                const s = Math.floor(remaining % 60);
                timeDisplay = `${m}:${s < 10 ? '0' : ''}${s}`;
            } else {
                const m = Math.floor(elapsed / 60);
                const s = Math.floor(elapsed % 60);
                timeDisplay = `${m}:${s < 10 ? '0' : ''}${s}`;
            }

            return `
                <header class="sticky top-0 z-50 glass-header border-b border-white backdrop-blur-xl p-6">
                    <div class="max-w-5xl mx-auto flex items-center justify-between">
                        <div class="flex flex-col">
                            <h1 class="text-xs font-black text-gray-900 uppercase tracking-[0.2em] mb-1">${assessment.title}</h1>
                            <div class="flex items-center gap-3">
                                <span class="text-[9px] font-black text-purple-600 uppercase tracking-widest">${questions.length} ITEM DATASET</span>
                                ${settings.oneAtATime ? `<span class="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-purple-100">Sequential Lock</span>` : ''}
                            </div>
                        </div>
                        
                        <div class="flex items-center gap-10">
                            <div class="hidden md:flex flex-col items-end gap-2">
                                <div class="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div id="progress-bar" class="h-full bg-purple-premium transition-all duration-500" style="width: ${progress}%"></div>
                                </div>
                                <span class="text-[8px] font-black text-gray-400 uppercase tracking-widest">TRANSMISSION PROGRESS: <span id="progress-text">${Math.round(progress)}</span>%</span>
                            </div>
                            
                            <div class="flex items-center gap-4 bg-gray-900 px-6 py-3 rounded-2xl shadow-xl shadow-gray-200">
                                <div class="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                                <span id="timer" class="text-lg font-black text-white font-mono tracking-tighter">${timeDisplay}</span>
                            </div>
                        </div>
                    </div>
                </header>
            `;
        };

        const renderNavigation = () => {
            if (!settings.oneAtATime) return '';
            return `
                <nav class="fixed bottom-0 left-0 right-0 p-8 glass-header border-t border-white backdrop-blur-xl z-50">
                    <div class="max-w-5xl mx-auto flex items-center justify-between gap-6">
                        <button id="prev-btn" class="flex-1 max-w-[120px] p-5 rounded-2xl border border-gray-100 font-black text-[10px] uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all disabled:opacity-30" ${currentIdx === 0 ? 'disabled' : ''}>PREVIOUS</button>
                        
                        <div class="hidden md:flex gap-2 flex-grow justify-center overflow-x-auto px-4 no-scrollbar">
                            ${questions.map((q, i) => `
                                <button data-jump="${i}" class="w-2.5 h-2.5 rounded-full transition-all ${i === currentIdx ? 'bg-purple-premium w-8' : (answers[q.id] ? 'bg-purple-200' : 'bg-gray-100')}"></button>
                            `).join('')}
                        </div>

                        ${currentIdx === questions.length - 1
                    ? `<button id="submit-trigger" class="flex-1 max-w-[200px] p-5 bg-purple-premium text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-200 hover:-translate-y-1 transition-all">FINALIZE SESSION</button>`
                    : `<button id="next-btn" class="flex-1 max-w-[120px] p-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:-translate-y-1 transition-all">NEXT STEP</button>`
                }
                    </div>
                </nav>
            `;
        };

        const renderQuestion = (q, index) => {
            const section = sections[q.sectionIdx || 0] || {};

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
                        </div>
                        ${content}
                    </div>
                </div>
            `;

            if (q.type === 'MCQ') return getQuestionUI(renderMCQ(q, index + 1, section));
            if (q.type === 'TRUE_FALSE') return getQuestionUI(renderTrueFalse(q, index + 1));
            if (q.type === 'IDENTIFICATION') return getQuestionUI(renderIdentification(q, index + 1));
            if (q.type === 'MULTI_ANSWER') return getQuestionUI(renderMultiAnswer(q, index + 1));
            if (q.type === 'MATCHING') return getQuestionUI(renderMatching(q, index + 1));
            if (q.type === 'ORDERING') return getQuestionUI(renderOrdering(q, index + 1));

            return `<div class="p-8 bg-red-50 text-red-500 rounded-3xl border border-red-100 uppercase font-black text-xs tracking-widest text-center">Telemetry Corruption: ${q.type}</div>`;
        };

        const updateUI = () => {
            app.innerHTML = `
                <div class="min-h-screen pb-32">
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

                <!-- Lockout Overlay -->
                <div id="lockout-overlay" class="hidden fixed inset-0 z-[100] bg-red-900/95 backdrop-blur-3xl flex-col items-center justify-center p-6">
                    <div class="bg-white p-12 rounded-[50px] shadow-2xl max-w-md w-full text-center">
                        <div class="w-20 h-20 bg-red-50 rounded-[28px] flex items-center justify-center mx-auto mb-8 border border-red-100">
                            <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                        <h2 class="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight text-red-600">ENVIRONMENT COMPROMISED</h2>
                        <p class="text-xs font-black text-gray-600 mb-8 uppercase tracking-widest leading-loose">You left the secure testing environment. Ask your Proctor to unlock.</p>
                        
                        <div class="space-y-4 mb-8">
                            <input type="password" id="proctor-auth" placeholder="Proctor Password" class="w-full p-5 text-center bg-gray-50 border border-gray-200 rounded-2xl font-black focus:border-red-500 outline-none">
                            <button id="unlock-btn" class="w-full bg-gray-900 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all hover:bg-black">Authorize Resume</button>
                        </div>
                        
                        <button id="force-submit-btn" class="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Or Force Submit Assessment Now</button>
                    </div>
                </div>
            `;

            // Re-hydrate answers
            Object.keys(answers).forEach(qId => {
                const val = answers[qId];
                if (Array.isArray(val)) {
                    // Multi-selection, Matching, or Ordering
                    val.forEach(v => {
                        if (typeof v === 'string') {
                            // Multi-choice or identification bank
                            const cb = document.querySelector(`input[name="q-${CSS.escape(qId)}"][value="${CSS.escape(v)}"]`);
                            if (cb) cb.checked = true;
                        }
                    });
                    // For Matching/Ordering with specific sub-names
                    const qObj = questions.find(item => item.id === qId);
                    if (qObj?.type === 'MATCHING') {
                        val.forEach((pairVal, i) => {
                            const sel = document.querySelector(`select[name="q-${CSS.escape(qId)}-pair-${i}"]`);
                            if (sel) sel.value = pairVal;
                        });
                    } else if (qObj?.type === 'ORDERING') {
                        // val is item text in student's intended order
                        // Reverse-map to numeric ranks for each shuffled item input
                        const shuffledItems = qObj.orderingItems || qObj.items || [];
                        shuffledItems.forEach((item, i) => {
                            const inp = document.querySelector(`input[name="q-${CSS.escape(qId)}-order-${i}"]`);
                            if (inp) {
                                const rank = val.indexOf(item);
                                inp.value = rank >= 0 ? rank + 1 : '';
                            }
                        });
                    }
                } else {
                    const selector = `input[name="q-${CSS.escape(qId)}"][value="${CSS.escape(val)}"]`;
                    try {
                        const radio = document.querySelector(selector);
                        if (radio) radio.checked = true;
                    } catch (e) { }

                    const input = document.querySelector(`input[name="q-${CSS.escape(qId)}"]`);
                    if (input && input.type !== 'radio') input.value = val;
                    const select = document.querySelector(`select[name="q-${CSS.escape(qId)}"]`);
                    if (select) select.value = val;
                }
            });

            // Unified Answer Collection
            const collectAnswers = () => {
                const formData = new FormData(form);
                const newAnswers = { ...answers };

                // Get all active questions in view
                const activeQs = settings.oneAtATime ? [questions[currentIdx]] : questions;

                activeQs.forEach(q => {
                    if (q.type === 'MCQ' || q.type === 'TRUE_FALSE' || q.type === 'IDENTIFICATION') {
                        const val = formData.get(`q-${q.id}`);
                        if (val !== null) newAnswers[q.id] = val;
                    } else if (q.type === 'MULTI_ANSWER') {
                        const vals = formData.getAll(`q-${q.id}`);
                        newAnswers[q.id] = vals; // Array
                    } else if (q.type === 'MATCHING') {
                        const matched = [];
                        const terms = q.matchingTerms || (q.pairs || []);
                        terms.forEach((_, i) => {
                            matched.push(formData.get(`q-${q.id}-pair-${i}`) || '');
                        });
                        newAnswers[q.id] = matched;
                    } else if (q.type === 'ORDERING') {
                        const items = q.orderingItems || (q.items || []);
                        // Build pairs of (item text, rank) and sort by rank
                        // so the stored answer is item text in the student's intended order
                        const pairs = items.map((item, i) => ({
                            item,
                            rank: parseInt(formData.get(`q-${q.id}-order-${i}`)) || 0
                        }));
                        // Only store if at least one rank was entered
                        if (pairs.some(p => p.rank > 0)) {
                            pairs.sort((a, b) => a.rank - b.rank);
                            newAnswers[q.id] = pairs.map(p => p.item);
                        }
                    }
                });

                answers = newAnswers;

                // Update UI Progress
                const progress = ((Object.keys(answers).length) / questions.length) * 100;
                const pBar = document.getElementById('progress-bar');
                const pText = document.getElementById('progress-text');
                if (pBar) pBar.style.width = `${progress}%`;
                if (pText) pText.textContent = Math.round(progress);

                localStorage.setItem(storageKey, JSON.stringify({
                    answers,
                    lastIdx: currentIdx,
                    elapsed,
                    shuffledIds: questions.map(q => q.id)
                }));
            };

            // Listeners
            const form = document.getElementById('assessment-form');
            form.onchange = collectAnswers;
            form.oninput = collectAnswers;

            if (settings.oneAtATime) {
                document.getElementById('prev-btn')?.addEventListener('click', () => {
                    collectAnswers();
                    if (currentIdx > 0) { currentIdx--; updateUI(); }
                });
                document.getElementById('next-btn')?.addEventListener('click', () => {
                    collectAnswers();
                    if (currentIdx < questions.length - 1) { currentIdx++; updateUI(); }
                });
                document.getElementById('submit-trigger')?.addEventListener('click', () => {
                    form.requestSubmit();
                });
                document.querySelectorAll('[data-jump]').forEach(btn => {
                    btn.onclick = () => { collectAnswers(); currentIdx = parseInt(btn.dataset.jump); updateUI(); };
                });
            }

            form.onsubmit = async (e) => {
                e.preventDefault();
                collectAnswers(); // Final pull

                const isAutoSubmit = window.sessionTimeExpired === true;
                if (!isAutoSubmit && !confirm("FINALISE TRANSMISSION PROTOCOL?")) return;

                const btn = document.getElementById('submit-btn') || document.getElementById('submit-trigger');
                btn.disabled = true;
                btn.textContent = 'TRANSMITTING...';

                try {
                    await submitTest(assessmentId, user.user.uid, answers, {
                        displayName: user.displayName,
                        email: user.email || user.user.email
                    }, {
                        unlockAttempts,
                        terminatedDueToCheating: false // It was a normal submit
                    });
                    localStorage.removeItem(storageKey);
                    if (user.role === 'teacher') {
                        window.location.hash = `#details?id=${assessmentId}`;
                    } else {
                        window.location.hash = '#student-dash';
                    }
                } catch (err) {
                    console.error(err);
                    alert("TRANSMISSION FAILURE: " + err.message);
                    btn.disabled = true;
                    btn.textContent = 'PROTOCOL ABORTED';
                }
            };
        };

        // Timer Logic
        let startTime = saved.startTime || (Date.now() - (saved.elapsed || 0) * 1000);
        if (!saved.startTime) {
            saved.startTime = startTime;
            localStorage.setItem(storageKey, JSON.stringify(saved));
        }

        const tick = () => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const timerEl = document.getElementById('timer');
            const progressEl = document.getElementById('progress-bar');

            if (settings.timeLimit && settings.timeLimit > 0) {
                // Countdown Mode
                const totalSeconds = settings.timeLimit * 60;
                const remaining = totalSeconds - elapsed;

                if (remaining <= 0) {
                    window.sessionTimeExpired = true;
                    const btn = document.getElementById('submit-btn') || document.getElementById('submit-trigger');

                    if (timerEl) {
                        timerEl.textContent = "00:00";
                        timerEl.classList.add('text-red-600', 'animate-pulse');
                    }
                    if (progressEl) progressEl.style.width = "0%";

                    if (btn && !btn.disabled) {
                        // Trigger auto-submit
                        const form = document.getElementById('assessment-form');
                        if (form) {
                            // Cloning the requestSubmit behavior manually if needed, or just calling handler
                            // Since we set the global flag, we can just trigger it
                            btn.click();
                        }
                    }
                    return;
                }

                const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
                const ss = String(remaining % 60).padStart(2, '0');

                if (timerEl) {
                    timerEl.textContent = `${mm}:${ss}`;
                }
            } else {
                // Count-up Mode (Default)
                const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
                const ss = String(elapsed % 60).padStart(2, '0');

                if (timerEl) timerEl.textContent = `${mm}:${ss}`;
            }
        };

        updateUI();
        setInterval(tick, 1000);
        tick();

        // --- ANTI-CHEAT WATCHERS ---
        const handleLockout = (reason) => {
            if (!isFullscreenArmed || isLockedOut || isTeacher) return;
            isLockedOut = true;
            document.getElementById('lockout-overlay').classList.remove('hidden');
            document.getElementById('lockout-overlay').classList.add('flex');
            console.warn("LOCKOUT TRIGGERED:", reason);
        };

        const handleResume = async () => {
            const pwdInput = document.getElementById('proctor-auth').value;
            if (pwdInput === settings.proctorPassword) {
                document.getElementById('proctor-auth').value = '';
                unlockAttempts++;
                isLockedOut = false;
                document.getElementById('lockout-overlay').classList.add('hidden');
                document.getElementById('lockout-overlay').classList.remove('flex');
                try {
                    await document.documentElement.requestFullscreen();
                } catch (e) { }
            } else {
                alert("INCORRECT PROCTOR OVERRIDE");
            }
        };

        const handleForceSubmit = async () => {
            const btn = document.getElementById('force-submit-btn');
            btn.textContent = "TRANSMITTING...";
            try {
                await submitTest(assessmentId, user.user.uid, answers, {
                    displayName: user.displayName,
                    email: user.email || user.user.email
                }, {
                    terminatedDueToCheating: true,
                    cheatingReason: "Force submitted during lockout",
                    unlockAttempts
                });
                localStorage.removeItem(storageKey);
                window.location.hash = '#student-dash';
                // Try to exit fullscreen if possible
                if (document.fullscreenElement) {
                    await document.exitFullscreen();
                }
            } catch (err) {
                alert("TRANSMISSION FAILURE: " + err.message);
                btn.textContent = "Or Force Submit Assessment Now";
            }
        };

        if (!isTeacher && settings.requireFullscreen) {
            document.addEventListener('fullscreenchange', () => {
                if (document.fullscreenElement === null) handleLockout("Exited Fullscreen");
            });
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') handleLockout("Switched Tabs/Background");
            });

            // Because UI is re-rendered, we must attach listeners to the body/document or dynamically
            // But since they are static overlays, we can attach when UI updates or globally delegate:
            document.addEventListener('click', (e) => {
                if (e.target.id === 'unlock-btn') handleResume();
                if (e.target.id === 'force-submit-btn') handleForceSubmit();
            });
        }

    } catch (error) {
        console.error(error);
        app.innerHTML = `<div class="p-20 text-center glass-panel rounded-[40px] font-black text-red-500 uppercase tracking-widest m-8">CRITICAL INTERFACE FAILURE: ${error.message}</div>`;
    }
};
