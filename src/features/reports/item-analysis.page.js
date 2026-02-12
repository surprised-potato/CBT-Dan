
import { getAssessment, updateAssessmentConfig } from '../../services/assessment.service.js';
import { getSubmissionsForAssessment, regradeAssessment } from '../../services/grading.service.js';
import { calculateAnalytics } from '../../services/analytics.service.js';
import { getAssessmentWithKeys } from '../../services/assessment.service.js';

export const ItemAnalysisPage = async () => {
    const app = document.getElementById('app');
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const id = params.get('id');

    if (!id) {
        app.innerHTML = '<div class="p-10 text-center font-black text-red-500 uppercase tracking-widest glass-panel rounded-3xl m-8">Critical Error: Missing Telemetry ID</div>';
        return;
    }

    app.innerHTML = `
        <div class="min-h-screen pb-20 bg-gray-50/50">
            <header class="glass-panel sticky top-0 z-40 px-4 py-6 border-b border-gray-100">
                <div class="max-w-6xl mx-auto flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <button onclick="window.history.back()" class="p-3 glass-panel rounded-2xl text-purple-600 hover:text-purple-800 transition-colors shadow-sm">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <div>
                            <h1 class="text-xs font-black text-purple-600 uppercase tracking-[0.3em] mb-1">Deep Diagnostic Protocol</h1>
                            <h2 class="text-xl font-black text-gray-900 leading-tight tracking-tight uppercase" id="page-title">Loading...</h2>
                        </div>
                    </div>
                </div>
            </header>

            <main class="max-w-6xl mx-auto p-4 space-y-8 mt-8" id="analysis-content">
                <div class="animate-pulse glass-panel p-12 rounded-[40px] h-64"></div>
            </main>
        </div>
    `;

    const content = document.getElementById('analysis-content');
    const titleEl = document.getElementById('page-title');

    const render = async () => {
        try {
            // We need keys for analytics
            const assessmentData = await getAssessmentWithKeys(id);
            const submissions = await getSubmissionsForAssessment(id);

            titleEl.textContent = assessmentData.title;

            const { itemStats } = calculateAnalytics(submissions, assessmentData, assessmentData.keys);

            content.innerHTML = `
                <div class="bg-white rounded-[40px] shadow-2xl shadow-purple-50/50 border border-white overflow-hidden">
                    <div class="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 class="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">Item Integrity Matrix</h3>
                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">${submissions.length} Datasets Analyzed</span>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead class="bg-gray-50/50 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                <tr>
                                    <th class="p-6 border-b border-gray-100 w-16 text-center">#</th>
                                    <th class="p-6 border-b border-gray-100">Evaluative content</th>
                                    <th class="p-6 border-b border-gray-100 w-32 text-center">Difficulty<br>(P-Value)</th>
                                    <th class="p-6 border-b border-gray-100 w-32 text-center">Discrimination<br>(D-Index)</th>
                                    <th class="p-6 border-b border-gray-100 w-40 text-center">Diagnostic</th>
                                    <th class="p-6 border-b border-gray-100 w-32 text-center">Protocol</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-50 text-xs">
                                ${itemStats.map((stat, i) => {
                // Interpretation Colors
                let diffColor = 'text-gray-900';
                if (stat.stats.difficulty < 0.2 || stat.stats.difficulty > 0.9) diffColor = 'text-amber-600';

                let discColor = 'text-gray-900';
                if (stat.stats.discrimination < 0.2) discColor = 'text-red-500';
                if (stat.stats.discrimination < 0) discColor = 'text-red-700 font-extrabold';

                let statusBadge = 'bg-gray-100 text-gray-500';
                if (stat.stats.status === 'GOOD') statusBadge = 'bg-green-50 text-green-600 border border-green-100';
                else if (stat.stats.status.includes('DIFFICULT') || stat.stats.status.includes('EASY')) statusBadge = 'bg-amber-50 text-amber-600 border border-amber-100';
                else statusBadge = 'bg-red-50 text-red-600 border border-red-100';

                const qObj = assessmentData.questions.find(q => q.id === stat.id);
                const isExcluded = qObj.sectionPoints === 0 && qObj.points === 0;

                return `
                                        <tr class="hover:bg-purple-50/30 transition-colors group ${isExcluded ? 'opacity-50 bg-gray-50' : ''}">
                                            <td class="p-6 text-center font-black text-gray-300 group-hover:text-purple-500 transition-colors">${i + 1}</td>
                                            <td class="p-6">
                                                <p class="font-bold text-gray-800 mb-1 line-clamp-2">${stat.text}</p>
                                                <div class="flex gap-2">
                                                    <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-lg">${stat.type}</span>
                                                    <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-lg">${stat.topic}</span>
                                                </div>
                                            </td>
                                            <td class="p-6 text-center">
                                                <div class="flex flex-col items-center gap-1">
                                                    <span class="text-sm font-black ${diffColor}">${Math.round(stat.stats.difficulty * 100)}%</span>
                                                    <div class="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                        <div class="h-full bg-gray-400" style="width: ${stat.stats.difficulty * 100}%"></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="p-6 text-center">
                                                <span class="text-sm font-black ${discColor}">${stat.stats.discrimination}</span>
                                            </td>
                                            <td class="p-6 text-center">
                                                <span class="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusBadge}">
                                                    ${stat.stats.status}
                                                </span>
                                            </td>
                                            <td class="p-6 text-center">
                                                <button class="weed-btn px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${isExcluded ? 'bg-red-100 text-red-600 border-red-200 hover:bg-red-200' : 'bg-white text-gray-400 border-gray-200 hover:border-red-400 hover:text-red-500'}" data-qid="${stat.id}" data-excluded="${isExcluded}">
                                                    ${isExcluded ? 'RESTORE' : 'EXCLUDE'}
                                                </button>
                                            </td>
                                        </tr>
                                    `;
            }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            // Attach Listeners
            content.querySelectorAll('.weed-btn').forEach(btn => {
                btn.onclick = async (e) => {
                    const { qid, excluded } = e.target.dataset;
                    const isExcluding = excluded === 'false';

                    if (!confirm(isExcluding ? "Exclude this item from grading? Its points will be set to 0 and all submissions will be regraded." : "Restore this item?")) return;

                    try {
                        e.target.textContent = 'Processing...';
                        e.target.disabled = true;

                        // 1. Update Assessment Config (Set specific question points to 0 or undefined to revert)
                        // Note: We need to update the embedded question in the 'questions' array.
                        // Ideally we modify the 'settings' or specific question metadata.
                        // Our data model embeds questions. We need to update the specific object in the array.

                        const newQuestions = assessmentData.questions.map(q => {
                            if (q.id === qid) {
                                return { ...q, points: isExcluding ? 0 : 1, sectionPoints: isExcluding ? 0 : undefined };
                                // We reset sectionPoints to undefined so it falls back to section config (if restoring)
                                // or force to 0 if excluding.
                                // NOTE: sectionPoints usually comes from section config.
                                // If we set it properly on the Question Object, grader picks it up.
                            }
                            return q;
                        });

                        await updateAssessmentConfig(id, { questions: newQuestions }); // Need to support updating questions array in service

                        // 2. Regrade All
                        await regradeAssessment(id);

                        // 3. Refresh
                        render();

                    } catch (err) {
                        console.error(err);
                        alert("Failed to update item protocol.");
                        e.target.disabled = false;
                        e.target.textContent = isExcluding ? 'EXCLUDE' : 'RESTORE';
                    }
                };
            });

        } catch (err) {
            console.error(err);
            content.innerHTML = `<div class="p-20 text-center glass-panel rounded-[40px] font-black text-red-500 uppercase tracking-widest text-xs">Analysis Failure: ${err.message}</div>`;
        }
    };

    render();
};
