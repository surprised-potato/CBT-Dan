import { renderButton } from '../../shared/button.js';
import { renderInput } from '../../shared/input.js';
import { getUser } from '../../core/store.js';
import { renderModal, setupModalListeners } from '../../shared/modal.js';
import { updateUserProfile, logoutUser, changeUserPassword } from '../../services/auth.service.js';
import { getAssessments } from '../../services/assessment.service.js';
import { getQuestions } from '../../services/question-bank.service.js';
import { getClassesByTeacher } from '../../services/class.service.js';
import { enforceProfileCompletion } from '../../core/utils.js';

export const TeacherDashPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();

    if (!user) {
        window.location.hash = '#login';
        return;
    }

    if (user.role === 'teacher' && user.isAuthorized !== true) {
        window.location.hash = '#pending-authorization';
        return;
    }

    const userName = user.displayName || 'Teacher';

    // --- Helper UI Functions ---
    const renderStatCard = (title, value, icon, colorClass, glowClass) => `
        <div class="glass-panel p-6 rounded-[32px] shadow-sm border border-white/5 flex items-center gap-5 hover:shadow-lg transition-all relative overflow-hidden group">
            <div class="absolute inset-0 bg-gradient-to-br ${glowClass} opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div class="w-14 h-14 ${colorClass} rounded-2xl flex items-center justify-center shrink-0 shadow-lg relative z-10">
                ${icon}
            </div>
            <div class="relative z-10">
                <p class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">${title}</p>
                <p class="text-3xl font-black text-white tracking-tighter">${value}</p>
            </div>
        </div>
    `;

    const isEmailUser = user.user?.providerData?.some(p => p.providerId === 'password') || false;

    // --- Initial Shell ---
    app.innerHTML = `
        <div class="relative min-h-screen bg-[#020617]">
            <!-- Dynamic Mesh Background -->
            <div class="bg-premium-gradient-fixed"></div>
            <div class="mesh-blob top-[-10%] right-[-10%] bg-blue-600/10"></div>
            <div class="mesh-blob bottom-[-10%] left-[-10%] bg-indigo-600/10"></div>

            <div class="relative z-10 flex flex-col items-center py-4 md:py-8 px-4">
                <div class="w-full max-w-2xl space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    
                    <!-- Header -->
                    <header class="glass-panel sticky top-4 z-40 px-6 py-5 md:px-8 md:py-7 rounded-[35px] border border-white/10 flex justify-between items-center shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)]">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl md:rounded-2xl flex items-center justify-center shadow-[0_10px_25px_rgba(37,99,235,0.4)] relative">
                                <div class="absolute inset-0 bg-blue-400 rounded-xl md:rounded-2xl animate-pulse opacity-20 blur-lg"></div>
                                <svg class="w-6 h-6 md:w-7 md:h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                            </div>
                            <div>
                                <h1 class="text-lg md:text-xl font-black text-white leading-tight tracking-tight uppercase">Cognita</h1>
                                <div class="flex items-center gap-2 mt-0.5">
                                    <p class="text-[11px] text-white/60 font-medium">${userName}</p>
                                    <span class="w-1 h-1 bg-white/20 rounded-full"></span>
                                    <button id="edit-profile-btn" class="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300">Settings</button>
                                </div>
                            </div>
                        </div>
                        <button id="logout-btn" class="p-3 bg-white/5 border border-white/5 rounded-2xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-90">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        </button>
                    </header>

                <main class="space-y-8 md:space-y-12 relative z-10 w-full">
                
                <!-- Stats Overview -->
                <section id="stats-container" class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div class="h-28 glass-panel animate-pulse rounded-[32px] border border-white/5"></div>
                    <div class="h-28 glass-panel animate-pulse rounded-[32px] border border-white/5"></div>
                    <div class="h-28 glass-panel animate-pulse rounded-[32px] border border-white/5"></div>
                </section>

                <!-- Management Actions -->
                <section class="space-y-6">
                    <div class="flex items-center gap-3 pl-1">
                        <h2 class="text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">Administrative Core</h2>
                        <div class="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
                    </div>
                    
                    <div class="grid grid-cols-1 gap-6">
                        <!-- Card: Bank -->
                        <div onclick="location.hash='#bank'" class="group relative glass-panel p-8 rounded-[40px] border border-white/5 cursor-pointer overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_30px_60px_-15px_rgba(37,99,235,0.3)] hover:border-blue-500/30 active:scale-[0.98]">
                            <div class="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div class="flex items-center gap-6">
                                    <div class="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[22px] flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                    </div>
                                    <div>
                                        <h3 class="font-black text-white text-2xl tracking-tight group-hover:text-blue-400 transition-all">Question Library</h3>
                                        <p class="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Manage Curriculum & Items</p>
                                    </div>
                                </div>
                                <div class="flex items-center justify-between p-4 bg-white/5 rounded-[22px] text-white/20 group-hover:bg-blue-600 group-hover:text-white transition-all border border-white/5 group-hover:border-blue-400/30">
                                    <span class="text-[9px] font-black uppercase tracking-[0.3em] ml-2">Open Repository</span>
                                    <svg class="w-5 h-5 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                </div>
                            </div>
                        </div>

                        <!-- Card: Assessments -->
                        <div onclick="location.hash='#assessment-bank'" class="group relative glass-panel p-8 rounded-[40px] border border-white/5 cursor-pointer overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_30px_60px_-15px_rgba(147,51,234,0.3)] hover:border-purple-500/30 active:scale-[0.98]">
                            <div class="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full -mr-20 -mt-20 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div class="flex items-center gap-6">
                                    <div class="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[22px] flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    </div>
                                    <div>
                                        <h3 class="font-black text-white text-2xl tracking-tight group-hover:text-purple-400 transition-colors">Assessments</h3>
                                        <p class="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Deploy & Monitor Exams</p>
                                    </div>
                                </div>
                                <div class="flex items-center justify-between p-4 bg-white/5 rounded-[22px] text-white/20 group-hover:bg-purple-600 group-hover:text-white transition-all border border-white/5 group-hover:border-purple-400/30">
                                    <span class="text-[9px] font-black uppercase tracking-[0.3em] ml-2">Manage Modules</span>
                                    <svg class="w-5 h-5 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                </div>
                            </div>
                        </div>

                        <!-- Card: Class Manager -->
                        <div onclick="location.hash='#class-manager'" class="group relative glass-panel p-8 rounded-[40px] border border-white/5 cursor-pointer overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_30px_60px_-15px_rgba(16,185,129,0.3)] hover:border-emerald-500/30 active:scale-[0.98]">
                            <div class="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-20 -mt-20 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div class="flex items-center gap-6">
                                    <div class="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[22px] flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                    </div>
                                    <div>
                                        <h3 class="font-black text-white text-2xl tracking-tight group-hover:text-emerald-400 transition-colors">Class Manager</h3>
                                        <p class="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Cohorts & Performance</p>
                                    </div>
                                </div>
                                <div class="flex items-center justify-between p-4 bg-white/5 rounded-[22px] text-white/20 group-hover:bg-emerald-600 group-hover:text-white transition-all border border-white/5 group-hover:border-emerald-400/30">
                                    <span class="text-[9px] font-black uppercase tracking-[0.3em] ml-2">Cohort Registry</span>
                                    <svg class="w-5 h-5 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Card: Faculty Registry -->
                            <div onclick="location.hash='#teacher-list'" class="group relative glass-panel p-6 rounded-[40px] border border-white/5 cursor-pointer overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl hover:border-amber-500/30 active:scale-[0.98]">
                                <div class="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:opacity-100 transition-opacity"></div>
                                <div class="relative z-10 flex flex-col gap-4">
                                    <div class="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                    </div>
                                    <div>
                                        <h3 class="font-black text-white text-lg tracking-tight group-hover:text-amber-400 transition-colors uppercase">Faculty</h3>
                                        <p class="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] mt-1">Registry Control</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Card: Attendance Terminal -->
                            <div onclick="location.hash='#attendance-terminal'" class="group relative glass-panel p-6 rounded-[40px] border border-white/5 cursor-pointer overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl hover:border-green-500/30 active:scale-[0.98]">
                                <div class="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:opacity-100 transition-opacity"></div>
                                <div class="relative z-10 flex flex-col gap-4">
                                    <div class="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v0m6 0v0m6 0v0M5 16h2m10 0h2m-4-6h2m-4 0h2m-4 0h2m-4 0h2m-4 0h2m-4 0h2m-8 8v2m0-10V4m0 0h2M5 4h2M5 4h2"></path></svg>
                                    </div>
                                    <div>
                                        <h3 class="font-black text-white text-lg tracking-tight group-hover:text-green-400 transition-colors uppercase">Attendance</h3>
                                        <p class="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] mt-1">Dynamic Terminal</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                </main>
            </div>

            <!-- Profile Modal -->
    ${renderModal({
        id: 'profile-modal',
        title: 'Account Settings',
        content: `
            <form id="profile-form" class="space-y-6">
                ${renderInput({ id: 'profile-name', label: 'Display Name', value: userName, placeholder: 'e.g. Dr. Richards', classes: 'bg-white/5 border-white/5 text-white placeholder:text-white/20' })}
                <p class="text-[10px] text-white/30 font-medium px-4">This name will be visible to your students on their dashboards and reports.</p>
                
                ${isEmailUser ? `
                    <div class="pt-4 border-t border-white/10">
                        ${renderInput({ id: 'profile-password', label: 'New Password', type: 'password', placeholder: 'Leave blank to keep current password', showToggle: true, classes: 'bg-white/5 border-white/5 text-white placeholder:text-white/20' })}
                    </div>
                ` : ''}

                <div id="profile-error" class="hidden text-red-400 text-[10px] font-black uppercase tracking-widest text-center bg-red-500/10 py-3 px-4 rounded-xl border border-red-500/20"></div>

                <button type="submit" class="w-full bg-blue-600 text-white p-5 rounded-[22px] font-black uppercase tracking-widest shadow-xl hover:-translate-y-1 transition-all border border-white/20">Save Profile Changes</button>
            </form>
        `
    })}

        </div>
    `;

    // --- Logic ---
    document.getElementById('logout-btn').onclick = async () => {
        await logoutUser();
        window.location.hash = '#login';
    };

    setupModalListeners('profile-modal');
    document.getElementById('edit-profile-btn').onclick = () => document.getElementById('profile-modal').classList.remove('hidden');

    document.getElementById('profile-form').onsubmit = async (e) => {
        e.preventDefault();
        const newName = document.getElementById('profile-name').value;
        const newPasswordInput = document.getElementById('profile-password');
        const errDisplay = document.getElementById('profile-error');

        let newPassword = newPasswordInput ? newPasswordInput.value.trim() : null;

        const btn = e.target.querySelector('button');
        btn.disabled = true;
        btn.textContent = 'Saving...';
        if (errDisplay) errDisplay.classList.add('hidden');

        try {
            await updateUserProfile(user.user.uid, { displayName: newName });

            if (newPassword) {
                await changeUserPassword(newPassword);
            }

            // If now complete, restore UI
            const modal = document.getElementById('profile-modal');
            const closeBtn = document.getElementById('profile-modal-close-btn');
            const title = modal?.querySelector('h3');

            if (closeBtn) closeBtn.classList.remove('hidden');
            if (title) {
                const notice = title.querySelector('.animate-pulse'); // The pulse notice
                if (notice) notice.remove();
                delete title.dataset.enforced;
            }

            document.getElementById('profile-modal').classList.add('hidden');

            // Surgical UI Update
            const nameDisplay = document.querySelector('header div p.text-xs.font-bold');
            if (nameDisplay) nameDisplay.textContent = newName;

        } catch (err) {
            console.error(err);
            if (errDisplay) {
                errDisplay.textContent = err.message || "Update failed. Error code: " + err.code;
                errDisplay.classList.remove('hidden');
            } else {
                alert("Update failed: " + err.message);
            }
        } finally {
            btn.disabled = false;
            btn.textContent = 'Save Profile Changes';
        }
    };

    const loadDashboardData = async () => {
        const statsContainer = document.getElementById('stats-container');
        try {
            const [classes, assessments, questions] = await Promise.all([
                getClassesByTeacher(user.user.uid),
                getAssessments(user.user.uid),
                getQuestions()
            ]);

            const totalStudents = classes.reduce((sum, c) => sum + (c.students?.length || 0), 0);
            statsContainer.innerHTML = `
                ${renderStatCard('Total Students', totalStudents,
                '<svg class="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>',
                'bg-blue-600/20', 'from-blue-600 to-indigo-600')}
                ${renderStatCard('Assessments', assessments.length,
                    '<svg class="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>',
                    'bg-purple-600/20', 'from-purple-600 to-indigo-600')}
                ${renderStatCard('Question Bank', questions.length,
                        '<svg class="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>',
                        'bg-emerald-600/20', 'from-emerald-600 to-teal-600')}
            `;
        } catch (error) {
            statsContainer.innerHTML = '<div class="glass-panel text-red-500 text-center py-6 col-span-full font-bold">Failed to load statistics</div>';
        }
    };

    loadDashboardData();
    enforceProfileCompletion(user, 'profile-modal');
};
