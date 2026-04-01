import { db } from '../../core/config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getUser } from '../../core/store.js';
import { calculateStudentTopicPerformance } from '../../services/analytics.service.js';
import { checkCorrectness, formatAnswer } from '../../services/grading.service.js';

export const ResultsPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();

    if (!user) {
        window.location.hash = '#login';
        return;
    }

    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const submissionId = params.get('id');

    if (!submissionId) {
        app.innerHTML = '<div class="p-20 text-center glass-panel rounded-[40px] font-black text-red-500 uppercase tracking-widest m-8">INVALID TELEMETRY ID</div>';
        return;
    }

    app.innerHTML = `
        <div class="min-h-screen flex flex-col items-center justify-center">
            <div class="w-16 h-1 bg-blue-600 rounded-full animate-pulse mb-8"></div>
            <p class="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] animate-pulse">Retrieving Performance Analysis...</p>
        </div>
    `;

    try {
        // 1. Fetch Submission
        const subSnap = await getDoc(doc(db, 'submissions', submissionId));
        if (!subSnap.exists()) throw new Error("Analysis not found");
        const submission = subSnap.data();

        // 2. Fetch Assessment Content and Keys
        const [contentSnap, keySnap] = await Promise.all([
            getDoc(doc(db, 'assessment_content', submission.assessmentId)),
            getDoc(doc(db, 'assessment_keys', submission.assessmentId))
        ]);

        const assessment = contentSnap.data();
        const keys = keySnap.data().answers;
        const studentAnswers = submission.answers || {};

        const percentage = Math.round((submission.score / submission.totalPoints) * 100);

        // 3. Topic Analysis
        const topicStats = calculateStudentTopicPerformance(submission, assessment, keys);

        app.innerHTML = `
            <div class="min-h-screen pb-24 bg-[#020617] relative">
                <!-- Dynamic Mesh Background -->
                <div class="bg-premium-gradient-fixed"></div>
                <div class="mesh-blob top-[-10%] left-[-10%] bg-blue-600/10 scale-150"></div>
                <div class="mesh-blob bottom-[-20%] right-[-10%] bg-indigo-500/10"></div>

                <header class="sticky top-0 z-50 glass-header border-b border-white/10 backdrop-blur-xl p-6 md:p-8 relative">
                    <div class="max-w-4xl mx-auto flex items-center justify-between gap-4">
                        <div class="flex items-center gap-4 md:gap-6 min-w-0">
                            <button onclick="window.location.hash='#student-dash'" class="p-3 md:p-4 bg-white/5 rounded-2xl border border-white/10 text-white/40 hover:text-blue-400 transition-all shadow-lg active:scale-90">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            </button>
                            <div class="min-w-0">
                                <h1 class="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-1 md:mb-2 truncate">Performance Diagnostic</h1>
                                <p class="text-xl md:text-2xl font-black text-white uppercase tracking-tight truncate">${assessment.title}</p>
                            </div>
                        </div>

                        <div class="flex items-center gap-4 md:gap-6 shrink-0">
                            <div class="text-right hidden sm:block">
                                <p class="text-3xl md:text-4xl font-black text-white tracking-tighter">${submission.score}<span class="text-white/20 mx-1 md:mx-2 text-xl">/</span>${submission.totalPoints}</p>
                                <span class="text-[9px] font-black text-white/40 uppercase tracking-widest">${percentage}% EFFICIENCY</span>
                            </div>
                            <div class="w-12 h-12 md:w-16 md:h-16 rounded-[22px] md:rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 border border-white/20">
                                <svg class="w-7 h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                        </div>
                    </div>
                </header>

                <main class="max-w-3xl mx-auto p-4 mt-8 space-y-8 md:space-y-12 relative z-10">
                    
                    ${submission.terminatedDueToCheating || submission.unlockAttempts > 0 ? `
                        <div class="bg-red-500/10 p-6 rounded-[32px] border border-red-500/20 flex items-start gap-4 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                             <div class="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-400 flex-shrink-0 border border-red-500/20">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                             </div>
                             <div>
                                 <h3 class="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] mb-1">Integrity Protocol Flag</h3>
                                 <p class="text-[11px] font-bold text-red-300/60 tracking-widest leading-relaxed uppercase">
                                    ${submission.terminatedDueToCheating ? `FORCE SUBMITTED: ${submission.cheatingReason || 'Environment compromised.'}` : ''}
                                    ${submission.terminatedDueToCheating && submission.unlockAttempts > 0 ? '<br>' : ''}
                                    ${submission.unlockAttempts > 0 ? `PROCTOR UNLOCKS: ${submission.unlockAttempts} (Student left secure environment)` : ''}
                                 </p>
                             </div>
                        </div>
                    ` : ''}

                    <!-- Topic Breakdown -->
                    <div class="glass-panel p-8 md:p-10 rounded-[40px] border border-white/10 shadow-2xl">
                        <div class="flex items-center gap-4 mb-8">
                            <div class="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-inner">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                            </div>
                            <h3 class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Knowledge Domain Breakdown</h3>
                        </div>

                        <div class="space-y-6">
                            ${topicStats.map(stat => `
                                <div>
                                    <div class="flex justify-between items-end mb-3">
                                        <span class="text-[10px] font-black text-white uppercase tracking-tight">${stat.topic}</span>
                                        <span class="text-[10px] font-black text-white/40 uppercase tracking-widest">${stat.earned}/${stat.total} (${stat.percentage}%)</span>
                                    </div>
                                    <div class="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                                        <div class="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(37,99,235,0.5)]" style="width: ${stat.percentage}%"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    ${assessment.questions.map((q, i) => {
                const studentAns = studentAnswers[q.id];
                const keyAns = keys[q.id];
                const isCorrect = checkCorrectness(q, studentAns, keyAns);

                return `
                            <div class="glass-panel p-8 md:p-10 rounded-[50px] border border-white/10 shadow-2xl relative overflow-hidden group">
                                <div class="absolute top-0 right-0 w-48 h-48 ${isCorrect ? 'bg-green-500/5' : 'bg-red-500/5'} rounded-full -mr-24 -mt-24 blur-3xl opacity-50 transition-opacity"></div>
                                
                                <div class="relative z-10">
                                    <div class="flex items-center justify-between mb-8">
                                        <div class="flex items-center gap-4">
                                            <div class="w-8 h-8 ${isCorrect ? 'bg-green-600 shadow-green-500/20' : 'bg-red-600 shadow-red-500/20'} rounded-xl flex items-center justify-center text-[10px] font-black text-white shadow-lg border border-white/10">
                                                ${i + 1}
                                            </div>
                                            <div class="w-12 h-1 bg-white/10 rounded-full"></div>
                                            <span class="text-[9px] font-black text-white/40 uppercase tracking-widest">${isCorrect ? 'VALID' : 'INVALID'} TELEMETRY</span>
                                        </div>
                                        <span class="px-4 py-1.5 ${isCorrect ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'} rounded-full text-[9px] font-black uppercase tracking-widest border">
                                            ${isCorrect ? '+ ' + (q.sectionPoints !== undefined ? q.sectionPoints : (q.points !== undefined ? q.points : 1)) : '0'} PTS
                                        </span>
                                    </div>

                                    <div class="space-y-6">
                                        <div class="text-xl md:text-2xl font-black text-white leading-tight uppercase tracking-tight">
                                            ${q.text}
                                        </div>

                                        ${(q.figures || []).map(f => `<img src="${f}" class="w-full rounded-[32px] border-4 border-white/5 shadow-2xl opacity-90 hover:opacity-100 transition-opacity">`).join('')}

                                        <div class="grid grid-cols-1 gap-4 pt-4">
                                            <div class="p-6 rounded-[32px] ${isCorrect ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'} border flex flex-col gap-3">
                                                <span class="text-[8px] font-black ${isCorrect ? 'text-green-400' : 'text-red-400'} uppercase tracking-[0.2em]">User Transmission:</span>
                                                <div class="text-sm font-black ${isCorrect ? 'text-green-50' : 'text-red-50'} uppercase leading-relaxed">
                                                    ${formatAnswer(q, studentAns)}
                                                </div>
                                            </div>

                                            ${!isCorrect ? `
                                                <div class="p-6 rounded-[32px] bg-white/5 border border-white/10 flex flex-col gap-3">
                                                    <span class="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Reference Protocol:</span>
                                                    <div class="text-sm font-black text-white/80 uppercase leading-relaxed">
                                                        ${formatAnswer(q, keyAns)}
                                                    </div>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
            }).join('')}
                </main>
            </div>
        `;

    } catch (error) {
        console.error(error);
        app.innerHTML = `<div class="p-20 text-center glass-panel rounded-[40px] font-black text-red-500 uppercase tracking-widest m-8">RETRIEVAL ERROR: ${error.message}</div>`;
    }

};
