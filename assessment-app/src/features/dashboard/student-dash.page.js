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
                    <div id="active-assessments-list" class="space-y-6">
                        <p class="text-blue-600 animate-pulse font-bold">Scanning for assessments...</p>
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
        try {
            // 1. Get Student Classes
            const { getStudentClasses } = await import('../../services/class.service.js');
            const myClasses = await getStudentClasses(user.user.uid);
            const myClassIds = myClasses.map(c => c.id);

            console.log("Debug: Student ID:", user.user.uid);
            console.log("Debug: Enrolled Classes:", myClasses);

            // 2. Get Assessments (filtered by class)
            const rawAssessments = await getActiveAssessments(myClassIds);
            console.log("Debug: Raw Assessments:", rawAssessments);

            // Check completion for each
            const { checkSubmission } = await import('../../services/submission.service.js');
            const assessments = await Promise.all(rawAssessments.map(async (a) => {
                const completed = await checkSubmission(a.id, user.user.uid);
                return { ...a, completed };
            }));

            // 3. Group By Class
            const groups = {};
            myClasses.forEach(c => {
                groups[c.id] = { name: `${c.name} (${c.section})`, code: c.code, assessments: [] };
            });

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

            // Enrolled Pills
            if (myClasses.length > 0) {
                html += `
                    <div class="mb-4">
                        <h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">My Classes</h4>
                        <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            ${myClasses.map(c => `
                                <div class="bg-white px-4 py-2 rounded-xl border border-blue-100 shadow-sm flex items-center gap-2 whitespace-nowrap">
                                    <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <span class="font-bold text-gray-700 text-xs">${c.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            // Groups
            Object.values(groups).forEach(g => {
                html += `
                    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                        <div class="bg-gray-50/50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                            <h3 class="font-bold text-gray-800 text-sm">${g.name}</h3>
                            <span class="text-[10px] font-mono text-gray-400 bg-white px-2 py-1 rounded border">Code: ${g.code}</span>
                        </div>
                        <div class="divide-y divide-gray-50">
                            ${g.assessments.length > 0
                        ? g.assessments.map(a => renderRow(a)).join('')
                        : '<div class="p-8 text-center text-gray-400 text-sm italic">No active assessments.</div>'}
                        </div>
                    </div>
                `;
            });

            // Public Exams
            if (publicGroup.length > 0) {
                html += `
                    <div class="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden mb-6">
                        <div class="bg-purple-50 px-6 py-3 border-b border-purple-100">
                            <h3 class="font-bold text-purple-900 text-sm">General Assessments</h3>
                        </div>
                        <div class="divide-y divide-gray-50">
                            ${publicGroup.map(a => renderRow(a)).join('')}
                        </div>
                    </div>
                `;
            }

            if (myClasses.length === 0 && publicGroup.length === 0) {
                html = `
                    <div class="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                        <p class="text-gray-500 font-bold mb-1">No assessments available.</p>
                        <p class="text-xs text-blue-500">Join a class above to see your exams.</p>
                    </div>
                `;
            }

            listContainer.innerHTML = html;

        } catch (err) {
            console.error(err);
            listContainer.innerHTML = `<p class="text-red-500 text-center py-10 font-bold">Error loading dashboard: ${err.message}</p>`;
        }
    })();

    const renderRow = (a) => `
        <div class="p-4 flex justify-between items-center group hover:bg-gray-50 transition-colors">
            <div>
                <h4 class="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">${a.title}</h4>
                <div class="flex items-center gap-2 mt-1">
                    <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded">${a.questionCount} Qs</span>
                    ${!a.assignedClassId ? '<span class="text-[10px] font-black text-purple-500 uppercase tracking-widest bg-purple-50 px-2 py-0.5 rounded">Public</span>' : ''}
                </div>
            </div>
            ${a.completed
            ? '<button disabled class="bg-gray-50 text-gray-300 px-6 py-2 rounded-xl font-bold text-xs border border-gray-100 cursor-not-allowed">Done</button>'
            : `<button onclick="window.location.hash='#taker?id=${a.id}'" class="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95">Start</button>`
        }
        </div>
    `;
};
