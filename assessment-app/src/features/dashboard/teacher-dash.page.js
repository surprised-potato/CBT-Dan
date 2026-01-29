import { renderButton } from '../../shared/button.js';
import { renderInput } from '../../shared/input.js';
import { createClass, getClassesByTeacher, approveStudent, rejectStudent } from '../../services/class.service.js';
import { getUser } from '../../core/store.js';
import { renderModal, setupModalListeners } from '../../shared/modal.js';
import { updateUserProfile } from '../../services/auth.service.js';

export const TeacherDashPage = async () => {
    const app = document.getElementById('app');
    const user = getUser(); // { user: {uid, email}, role: 'teacher' }

    if (!user) {
        window.location.hash = '#login';
        return;
    }

    const userName = user.displayName || 'Teacher';

    // --- Template ---
    app.innerHTML = `
        <div class="bg-gray-50 min-h-screen pb-20">
            <!-- Header -->
            <header class="bg-white shadow p-4 sticky top-0 z-10">
                <div class="max-w-4xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 class="text-xl font-bold text-gray-800">Teacher Dashboard</h1>
                        <p class="text-xs text-gray-500">${userName} (${user.email})</p>
                        <button id="edit-profile-btn" class="text-xs text-blue-500 hover:underline">Edit Profile</button>
                    </div>
                    <button id="logout-btn" class="text-sm text-red-500 font-medium">Logout</button>
                </div>
            </header>

            <main class="max-w-4xl mx-auto p-4 space-y-6">
                
                <!-- Quick Actions -->
                <section class="grid grid-cols-3 gap-4">
                    <div onclick="location.hash='#bank'" class="bg-blue-600 text-white p-4 rounded-xl shadow cursor-pointer active:scale-95 transition-transform">
                        <h3 class="font-bold text-lg mb-1">Question Bank</h3>
                        <p class="text-blue-100 text-xs">Manage Content</p>
                    </div>
                    <div onclick="location.hash='#assessment-bank'" class="bg-purple-600 text-white p-4 rounded-xl shadow cursor-pointer active:scale-95 transition-transform">
                        <h3 class="font-bold text-lg mb-1">Assessments</h3>
                        <p class="text-purple-100 text-xs">Manage Bank</p>
                    </div>
                    <div id="create-class-btn" class="bg-white text-gray-800 p-4 rounded-xl shadow cursor-pointer active:scale-95 transition-transform border border-gray-100">
                        <h3 class="font-bold text-lg mb-1">+ New Class</h3>
                        <p class="text-gray-400 text-xs">Create Group</p>
                    </div>
                </section>

                <!-- Class List -->
                <section>
                    <h2 class="text-lg font-bold text-gray-800 mb-4">My Classes</h2>
                    <div id="class-list" class="space-y-4">
                        <div class="text-center py-8 text-gray-400">Loading classes...</div>
                    </div>
                </section>
            </main>

            <!-- Create Class Modal -->
            <div id="class-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center p-4 z-50">
                <div class="bg-white rounded-xl p-6 w-full max-w-sm">
                    <h3 class="text-xl font-bold mb-4">Create Class</h3>
                    <form id="create-class-form" class="space-y-4">
                        ${renderInput({ id: 'class-name', label: 'Class Name', placeholder: 'e.g. Math 101', required: true })}
                        ${renderInput({ id: 'class-sec', label: 'Section', placeholder: 'e.g. Block A' })}
                        
                        <div class="flex gap-2 pt-2">
                             ${renderButton({ text: 'Cancel', type: 'button', variant: 'secondary', id: 'cancel-class-btn' })}
                             ${renderButton({ text: 'Create', type: 'submit' })}
                        </div>
                    </form>
                </div>
            </div>

            <!-- Manage Requests Modal -->
            <div id="requests-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center p-4 z-50">
                <div class="bg-white rounded-xl p-6 w-full max-w-md h-[400px] flex flex-col">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold">Pending Requests</h3>
                        <button onclick="document.getElementById('requests-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                    </div>
                    <div id="requests-list" class="flex-1 overflow-y-auto space-y-3 pr-2">
                        <!-- Dynamic List -->
                    </div>
                </div>
            </div>
            
            <!-- Profile Modal -->
            ${renderModal({
        id: 'profile-modal',
        title: 'Edit Profile',
        content: `
                    <form id="profile-form" class="space-y-4">
                        ${renderInput({ id: 'profile-name', label: 'Display Name', value: userName, placeholder: 'e.g. Mrs. Smith' })}
                        <button type="submit" class="w-full bg-blue-600 text-white p-3 rounded-lg font-bold">Save Changes</button>
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
        btn.textContent = 'Saving...';

        try {
            await updateUserProfile(user.user.uid, { displayName: newName });
            document.getElementById('profile-modal').classList.add('hidden');
            TeacherDashPage();
        } catch (err) {
            console.error(err);
            alert("Failed to update profile");
        } finally {
            btn.disabled = false;
            btn.textContent = 'Save Changes';
        }
    });

    let currentClasses = [];

    // 2. Fetch Classes
    const loadClasses = async () => {
        const listContainer = document.getElementById('class-list');
        try {
            currentClasses = await getClassesByTeacher(user.user.uid);

            if (currentClasses.length === 0) {
                listContainer.innerHTML = `<div class="bg-white p-8 rounded-xl text-center text-gray-400">No classes yet. Create one!</div>`;
                return;
            }

            listContainer.innerHTML = currentClasses.map(c => {
                const pendingCount = c.pendingStudents ? c.pendingStudents.length : 0;
                return `
                <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="font-bold text-gray-900 text-lg">${c.name}</h3>
                            <p class="text-sm text-gray-500">${c.section || 'No Section'}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-xs text-gray-400 uppercase tracking-wide">Join Code</p>
                            <p class="text-xl font-mono font-bold text-blue-600 tracking-widest">${c.code}</p>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center border-t border-gray-50 pt-3">
                        <div class="text-sm text-gray-500">
                            <strong>${c.students.length}</strong> Students
                        </div>
                        ${pendingCount > 0 ? `
                            <button onclick="window.manageRequests('${c.id}')" class="bg-orange-50 text-orange-600 px-4 py-2 rounded-lg text-sm font-bold border border-orange-100 hover:bg-orange-100 flex items-center gap-2">
                                <span class="bg-orange-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">${pendingCount}</span>
                                Review Requests
                            </button>
                        ` : `
                            <span class="text-xs text-green-500 font-bold bg-green-50 px-3 py-1 rounded-full">Active</span>
                        `}
                    </div>
                </div>
            `}).join('');
        } catch (error) {
            console.error(error);
            listContainer.innerHTML = `<div class="text-red-500 text-center">Failed to load classes.</div>`;
        }
    };

    loadClasses();

    // 3. Modal Logic - Create Class
    const modal = document.getElementById('class-modal');
    document.getElementById('create-class-btn').addEventListener('click', () => {
        modal.classList.remove('hidden');
    });
    document.getElementById('cancel-class-btn').addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    document.getElementById('create-class-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('class-name').value;
        const sec = document.getElementById('class-sec').value;
        const btn = e.target.querySelector('button[type="submit"]');

        btn.disabled = true;
        btn.textContent = 'Creating...';

        try {
            await createClass(name, sec, user.user.uid);
            modal.classList.add('hidden');
            e.target.reset();
            loadClasses(); // Refresh list
        } catch (error) {
            alert("Error creating class");
        } finally {
            btn.disabled = false;
            btn.textContent = 'Create';
        }
    });

    // 4. Modal Logic - Manage Requests
    window.manageRequests = (classId) => {
        const cls = currentClasses.find(c => c.id === classId);
        if (!cls) return;

        const modal = document.getElementById('requests-modal');
        const list = document.getElementById('requests-list');

        modal.classList.remove('hidden');

        const renderRequests = () => {
            if (!cls.pendingStudents || cls.pendingStudents.length === 0) {
                list.innerHTML = `<div class="text-center text-gray-400 py-10">No pending requests.</div>`;
                setTimeout(() => {
                    modal.classList.add('hidden');
                    loadClasses();
                }, 1000);
                return;
            }

            list.innerHTML = cls.pendingStudents.map((s, idx) => {
                const email = typeof s === 'string' ? 'No Email' : s.email;
                const uid = typeof s === 'string' ? s : s.uid;

                return `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div class="overflow-hidden">
                         <p class="font-bold text-gray-800 truncate text-sm" title="${email}">${email}</p>
                         <p class="text-[10px] text-gray-400 font-mono truncate">${uid}</p>
                    </div>
                    <div class="flex gap-2 shrink-0">
                        <button onclick="window.handleReq('${classId}', ${idx}, 'reject')" class="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors">✕</button>
                        <button onclick="window.handleReq('${classId}', ${idx}, 'approve')" class="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors">✓</button>
                    </div>
                </div>
            `}).join('');
        };

        renderRequests();

        window.handleReq = async (cId, studentIdx, action) => {
            // Re-find class to ensure fresh reference if needed, though we mutate local 'cls'
            // best to use the captured 'cls' variable
            const student = cls.pendingStudents[studentIdx];
            if (!student) return;

            // Optimistic UI update could be done here, but let's just wait
            try {
                if (action === 'approve') {
                    await approveStudent(cId, student);
                } else {
                    await rejectStudent(cId, student);
                }

                // Update local state to reflect change immediately 
                // (simulating real-time since we don't have a listener on this specific doc yet)
                cls.pendingStudents.splice(studentIdx, 1);
                if (action === 'approve') {
                    cls.students.push(student); // Inaccurate if we just push but good enough for UI count
                }

                renderRequests();
            } catch (err) {
                console.error(err);
                alert("Action failed.");
            }
        };
    };

};
