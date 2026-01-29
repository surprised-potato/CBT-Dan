import { getAssessment } from '../../services/assessment.service.js';
import { getSubmissionsForAssessment, gradeAllSubmissions } from '../../services/grading.service.js';
import { renderButton } from '../../shared/button.js';

export const ReportPage = async () => {
    const app = document.getElementById('app');
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const id = params.get('id');

    if (!id) {
        app.innerHTML = '<div class="p-10 text-center">Missing Assessment ID</div>';
        return;
    }

    app.innerHTML = `
        <div class="bg-gray-50 min-h-screen pb-20">
            <header class="bg-white shadow p-4 sticky top-0 z-40">
                <div class="w-full max-w-3xl mx-auto flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <button onclick="window.history.back()" class="text-gray-500 hover:text-gray-700">← Back</button>
                        <h1 class="text-xl font-bold text-gray-800">Assessment Report</h1>
                    </div>
                </div>
            </header>

            <main class="w-full max-w-4xl mx-auto p-4" id="report-content">
                <div class="animate-pulse bg-white p-8 rounded-2xl h-64"></div>
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
                : '-';

            content.innerHTML = `
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">${assessment.title}</h2>
                    <div class="grid grid-cols-3 gap-6 mt-6">
                        <div class="bg-blue-50 p-4 rounded-lg text-center">
                            <p class="text-sm font-bold text-blue-500 uppercase">Submissions</p>
                            <p class="text-3xl font-black text-blue-900">${total}</p>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg text-center">
                            <p class="text-sm font-bold text-green-500 uppercase">Graded</p>
                            <p class="text-3xl font-black text-green-900">${graded.length}</p>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-lg text-center">
                            <p class="text-sm font-bold text-purple-500 uppercase">Avg Score</p>
                            <p class="text-3xl font-black text-purple-900">${avgScore}</p>
                        </div>
                    </div>
                    
                    <div class="mt-6 flex justify-end">
                        ${renderButton({ text: 'Grade All Pending', variant: 'primary', id: 'grade-all-btn' })}
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                            <tr>
                                <th class="p-4 border-b">Student</th>
                                <th class="p-4 border-b">Date</th>
                                <th class="p-4 border-b">Status</th>
                                <th class="p-4 border-b text-right">Score</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 text-sm">
                            ${submissions.length === 0 ? '<tr><td colspan="4" class="p-8 text-center text-gray-400">No submissions yet</td></tr>' : ''}
                            ${submissions.map(s => {
                const isGraded = s.status === 'graded';
                const badgeClass = isGraded
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700';

                return `
                                    <tr class="hover:bg-gray-50">
                                        <td class="p-4 font-bold text-gray-800">
                                            ${s.studentName}<br>
                                            <span class="text-xs font-normal text-gray-400">${s.studentEmail}</span>
                                        </td>
                                        <td class="p-4 text-gray-600">
                                            ${new Date(s.submittedAt).toLocaleString()}
                                        </td>
                                        <td class="p-4">
                                            <span class="px-2 py-1 rounded-full text-xs font-bold ${badgeClass} uppercase">
                                                ${s.status}
                                            </span>
                                        </td>
                                        <td class="p-4 text-right font-mono font-bold text-base text-gray-900">
                                            ${isGraded ? `${s.score} / ${s.totalPoints || '?'}` : '--'}
                                        </td>
                                    </tr>
                                `;
            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('grade-all-btn').onclick = async () => {
                const btn = document.getElementById('grade-all-btn');
                btn.disabled = true;
                btn.textContent = 'Grading...';
                try {
                    const count = await gradeAllSubmissions(id);
                    alert(`Successfully graded ${count} submissions.`);
                    render(); // Refresh
                } catch (err) {
                    console.error(err);
                    alert("Error during grading.");
                    btn.disabled = false;
                    btn.textContent = 'Grade All Pending';
                }
            };

        } catch (err) {
            content.innerHTML = `<div class="p-8 text-center text-red-500">Error: ${err.message}</div>`;
        }
    };

    render();
};
