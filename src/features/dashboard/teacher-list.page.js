import { getUser } from '../../core/store.js';
import { getPendingInstructors, getApprovedInstructors, authorizeInstructor, demoteToStudent } from '../../services/auth.service.js';

export const TeacherListPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();

    if (!user || user.role !== 'teacher' || user.isAuthorized !== true) {
        window.location.hash = '#login';
        return;
    }

    let currentTab = 'approved'; // 'approved' | 'pending'
    let approvedTeachers = [];
    let pendingTeachers = [];

    const renderShell = () => {
        app.innerHTML = `
            <div class="relative min-h-screen bg-[#020617] pb-32">
                <!-- Dynamic Mesh Background -->
                <div class="bg-premium-gradient-fixed"></div>
                <div class="mesh-blob top-[-10%] right-[-10%] bg-indigo-600/10 scale-150"></div>
                <div class="mesh-blob bottom-[-20%] left-[-10%] bg-blue-500/10"></div>

                <div class="relative z-10 flex flex-col items-center py-4 md:py-8 px-4">
                    <div class="w-full max-w-4xl space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        
                        <!-- Header -->
                        <header class="glass-panel px-6 py-5 md:px-8 md:py-6 rounded-[35px] border border-white/10 flex flex-wrap justify-between items-center gap-4 shadow-xl">
                            <div class="flex items-center gap-4 min-w-0">
                                <button id="back-to-dash" class="p-3 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90 shadow-lg shrink-0">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                                </button>
                                <div class="min-w-0">
                                    <h1 class="text-xl md:text-2xl font-black text-white leading-tight tracking-tight truncate uppercase">Faculty Registry</h1>
                                    <p class="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mt-0.5 truncate opacity-80">Access Authorization</p>
                                </div>
                            </div>
                            <div class="h-10 w-px bg-white/10 hidden md:block"></div>
                            <div class="flex flex-col items-end">
                                <p class="text-[9px] font-black text-white/20 uppercase tracking-widest">Registry Status</p>
                                <p class="text-[10px] font-black text-white uppercase tracking-tight">Active Operations</p>
                            </div>
                        </header>

                        <main class="space-y-8 relative z-10" id="registry-content">
                            <div class="h-96 glass-panel animate-pulse rounded-[45px] border border-white/5"></div>
                        </main>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('back-to-dash').onclick = () => window.location.hash = '#teacher-dash';
    };

    const render = async () => {
        const content = document.getElementById('registry-content');
        try {
            [approvedTeachers, pendingTeachers] = await Promise.all([
                getApprovedInstructors(),
                getPendingInstructors()
            ]);

            content.innerHTML = `
                <div class="glass-panel rounded-[45px] border border-white/5 shadow-2xl overflow-hidden">
                    <!-- Tab Header -->
                    <div class="p-8 md:p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div>
                            <h3 class="text-xs font-black text-white/30 uppercase tracking-[0.4em] mb-2 pl-1">Faculty Management</h3>
                            <p class="text-[10px] text-white/20 font-medium max-w-xs">Manage institutional access and personnel authorization requests.</p>
                        </div>
                        
                        <div class="flex p-1.5 bg-white/5 rounded-[26px] border border-white/5 shadow-inner">
                            <button id="tab-approved" class="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${currentTab === 'approved' ? 'bg-white/10 text-indigo-400 shadow-xl ring-1 ring-indigo-400/20' : 'text-white/30 hover:text-white/50'}">
                                Active (${approvedTeachers.length})
                            </button>
                            <button id="tab-pending" class="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${currentTab === 'pending' ? 'bg-white/10 text-amber-400 shadow-xl ring-1 ring-amber-400/20' : 'text-white/30 hover:text-white/50 relative'}">
                                Requests (${pendingTeachers.length})
                                ${pendingTeachers.length > 0 && currentTab !== 'pending' ? '<span class="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>' : ''}
                            </button>
                        </div>
                    </div>

                    <div class="p-8 md:p-12 animate-in fade-in duration-500">
                        ${currentTab === 'approved' ? renderApproved() : renderPending()}
                    </div>
                </div>
            `;

            setupListeners();
        } catch (err) {
            content.innerHTML = `
                <div class="glass-panel p-20 text-center rounded-[45px] border border-red-500/20">
                    <div class="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <p class="font-black text-red-500 uppercase tracking-widest text-xs">Registry Connection Protocol Failure</p>
                    <p class="text-white/30 text-[10px] mt-2">${err.message}</p>
                </div>
            `;
        }
    };

    const renderApproved = () => {
        if (approvedTeachers.length === 0) {
            return `
                <div class="p-20 text-center glass-panel rounded-[40px] border border-dashed border-white/10">
                    <p class="text-xs text-white/20 font-black uppercase tracking-widest italic">Electronic registry empty</p>
                </div>
            `;
        }

        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${approvedTeachers.map(t => {
            const isSelf = t.uid === user.user.uid;
            return `
                    <div class="group relative glass-panel p-6 rounded-[35px] border border-white/5 hover:border-indigo-500/30 transition-all shadow-xl overflow-hidden active:scale-[0.99]">
                        <div class="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div class="flex items-center justify-between gap-4 relative z-10">
                            <div class="flex items-center gap-5">
                                <div class="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 font-black text-lg border border-white/5 ring-1 ring-white/5 group-hover:bg-indigo-500/20 transition-all">
                                    ${t.displayName ? t.displayName[0].toUpperCase() : 'U'}
                                </div>
                                <div class="min-w-0">
                                    <h4 class="font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight truncate">${t.displayName || 'Unnamed Personnel'}</h4>
                                    <p class="text-[10px] text-white/30 font-bold tracking-widest truncate">${t.email}</p>
                                </div>
                            </div>
                            
                            ${!isSelf ? `
                                <button data-uid="${t.uid}" class="revoke-btn p-3 bg-white/5 border border-white/5 rounded-2xl text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100" title="Revoke Authorization">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            ` : `
                                <div class="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                                    <span class="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Master</span>
                                </div>
                            `}
                        </div>
                    </div>
                `}).join('')}
            </div>
        `;
    };

    const renderPending = () => {
        if (pendingTeachers.length === 0) {
            return `
                <div class="p-20 text-center glass-panel rounded-[40px] border border-dashed border-white/10">
                    <p class="text-xs text-white/20 font-black uppercase tracking-widest italic">No pending authorization requests</p>
                </div>
            `;
        }

        return `
            <div class="space-y-6">
                ${pendingTeachers.map(p => `
                    <div class="group glass-panel p-8 rounded-[40px] border border-amber-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 hover:border-amber-500/30 transition-all shadow-xl relative overflow-hidden">
                        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/50 to-transparent"></div>
                        
                        <div class="flex items-center gap-6">
                            <div class="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 font-black text-xl border border-amber-500/20 shadow-inner group-hover:scale-110 transition-transform">
                                ${p.displayName ? p.displayName[0].toUpperCase() : 'U'}
                            </div>
                            <div>
                                <h4 class="font-black text-white text-lg uppercase tracking-tight">${p.displayName || 'Pending Personnel'}</h4>
                                <p class="text-[10px] text-white/30 font-bold tracking-widest">${p.email}</p>
                                <div class="flex items-center gap-2 mt-2">
                                    <span class="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                                    <p class="text-[9px] text-amber-400/80 font-black uppercase tracking-[0.2em]">${p.course || 'Unassigned Department'}</p>
                                </div>
                            </div>
                        </div>

                        <div class="flex gap-4 w-full md:w-auto mt-4 md:mt-0">
                            <button data-uid="${p.uid}" class="reject-btn flex-1 md:flex-none px-8 py-4 bg-white/5 text-white/30 border border-white/5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all">Reject</button>
                            <button data-uid="${p.uid}" class="approve-btn flex-1 md:flex-none px-8 py-4 bg-amber-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all outline-none border border-white/20">Grant Access</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    };

    const setupListeners = () => {
        document.getElementById('tab-approved').onclick = () => { currentTab = 'approved'; render(); };
        document.getElementById('tab-pending').onclick = () => { currentTab = 'pending'; render(); };

        document.querySelectorAll('.approve-btn').forEach(btn => {
            btn.onclick = async (e) => {
                const uid = e.currentTarget.dataset.uid;
                e.currentTarget.disabled = true;
                e.currentTarget.textContent = 'Processing...';
                try {
                    await authorizeInstructor(uid);
                    render();
                } catch (err) {
                    alert("Authorization protocol failed");
                    e.currentTarget.disabled = false;
                    e.currentTarget.textContent = 'Grant Access';
                }
            };
        });

        document.querySelectorAll('.reject-btn').forEach(btn => {
            btn.onclick = async (e) => {
                const uid = e.currentTarget.dataset.uid;
                if (!confirm("Terminate authorization request? Personnel will be restricted to student-tier access.")) return;

                e.currentTarget.disabled = true;
                e.currentTarget.textContent = '...';
                try {
                    await demoteToStudent(uid);
                    render();
                } catch (err) {
                    alert("Termination protocol failed");
                    e.currentTarget.disabled = false;
                    e.currentTarget.textContent = 'Reject';
                }
            };
        });

        document.querySelectorAll('.revoke-btn').forEach(btn => {
            btn.onclick = async (e) => {
                const uid = e.currentTarget.dataset.uid;
                if (!confirm("REVOKE INSTITUTIONAL ACCESS: This will instantly remove instructor privileges. Continue?")) return;

                e.currentTarget.disabled = true;
                try {
                    await demoteToStudent(uid);
                    render();
                } catch (err) {
                    alert("Revocation failed");
                    e.currentTarget.disabled = false;
                }
            };
        });
    };

    renderShell();
    render();
};
