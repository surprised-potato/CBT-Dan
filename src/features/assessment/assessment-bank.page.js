import { getAssessments, deleteAssessment, updateAssessmentTitle, getTeacherAssessmentsSummary } from '../../services/assessment.service.js';
import { getClassesByTeacher } from '../../services/class.service.js';
import { getUser } from '../../core/store.js';

export const AssessmentBankPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();
    if (!user) { window.location.hash = '#login'; return; }

    app.innerHTML = `
        <div class="relative min-h-screen bg-[#020617] pb-32">
            <!-- Dynamic Mesh Background -->
            <div class="bg-premium-gradient-fixed"></div>
            <div class="mesh-blob top-[-10%] left-[-10%] bg-purple-600/10 scale-150"></div>
            <div class="mesh-blob bottom-[-20%] right-[-10%] bg-indigo-500/10"></div>

            <div class="relative z-10 flex flex-col items-center py-4 md:py-8 px-4">
                <div class="w-full max-w-4xl space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    
                    <!-- Header -->
                    <header class="glass-panel px-6 py-5 md:px-8 md:py-6 rounded-[35px] border border-white/10 flex flex-wrap justify-between items-center gap-4 shadow-xl">
                        <div class="flex items-center gap-4 min-w-0">
                            <button id="main-back-btn" class="p-3 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90 shadow-lg shrink-0">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            </button>
                            <div class="min-w-0">
                                <h1 class="text-xl md:text-2xl font-black text-white leading-tight tracking-tight truncate uppercase">Assessment Bank</h1>
                                <p class="text-[10px] text-purple-400 font-black uppercase tracking-[0.3em] mt-0.5 truncate opacity-80">Operational Controls</p>
                            </div>
                        </div>
                        <button onclick="location.hash='#wizard'" class="bg-purple-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_10px_25px_rgba(147,51,234,0.3)] hover:shadow-[0_15px_35px_rgba(147,51,234,0.4)] hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2 border border-white/20">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                            New Assessment
                        </button>
                    </header>

                    <!-- Search -->
                    <div class="mb-10 relative group bg-white/5 border border-white/10 rounded-[28px] overflow-hidden focus-within:border-purple-500/50 transition-colors shadow-2xl">
                        <input type="text" id="as-search" placeholder="Search assessments..." class="w-full p-6 pl-16 bg-transparent text-white text-lg font-bold tracking-tight outline-none placeholder:text-white/20 uppercase">
                        <div class="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-purple-400 transition-colors">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                    </div>

                    <main id="as-list" class="space-y-6 md:space-y-8 pb-12">
                        <div class="animate-pulse glass-panel p-8 rounded-[40px] h-32"></div>
                        <div class="animate-pulse glass-panel p-8 rounded-[40px] h-32"></div>
                    </main>
                </div>
            </div>
        </div>

        <!-- Edit Title Modal -->
        <div id="edit-modal" class="fixed inset-0 bg-black/60 z-[100] hidden flex items-center justify-center p-4 backdrop-blur-md">
            <div class="glass-panel w-full max-w-md rounded-[40px] border border-white/10 p-10 relative z-10 shadow-2xl animate-in zoom-in-95 duration-300">
                <h3 class="text-2xl font-black text-white mb-6 uppercase tracking-tight">Rename Assessment</h3>
                <input type="text" id="edit-title-input" class="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-purple-500/50 transition-colors mb-8 uppercase tracking-tight">
                <div class="flex gap-4">
                    <button id="save-title-btn" class="flex-1 bg-purple-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-500/20 border border-white/20 hover:-translate-y-0.5 transition-all">Save</button>
                    <button onclick="document.getElementById('edit-modal').classList.add('hidden')" class="px-8 py-4 bg-white/5 text-white/40 rounded-2xl font-black uppercase text-xs tracking-widest border border-white/5">Cancel</button>
                </div>
            </div>
        </div>
    `;

    const listContainer = document.getElementById('as-list');
    const searchInput = document.getElementById('as-search');
    let assessments = [];
    let classes = [];

    const fetchAndRender = async () => {
        try {
            // Using optimized summary (1 read for the whole list)
            const [assessmentsData, classesData] = await Promise.all([
                getTeacherAssessmentsSummary(user.user.uid),
                getClassesByTeacher(user.user.uid)
            ]);
            assessments = assessmentsData;
            classes = classesData;
            renderList();
        } catch (err) {
            console.error(err);
            listContainer.innerHTML = `<div class="text-center py-20 text-red-500 font-bold glass-panel border border-white/10 rounded-[40px]">Failed to load assessments.</div>`;
        }
    };

    const renderList = () => {
        const term = searchInput.value.toLowerCase();
        const filtered = assessments.filter(a => a.title.toLowerCase().includes(term));

        if (filtered.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center py-24 glass-panel rounded-[50px] border-2 border-dashed border-white/10">
                    <p class="text-white/30 font-black uppercase tracking-widest text-xs mb-6">No assessments match query</p>
                    <button onclick="location.hash='#wizard'" class="text-purple-400 font-black uppercase text-[10px] tracking-[0.3em] border-b-2 border-purple-400 pb-1">Create New Assessment</button>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = filtered.map(a => {
            const isActive = a.status === 'active';
            const assignedIds = a.assignedClassIds || [];
            const assignedClasses = classes.filter(c => assignedIds.includes(c.id));

            return `
            <div class="group relative glass-panel p-8 rounded-[40px] border border-white/5 hover:border-purple-500/30 hover:-translate-y-1 transition-all overflow-hidden shadow-2xl">
                <div class="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-4 mb-4">
                            ${isActive
                    ? `<span class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                     <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Active
                                   </span>`
                    : `<span class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5 text-white/40 border border-white/10">
                                     Draft
                                   </span>`
                }
                            <span class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">${new Date(a.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <h3 onclick="location.hash='#details?id=${a.id}'" class="text-2xl font-black text-white truncate tracking-tight group-hover:text-purple-400 transition-colors uppercase cursor-pointer">${a.title}</h3>
                        <div class="flex items-center flex-wrap gap-2 mt-4">
                             <span class="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">${a.questionCount} Items</span> 
                             <span class="w-1 h-1 bg-white/10 rounded-full"></span> 
                             ${assignedClasses.length > 0
                    ? assignedClasses.map(c => `<span class="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20 text-[9px] font-black uppercase tracking-widest">${c.name} [${c.section}]</span>`).join('')
                    : '<span class="text-white/20 text-[9px] font-black uppercase tracking-widest italic">Universal Access</span>'}
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-4 mt-4 md:mt-0">
                        <div class="flex gap-2">
                            <button onclick="window.editAsTitle('${a.id}', '${a.title.replace(/'/g, "\\'")}')" class="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all flex items-center justify-center shadow-lg ring-1 ring-white/5" title="Modify Registry">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h1.828l8.586-8.586z"></path></svg>
                            </button>
                            <button onclick="window.delAs('${a.id}')" class="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center shadow-lg ring-1 ring-white/5" title="Purge Record">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                        
                        <button onclick="location.hash='#details?id=${a.id}'" class="flex items-center gap-3 px-8 py-4 text-xs font-black uppercase tracking-widest text-white bg-purple-600 rounded-2xl transition-all shadow-[0_10px_25px_rgba(147,51,234,0.3)] hover:shadow-[0_15px_35px_rgba(147,51,234,0.4)] hover:-translate-y-0.5 active:scale-95 border border-white/20">
                            Manage
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                    </div>
                </div>
                <div onclick="location.hash='#details?id=${a.id}'" class="mt-8 flex items-center justify-between p-5 bg-white/5 rounded-[28px] text-white/30 group-hover:bg-purple-600 group-hover:text-white group-hover:drop-shadow-[0_10px_20px_rgba(147,51,234,0.4)] transition-all border border-white/5 group-hover:border-purple-400 cursor-pointer">
                    <span class="text-[10px] font-black uppercase tracking-[0.3em] ml-2">Open Operational Panel</span>
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
            </div>`;
        }).join('');
    };

    searchInput.oninput = renderList;

    document.getElementById('main-back-btn').onclick = () => {
        window.location.hash = '#teacher-dash';
    };

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
                alert("Save failed.");
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save';
            }
        };
    };

    window.delAs = async (id) => {
        if (!confirm("Delete this assessment permanently? Students will lose access.")) return;
        try {
            await deleteAssessment(id);
            fetchAndRender();
        } catch (err) {
            alert("Purge failed.");
        }
    };

    fetchAndRender();
};
