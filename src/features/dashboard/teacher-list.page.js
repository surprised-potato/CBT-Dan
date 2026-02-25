import { getUser } from '../../core/store.js';
import { getPendingInstructors, getApprovedInstructors, authorizeInstructor, demoteToStudent } from '../../services/auth.service.js';

export const TeacherListPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();

    if (!user || user.role !== 'teacher' || user.isAuthorized === false) {
        window.location.hash = '#login';
        return;
    }

    let currentTab = 'approved'; // 'approved' | 'pending'
    let approvedTeachers = [];
    let pendingTeachers = [];

    app.innerHTML = `
        <div class="min-h-screen pb-20 bg-gray-50/50">
            <header class="glass-panel sticky top-0 z-40 px-4 py-6 border-b border-white/20">
                <div class="max-w-5xl mx-auto flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <button onclick="window.location.hash='#teacher-dash'" class="p-3 glass-panel rounded-2xl text-blue-600 hover:text-blue-800 transition-colors shadow-sm">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <h1 class="text-2xl font-black text-gray-900 leading-tight tracking-tight uppercase">Faculty Registry</h1>
                    </div>
                </div>
            </header>

            <main class="max-w-5xl mx-auto p-4 space-y-8 mt-8" id="registry-content">
                <div class="animate-pulse glass-panel p-12 rounded-[40px] h-64"></div>
            </main>
        </div>
    `;

    const content = document.getElementById('registry-content');

    const render = async () => {
        try {
            [approvedTeachers, pendingTeachers] = await Promise.all([
                getApprovedInstructors(),
                getPendingInstructors()
            ]);

            content.innerHTML = `
                <div class="bg-white rounded-[40px] shadow-2xl shadow-blue-50/50 border border-white overflow-hidden">
                    <div class="p-8 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/50 gap-4">
                        <h3 class="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">Instructor Administration</h3>
                        <div class="flex bg-gray-200/50 p-1 rounded-2xl glass-panel">
                            <button id="tab-approved" class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentTab === 'approved' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}">
                                Active Personnel (${approvedTeachers.length})
                            </button>
                            <button id="tab-pending" class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentTab === 'pending' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-800 relative'}">
                                Pending Requests (${pendingTeachers.length})
                                ${pendingTeachers.length > 0 && currentTab !== 'pending' ? '<span class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></span><span class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>' : ''}
                            </button>
                        </div>
                    </div>

                    <div class="p-8">
                        ${currentTab === 'approved' ? renderApproved() : renderPending()}
                    </div>
                </div>
            `;

            setupListeners();
        } catch (err) {
            content.innerHTML = `<div class="p-20 text-center glass-panel rounded-[40px] font-black text-red-500 uppercase tracking-widest text-xs">Access Violation: ${err.message}</div>`;
        }
    };

    const renderApproved = () => {
        if (approvedTeachers.length === 0) return '<div class="p-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-gray-100 rounded-3xl">No Active Instructors</div>';

        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${approvedTeachers.map(t => `
                    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-all gap-4">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black shadow-inner">
                                ${t.displayName ? t.displayName[0] : 'U'}
                            </div>
                            <div>
                                <h4 class="font-black text-gray-900 uppercase tracking-tight">${t.displayName || 'Unknown Personnel'}</h4>
                                <p class="text-[10px] text-gray-500 font-bold tracking-widest">${t.email}</p>
                            </div>
                        </div>
                        ${t.uid !== user.user.uid ? `
                            <button data-uid="${t.uid}" class="revoke-btn text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-white hover:bg-red-500 px-4 py-2 rounded-xl transition-all border border-red-100 hover:border-red-500">Revoke Access</button>
                        ` : `<span class="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">You</span>`}
                    </div>
                `).join('')}
            </div>
        `;
    };

    const renderPending = () => {
        if (pendingTeachers.length === 0) return '<div class="p-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-gray-100 rounded-3xl">No Pending Requests</div>';

        return `
            <div class="space-y-4">
                ${pendingTeachers.map(p => `
                    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-amber-50/50 border border-amber-100 rounded-3xl shadow-sm transition-all gap-4">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center font-black shadow-inner">
                                ${p.displayName ? p.displayName[0] : 'U'}
                            </div>
                            <div>
                                <h4 class="font-black text-gray-900 uppercase tracking-tight">${p.displayName || 'Unknown Personnel'}</h4>
                                <p class="text-[10px] text-gray-500 font-bold tracking-widest">${p.email}</p>
                                <p class="text-[9px] text-amber-600/80 font-black uppercase tracking-[0.2em] mt-1">${p.course || 'No Department'}</p>
                            </div>
                        </div>
                        <div class="flex gap-2 w-full sm:w-auto">
                            <button data-uid="${p.uid}" class="reject-btn flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 hover:bg-red-100 px-6 py-3 rounded-xl transition-all shadow-sm">Reject</button>
                            <button data-uid="${p.uid}" class="approve-btn flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest text-white bg-amber-500 hover:bg-amber-600 active:scale-95 px-6 py-3 rounded-xl transition-all shadow-md shadow-amber-200">Approve</button>
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
                const uid = e.target.dataset.uid;
                e.target.disabled = true;
                e.target.textContent = '...';
                try {
                    await authorizeInstructor(uid);
                    render(); // Refresh
                } catch (err) {
                    alert("Approval failed");
                    e.target.disabled = false;
                }
            };
        });

        document.querySelectorAll('.reject-btn').forEach(btn => {
            btn.onclick = async (e) => {
                const uid = e.target.dataset.uid;
                if (!confirm("Are you sure you want to reject this request?")) return;

                e.target.disabled = true;
                e.target.textContent = '...';
                try {
                    await demoteToStudent(uid);
                    render(); // Refresh
                } catch (err) {
                    alert("Rejection failed");
                    e.target.disabled = false;
                }
            };
        });

        document.querySelectorAll('.revoke-btn').forEach(btn => {
            btn.onclick = async (e) => {
                const uid = e.target.dataset.uid;
                if (!confirm("REVOKE ACCESS: This will instantly remove instructor privileges for this user. Continue?")) return;

                e.target.disabled = true;
                e.target.textContent = '...';
                try {
                    await demoteToStudent(uid);
                    render(); // Refresh
                } catch (err) {
                    alert("Revocation failed");
                    e.target.disabled = false;
                }
            };
        });
    };

    render();
};
