import { renderButton } from '../../shared/button.js';
import { renderInput } from '../../shared/input.js';
import { getUser } from '../../core/store.js';
import { renderModal, setupModalListeners } from '../../shared/modal.js';
import { updateUserProfile } from '../../services/auth.service.js';
import { getAssessments } from '../../services/assessment.service.js';
import { getQuestions } from '../../services/question-bank.service.js';
import { getClassesByTeacher } from '../../services/class.service.js';

export const TeacherDashPage = async () => {
    const app = document.getElementById('app');
    const user = getUser(); // { user: {uid, email}, role: 'teacher' }

    if (!user) {
        window.location.hash = '#login';
        return;
    }

    const userName = user.displayName || 'Teacher';

    // --- Helper UI Functions ---
    const renderStatCard = (title, value, icon, colorClass) => `
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div class="w-12 h-12 ${colorClass} rounded-xl flex items-center justify-center shrink-0">
                ${icon}
            </div>
            <div>
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">${title}</p>
                <p class="text-2xl font-bold text-gray-900">${value}</p>
            </div>
        </div>
    `;

    // --- Initial Shell ---
    app.innerHTML = `
        <div class="bg-gray-50 min-h-screen pb-20">
            <!-- Header -->
            <header class="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 p-4 sticky top-0 z-40">
                <div class="max-w-5xl mx-auto flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                        </div>
                        <div>
                            <h1 class="text-xl font-black text-gray-900 leading-tight">Teacher Console</h1>
                            <div class="flex items-center gap-2">
                                <p class="text-xs text-gray-500 font-medium">${userName}</p>
                                <span class="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <button id="edit-profile-btn" class="text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:text-blue-700">Settings</button>
                            </div>
                        </div>
                    </div>
                    <button id="logout-btn" class="p-2 text-gray-400 hover:text-red-500 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    </button>
                </div>
            </header>

            <main class="max-w-5xl mx-auto p-4 space-y-8 mt-4">
                
                <!-- Stats Overview -->
                <section id="stats-container" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="h-24 bg-gray-200 animate-pulse rounded-2xl"></div>
                    <div class="h-24 bg-gray-200 animate-pulse rounded-2xl"></div>
                </section>

                <!-- Quick Actions -->
                <section>
                    <h2 class="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4 pl-1">Management</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div onclick="location.hash='#bank'" class="group bg-blue-600 p-8 rounded-3xl shadow-xl shadow-blue-100 cursor-pointer active:scale-[0.98] transition-all outline outline-0 outline-blue-200 hover:outline-8">
                            <div class="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                            </div>
                            <h3 class="font-black text-white text-2xl">Question Library</h3>
                            <p class="text-blue-100 text-xs font-bold uppercase tracking-widest mt-2 opacity-80">Catalog Questions</p>
                        </div>

                        <div onclick="location.hash='#assessment-bank'" class="group bg-purple-600 p-8 rounded-3xl shadow-xl shadow-purple-100 cursor-pointer active:scale-[0.98] transition-all outline outline-0 outline-purple-200 hover:outline-8">
                            <div class="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <h3 class="font-black text-white text-2xl">Assessments</h3>
                            <p class="text-purple-100 text-xs font-bold uppercase tracking-widest mt-2 opacity-80">Create & Monitor</p>
                        </div>

                        <div onclick="location.hash='#class-manager'" class="group bg-emerald-600 p-8 rounded-3xl shadow-xl shadow-emerald-100 cursor-pointer active:scale-[0.98] transition-all outline outline-0 outline-emerald-200 hover:outline-8 md:col-span-2">
                            <div class="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            </div>
                            <h3 class="font-black text-white text-2xl">Class Manager</h3>
                            <p class="text-emerald-100 text-xs font-bold uppercase tracking-widest mt-2 opacity-80">Students & Enrolment</p>
                        </div>
                    </div>
                </section>

            </main>
            
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

    // 1. Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        window.location.hash = '#login';
    });

    // Profile Logic
    setupModalListeners('profile-modal');
    document.getElementById('edit-profile-btn').addEventListener('click', () => {
        document.getElementById('profile-modal').classList.remove('hidden');
    });
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newName = document.getElementById('profile-name').value;
        const btn = e.target.querySelector('button');
        btn.disabled = true;
        btn.textContent = 'Saving Changes...';

        try {
            await updateUserProfile(user.user.uid, { displayName: newName });
            document.getElementById('profile-modal').classList.add('hidden');
            TeacherDashPage();
        } catch (err) {
            console.error(err);
            alert("Failed to update profile");
        } finally {
            btn.disabled = false;
            btn.textContent = 'Save Profile Changes';
        }
    });

    // 2. Fetch Data & Stats
    const loadDashboardData = async () => {
        const statsContainer = document.getElementById('stats-container');

        try {
            // Fetch everything in parallel
            const [classes, assessments, questions] = await Promise.all([
                getClassesByTeacher(user.user.uid),
                getAssessments(user.user.uid),
                getQuestions()
            ]);

            // Update Stats
            const totalStudents = classes.reduce((sum, c) => sum + (c.students?.length || 0), 0);
            statsContainer.innerHTML = `
                ${renderStatCard('Total Students', totalStudents,
                '<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>',
                'bg-blue-50')}
                ${renderStatCard('Assessments', assessments.length,
                    '<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>',
                    'bg-purple-50')}
                ${renderStatCard('Question Bank', questions.length,
                        '<svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>',
                        'bg-emerald-50')}
            `;

        } catch (error) {
            console.error(error);
            statsContainer.innerHTML = '<div class="text-red-500 text-center py-4 bg-red-50 rounded-2xl border border-red-100 col-span-full">Failed to load dashboard statistics.</div>';
        }
    };

    loadDashboardData();

};
