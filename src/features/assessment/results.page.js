import { db } from '../../core/config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getUser } from '../../core/store.js';
import { calculateStudentTopicPerformance } from '../../services/analytics.service.js';

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
            <div class="min-h-screen pb-24 bg-gray-50/50">
                <header class="sticky top-0 z-50 glass-header border-b border-white backdrop-blur-xl p-8">
                    <div class="max-w-4xl mx-auto flex items-center justify-between">
                        <div class="flex items-center gap-6">
                            <button onclick="window.location.hash='#student-dash'" class="p-4 bg-white rounded-2xl border border-gray-100 text-gray-400 hover:text-blue-600 transition-all shadow-sm">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            </button>
                            <div>
                                <h1 class="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-2">Performance Diagnostic</h1>
                                <p class="text-2xl font-black text-gray-900 uppercase tracking-tight">${assessment.title}</p>
                            </div>
                        </div>

                        <div class="flex items-center gap-6">
                            <div class="text-right">
                                <p class="text-4xl font-black text-gray-900 tracking-tighter">${submission.score}<span class="text-gray-200 mx-2 text-2xl">/</span>${submission.totalPoints}</p>
                                <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">${percentage}% EFFICIENCY</span>
                            </div>
                            <div class="w-16 h-16 rounded-3xl bg-blue-premium flex items-center justify-center text-white shadow-xl shadow-blue-200">
                                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                        </div>
                    </div>
                </header>

                <main class="max-w-3xl mx-auto p-4 mt-8 space-y-12">
                    
                    <!-- Topic Breakdown -->
                    <div class="bg-white p-10 rounded-[40px] border border-white shadow-2xl shadow-blue-50/50">
                        <div class="flex items-center gap-4 mb-8">
                            <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                            </div>
                            <h3 class="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">Knowledge Domain Breakdown</h3>
                        </div>

                        <div class="space-y-6">
                            ${topicStats.map(stat => `
                                <div>
                                    <div class="flex justify-between items-end mb-2">
                                        <span class="text-xs font-black text-gray-800 uppercase tracking-tight">${stat.topic}</span>
                                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">${stat.earned}/${stat.total} (${stat.percentage}%)</span>
                                    </div>
                                    <div class="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div class="h-full bg-blue-premium rounded-full transition-all duration-1000 ease-out" style="width: ${stat.percentage}%"></div>
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
                            <div class="bg-white p-10 rounded-[50px] border border-white shadow-2xl shadow-blue-50/50 relative overflow-hidden group">
                                <div class="absolute top-0 right-0 w-32 h-32 ${isCorrect ? 'bg-green-50/50' : 'bg-red-50/50'} rounded-full -mr-16 -mt-16 blur-3xl opacity-50 transition-opacity"></div>
                                
                                <div class="relative z-10">
                                    <div class="flex items-center justify-between mb-8">
                                        <div class="flex items-center gap-4">
                                            <div class="w-8 h-8 ${isCorrect ? 'bg-green-500' : 'bg-red-500'} rounded-xl flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-blue-100">
                                                ${i + 1}
                                            </div>
                                            <div class="w-12 h-1 bg-gray-100 rounded-full"></div>
                                            <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">${isCorrect ? 'VALID' : 'INVALID'} TELEMETRY</span>
                                        </div>
                                        <span class="px-4 py-1.5 ${isCorrect ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'} rounded-full text-[9px] font-black uppercase tracking-widest border">
                                            ${isCorrect ? '+ ' + (q.sectionPoints !== undefined ? q.sectionPoints : (q.points !== undefined ? q.points : 1)) : '0'} PTS
                                        </span>
                                    </div>

                                    <div class="space-y-6">
                                        <div class="text-xl font-black text-gray-800 leading-tight uppercase tracking-tight">
                                            ${q.text}
                                        </div>

                                        ${(q.figures || []).map(f => `<img src="${f}" class="w-full rounded-3xl border-4 border-gray-50 shadow-lg">`).join('')}

                                        <div class="grid grid-cols-1 gap-4 pt-4">
                                            <div class="p-6 rounded-[32px] ${isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'} border-2 flex flex-col gap-2">
                                                <span class="text-[8px] font-black ${isCorrect ? 'text-green-600' : 'text-red-600'} uppercase tracking-widest">Your Transmission:</span>
                                                <div class="text-sm font-black ${isCorrect ? 'text-green-900' : 'text-red-900'} uppercase">
                                                    ${formatAnswer(q, studentAns)}
                                                </div>
                                            </div>

                                            ${!isCorrect ? `
                                                <div class="p-6 rounded-[32px] bg-gray-50 border border-gray-100 flex flex-col gap-2">
                                                    <span class="text-[8px] font-black text-gray-400 uppercase tracking-widest">Reference Protocol:</span>
                                                    <div class="text-sm font-black text-gray-700 uppercase">
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

const normalize = (str) => String(str || '').trim().toLowerCase();

const checkCorrectness = (q, studentAns, keyAns) => {
    if (Array.isArray(keyAns)) {
        if (Array.isArray(studentAns)) {
            if (studentAns.length !== keyAns.length) return false;
            if (q.type === 'MULTI_ANSWER') {
                return studentAns.every(v => keyAns.includes(v)) && keyAns.every(v => studentAns.includes(v));
            } else if (q.type === 'MATCHING') {
                return studentAns.every((v, idx) => {
                    const def = keyAns[idx]?.definition;
                    return def && normalize(v) === normalize(def);
                });
            } else if (q.type === 'ORDERING') {
                return studentAns.every((v, idx) => {
                    const key = keyAns[idx];
                    return key && normalize(v) === normalize(key);
                });
            }
            return studentAns.every((v, idx) => {
                const key = keyAns[idx];
                return key && normalize(v) === normalize(key);
            });
        } else if (typeof studentAns === 'string') {
            return keyAns.some(v => normalize(studentAns) === normalize(v));
        }
    }
    return normalize(studentAns) === normalize(keyAns);
};

const formatAnswer = (q, ans) => {
    if (!ans) return '<span class="italic opacity-50">NO DATA TRANSMITTED</span>';
    if (Array.isArray(ans)) {
        if (q.type === 'MULTI_ANSWER') {
            return ans.map(v => {
                const choice = q.choices.find(c => c.id === v);
                return choice ? choice.text : v;
            }).join(', ');
        }
        if (q.type === 'MATCHING') {
            const terms = q.matchingTerms || (q.pairs || []).map(p => p.term);
            return ans.map((v, i) => {
                const val = typeof v === 'object' && v !== null ? (v.definition || v.text || JSON.stringify(v)) : v;
                return `${terms[i] || '?'} → ${val}`;
            }).join('<br>');
        }
        if (q.type === 'ORDERING') {
            return ans.map((v, i) => `${i + 1}. ${v}`).join(', ');
        }
        return ans.join(', ');
    }
    if (q.type === 'MCQ') {
        const choice = q.choices ? q.choices.find(c => c.id === ans) : null;
        return choice ? choice.text : ans;
    }
    if (q.type === 'TRUE_FALSE') return ans === 'true' ? 'TRUE' : 'FALSE';
    return ans;
};
