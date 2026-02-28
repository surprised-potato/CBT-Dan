import { getAssessment, getAssessmentWithKeys, toggleAssessmentStatus, cloneAssessment, updateAssessmentConfig, reconfigureAssessmentSections } from '../../services/assessment.service.js';
import { getClassesByTeacher } from '../../services/class.service.js';
import { getHierarchy } from '../../services/question-bank.service.js';
import { getUser } from '../../core/store.js';

export const DetailsPage = async () => {
    const app = document.getElementById('app');
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const id = params.get('id');

    if (!id) {
        app.innerHTML = '<div class="p-10 text-center font-black text-red-500 uppercase tracking-widest glass-panel rounded-3xl m-8">Critical Error: Missing Assessment ID</div>';
        return;
    }

    app.innerHTML = `
        <div class="min-h-screen pb-20 bg-[#020617] bg-premium-gradient relative">
            <!-- Animated Background Mesh -->
            <div class="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/40 rounded-full blur-[120px] mix-blend-screen animate-blob"></div>
                <div class="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-indigo-900/40 rounded-full blur-[100px] mix-blend-screen animate-blob animation-delay-2000"></div>
                <div class="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-emerald-900/30 rounded-full blur-[150px] mix-blend-screen animate-blob animation-delay-4000"></div>
            </div>

            <header class="glass-panel sticky top-0 z-40 px-4 py-6 border-b border-white/5 bg-black/40 backdrop-blur-xl">
                <div class="max-w-4xl mx-auto flex justify-between items-center relative z-10">
                    <div class="flex items-center gap-4">
                        <button onclick="location.hash='#assessment-bank'" class="p-3 glass-panel rounded-2xl text-purple-400 hover:text-purple-300 hover:bg-white/10 transition-colors shadow-sm border border-white/10">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <h1 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300 leading-tight tracking-tight uppercase">Assessment Specs</h1>
                    </div>
                </div>
            </header>

            <main class="max-w-4xl mx-auto p-4 space-y-8 mt-8 relative z-10" id="details-content">
                <div class="animate-pulse glass-panel p-12 rounded-[40px] h-64 border border-white/10 bg-white/5"></div>
            </main>
        </div>
    `;

    const content = document.getElementById('details-content');

    const renderDetails = async () => {
        try {
            const user = getUser();
            const [assessment, classes, hierarchy] = await Promise.all([
                getAssessmentWithKeys(id),
                user ? getClassesByTeacher(user.user.uid) : [],
                getHierarchy()
            ]);
            const status = assessment.status || 'draft';
            const isActive = status === 'active';

            // Get assigned class names for display
            const assignedIds = assessment.assignedClassIds || (assessment.assignedClassId ? [assessment.assignedClassId] : []);
            const assignedClasses = classes.filter(c => assignedIds.includes(c.id));

            const statusBadge = isActive
                ? `<span class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                     <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse box-shadow-glow"></span> Active Operational Status
                   </span>`
                : `<span class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5 text-gray-400 border border-white/10">
                     Draft Mode
                   </span>`;

            content.innerHTML = `
                <div class="glass-panel bg-white/5 p-8 md:p-10 rounded-[50px] shadow-2xl border border-white/10 mb-10 relative overflow-hidden backdrop-blur-md">
                    <div class="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full -mr-32 -mt-32 blur-3xl mix-blend-screen"></div>
                    
                    <div class="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
                        <div class="flex-1">
                            <div class="flex flex-wrap items-center gap-4 mb-6">
                                ${statusBadge}
                                <span class="text-[10px] font-black text-purple-300 uppercase tracking-[0.2em] bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]">Module ID: ${id.substring(0, 8)}...</span>
                                ${assignedClasses.map(c => `<span class="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">${c.name} [${c.section}]</span>`).join('')}
                                ${assessment.settings?.oneAtATime ? '<span class="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">Discrete Delivery</span>' : ''}
                                ${assessment.settings?.randomizeOrder ? '<span class="text-[10px] font-black text-amber-300 uppercase tracking-[0.2em] bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">Random Order</span>' : ''}
                            </div>
                            <h2 class="text-3xl md:text-4xl font-black text-white leading-[1.1] tracking-tight uppercase mb-4 drop-shadow-md">${assessment.title}</h2>
                            <p class="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Initialised on ${new Date(assessment.createdAt).toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
                        </div>
                        <div class="bg-black/20 p-6 rounded-[32px] border border-white/10 shadow-inner w-full md:w-auto md:min-w-[140px] text-center backdrop-blur-sm">
                            <p class="text-4xl font-black text-white tracking-tighter drop-shadow-md">${assessment.questionCount}</p>
                            <p class="text-[10px] font-black text-purple-300 uppercase tracking-widest mt-1">Operational Items</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12 relative z-10">
                        <button id="toggle-status-btn" class="w-full ${isActive ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-purple-600 text-white border-purple-400 shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:bg-purple-500'} p-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all hover:-translate-y-0.5 active:scale-95 border backdrop-blur-sm">
                            ${isActive ? 'End Operational Window' : 'Launch Assessment'}
                        </button>
                        
                        <button onclick="window.location.hash='#taker?id=${id}'" class="w-full bg-white/5 p-5 rounded-2xl font-black uppercase text-xs tracking-widest text-white border border-white/10 shadow-sm hover:bg-white/10 transition-all backdrop-blur-sm">
                            Initialise Simulation
                        </button>

                        <button onclick="window.location.hash='#report?id=${id}'" class="w-full bg-indigo-500/10 text-indigo-300 p-5 rounded-2xl font-black uppercase text-xs tracking-widest border border-indigo-500/20 shadow-sm hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-3 backdrop-blur-sm">
                            <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                            Generate Performance Registry
                        </button>
                        
                        <button onclick="window.location.hash='#printable?id=${id}&mode=student'" class="w-full bg-cyan-500/10 text-cyan-300 p-5 rounded-2xl font-black uppercase text-xs tracking-widest border border-cyan-500/20 shadow-sm hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-3 backdrop-blur-sm">
                            <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                            Generate Test Paper
                        </button>

                        <button onclick="window.location.hash='#printable?id=${id}&mode=key'" class="w-full bg-emerald-500/10 text-emerald-300 p-5 rounded-2xl font-black uppercase text-xs tracking-widest border border-emerald-500/20 shadow-sm hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-3 backdrop-blur-sm">
                            <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                            Generate Answer Key
                        </button>

                        <button id="clone-btn" class="w-full bg-amber-500/10 text-amber-300 p-5 rounded-2xl font-black uppercase text-xs tracking-widest border border-amber-500/20 shadow-sm hover:bg-amber-500/20 transition-all flex items-center justify-center gap-3 backdrop-blur-sm">
                            <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                            Clone Module
                        </button>
                    </div>
                    
                    <!-- Assigned Classes -->
                    ${assignedClasses.length > 0 ? `
                    <div class="mt-8 p-6 bg-black/20 rounded-3xl border border-white/5 backdrop-blur-sm">
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Assigned Sectors</p>
                        <div class="flex flex-wrap gap-2">
                            ${assignedClasses.map(c => `<span class="px-4 py-2 bg-white/5 text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-sm">${c.name} [${c.section}]</span>`).join('')}
                        </div>
                    </div>
                    ` : '<p class="text-center text-[10px] font-black text-gray-500 mt-6 uppercase tracking-widest">Public Access Protocol (No Class Restrictions)</p>'}
                    
                    ${isActive ? `<p class="text-center text-[10px] font-black text-green-400 mt-6 uppercase tracking-[0.2em] animate-pulse drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]">Tele-Access is currently open for student enrolment</p>` : ''}
                </div>

                <!-- Section Configuration Panel -->
                ${(assessment.sections && assessment.sections.length > 0) ? `
                <div class="space-y-6">
                    <div class="flex justify-between items-center px-4">
                        <h3 class="text-xl font-black text-white uppercase tracking-[0.2em]">Sector Configuration</h3>
                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">${assessment.sections.length} Sector(s)</span>
                    </div>
                    ${assessment.sections.map((sec, idx) => {
                const totalItems = (sec.distribution?.EASY || 0) + (sec.distribution?.MODERATE || 0) + (sec.distribution?.DIFFICULT || 0);
                return `
                        <div class="glass-panel bg-white/5 p-8 rounded-[40px] border border-white/10 shadow-xl relative overflow-hidden backdrop-blur-md">
                            <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16 blur-3xl mix-blend-screen"></div>
                            <div class="relative z-10 w-full overflow-hidden">
                                <div class="flex flex-col md:flex-row md:items-center justify-between mb-6">
                                    <div class="flex flex-wrap md:flex-nowrap items-center gap-3">
                                        <div class="w-8 h-8 bg-indigo-500/20 border border-indigo-500/30 rounded-xl flex items-center justify-center text-[10px] font-black text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)] shrink-0">${idx + 1}</div>
                                        <span class="text-xs font-black text-white uppercase tracking-tight">${sec.title || 'Untitled Sector'}</span>
                                        ${!isActive ? `<button class="edit-sector-btn ml-2 px-4 py-2 rounded-xl bg-purple-600 border border-purple-400 text-white hover:bg-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.3)] transition uppercase font-black text-[10px] tracking-widest shrink-0" data-idx="${idx}">Edit Setup</button>` : ''}
                                    </div>
                                    <div class="flex flex-wrap md:flex-nowrap items-center gap-2 mt-4 md:mt-0">
                                        <span class="text-[10px] font-black text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 uppercase tracking-widest">${totalItems} Items</span>
                                        <span class="text-[10px] font-black text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20 uppercase tracking-widest">${sec.pointsPerQuestion || 1} Pts/Q</span>
                                    </div>
                                </div>
                                
                                <!-- Topics -->
                                ${sec.topics && sec.topics.length > 0 ? `
                                <div class="flex flex-wrap gap-2 mb-6">
                                    ${sec.topics.map(t => `<span class="px-4 py-1.5 bg-white/5 text-gray-300 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">${t}</span>`).join('')}
                                </div>
                                ` : '<p class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 italic">No topic constraints</p>'}

                                <!-- Distribution -->
                                <div class="flex items-center gap-6 p-4 bg-black/20 rounded-2xl border border-white/5 backdrop-blur-sm">
                                    <div class="flex items-center gap-2">
                                        <span class="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                        <span class="text-[10px] font-black text-gray-300 uppercase">${sec.distribution?.EASY || 0} Easy</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
                                        <span class="text-[10px] font-black text-gray-300 uppercase">${sec.distribution?.MODERATE || 0} Moderate</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                                        <span class="text-[10px] font-black text-gray-300 uppercase">${sec.distribution?.DIFFICULT || 0} Difficult</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        `;
            }).join('')}
                </div>
                ` : ''}

                <div class="space-y-8">
                    <h3 class="text-xl font-black text-white uppercase tracking-[0.2em] px-4">Registry Preview</h3>
                    ${assessment.questions.map((q, idx) => {
                const correctAnswer = assessment.keys && assessment.keys[q.id] ? assessment.keys[q.id] : null;

                return `
                        <div class="glass-panel bg-white/5 p-8 rounded-[40px] border border-white/10 shadow-xl relative overflow-hidden group backdrop-blur-md">
                             ${isActive ? '<div class="absolute inset-0 bg-black/60 backdrop-blur-[4px] z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span class="font-black text-[10px] uppercase tracking-[0.3em] text-cyan-300 bg-cyan-900/40 border border-cyan-500/30 px-6 py-3 rounded-2xl shadow-[0_0_15px_rgba(6,182,212,0.2)]">Encryption Locked (Active Session)</span></div>' : ''}
                            <div class="flex justify-between items-center mb-6">
                                <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Item Reference ${idx + 1}</span>
                                <span class="text-[10px] font-black text-purple-300 bg-purple-500/10 px-4 py-1.5 rounded-full border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)] uppercase tracking-widest">${q.type}</span>
                            </div>
                            <p class="text-white font-extrabold text-lg mb-6 leading-relaxed drop-shadow-sm">${q.text || 'No operational data provided'}</p>
                            
                             ${q.choices && q.choices.length > 0 ? `
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    ${q.choices.map(opt => {
                    const textValue = typeof opt === 'string' ? opt : opt.text;
                    const isCorrect = correctAnswer === textValue;
                    return `
                                        <div class="p-4 rounded-2xl text-[13px] font-bold border transition-colors relative overflow-hidden ${isCorrect ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-black/20 text-gray-300 border-white/5 shadow-inner backdrop-blur-sm'}">
                                            ${isCorrect ? '<div class="absolute right-0 top-0 h-full w-12 bg-emerald-500/10 flex items-center justify-center border-l border-emerald-500/20"><svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div>' : ''}
                                            <span class="${isCorrect ? 'pr-10 block' : ''}">${textValue}</span>
                                        </div>
                                    `}).join('')}
                                </div>
                            ` : ``}
                            
                            ${(!q.choices || q.choices.length === 0) && correctAnswer ? `
                                <div class="mt-4 p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl relative overflow-hidden">
                                     <div class="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                                     <span class="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-2 opacity-80">Verified Key</span>
                                     <p class="text-[13px] font-bold text-emerald-50 relative z-10">${Array.isArray(correctAnswer) ? correctAnswer.map(c => `• ${typeof c === 'object' ? JSON.stringify(c) : c}`).join('<br>') : typeof correctAnswer === 'object' ? JSON.stringify(correctAnswer) : correctAnswer}</p>
                                </div>
                            ` : ''}
                            
                            ${(!q.choices || q.choices.length === 0) && !correctAnswer ? `
                                <div class="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                                     <span class="text-[10px] font-black uppercase tracking-widest text-amber-400">Manual Evaluation Required</span>
                                </div>
                            ` : ''}
                        </div>
                    `}).join('')}
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

            document.getElementById('clone-btn').onclick = () => {
                // Show class selection modal
                const modal = document.createElement('div');
                modal.id = 'clone-modal';
                modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300';
                modal.innerHTML = `
                    <div class="glass-panel bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 rounded-[40px] p-10 max-w-lg w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-8 duration-500 relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full -mr-32 -mt-32 blur-3xl mix-blend-screen pointer-events-none"></div>
                        <div class="relative z-10">
                            <h3 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300 uppercase tracking-tight mb-2">Clone for Other Sectors</h3>
                            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">Select which classes to assign to the cloned assessment</p>
                            
                            <div class="flex flex-wrap gap-2 mb-8 p-4 bg-black/40 rounded-3xl border border-white/5 min-h-[100px] max-h-[240px] overflow-y-auto">
                                ${classes.length > 0 ? classes.map(c => `
                                    <label class="cursor-pointer">
                                        <input type="checkbox" class="clone-class-check hidden" data-classid="${c.id}">
                                        <div class="clone-class-chip px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all bg-white/5 text-gray-400 border-white/10 hover:border-purple-500/50 hover:bg-white/10">
                                            ${c.name} [${c.section}]
                                        </div>
                                    </label>
                                `).join('') : '<p class="text-[10px] font-black text-gray-500 uppercase tracking-widest italic flex items-center justify-center w-full h-full">No active sectors available</p>'}
                            </div>
                            
                            <div class="flex gap-4">
                                <button id="cancel-clone" class="flex-1 p-5 glass-panel rounded-2xl font-black uppercase text-xs tracking-widest text-gray-300 border border-white/10 hover:bg-white/10 transition-colors">Cancel</button>
                                <button id="confirm-clone" class="flex-1 p-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:bg-purple-500 transition-colors">Clone Module</button>
                            </div>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);

                // Wire up checkbox styling
                modal.querySelectorAll('.clone-class-check').forEach(cb => {
                    cb.onchange = (e) => {
                        const chip = e.target.nextElementSibling;
                        if (e.target.checked) {
                            chip.classList.remove('bg-white/5', 'text-gray-400', 'border-white/10', 'hover:border-purple-500/50', 'hover:bg-white/10');
                            chip.classList.add('bg-purple-600', 'text-white', 'border-purple-400', 'shadow-[0_0_15px_rgba(147,51,234,0.3)]');
                        } else {
                            chip.classList.add('bg-white/5', 'text-gray-400', 'border-white/10', 'hover:border-purple-500/50', 'hover:bg-white/10');
                            chip.classList.remove('bg-purple-600', 'text-white', 'border-purple-400', 'shadow-[0_0_15px_rgba(147,51,234,0.3)]');
                        }
                    };
                });

                document.getElementById('cancel-clone').onclick = () => modal.remove();

                document.getElementById('confirm-clone').onclick = async () => {
                    const selectedIds = Array.from(modal.querySelectorAll('.clone-class-check:checked')).map(cb => cb.dataset.classid);
                    const confirmBtn = document.getElementById('confirm-clone');
                    confirmBtn.disabled = true;
                    confirmBtn.textContent = 'CLONING...';
                    try {
                        const newId = await cloneAssessment(id, selectedIds);
                        modal.remove();
                        window.location.hash = `#details?id=${newId}`;
                    } catch (err) {
                        alert("Clone failed: " + err.message);
                        confirmBtn.disabled = false;
                        confirmBtn.textContent = 'Clone Module';
                    }
                };
            };

            // Edit Sector Logic
            document.querySelectorAll('.edit-sector-btn').forEach(btn => {
                btn.onclick = (e) => {
                    const idx = parseInt(e.target.dataset.idx);
                    const sec = assessment.sections[idx];

                    const modal = document.createElement('div');
                    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col p-4 overflow-y-auto custom-scrollbar animate-in fade-in duration-300';

                    // Local state clone for this editor
                    const localSec = JSON.parse(JSON.stringify(sec));
                    if (!localSec.distribution) localSec.distribution = { ANY: 5, EASY: 0, MODERATE: 0, DIFFICULT: 0 };

                    const renderEditModalContent = () => {
                        const availableTopics = hierarchy.topics[localSec.course] || [];

                        modal.innerHTML = `
                            <div class="m-auto glass-panel bg-[#0f172a]/95 border border-white/10 rounded-[40px] p-8 max-w-3xl w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
                                <h3 class="text-2xl font-black text-white mb-6 uppercase">Edit Sector ${idx + 1}: ${localSec.title}</h3>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <!-- Config Inputs -->
                                    <div>
                                        <label class="text-[10px] uppercase font-black text-white/40 tracking-widest mb-2 block">Knowledge Domain (Course)</label>
                                        <select id="edit-course" class="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-white font-bold outline-none cursor-pointer">
                                            <option value="">-- SELECT COURSE --</option>
                                            ${hierarchy.courses.map(c => `<option value="${c}" ${localSec.course === c ? 'selected' : ''}>${c.toUpperCase()}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div>
                                        <label class="text-[10px] uppercase font-black text-white/40 tracking-widest mb-2 block">Item Type</label>
                                        <select id="edit-type" class="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-white font-bold outline-none cursor-pointer">
                                            ${['ALL', 'MCQ', 'TRUE_FALSE', 'IDENTIFICATION', 'MATCHING', 'ORDERING'].map(t => `<option value="${t}" ${localSec.type === t ? 'selected' : ''}>${t.replace('_', ' ')}</option>`).join('')}
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="mb-8 p-6 bg-black/20 rounded-3xl border border-white/5">
                                    <label class="text-[10px] uppercase font-black text-white/40 tracking-widest mb-4 block">Topic Constraints</label>
                                    <div class="flex flex-wrap gap-2">
                                        ${availableTopics.length > 0 ? availableTopics.map(t => `
                                            <label class="cursor-pointer">
                                                <input type="checkbox" class="edit-topic-check hidden" value="${t}" ${localSec.topics.includes(t) ? 'checked' : ''}>
                                                <div class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${localSec.topics.includes(t) ? 'bg-purple-600 text-white border-purple-400' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}">
                                                    ${t}
                                                </div>
                                            </label>
                                        `).join('') : '<span class="text-[10px] font-black italic text-gray-500 uppercase">Select a course first</span>'}
                                    </div>
                                </div>
                                
                                <div class="mb-8">
                                    <label class="text-[10px] uppercase font-black text-white/40 tracking-widest mb-4 block">Difficulty Distribution</label>
                                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        ${['ANY', 'EASY', 'MODERATE', 'DIFFICULT'].map(diff => `
                                            <div class="bg-black/20 p-4 rounded-2xl border border-white/5">
                                                <span class="text-[10px] font-black text-${diff === 'ANY' ? 'purple' : diff === 'EASY' ? 'green' : diff === 'MODERATE' ? 'amber' : 'red'}-400 uppercase tracking-widest block mb-1">${diff}</span>
                                                <input type="number" min="0" value="${localSec.distribution[diff] || 0}" data-diff="${diff}" class="edit-dist w-full bg-transparent text-xl font-black text-white outline-none">
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>

                                <div class="flex justify-end gap-4 mt-8">
                                    <button id="cancel-edit" class="px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] text-gray-400 hover:text-white transition">Cancel</button>
                                    <button id="save-edit" class="px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] transition">Reconfigure Sector</button>
                                </div>
                            </div>
                        `;

                        // Bind modal events
                        modal.querySelector('#edit-course').onchange = (e) => {
                            localSec.course = e.target.value;
                            localSec.topics = []; // Reset topics on course change
                            renderEditModalContent();
                        };

                        modal.querySelector('#edit-type').onchange = (e) => {
                            localSec.type = e.target.value;
                        };

                        modal.querySelectorAll('.edit-topic-check').forEach(cb => {
                            cb.onchange = (e) => {
                                if (e.target.checked) localSec.topics.push(e.target.value);
                                else localSec.topics = localSec.topics.filter(t => t !== e.target.value);
                                renderEditModalContent();
                            };
                        });

                        modal.querySelectorAll('.edit-dist').forEach(inp => {
                            inp.onchange = (e) => {
                                localSec.distribution[e.target.dataset.diff] = parseInt(e.target.value) || 0;
                            };
                        });

                        modal.querySelector('#cancel-edit').onclick = () => modal.remove();

                        modal.querySelector('#save-edit').onclick = async () => {
                            const btn = modal.querySelector('#save-edit');
                            btn.disabled = true;
                            btn.textContent = 'RECONFIGURING...';

                            try {
                                const newSections = JSON.parse(JSON.stringify(assessment.sections));
                                newSections[idx] = localSec;

                                await reconfigureAssessmentSections(id, newSections);
                                modal.remove();
                                renderDetails(); // refresh entire view
                            } catch (err) {
                                alert(err.message);
                                btn.disabled = false;
                                btn.textContent = 'Reconfigure Sector';
                            }
                        };
                    };

                    renderEditModalContent();
                    document.body.appendChild(modal);
                };
            });

        } catch (err) {
            content.innerHTML = `
                <div class="glass-panel bg-red-900/10 border border-red-500/20 text-red-400 p-12 rounded-[40px] text-center backdrop-blur-md shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                    <div class="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                        <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <p class="font-black text-2xl mb-4 uppercase tracking-tight text-white drop-shadow-md">Telemetry Protocol Failure</p>
                    <p class="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-8 leading-relaxed">${err.message}</p>
                    <button onclick="location.hash='#assessment-bank'" class="bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors px-6 py-3 rounded-xl border border-red-500/30 font-black uppercase text-[10px] tracking-[0.2em]">Return to Registry</button>
                </div>
            `;
        }
    };

    renderDetails();
};
