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
import { calculateDistance, requestGeolocation, getGeolocationErrorHelp, canRequestFullscreen, isIOS } from '../../core/utils.js';

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

        // ── Geofence Check (hardened for iOS/Android) ──
        if (!isTeacher && settings.requireGeofence) {
            let geoPassed = false;
            while (!geoPassed) {
                app.innerHTML = `
                    <div class="min-h-screen flex flex-col items-center justify-center p-6">
                        <div class="w-16 h-1 bg-blue-500 rounded-full animate-pulse mb-8"></div>
                        <p class="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] animate-pulse">Verifying Geospatial Perimeter...</p>
                    </div>
                `;

                try {
                    let position;
                    try {
                        position = await requestGeolocation(true, 15000);
                    } catch (e1) {
                        // Retry with relaxed accuracy
                        position = await requestGeolocation(false, 20000);
                    }

                    const studentLat = position.coords.latitude;
                    const studentLng = position.coords.longitude;
                    const distance = calculateDistance(studentLat, studentLng, settings.geofenceLat, settings.geofenceLng);

                    if (distance > settings.geofenceRadius) {
                        throw { code: -1, message: `Location outside authorized perimeter (${Math.round(distance)}m > ${settings.geofenceRadius}m allowed)` };
                    }
                    geoPassed = true; // success
                } catch (err) {
                    const help = err.code === -1
                        ? { title: 'Outside Perimeter', message: err.message }
                        : getGeolocationErrorHelp(err);

                    const userAction = await new Promise(resolve => {
                        app.innerHTML = `
                            <div class="min-h-screen flex flex-col items-center justify-center p-6">
                                <div class="bg-white p-12 rounded-[50px] shadow-2xl shadow-blue-100 border border-white max-w-md w-full text-center">
                                    <div class="w-20 h-20 bg-amber-50 border border-amber-100 rounded-[28px] flex items-center justify-center mx-auto mb-6">
                                        <svg class="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    </div>
                                    <h2 class="text-2xl font-black text-amber-600 mb-4 uppercase tracking-tight">${help.title}</h2>
                                    <div class="text-[11px] font-bold text-gray-600 mb-8 leading-relaxed">${help.message}</div>
                                    
                                    <div class="space-y-3 mb-8">
                                        <button id="geo-retry-btn" class="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all">Retry Location</button>
                                        
                                        <div class="pt-6 border-t border-gray-100">
                                            <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Proctor Override</p>
                                            <input type="password" id="geo-override-pwd" placeholder="Enter Master Password" class="w-full p-4 text-center bg-gray-50 border border-gray-200 rounded-xl font-black text-gray-900 focus:border-blue-500 transition-all outline-none text-xs placeholder-gray-300 mb-2">
                                            <button id="geo-override-btn" class="w-full bg-gray-900 text-white p-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all">Bypass Restriction</button>
                                        </div>
                                    </div>

                                    <button id="geo-cancel-btn" class="w-full bg-gray-100 text-gray-600 p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Return to Dashboard</button>
                                </div>
                            </div>
                        `;
                        document.getElementById('geo-retry-btn').onclick = () => resolve('retry');
                        document.getElementById('geo-cancel-btn').onclick = () => resolve('cancel');
                        document.getElementById('geo-override-btn').onclick = () => {
                            const pwd = document.getElementById('geo-override-pwd').value;
                            if (pwd === (settings.unlockPassword || settings.proctorPassword)) {
                                resolve('override');
                            } else {
                                alert("Invalid Master Password");
                            }
                        };
                    });

                    if (userAction === 'cancel') {
                        window.location.hash = '#student-dash';
                        return;
                    }
                    if (userAction === 'override') {
                        geoPassed = true;
                    }
                    // Loop continues on retry
                }
            }
        }

        // ── Fullscreen Check (platform-aware with iOS fallback) ──
        let isFullscreenArmed = false;
        let isPseudoFullscreen = false;
        let isLockedOut = false;
        let unlockAttempts = 0;
        const hasNativeFullscreen = canRequestFullscreen();

        if (!isTeacher && settings.requireFullscreen) {
            if (hasNativeFullscreen) {
                // Desktop / Android: use native fullscreen
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
                            const el = document.documentElement;
                            await (el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen());
                            isFullscreenArmed = true;
                            resolve();
                        } catch (e) {
                            alert('Fullscreen required to proceed.');
                        }
                    };
                });
            } else {
                // iOS / unsupported: pseudo-fullscreen mode
                app.innerHTML = `
                    <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020617] bg-premium-gradient relative">
                        <!-- Animated Background Mesh -->
                        <div class="fixed inset-0 overflow-hidden pointer-events-none z-0">
                            <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/20 rounded-full blur-[120px] mix-blend-screen animate-blob"></div>
                            <div class="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[150px] mix-blend-screen animate-blob animation-delay-4000"></div>
                        </div>
                        
                        <div class="glass-panel bg-red-900/10 p-12 rounded-[50px] shadow-[0_0_50px_rgba(239,68,68,0.1)] border border-red-500/20 max-w-md w-full text-center relative z-10 backdrop-blur-xl">
                            <div class="w-20 h-20 bg-red-500/10 rounded-[28px] flex items-center justify-center mx-auto mb-8 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                                <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                            </div>
                            <h2 class="text-xl font-black text-white mb-4 uppercase tracking-tight drop-shadow-md">STRICT MODE</h2>
                            <p class="text-xs font-black text-red-400 mb-4 uppercase tracking-widest leading-loose drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]">Switching apps or tabs will trigger an immediate lockout.</p>
                            <p class="text-[10px] font-bold text-gray-400 mb-10 leading-relaxed">Your device does not support native fullscreen. The exam will run in strict mode — leaving this page will lock your session.</p>
                            <button id="enter-fs-btn" class="w-full bg-red-600/90 hover:bg-red-500 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:-translate-y-0.5 active:scale-95 transition-all border border-red-400/50">Agree & Begin Exam</button>
                        </div>
                    </div>
                `;

                await new Promise(resolve => {
                    document.getElementById('enter-fs-btn').onclick = () => {
                        isPseudoFullscreen = true;
                        isFullscreenArmed = true;
                        resolve();
                    };
                });
            }
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
                <header class="sticky top-0 z-50 glass-header border-b border-white/10 bg-black/40 backdrop-blur-xl p-4 md:p-6 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                    <div class="max-w-5xl mx-auto flex items-center justify-between">
                        <div class="flex flex-col">
                            <h1 class="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 uppercase tracking-[0.2em] mb-1 truncate max-w-[150px] md:max-w-full">${assessment.title}</h1>
                            <div class="flex items-center gap-3 mt-1">
                                <span class="text-[9px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">${questions.length} ITEM DATASET</span>
                                ${settings.oneAtATime ? `<span class="hidden md:inline-block px-3 py-1 bg-indigo-500/10 text-indigo-300 rounded-full text-[8px] font-black uppercase tracking-widest border border-indigo-500/20">Sequential Lock</span>` : ''}
                            </div>
                        </div>
                        
                        <div class="flex items-center gap-4 md:gap-10">
                            <div class="hidden md:flex flex-col items-end gap-2">
                                <div class="w-48 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                    <div id="progress-bar" class="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-500 shadow-[0_0_10px_rgba(147,51,234,0.5)]" style="width: ${progress}%"></div>
                                </div>
                                <span class="text-[8px] font-black text-gray-400 uppercase tracking-widest">TRANSMISSION PROGRESS: <span id="progress-text" class="text-purple-300">${Math.round(progress)}</span>%</span>
                            </div>
                            
                            <div class="flex items-center gap-3 md:gap-4 bg-black/40 border border-white/10 px-4 py-2 md:px-6 md:py-3 rounded-2xl shadow-inner backdrop-blur-md">
                                <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse box-shadow-glow"></div>
                                <span id="timer" class="text-base md:text-lg font-black text-white font-mono tracking-tighter drop-shadow-md">${timeDisplay}</span>
                            </div>
                        </div>
                    </div>
                </header>
            `;
        };

        const renderNavigation = () => {
            if (!settings.oneAtATime) return '';
            return `
                <nav class="fixed bottom-0 left-0 right-0 p-4 md:p-8 glass-header border-t border-white/10 bg-black/60 backdrop-blur-2xl z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                    <div class="max-w-5xl mx-auto flex items-center justify-between gap-3 md:gap-6">
                        <button id="prev-btn" class="flex-1 max-w-[100px] md:max-w-[120px] p-4 md:p-5 rounded-2xl border border-white/10 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-gray-400 hover:bg-white/5 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent" ${currentIdx === 0 ? 'disabled' : ''}>PREVIOUS</button>

                        <div class="hidden md:flex gap-2 flex-grow justify-center overflow-x-auto px-4 no-scrollbar">
                            ${questions.map((q, i) => `
                                <button data-jump="${i}" class="w-2.5 h-2.5 rounded-full transition-all ${i === currentIdx ? 'bg-purple-500 w-8 shadow-[0_0_10px_rgba(168,85,247,0.8)]' : (answers[q.id] ? 'bg-white/30' : 'bg-white/10')}"></button>
                            `).join('')}
                        </div>
                        <div class="md:hidden flex-grow text-center">
                            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">${currentIdx + 1} OF ${questions.length}</span>
                        </div>

                        ${currentIdx === questions.length - 1
                    ? `<button id="submit-trigger" class="flex-1 max-w-[160px] md:max-w-[200px] p-4 md:p-5 bg-purple-600 text-white rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:bg-purple-500 hover:-translate-y-1 transition-all border border-purple-400">FINALIZE SESSION</button>`
                    : `<button id="next-btn" class="flex-1 max-w-[100px] md:max-w-[120px] p-4 md:p-5 bg-white/10 text-white rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-white/20 border border-white/20 hover:-translate-y-1 transition-all shadow-sm">NEXT STEP</button>`
                }
                    </div>
                </nav>
            `;
        };

        const renderQuestion = (q, index) => {
            const section = sections[q.sectionIdx || 0] || {};

            const getQuestionUI = (content) => `
                <div class="glass-panel bg-white/5 p-6 md:p-10 rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4 duration-500 backdrop-blur-lg">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity mix-blend-screen pointer-events-none"></div>
                    <div class="relative z-10">
                        <div class="flex items-center justify-between mb-8">
                            <div class="flex items-center gap-4">
                                <div class="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center text-[10px] font-black text-white shadow-[0_0_15px_rgba(147,51,234,0.5)] border border-purple-400">
                                    ${index + 1}
                                </div>
                                <div class="w-12 h-1 bg-white/10 rounded-full"></div>
                                <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest hidden md:inline">Item Index ${index + 1} of ${questions.length}</span>
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

            return `< div class="p-8 bg-red-50 text-red-500 rounded-3xl border border-red-100 uppercase font-black text-xs tracking-widest text-center" > Telemetry Corruption: ${q.type}</div > `;
        };

        const updateUI = () => {
            app.innerHTML = `
    < div class="min-h-screen pb-40 bg-[#020617] bg-premium-gradient relative" >
                    < !--Animated Background Mesh for the whole taker area-- >
    <div class="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/40 rounded-full blur-[120px] mix-blend-screen animate-blob"></div>
        <div class="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/30 rounded-full blur-[150px] mix-blend-screen animate-blob animation-delay-4000"></div>
    </div>

                    ${renderHeader()}
<main class="max-w-3xl mx-auto p-4 md:p-6 mt-4 md:mt-8 relative z-10 w-full">
    <form id="assessment-form">
        <div id="questions-container" class="space-y-8 md:space-y-10">
            ${settings.oneAtATime
                    ? renderQuestion(questions[currentIdx], currentIdx)
                    : questions.map((q, i) => renderQuestion(q, i)).join('')
                }
        </div>

        ${!settings.oneAtATime ? `
                                <div class="mt-16 pt-12 border-t border-white/10 flex flex-col items-center">
                                    <button type="submit" id="submit-btn" class="w-full max-w-md bg-purple-600 text-white p-6 rounded-3xl font-black uppercase text-sm tracking-[0.3em] shadow-[0_0_30px_rgba(147,51,234,0.4)] hover:shadow-[0_0_40px_rgba(147,51,234,0.6)] hover:bg-purple-500 hover:-translate-y-1 active:scale-[0.98] transition-all border border-purple-400">Transmit Telemetry</button>
                                    <p class="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mt-8 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-green-500 animate-pulse box-shadow-glow"></span> Persistent sync active with cloud buffers</p>
                                </div>
                            ` : ''}
    </form>
</main>
                    ${renderNavigation()}
                </div >

                < !--Lockout Overlay-- >
    <div id="lockout-overlay" class="hidden fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl flex-col items-center justify-center p-6">
        <div class="glass-panel bg-red-900/20 p-8 md:p-12 rounded-[50px] shadow-[0_0_100px_rgba(239,68,68,0.2)] border border-red-500/30 max-w-md w-full text-center relative overflow-hidden">
            <div class="absolute inset-0 bg-red-500/5 pulse-bg z-0 pointer-events-none"></div>
            <div class="relative z-10">
                <div class="w-20 h-20 bg-red-500/20 rounded-[28px] flex items-center justify-center mx-auto mb-8 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                    <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <h2 class="text-2xl font-black mb-4 uppercase tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">ENVIRONMENT COMPROMISED</h2>
                <p class="text-[11px] md:text-xs font-black text-red-300 mb-8 uppercase tracking-widest leading-loose">You left the secure testing environment. Ask your Proctor to unlock.</p>

                <div class="space-y-4 mb-8">
                    <input type="password" id="proctor-auth" placeholder="Master Proctor Password" class="w-full p-5 text-center bg-black/50 border border-white/10 rounded-2xl font-black text-white focus:border-red-500 focus:bg-black/80 transition-all outline-none placeholder-gray-600">
                        <button id="unlock-btn" class="w-full bg-white/10 text-white border border-white/20 p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all hover:bg-white/20 hover:border-white/30 shadow-lg">Authorize Resume</button>
                </div>

                <button id="force-submit-btn" class="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-300 hover:underline transition-colors p-2">Or Force Submit Assessment Now</button>
            </div>
        </div>
    </div>
`;

            // Re-hydrate answers
            Object.keys(answers).forEach(qId => {
                let val = answers[qId];
                const qObj = questions.find(item => item.id === qId);
                if (!qObj) return;

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
                    if (qObj.type === 'MATCHING') {
                        val.forEach((pairVal, i) => {
                            const sel = document.querySelector(`select[name="q-${CSS.escape(qId)}-pair-${i}"]`);
                            if (sel) sel.value = pairVal;
                        });
                    } else if (qObj.type === 'ORDERING') {
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
                    // Handle Boolean for T/F or String for MCQ/ID
                    const stringVal = String(val);
                    const selector = `input[name="q-${CSS.escape(qId)}"][value="${CSS.escape(stringVal)}"]`;
                    try {
                        const radio = document.querySelector(selector);
                        if (radio) {
                            radio.checked = true;
                        } else {
                            // Fallback for ID text inputs
                            const input = document.querySelector(`input[name="q-${CSS.escape(qId)}"]`);
                            if (input && input.type !== 'radio' && input.type !== 'checkbox') {
                                input.value = val;
                            }
                            const select = document.querySelector(`select[name="q-${CSS.escape(qId)}"]`);
                            if (select) select.value = val;
                        }
                    } catch (e) {
                        console.error("Hydration error for", qId, e);
                    }
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
                if (pBar) pBar.style.width = `${progress}% `;
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

                    // Show success overlay
                    const successOverlay = document.createElement('div');
                    successOverlay.className = 'fixed inset-0 z-[200] bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-500';
                    successOverlay.innerHTML = `
                <div class="glass-panel bg-green-900/20 p-12 rounded-[50px] shadow-[0_0_100px_rgba(34,197,94,0.2)] border border-green-500/30 max-w-md w-full text-center relative overflow-hidden animate-in zoom-in-95 duration-500">
                    <div class="absolute inset-0 bg-green-500/5 pulse-bg z-0 pointer-events-none"></div>
                    <div class="relative z-10">
                        <div class="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/40 shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                            <svg class="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h2 class="text-2xl md:text-3xl font-black text-white mb-4 uppercase tracking-tight drop-shadow-[0_0_10px_rgba(34,197,94,0.6)]">Transmitted</h2>
                        <p class="text-[11px] md:text-sm font-black text-green-300 mb-8 uppercase tracking-[0.2em] leading-loose">Telemetry successfully synchronized with master node. Please wait for official assessment results.</p>
                        <div class="w-full bg-black/40 h-2 rounded-full overflow-hidden mt-4">
                            <div class="bg-green-500 h-full animate-[progress_3s_ease-in-out_forwards]"></div>
                        </div>
                    </div>
                </div>
                <style>
                    @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
                </style>
            `;
                    document.body.appendChild(successOverlay);

                    // Wait 3 seconds, then exit fullscreen and redirect
                    setTimeout(async () => {
                        if (document.fullscreenElement) {
                            try { await document.exitFullscreen(); } catch (e) { }
                        }
                        successOverlay.style.opacity = '0';

                        setTimeout(() => {
                            successOverlay.remove();
                            if (user.role === 'teacher') {
                                window.location.hash = `#details?id=${assessmentId}`;
                            } else {
                                window.location.hash = '#student-dash';
                            }
                        }, 500);
                    }, 3000);

                } catch (err) {
                    console.error(err);
                    alert("TRANSMISSION FAILURE: " + err.message);
                    if (btn) {
                        btn.disabled = false;
                        btn.textContent = 'RETRY TRANSMISSION';
                    }
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
            const targetPwd = settings.unlockPassword || settings.proctorPassword;
            if (pwdInput === targetPwd) {
                document.getElementById('proctor-auth').value = '';
                unlockAttempts++;
                isLockedOut = false;
                document.getElementById('lockout-overlay').classList.add('hidden');
                document.getElementById('lockout-overlay').classList.remove('flex');
                // Only re-enter native fullscreen if supported
                if (hasNativeFullscreen && !isPseudoFullscreen) {
                    try {
                        const el = document.documentElement;
                        await (el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen());
                    } catch (e) { }
                }
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
                    cheatingReason: isPseudoFullscreen ? "Force submitted during strict mode lockout" : "Force submitted during lockout",
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
            if (hasNativeFullscreen && !isPseudoFullscreen) {
                // Native fullscreen: watch both fullscreen exit and tab switch
                document.addEventListener('fullscreenchange', () => {
                    if (document.fullscreenElement === null) handleLockout("Exited Fullscreen");
                });
            }
            // Visibility API: works on both native and pseudo-fullscreen (including iOS Safari)
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') handleLockout("Switched Tabs/Background");
            });

            // Focus/Blur API: catches notification center / control center pull-downs on mobile
            window.addEventListener('blur', () => {
                handleLockout("Lost Window Focus");
            });

            // Pagehide: Final fallback for app switching
            window.addEventListener('pagehide', () => {
                handleLockout("Backgrounded Assessment");
            });

            // Context Menu Block: Prevents lookups/system menus during exam
            document.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                return false;
            });

            // Delegated click listeners for lockout overlay buttons
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
