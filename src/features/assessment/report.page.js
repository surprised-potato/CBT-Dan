import { getAssessment } from '../../services/assessment.service.js';
import { getSubmissionsForAssessment, gradeAllSubmissions } from '../../services/grading.service.js';
import { renderButton } from '../../shared/button.js';

export const ReportPage = async () => {
    const app = document.getElementById('app');
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const id = params.get('id');

    if (!id) {
        app.innerHTML = '<div class="p-10 text-center font-black text-red-500 uppercase tracking-widest glass-panel rounded-3xl m-8">Critical Error: Missing Telemetry ID</div>';
        return;
    }

    app.innerHTML = `
        <div class="min-h-screen pb-20">
            <header class="glass-panel sticky top-0 z-40 px-4 py-6 border-b border-white/20">
                <div class="max-w-5xl mx-auto flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <button onclick="window.history.back()" class="p-3 glass-panel rounded-2xl text-purple-600 hover:text-purple-800 transition-colors shadow-sm">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <h1 class="text-2xl font-black text-gray-900 leading-tight tracking-tight uppercase">Performance Registry</h1>
                    </div>
                </div>
            </header>

            <main class="max-w-5xl mx-auto p-4 space-y-8 mt-8" id="report-content">
                <div class="animate-pulse glass-panel p-12 rounded-[40px] h-64"></div>
            </main>
        </div>
    `;

    const content = document.getElementById('report-content');

    const render = async () => {
        try {
            const [assessment, submissions] = await Promise.all([
                getAssessment(id),
                getSubmissionsForAssessment(id)
            ]);

            const total = submissions.length;
            const graded = submissions.filter(s => s.status === 'graded');
            const avgScore = graded.length > 0
                ? (graded.reduce((acc, s) => acc + (s.score || 0), 0) / graded.length).toFixed(1)
                : '--';

            content.innerHTML = `
                <div class="bg-white p-10 rounded-[50px] shadow-2xl shadow-purple-50/50 border border-white mb-10 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-64 h-64 bg-purple-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    
                    <div class="relative z-10">
                        <h2 class="text-4xl font-black text-gray-900 leading-[1.1] tracking-tight uppercase mb-8">${assessment.title}</h2>
                        
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div class="bg-purple-premium p-8 rounded-[32px] text-center shadow-xl shadow-purple-100">
                                <p class="text-[10px] font-black text-purple-100 uppercase tracking-widest mb-2">Total Packets</p>
                                <p class="text-4xl font-black text-white tracking-tighter">${total}</p>
                            </div>
                            <div class="bg-white p-8 rounded-[32px] text-center border-2 border-green-50 shadow-inner">
                                <p class="text-[10px] font-black text-green-500 uppercase tracking-widest mb-2">Validated</p>
                                <p class="text-4xl font-black text-green-700 tracking-tighter">${graded.length}</p>
                            </div>
                            <div class="bg-white p-8 rounded-[32px] text-center border-2 border-indigo-50 shadow-inner">
                                <p class="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Mean Output</p>
                                <p class="text-4xl font-black text-indigo-700 tracking-tighter">${avgScore}</p>
                            </div>
                        </div>
                        
                        <div class="mt-10 flex justify-center">
                            <button id="grade-all-btn" class="bg-purple-premium text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all">
                                Execute Batch Validation
                            </button>
                            <button onclick="window.location.hash='#item-analysis?id=${id}'" class="ml-4 bg-white text-purple-600 border-2 border-purple-100 px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-sm hover:border-purple-300 hover:text-purple-800 transition-all">
                                View Item Analysis
                            </button>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-[40px] shadow-2xl shadow-purple-50/50 border border-white overflow-hidden">
                    <div class="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 class="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">Operational Data Stream</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead class="bg-gray-50/50 text-[10px] font-black text-gray-700 uppercase tracking-widest">
                                <tr>
                                    <th class="p-8 border-b border-gray-100">Personnel Asset</th>
                                    <th class="p-8 border-b border-gray-100">Transmission Log</th>
                                    <th class="p-8 border-b border-gray-100">Status</th>
                                    <th class="p-8 border-b border-gray-100 text-right">Result</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-50 text-sm">
                                ${submissions.length === 0 ? '<tr><td colspan="4" class="p-20 text-center font-black text-xs text-gray-500 uppercase tracking-[0.3em]">No telemetry detected in this sector</td></tr>' : ''}
                                ${submissions.map(s => {
                const isGraded = s.status === 'graded';
                const badgeClass = isGraded
                    ? 'bg-green-50 text-green-600 border-green-100'
                    : 'bg-amber-50 text-amber-600 border-amber-100';

                return `
                                        <tr class="hover:bg-purple-50/30 transition-colors group">
                                            <td class="p-8">
                                                <div class="flex items-center gap-4">
                                                    <div class="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-purple-600 font-black text-lg group-hover:bg-purple-premium group-hover:text-white transition-all shadow-inner">
                                                        ${s.studentName?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <p class="font-black text-gray-900 uppercase tracking-tight">${s.studentName || 'Unknown Asset'}</p>
                                                        <p class="text-[10px] font-bold text-gray-600 tracking-wider">${s.studentEmail}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="p-8 text-[11px] font-black text-gray-600 uppercase tracking-tight">
                                                ${new Date(s.submittedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                            </td>
                                            <td class="p-8">
                                                <span class="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${badgeClass}">
                                                    ${s.status}
                                                </span>
                                            </td>
                                            <td class="p-8 text-right font-black text-xl text-gray-900 tracking-tighter">
                                                ${isGraded ? `<span class="text-purple-600">${s.score}</span> <span class="text-gray-200 text-sm font-bold">/ ${s.totalPoints || '?'}</span>` : '<span class="text-gray-200">--</span>'}
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
                    render();
                } catch (err) {
                    console.error(err);
                    alert("Validation protocol failure.");
                    btn.disabled = false;
                    btn.textContent = 'Execute Batch Validation';
                }
            };

        } catch (err) {
            content.innerHTML = `<div class="p-20 text-center glass-panel rounded-[40px] font-black text-red-500 uppercase tracking-widest text-xs">Registry Access Violation: ${err.message}</div>`;
        }
    };

    render();
};
