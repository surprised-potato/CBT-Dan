import { getAssessment, toggleAssessmentStatus } from '../../services/assessment.service.js';
import { renderButton } from '../../shared/button.js';

export const DetailsPage = async () => {
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
                        <button onclick="location.hash='#assessment-bank'" class="text-gray-500 hover:text-gray-700">← Back</button>
                        <h1 class="text-xl font-bold text-gray-800">Assessment Details</h1>
                    </div>
                </div>
            </header>

            <main class="w-full max-w-3xl mx-auto p-4" id="details-content">
                <div class="animate-pulse bg-white p-8 rounded-2xl h-64"></div>
            </main>
        </div>
    `;

    const content = document.getElementById('details-content');

    const renderDetails = async () => {
        try {
            const assessment = await getAssessment(id);
            const status = assessment.status || 'draft';
            const isActive = status === 'active';

            const statusBadge = isActive
                ? '<span class="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm">ACTIVE</span>'
                : '<span class="bg-gray-100 text-gray-500 font-bold px-3 py-1 rounded-full text-sm">DRAFT</span>';

            content.innerHTML = `
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-6">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <span class="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded mb-2 inline-block">Assessment ID: ${id}</span>
                            <div class="flex items-center gap-3 mb-2">
                                ${statusBadge}
                                <h2 class="text-3xl font-bold text-gray-900 leading-tight">${assessment.title}</h2>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-2xl font-black text-gray-900">${assessment.questionCount}</p>
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Total Questions</p>
                        </div>
                    </div>
                    
                    <p class="text-gray-500 mb-8">Created on ${new Date(assessment.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                    
                    <div class="grid grid-cols-2 gap-4">
                        ${isActive
                    ? renderButton({ text: 'End Assessment', variant: 'danger', id: 'toggle-status-btn' })
                    : renderButton({ text: 'Launch Assessment', variant: 'primary', id: 'toggle-status-btn' })
                }
                        
                        ${isActive
                    ? `<button onclick="window.location.hash='#taker?id=${id}'" class="w-full py-3 rounded-xl font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">Preview as Student</button>`
                    : `<button onclick="window.location.hash='#taker?id=${id}'" class="w-full py-3 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">Preview Draft</button>`
                }
                    </div>
                     ${isActive ? `<p class="text-center text-xs text-green-600 mt-2 font-bold">Students can now see and take this assessment.</p>` : ''}
                </div>

                <div class="space-y-6">
                    <h3 class="text-xl font-bold text-gray-900 px-2">Questions Preview</h3>
                    ${assessment.questions.map((q, idx) => `
                        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                             ${isActive ? '<div class="absolute inset-0 bg-gray-50 bg-opacity-50 z-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><span class="font-bold text-gray-500">Editing Locked</span></div>' : ''}
                            <div class="flex justify-between mb-4">
                                <span class="text-xs font-bold text-gray-400">Question ${idx + 1}</span>
                                <span class="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded">${q.type}</span>
                            </div>
                            <p class="text-gray-800 font-medium text-lg mb-4">${q.text || 'No question text provided'}</p>
                             ${q.choices && q.choices.length > 0 ? `
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    ${q.choices.map(opt => `
                                        <div class="p-3 bg-gray-50 rounded-xl text-sm text-gray-600 border border-gray-100">
                                            ${typeof opt === 'string' ? opt : opt.text}
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;

            document.getElementById('toggle-status-btn').onclick = async () => {
                const btn = document.getElementById('toggle-status-btn');
                btn.disabled = true;
                const newStatus = isActive ? 'draft' : 'active';
                const confirmMsg = isActive ? "End assessment? Students will no longer be able to submit." : "Launch assessment? Students will be able to take it immediately.";

                if (confirm(confirmMsg)) {
                    btn.textContent = 'Updating...';
                    await toggleAssessmentStatus(id, newStatus);
                    renderDetails(); // Re-render
                } else {
                    btn.disabled = false;
                }
            };

        } catch (err) {
            content.innerHTML = `
                <div class="bg-red-50 text-red-600 p-8 rounded-2xl text-center">
                    <p class="font-bold text-lg mb-2">Error loading assessment</p>
                    <p class="text-sm">${err.message}</p>
                    <button onclick="location.hash='#assessment-bank'" class="mt-4 font-bold underline">Back to Bank</button>
                </div>
            `;
        }
    };

    renderDetails();
};
