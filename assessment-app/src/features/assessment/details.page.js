import { getAssessment, toggleAssessmentStatus } from '../../services/assessment.service.js';
import { renderButton } from '../../shared/button.js';

export const DetailsPage = async () => {
    const app = document.getElementById('app');
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const id = params.get('id');

    if (!id) {
        app.innerHTML = '<div class="p-10 text-center font-black text-red-500 uppercase tracking-widest glass-panel rounded-3xl m-8">Critical Error: Missing Assessment ID</div>';
        return;
    }

    app.innerHTML = `
        <div class="min-h-screen pb-20">
            <header class="glass-panel sticky top-0 z-40 px-4 py-6 border-b border-white/20">
                <div class="max-w-4xl mx-auto flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <button onclick="location.hash='#assessment-bank'" class="p-3 glass-panel rounded-2xl text-gray-500 hover:text-blue-600 transition-colors shadow-sm">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <h1 class="text-2xl font-black text-gray-900 leading-tight tracking-tight uppercase">Assessment Specs</h1>
                    </div>
                </div>
            </header>

            <main class="max-w-4xl mx-auto p-4 space-y-8 mt-8" id="details-content">
                <div class="animate-pulse glass-panel p-12 rounded-[40px] h-64"></div>
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
                ? `<span class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-600 border border-green-100">
                     <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Active Operational Status
                   </span>`
                : `<span class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600 border border-gray-200">
                     Draft Mode
                   </span>`;

            content.innerHTML = `
                <div class="bg-white p-10 rounded-[50px] shadow-2xl shadow-blue-50/50 border border-white mb-10 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    
                    <div class="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
                        <div class="flex-1">
                            <div class="flex flex-wrap items-center gap-4 mb-6">
                                ${statusBadge}
                                <span class="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100/50">Module ID: ${id.substring(0, 8)}...</span>
                            </div>
                            <h2 class="text-4xl font-black text-gray-900 leading-[1.1] tracking-tight uppercase mb-4">${assessment.title}</h2>
                            <p class="text-xs font-black text-gray-300 uppercase tracking-[0.3em]">Initialised on ${new Date(assessment.createdAt).toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
                        </div>
                        <div class="bg-gray-50 p-6 rounded-[32px] border border-gray-100 shadow-inner text-center min-w-[140px]">
                            <p class="text-4xl font-black text-gray-900 tracking-tighter">${assessment.questionCount}</p>
                            <p class="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Operational Items</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 relative z-10">
                        <button id="toggle-status-btn" class="w-full ${isActive ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-premium text-white'} p-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all hover:-translate-y-0.5 active:scale-95 border">
                            ${isActive ? 'End Operational Window' : 'Launch Assessment'}
                        </button>
                        
                        <button onclick="window.location.hash='#taker?id=${id}'" class="w-full glass-panel p-5 rounded-2xl font-black uppercase text-xs tracking-widest text-gray-600 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                            Initialise Simulation
                        </button>

                        <button onclick="window.location.hash='#report?id=${id}'" class="md:col-span-2 w-full bg-indigo-50 text-indigo-700 p-5 rounded-2xl font-black uppercase text-xs tracking-widest border border-indigo-100 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                            Generate Performance Registry
                        </button>
                    </div>
                     ${isActive ? `<p class="text-center text-[10px] font-black text-green-600 mt-6 uppercase tracking-widest animate-pulse">Tele-Access is currently open for student enrolment</p>` : ''}
                </div>

                <div class="space-y-8">
                    <h3 class="text-xl font-black text-gray-900 uppercase tracking-[0.2em] px-4">Registry Preview</h3>
                    ${assessment.questions.map((q, idx) => `
                        <div class="bg-white p-8 rounded-[40px] border border-white shadow-xl shadow-blue-50/50 relative overflow-hidden group">
                             ${isActive ? '<div class="absolute inset-0 bg-gray-50/80 backdrop-blur-[2px] z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span class="font-black text-[10px] uppercase tracking-[0.3em] text-gray-500 bg-white px-6 py-3 rounded-2xl shadow-xl">Encryption Locked (Active Session)</span></div>' : ''}
                            <div class="flex justify-between items-center mb-6">
                                <span class="text-[10px] font-black text-gray-300 uppercase tracking-widest">Item Reference ${idx + 1}</span>
                                <span class="text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100 uppercase tracking-widest">${q.type}</span>
                            </div>
                            <p class="text-gray-900 font-extrabold text-lg mb-6 leading-relaxed">${q.text || 'No operational data provided'}</p>
                             ${q.choices && q.choices.length > 0 ? `
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    ${q.choices.map(opt => `
                                        <div class="p-4 bg-gray-50/50 rounded-2xl text-[13px] font-bold text-gray-600 border border-gray-100/50 shadow-inner">
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
                const confirmMsg = isActive ? "TERMINATE operational session? Students will no longer be able to transmit data." : "INITIALISE assessment launch? Registry will open for student terminals immediately.";

                if (confirm(confirmMsg)) {
                    btn.textContent = 'COMMITTING...';
                    await toggleAssessmentStatus(id, newStatus);
                    renderDetails();
                } else {
                    btn.disabled = false;
                }
            };

        } catch (err) {
            content.innerHTML = `
                <div class="glass-panel text-red-600 p-12 rounded-[40px] text-center">
                    <p class="font-black text-xl mb-4 uppercase tracking-tight">Telemetry Protocol Failure</p>
                    <p class="text-xs font-black uppercase tracking-widest opacity-60">${err.message}</p>
                    <button onclick="location.hash='#assessment-bank'" class="mt-8 font-black uppercase text-[10px] tracking-[0.3em] border-b-2 border-red-600 pb-1">Return to Registry</button>
                </div>
            `;
        }
    };

    renderDetails();
};
