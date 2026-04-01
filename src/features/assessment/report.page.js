import { getAssessment } from '../../services/assessment.service.js';
import { getSubmissionsForAssessment, gradeAllSubmissions } from '../../services/grading.service.js';
import { renderButton } from '../../shared/button.js';
import { db } from '../../core/config.js';
import { collection, query, where, onSnapshot, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const ReportPage = async () => {
    const app = document.getElementById('app');
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const id = params.get('id');

    if (!id) {
        app.innerHTML = '<div class="p-10 text-center font-black text-red-500 uppercase tracking-widest glass-panel rounded-3xl m-8">Critical Error: Missing Telemetry ID</div>';
        return;
    }

    app.innerHTML = `
        <div class="min-h-screen pb-20 bg-[#020617] relative">
            <!-- Dynamic Mesh Background -->
            <div class="bg-premium-gradient-fixed"></div>
            <div class="mesh-blob top-[-10%] right-[-10%] bg-purple-600/10 scale-150"></div>
            <div class="mesh-blob bottom-[-20%] left-[-10%] bg-indigo-500/10"></div>

            <header class="glass-panel sticky top-0 z-40 px-6 py-6 border-b border-white/10 backdrop-blur-xl relative">
                <div class="max-w-5xl mx-auto flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <button onclick="window.history.back()" class="p-3 bg-white/5 border border-white/10 rounded-2xl text-purple-400 hover:text-white hover:bg-white/10 transition-all shadow-lg active:scale-90">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <div>
                            <h1 class="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-1">Assessment Analytics</h1>
                            <h2 class="text-xl md:text-2xl font-black text-white leading-tight tracking-tight uppercase">Performance Registry</h2>
                        </div>
                    </div>
                </div>
            </header>

            <main class="max-w-5xl mx-auto p-4 space-y-8 mt-8 relative z-10" id="report-content">
                <div class="animate-pulse glass-panel p-12 rounded-[40px] h-64 border border-white/10"></div>
            </main>
        </div>
    `;

    const content = document.getElementById('report-content');
    let unsubscribe = null;
    const studentCache = new Map();

    const resolveStudentName = async (uid, fallbackEmail, fallbackName) => {
        if (studentCache.has(uid)) return studentCache.get(uid);

        try {
            const userSnap = await getDoc(doc(db, "users", uid));
            if (userSnap.exists()) {
                const name = userSnap.data().displayName || fallbackName;
                studentCache.set(uid, name);
                return name;
            }
        } catch (e) {
            console.error("Name lookup failed:", e);
        }
        return fallbackName || 'Unknown Personnel';
    };

    const initRealtimeListener = async () => {
        try {
            const assessment = await getAssessment(id);
            const q = query(
                collection(db, "submissions"),
                where("assessmentId", "==", id)
            );

            unsubscribe = onSnapshot(q, async (snapshot) => {
                const submissions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

                // Resolve all names in parallel
                await Promise.all(submissions.map(async (s) => {
                    s.resolvedName = await resolveStudentName(s.studentId, s.studentEmail, s.studentName);
                }));

                const total = submissions.length;
                const graded = submissions.filter(s => s.status === 'graded');
                const avgScore = graded.length > 0
                    ? (graded.reduce((acc, s) => acc + (s.score || 0), 0) / graded.length).toFixed(1)
                    : '--';

                content.innerHTML = `
                    <div class="glass-panel p-8 md:p-10 rounded-[50px] shadow-2xl border border-white/10 mb-10 relative overflow-hidden bg-black/20">
                        <div class="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        
                        <div class="relative z-10">
                            <h2 class="text-3xl md:text-4xl font-black text-white leading-[1.1] tracking-tight uppercase mb-10 drop-shadow-md">${assessment.title}</h2>
                            
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div class="bg-purple-600/20 border border-purple-500/30 p-8 rounded-[32px] text-center shadow-xl relative overflow-hidden group">
                                    <div class="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <p class="text-[10px] font-black text-purple-300 uppercase tracking-widest mb-2 relative z-10">Total Packets</p>
                                    <p class="text-4xl font-black text-white tracking-tighter relative z-10">${total}</p>
                                </div>
                                <div class="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[32px] text-center shadow-xl relative overflow-hidden group">
                                    <div class="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <p class="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 relative z-10">Validated</p>
                                    <p class="text-4xl font-black text-white tracking-tighter relative z-10">${graded.length}</p>
                                </div>
                                <div class="bg-indigo-500/10 border border-indigo-500/20 p-8 rounded-[32px] text-center shadow-xl relative overflow-hidden group">
                                    <div class="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <p class="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 relative z-10">Mean Output</p>
                                    <p class="text-4xl font-black text-white tracking-tighter relative z-10">${avgScore}</p>
                                </div>
                            </div>
                            
                            <div class="mt-10 flex flex-wrap justify-center gap-4">
                                <button id="grade-all-btn" class="bg-purple-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5 active:scale-95 transition-all border border-white/20">
                                    Execute Batch Validation
                                </button>
                                <button onclick="window.location.hash='#item-analysis?id=${id}'" class="bg-white/5 text-purple-400 border border-white/10 px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-white/10 transition-all active:scale-95">
                                    View Item Analysis
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="glass-panel rounded-[40px] shadow-2xl border border-white/10 overflow-hidden bg-black/20">
                        <div class="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Operational Data Stream</h3>
                            <span class="text-[9px] font-black text-purple-400 uppercase tracking-[0.2em]">${submissions.length} DATASETS</span>
                        </div>
                        <div class="overflow-x-auto no-scrollbar">
                            <table class="w-full text-left border-collapse">
                                <thead class="bg-white/5 text-[9px] font-black text-white/40 uppercase tracking-widest">
                                    <tr>
                                        <th class="p-8 border-b border-white/5">Personnel Asset</th>
                                        <th class="p-8 border-b border-white/5">Transmission Log</th>
                                        <th class="p-8 border-b border-white/5">Status</th>
                                        <th class="p-8 border-b border-white/5 text-right">Result</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-white/5 text-sm">
                                    ${submissions.length === 0 ? '<tr><td colspan="4" class="p-24 text-center font-black text-[10px] text-white/20 uppercase tracking-[0.4em] italic">No telemetry detected in this sector</td></tr>' : ''}
                                    ${submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)).map(s => {
                    const isGraded = s.status === 'graded';
                    const badgeClass = isGraded
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

                    return `
                                            <tr class="hover:bg-white/5 transition-colors group">
                                                <td class="p-8">
                                                    <div class="flex items-center gap-5">
                                                        <div class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-purple-400 font-black text-lg group-hover:bg-purple-600 group-hover:text-white transition-all shadow-inner border border-white/5">
                                                            ${(s.resolvedName || '?')[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p class="font-black text-white uppercase tracking-tight flex items-center gap-3">
                                                                ${s.resolvedName || 'Unknown Asset'}
                                                                ${s.terminatedDueToCheating ? '<span class="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-[8px] font-black uppercase tracking-widest border border-red-500/20" title="' + (s.cheatingReason || 'Force submitted during lockout') + '">COMPROMISED</span>' : ''}
                                                                ${s.unlockAttempts > 0 ? '<span class="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[8px] font-black uppercase tracking-widest border border-amber-500/20" title="Student left environment and required proctor unlock">UNLOCKED (' + s.unlockAttempts + ')</span>' : ''}
                                                            </p>
                                                            <p class="text-[10px] font-bold text-white/20 tracking-widest mt-0.5 uppercase">${s.studentEmail}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td class="p-8 text-[10px] font-black text-white/40 uppercase tracking-widest">
                                                    ${new Date(s.submittedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                                </td>
                                                <td class="p-8">
                                                    <span class="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${badgeClass}">
                                                        ${s.status}
                                                    </span>
                                                </td>
                                                <td class="p-8 text-right font-black text-xl text-white tracking-tighter">
                                                    ${isGraded ? `<span class="text-purple-400">${s.score}</span> <span class="text-white/10 text-sm font-bold">/ ${s.totalPoints || '?'}</span>` : '<span class="text-white/5">--</span>'}
                                                </td>
                                            </tr>
                                        `;
                }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;

                document.getElementById('grade-all-btn').onclick = async () => {
                    const btn = document.getElementById('grade-all-btn');
                    btn.disabled = true;
                    btn.textContent = 'VALIDATING...';
                    try {
                        const count = await gradeAllSubmissions(id);
                        alert(`Successfully validated ${count} operational packets.`);
                    } catch (err) {
                        console.error(err);
                        alert("Validation protocol failure.");
                        btn.disabled = false;
                        btn.textContent = 'Execute Batch Validation';
                    }
                };
            });

        } catch (err) {
            content.innerHTML = `<div class="p-20 text-center glass-panel rounded-[40px] font-black text-red-500 uppercase tracking-widest text-xs">Registry Access Violation: ${err.message}</div>`;
        }
    };

    initRealtimeListener();

    // Cleanup on hash change (rudimentary)
    const originalHash = window.location.hash;
    const checker = setInterval(() => {
        if (window.location.hash !== originalHash) {
            if (unsubscribe) unsubscribe();
            clearInterval(checker);
        }
    }, 1000);
};
