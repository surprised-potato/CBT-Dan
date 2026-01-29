import { renderButton } from '../../shared/button.js';
import { getAssessments, deleteAssessment, updateAssessmentTitle } from '../../services/assessment.service.js';
import { getUser } from '../../core/store.js';

export const AssessmentBankPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();
    if (!user) { window.location.hash = '#login'; return; }

    app.innerHTML = `
        <div class="min-h-screen pb-20">
            <header class="glass-panel sticky top-0 z-40 px-4 py-6 border-b border-white/20">
                <div class="max-w-5xl mx-auto flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <button onclick="location.hash='#teacher-dash'" class="p-3 glass-panel rounded-2xl text-gray-500 hover:text-blue-600 transition-colors shadow-sm">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <h1 class="text-2xl font-black text-gray-900 leading-tight tracking-tight">Assessments</h1>
                    </div>
                    <button onclick="location.hash='#wizard'" class="bg-blue-premium text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        New Assessment
                    </button>
                </div>
            </header>

            <main class="max-w-5xl mx-auto p-4 space-y-8 mt-8">
                <div class="relative group">
                    <input type="text" id="as-search" placeholder="Search operational modules..." class="w-full p-6 pl-16 rounded-[28px] glass-panel border-white/40 shadow-xl shadow-blue-50/20 focus:ring-2 focus:ring-blue-500/20 text-lg font-bold tracking-tight outline-none transition-all">
                    <div class="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-600 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                </div>

                <div id="as-list" class="grid grid-cols-1 gap-6">
                    <div class="animate-pulse glass-panel p-8 rounded-[40px] h-32"></div>
                    <div class="animate-pulse glass-panel p-8 rounded-[40px] h-32"></div>
                </div>
            </main>
        </div>

        <!-- Edit Title Modal -->
        <div id="edit-modal" class="fixed inset-0 bg-black/60 z-[100] hidden flex items-center justify-center p-4 backdrop-blur-md">
            <div class="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden border border-white/40">
                <div class="p-10">
                    <h3 class="text-2xl font-black text-gray-900 mb-6 tracking-tight">Rename Module</h3>
                    <input type="text" id="edit-title-input" class="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500/40 focus:bg-white outline-none transition-all mb-8 font-black text-lg">
                    <div class="flex gap-4">
                        <button id="save-title-btn" class="flex-1 bg-blue-premium text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-colors">Commit Change</button>
                        <button onclick="document.getElementById('edit-modal').classList.add('hidden')" class="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-xs tracking-widest">Abort</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const listContainer = document.getElementById('as-list');
    const searchInput = document.getElementById('as-search');
    let assessments = [];

    const fetchAndRender = async () => {
        try {
            assessments = await getAssessments(user.user.uid);
            renderList();
        } catch (err) {
            listContainer.innerHTML = `<div class="text-center py-20 text-red-500 font-bold glass-panel rounded-[40px]">Telemetry load failed.</div>`;
        }
    };

    const renderList = () => {
        const term = searchInput.value.toLowerCase();
        const filtered = assessments.filter(a => a.title.toLowerCase().includes(term));

        if (filtered.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center py-24 glass-panel rounded-[50px] border-2 border-dashed border-white">
                    <p class="text-gray-500 font-black uppercase tracking-widest text-xs opacity-50 mb-6">No operational modules found</p>
                    <button onclick="location.hash='#wizard'" class="text-blue-600 font-black uppercase text-[10px] tracking-[0.3em] border-b-2 border-blue-600 pb-1">Initialise New Module</button>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = filtered.map(a => {
            const isActive = a.status === 'active';
            const statusBadge = isActive
                ? `<span class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-600 border border-green-100">
                     <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Active
                   </span>`
                : `<span class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600 border border-gray-200">
                     Draft
                   </span>`;

            return `
            <div class="group relative bg-white p-8 rounded-[40px] border border-white shadow-xl shadow-blue-50/40 hover:shadow-2xl hover:shadow-blue-100 hover:border-blue-200 transition-all overflow-hidden">
                <div class="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-blue-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-4 mb-4">
                            ${statusBadge}
                            <span class="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">${new Date(a.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <h3 class="text-2xl font-black text-gray-900 truncate tracking-tight group-hover:text-blue-600 transition-colors uppercase">${a.title}</h3>
                        <p class="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                             ${a.questionCount} Validated Items 
                             <span class="w-1 h-1 bg-gray-200 rounded-full"></span> 
                             Universal Section
                        </p>
                    </div>
                    
                    <div class="flex items-center gap-4 mt-4 md:mt-0">
                        <div class="flex gap-2">
                            <button onclick="window.editAsTitle('${a.id}', '${a.title.replace(/'/g, "\\'")}')" class="w-12 h-12 glass-panel rounded-2xl text-gray-500 hover:text-blue-600 transition-all flex items-center justify-center shadow-sm" title="Modify Registry">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </button>
                            <button onclick="window.delAs('${a.id}')" class="w-12 h-12 glass-panel rounded-2xl text-gray-500 hover:text-red-500 transition-all flex items-center justify-center shadow-sm" title="Purge Records">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                        
                        <button onclick="location.hash='#details?id=${a.id}'" class="flex items-center gap-3 px-8 py-4 text-xs font-black uppercase tracking-widest text-white bg-blue-premium rounded-2xl transition-all shadow-xl shadow-blue-100 hover:shadow-2xl hover:shadow-blue-200 hover:-translate-y-0.5 active:scale-95">
                            Operational Panel
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    };

    searchInput.oninput = renderList;

    window.editAsTitle = (id, title) => {
        const modal = document.getElementById('edit-modal');
        const input = document.getElementById('edit-title-input');
        const saveBtn = document.getElementById('save-title-btn');

        input.value = title;
        modal.classList.remove('hidden');

        saveBtn.onclick = async () => {
            const newTitle = input.value.trim();
            if (!newTitle) return;

            saveBtn.disabled = true;
            saveBtn.textContent = 'Committing...';

            try {
                await updateAssessmentTitle(id, newTitle);
                modal.classList.add('hidden');
                fetchAndRender(); // Refresh
            } catch (err) {
                alert("Committal failed.");
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Commit Change';
            }
        };
    };

    window.delAs = async (id) => {
        if (!confirm("Purge this operational module from registry? Students will lose access.")) return;
        try {
            await deleteAssessment(id);
            fetchAndRender();
        } catch (err) {
            alert("Purge failed.");
        }
    };

    fetchAndRender();
};
