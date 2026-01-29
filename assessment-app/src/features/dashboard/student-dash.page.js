import { renderButton } from '../../shared/button.js';
import { renderInput } from '../../shared/input.js';
import { joinClass } from '../../services/class.service.js';
import { getActiveAssessments } from '../../services/assessment.service.js';
import { getUser } from '../../core/store.js';
import { renderModal, setupModalListeners } from '../../shared/modal.js';
import { updateUserProfile } from '../../services/auth.service.js';

export const StudentDashPage = () => {
    const app = document.getElementById('app');
    const user = getUser(); // { user: {uid, email}, displayName: ... }

    if (!user) {
        window.location.hash = '#login';
        return;
    }

    // Robust email check (Handle both Firestore doc and Auth object)
    const userEmail = user.email || user.user?.email || 'No Email';
    const userName = user.displayName || 'Guest Student';

    app.innerHTML = `
        <div class="bg-gray-50 min-h-screen pb-20 p-4">
            <header class="flex justify-between items-center mb-8">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">Student Dashboard</h1>
                     <p class="text-xs text-gray-500">${userName} (${userEmail})</p>
                     <button id="edit-profile-btn" class="text-xs text-blue-500 hover:underline">Edit Profile</button>
                </div>
                <button id="logout-btn" class="text-sm text-red-500 font-medium">Logout</button>
            </header>
            
            <!-- Join Class -->
            <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                <h3 class="font-bold text-lg mb-4 text-gray-800">Join a Class</h3>
                <form id="join-class-form" class="flex gap-2">
                    <div class="flex-1">
                        <input id="class-code" type="text" placeholder="Enter Class Code" class="w-full p-3 border-2 border-gray-200 rounded-lg uppercase font-mono tracking-widest focus:border-blue-500 outline-none" required maxlength="6">
                    </div>
                    <button type="submit" class="bg-blue-600 text-white px-6 rounded-lg font-bold">Join</button>
                </form>
            </section>

            <div class="grid gap-4">
                <div class="bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <h3 class="font-bold text-blue-800 mb-4">Available Assessments</h3>
                    <div id="active-assessments-list" class="space-y-3">
                        <p class="text-blue-600 animate-pulse">Checking for exams...</p>
                    </div>
                </div>
            </div>

            <!-- Profile Modal -->
            ${renderModal({
        id: 'profile-modal',
        title: 'Edit Profile',
        content: `
                    <form id="profile-form" class="space-y-4">
                        ${renderInput({ id: 'profile-name', label: 'Display Name', value: userName, placeholder: 'e.g. John Doe' })}
                        <button type="submit" class="w-full bg-blue-600 text-white p-3 rounded-lg font-bold">Save Changes</button>
                    </form>
                `
    })}
        </div>
    `;

    document.getElementById('logout-btn').addEventListener('click', () => {
        window.location.hash = '#login';
    });

    // Profile Modal Logic
    setupModalListeners('profile-modal');
    document.getElementById('edit-profile-btn').addEventListener('click', () => {
        document.getElementById('profile-modal').classList.remove('hidden');
    });

    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newName = document.getElementById('profile-name').value;
        const btn = e.target.querySelector('button');
        btn.disabled = true;
        btn.textContent = 'Saving...';

        try {
            await updateUserProfile(user.user.uid, { displayName: newName });
            document.getElementById('profile-modal').classList.add('hidden');
            // Refresh
            StudentDashPage();
        } catch (err) {
            console.error(err);
            alert("Failed to update profile");
        } finally {
            btn.disabled = false;
            btn.textContent = 'Save Changes';
        }
    });

    document.getElementById('join-class-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('class-code').value.toUpperCase();
        const btn = e.target.querySelector('button');

        btn.disabled = true;
        btn.textContent = '...';

        try {
            await joinClass(code, user.user.uid, userEmail, userName);
            alert("Joined successfully! Wait for teacher approval.");
            e.target.reset();
        } catch (error) {
            alert(error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Join';
        }
    });

    // Fetch Active Tests
    (async () => {
        const listContainer = document.getElementById('active-assessments-list');
        listContainer.innerHTML = '<div class="py-12 text-center text-blue-600 animate-pulse font-bold">Scanning for assessments...</div>';

        try {
            // 1. Get Student Classes
            const { getStudentClasses } = await import('../../services/class.service.js');
            const myClasses = await getStudentClasses(user.user.uid);
            const myClassIds = myClasses.map(c => c.id);

            console.log("Debug: Student ID:", user.user.uid);
            console.log("Debug: Enrolled Classes Found:", myClasses);

            // 2. Get Assessments (filtered by class)
            // Note: We pass myClassIds to service to filter by assignedClassId
            const rawAssessments = await getActiveAssessments(myClassIds);
            console.log("Debug: Active Assessments from Firestore:", rawAssessments);

            // Check completion for each
            const { checkSubmission } = await import('../../services/submission.service.js');
            const assessments = await Promise.all(rawAssessments.map(async (a) => {
                const completed = await checkSubmission(a.id, user.user.uid);
                return { ...a, completed };
            }));

            // 3. Group By Class
            const groups = {};

            // Initialize groups for enrolled classes (to show them even if empty)
            myClasses.forEach(c => {
                groups[c.id] = {
                    name: `${c.name} (${c.section})`,
                    code: c.code,
                    assessments: []
                };
            });

            // "Public" / General group
            const publicGroup = [];

            assessments.forEach(a => {
                if (a.assignedClassId && groups[a.assignedClassId]) {
                    groups[a.assignedClassId].assessments.push(a);
                } else if (!a.assignedClassId) {
                    publicGroup.push(a);
                }
            });

            // 4. Render
            let html = '';

            // Render Enrolled Classes Pills (Visual feedback)
            if (myClasses.length > 0) {
                html += `
                    <div class="mb-8">
                        <h4 class="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Enrolled Classes</h4>
                        <div class="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                            ${myClasses.map(c => `
                                <div class="bg-white px-5 py-2.5 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-2 whitespace-nowrap group hover:border-blue-400 transition-colors">
                                    <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <span class="font-bold text-gray-700 text-sm">${c.name}</span>
                                    <span class="text-[10px] bg-gray-50 text-gray-400 px-2 py-1 rounded-lg font-mono font-bold">${c.code}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            // Render Class Groups
            if (Object.keys(groups).length > 0) {
                Object.values(groups).forEach(group => {
                    html += `
                        <div class="mb-8 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div class="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h3 class="font-bold text-gray-900">${group.name}</h3>
                                <span class="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-lg">Class Exam</span>
                            </div>
                            <div class="divide-y divide-gray-50 bg-white">
                                ${group.assessments.length > 0
                            ? group.assessments.map(a => renderAssessmentRow(a)).join('')
                            : '<div class="p-10 text-center text-gray-400 text-sm italic">No active assessments found in this class.</div>'
                        }
                            </div>
                        </div>
                    `;
                });
            } else if (publicGroup.length === 0) {
                html += `
                    <div class="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                        <div class="mb-4 text-gray-300">
                             <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <p class="text-gray-500 mb-2 font-bold">You are not enrolled in any classes yet.</p>
                        <p class="text-sm text-blue-500 font-medium">Join a class above to see your assessments.</p>
                    </div>`;
            }

            // Render Public Group
            if (publicGroup.length > 0) {
                html += `
                    <div class="mb-8 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div class="bg-purple-50 px-6 py-4 border-b border-purple-100">
                            <h3 class="font-bold text-purple-900">General assessments</h3>
                        </div>
                        <div class="divide-y divide-gray-50 bg-white">
                            ${publicGroup.map(a => renderAssessmentRow(a)).join('')}
                        </div>
                    </div>
                `;
            }

            listContainer.innerHTML = html;

        } catch (err) {
            console.error("Student Dashboard Render Error:", err);
            listContainer.innerHTML = `
                <div class="p-10 text-center">
                    <p class="text-red-500 font-bold mb-2">Failed to load assessments</p>
                    <p class="text-xs text-gray-400">${err.message}</p>
                </div>
            `;
        }
    })();

    // Helper for Row
    const renderAssessmentRow = (a) => `
        <div class="p-5 hover:bg-gray-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-5 group">
            <div class="pl-2">
                <h4 class="font-bold text-gray-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">${a.title}</h4>
                <div class="flex items-center gap-3">
                    <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-md">${a.questionCount} Items</span>
                    ${!a.assignedClassId ? '<span class="text-[10px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 px-2 py-1 rounded-md border border-purple-100">Public Access</span>' : ''}
                </div>
            </div>
            <div class="shrink-0 flex items-center">
                ${a.completed
            ? `<button disabled class="w-full sm:w-auto bg-gray-50 text-gray-300 px-8 py-3 rounded-2xl font-bold text-sm cursor-not-allowed border border-gray-100">Completed</button>`
            : `<button onclick="window.location.hash='#taker?id=${a.id}'" class="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 hover:shadow-2xl hover:-translate-y-0.5 transition-all active:scale-95">Start Exam</button>`
        }
            </div>
        </div>
    `;
};
