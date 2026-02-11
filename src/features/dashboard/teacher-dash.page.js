import { renderButton } from '../../shared/button.js';
import { renderInput } from '../../shared/input.js';
import { getUser } from '../../core/store.js';
import { renderModal, setupModalListeners } from '../../shared/modal.js';
import { updateUserProfile } from '../../services/auth.service.js';
import { getAssessments } from '../../services/assessment.service.js';
import { getQuestions } from '../../services/question-bank.service.js';
import { getClassesByTeacher } from '../../services/class.service.js';
import { getPendingInstructors, authorizeInstructor } from '../../services/auth.service.js';

export const TeacherDashPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();

    if (!user) {
        window.location.hash = '#login';
        return;
    }

    if (user.role === 'teacher' && user.isAuthorized === false) {
        window.location.hash = '#pending-authorization';
        return;
    }

    const userName = user.displayName || 'Teacher';

    // --- Helper UI Functions ---
    const renderStatCard = (title, value, icon, colorClass) => `
        <div class="glass-panel p-6 rounded-3xl shadow-sm border border-white/50 flex items-center gap-5 hover:shadow-md transition-all">
            <div class="w-14 h-14 ${colorClass} rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                ${icon}
            </div>
            <div>
                <p class="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-1">${title}</p>
                <p class="text-3xl font-black text-gray-900">${value}</p>
            </div>
        </div>
    `;

    // --- Initial Shell ---
    app.innerHTML = `
        <div class="flex items-start justify-center min-h-screen bg-premium-gradient py-8 px-4">
            <div class="bg-white w-full max-w-2xl rounded-[50px] shadow-2xl shadow-blue-200/50 animate-in fade-in slide-in-from-bottom-8 duration-700 relative overflow-hidden border border-white min-h-[90vh]">
                <div class="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-30"></div>
                
                <!-- Header -->
                <header class="glass-panel sticky top-0 z-40 px-8 py-8 border-b border-gray-100 flex justify-between items-center">
                    <div class="flex items-center gap-5">
                        <div class="w-12 h-12 bg-blue-premium rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                        </div>
                        <div>
                            <h1 class="text-2xl font-black text-gray-900 leading-tight tracking-tight">Teacher Console</h1>
                            <div class="flex items-center gap-2 mt-0.5">
                                <p class="text-xs text-gray-800 font-bold">${userName}</p>
                                <span class="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <button id="edit-profile-btn" class="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700">Account Settings</button>
                            </div>
                        </div>
                    </div>
                    <button id="logout-btn" class="p-3 glass-panel rounded-2xl text-gray-400 hover:text-red-500 transition-colors shadow-sm">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    </button>
                </header>

                <main class="p-8 space-y-12 relative z-10">
                
                <!-- Stats Overview -->
                <section id="stats-container" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="h-28 glass-panel animate-pulse rounded-3xl"></div>
                    <div class="h-28 glass-panel animate-pulse rounded-3xl"></div>
                    <div class="h-28 glass-panel animate-pulse rounded-3xl"></div>
                </section>

                <!-- Management Actions -->
                <section>
                    <div class="flex items-center gap-3 mb-6 pl-1">
                        <h2 class="text-xs font-black text-gray-600 uppercase tracking-[0.3em]">Institutional Management</h2>
                        <div class="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
                    </div>
                    
                    <div class="grid grid-cols-1 gap-6">
                        <!-- Card: Bank -->
                        <div onclick="location.hash='#bank'" class="group relative bg-white p-10 rounded-[40px] shadow-xl shadow-blue-500/10 cursor-pointer overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/40 active:scale-[0.98]">
                            <div class="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
                            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div class="flex items-center gap-8">
                                    <div class="w-20 h-20 bg-blue-premium rounded-[28px] flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                                        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                    </div>
                                    <div>
                                        <h3 class="font-black text-gray-900 text-3xl group-hover:text-blue-600 transition-all">Question Library</h3>
                                        <p class="text-gray-600 text-xs font-bold uppercase tracking-[0.2em] mt-2">Manage Curriculum & Question Items</p>
                                    </div>
                                </div>
                                <div class="mt-8 flex items-center justify-between p-5 bg-gray-50 rounded-[28px] text-gray-400 group-hover:bg-blue-600 group-hover:text-white group-hover:drop-shadow-[0_10px_20px_rgba(37,99,235,0.4)] transition-all shadow-inner border border-transparent group-hover:border-blue-400">
                                    <span class="text-[10px] font-black uppercase tracking-[0.3em] ml-2">Open Repository</span>
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                </div>
                            </div>
                        </div>

                        <!-- Card: Assessments -->
                        <div onclick="location.hash='#assessment-bank'" class="group relative bg-white p-10 rounded-[40px] shadow-xl shadow-purple-500/10 cursor-pointer overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/40 active:scale-[0.98]">
                            <div class="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
                            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div class="flex items-center gap-8">
                                    <div class="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[28px] flex items-center justify-center shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform">
                                        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    </div>
                                    <div>
                                        <h3 class="font-black text-gray-900 text-3xl group-hover:text-purple-600 transition-colors">Assessments</h3>
                                        <p class="text-gray-600 text-xs font-bold uppercase tracking-[0.2em] mt-2">Draft, Deploy & Monitor Exams</p>
                                    </div>
                                </div>
                                <div class="mt-8 flex items-center justify-between p-5 bg-gray-50 rounded-[28px] text-gray-400 group-hover:bg-purple-600 group-hover:text-white group-hover:drop-shadow-[0_10px_20px_rgba(147,51,234,0.4)] transition-all shadow-inner border border-transparent group-hover:border-purple-400">
                                    <span class="text-[10px] font-black uppercase tracking-[0.3em] ml-2">Manage Modules</span>
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                </div>
                            </div>
                        </div>

                        <!-- Card: Class Manager -->
                        <div onclick="location.hash='#class-manager'" class="group relative bg-white p-10 rounded-[40px] shadow-xl shadow-emerald-500/10 cursor-pointer overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/40 active:scale-[0.98]">
                            <div class="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
                            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div class="flex items-center gap-8">
                                    <div class="w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[28px] flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                                        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                    </div>
                                    <div>
                                        <h3 class="font-black text-gray-900 text-3xl group-hover:text-emerald-600 transition-colors">Class Manager</h3>
                                        <p class="text-gray-600 text-xs font-bold uppercase tracking-[0.2em] mt-2">Enrollment, Student Performance & Grades</p>
                                    </div>
                                </div>
                                <div class="mt-8 flex items-center justify-between p-5 bg-gray-50 rounded-[28px] text-gray-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:drop-shadow-[0_10px_20px_rgba(16,185,129,0.4)] transition-all shadow-inner border border-transparent group-hover:border-emerald-400">
                                    <span class="text-[10px] font-black uppercase tracking-[0.3em] ml-2">Cohort Registry</span>
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                                </div>
                            </div>
                        </div>

                        <!-- Card: Pending Authorizations -->
                        <div id="pending-auth-card" class="hidden animate-in zoom-in duration-500">
                             <div class="group relative bg-amber-50 p-10 rounded-[40px] shadow-xl shadow-amber-500/10 cursor-pointer overflow-hidden transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/40 border-2 border-amber-200">
                                <div class="absolute top-0 right-0 w-64 h-64 bg-amber-100 rounded-full -mr-20 -mt-20 blur-3xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
                                <div class="relative z-10">
                                    <div class="flex items-center gap-8 mb-6">
                                        <div class="w-20 h-20 bg-amber-500 rounded-[28px] flex items-center justify-center shadow-lg shadow-amber-200 group-hover:scale-110 transition-transform text-white">
                                            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                        </div>
                                        <div>
                                            <h3 class="font-black text-gray-900 text-3xl">Pending Approvals</h3>
                                            <p class="text-amber-800 text-xs font-black uppercase tracking-[0.2em] mt-2">New Instructor Enrollment Requests</p>
                                        </div>
                                    </div>
                                    <div id="pending-list" class="space-y-4">
                                        <!-- List of pending users injected here -->
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
                        ${renderInput({ id: 'profile-name', label: 'Instructor Display Name', value: userName, placeholder: 'e.g. Dr. Richards' })}
                        <p class="text-[10px] text-gray-400 font-medium">This name will be visible to your students on their dashboards and assessment reports.</p>
                        <button type="submit" class="w-full bg-blue-600 text-white p-4 rounded-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">Save Profile Changes</button>
                    </form>
                `
    })}

        </div>
    `;

    // --- Logic ---
    document.getElementById('logout-btn').onclick = () => window.location.hash = '#login';

    setupModalListeners('profile-modal');
    document.getElementById('edit-profile-btn').onclick = () => document.getElementById('profile-modal').classList.remove('hidden');

    document.getElementById('profile-form').onsubmit = async (e) => {
        e.preventDefault();
        const newName = document.getElementById('profile-name').value;
        const btn = e.target.querySelector('button');
        btn.disabled = true;
        btn.textContent = 'Saving...';
        try {
            await updateUserProfile(user.user.uid, { displayName: newName });
            document.getElementById('profile-modal').classList.add('hidden');
            location.reload();
        } catch (err) {
            alert("Update failed");
        } finally {
            btn.disabled = false;
        }
    };

    const loadDashboardData = async () => {
        const statsContainer = document.getElementById('stats-container');
        try {
            const [classes, assessments, questions, pending] = await Promise.all([
                getClassesByTeacher(user.user.uid),
                getAssessments(user.user.uid),
                getQuestions(),
                getPendingInstructors()
            ]);

            // Handle Pending UI
            if (pending.length > 0) {
                const pendingCard = document.getElementById('pending-auth-card');
                const pendingList = document.getElementById('pending-list');
                pendingCard.classList.remove('hidden');
                pendingList.innerHTML = pending.map(p => `
                    <div class="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-amber-200 backdrop-blur-sm">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 font-black">
                                ${p.displayName?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <p class="text-xs font-black text-gray-900 uppercase tracking-wider">${p.displayName || 'Unknown Personnel'}</p>
                                <p class="text-[10px] text-gray-500 font-bold">${p.course || 'No Department'}</p>
                            </div>
                        </div>
                        <button data-uid="${p.uid}" class="approve-btn bg-amber-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 active:scale-95 transition-all shadow-md shadow-amber-200">Approve</button>
                    </div>
                `).join('');

                pendingList.querySelectorAll('.approve-btn').forEach(btn => {
                    btn.onclick = async (e) => {
                        const uid = e.target.dataset.uid;
                        e.target.disabled = true;
                        e.target.textContent = '...';
                        try {
                            await authorizeInstructor(uid);
                            loadDashboardData(); // Refresh
                        } catch (err) {
                            alert("Approval failed");
                            e.target.disabled = false;
                        }
                    };
                });
            } else {
                document.getElementById('pending-auth-card').classList.add('hidden');
            }

            const totalStudents = classes.reduce((sum, c) => sum + (c.students?.length || 0), 0);
            statsContainer.innerHTML = `
                ${renderStatCard('Total Students', totalStudents,
                '<svg class="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>',
                'bg-blue-50')}
                ${renderStatCard('Assessments', assessments.length,
                    '<svg class="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>',
                    'bg-purple-50')}
                ${renderStatCard('Question Bank', questions.length,
                        '<svg class="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>',
                        'bg-emerald-50')}
            `;
        } catch (error) {
            statsContainer.innerHTML = '<div class="glass-panel text-red-500 text-center py-6 col-span-full font-bold">Failed to load statistics</div>';
        }
    };

    loadDashboardData();
};
