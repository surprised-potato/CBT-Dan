import { renderButton } from '../../shared/button.js';
import { renderInput } from '../../shared/input.js';
import { createClass, getClassesByTeacher, approveStudent, rejectStudent } from '../../services/class.service.js';
import { getUser } from '../../core/store.js';
import { renderModal, setupModalListeners } from '../../shared/modal.js';

export const ClassManagerPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();

    if (!user) {
        window.location.hash = '#login';
        return;
    }

    let currentClasses = [];
    let selectedClass = null; // null for Level 1, class object for Level 2

    const renderLevel1 = () => {
        app.innerHTML = `
            <div class="bg-gray-50 min-h-screen pb-20">
                <header class="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 p-4 sticky top-0 z-40">
                    <div class="max-w-5xl mx-auto flex items-center gap-4">
                        <button onclick="location.hash='#teacher-dash'" class="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <h1 class="text-xl font-black text-gray-900 leading-tight">Class Manager</h1>
                    </div>
                </header>

                <main class="max-w-5xl mx-auto p-4 space-y-8 mt-4">
                    <section>
                        <div class="flex justify-between items-center mb-6">
                            <h2 class="text-sm font-black text-gray-400 uppercase tracking-[0.2em] pl-1">Your Classes</h2>
                            <button id="add-class-btn" class="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                                New Class
                            </button>
                        </div>
                        <div id="class-list-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="h-40 bg-gray-200 animate-pulse rounded-2xl"></div>
                            <div class="h-40 bg-gray-200 animate-pulse rounded-2xl"></div>
                        </div>
                    </section>
                </main>

                <!-- Create Class Modal -->
                ${renderModal({
            id: 'class-modal',
            title: 'Create New Class',
            content: `
                        <form id="create-class-form" class="space-y-6">
                            ${renderInput({ id: 'class-name', label: 'Class Name', placeholder: 'e.g. Advanced Biology', required: true })}
                            ${renderInput({ id: 'class-sec', label: 'Section / Room', placeholder: 'e.g. Block A' })}
                            <p class="text-[10px] text-gray-400 font-medium">Students will use a unique join code to request entry into this class.</p>
                            <button type="submit" class="w-full bg-blue-600 text-white p-4 rounded-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">Build Class</button>
                        </form>
                    `
        })}
            </div>
        `;

        setupEventListeners();
        loadClasses();
    };

    const renderLevel2 = (cls) => {
        selectedClass = cls;
        const pendingCount = cls.pendingStudents?.length || 0;
        const studentCount = cls.students?.length || 0;

        app.innerHTML = `
            <div class="bg-gray-50 min-h-screen pb-20">
                <header class="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 p-4 sticky top-0 z-40">
                    <div class="max-w-5xl mx-auto flex items-center gap-4">
                        <button id="back-to-list" class="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <div>
                            <h1 class="text-xl font-black text-gray-900 leading-tight">${cls.name}</h1>
                            <p class="text-xs text-gray-500 font-medium">${cls.section || 'General Section'}</p>
                        </div>
                    </div>
                </header>

                <main class="max-w-2xl mx-auto p-4 space-y-8 mt-4">
                    <!-- Join Code Card -->
                    <div class="bg-blue-600 p-6 rounded-3xl shadow-xl shadow-blue-100 flex justify-between items-center text-white">
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Student Join Code</p>
                            <p class="text-3xl font-mono font-black tracking-[0.2em]">${cls.code}</p>
                        </div>
                        <button onclick="window.copyJoinCode('${cls.code}', this)" class="p-3 bg-white/20 rounded-2xl hover:bg-white/30 transition-colors">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                        </button>
                    </div>

                    <!-- Pending Requests -->
                    <section>
                        <div class="flex items-center gap-2 mb-4 pl-1">
                            <h2 class="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Pending Requests</h2>
                            <span class="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">${pendingCount}</span>
                        </div>
                        <div id="pending-list" class="space-y-3">
                            ${renderPendingList(cls)}
                        </div>
                    </section>

                    <!-- Student List -->
                    <section>
                         <div class="flex items-center gap-2 mb-4 pl-1">
                            <h2 class="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Enrolled Students</h2>
                            <span class="bg-gray-200 text-gray-600 text-[10px] font-black px-2 py-0.5 rounded-full">${studentCount}</span>
                        </div>
                        <div id="student-list" class="space-y-2">
                            ${renderStudentList(cls)}
                        </div>
                    </section>
                </main>
            </div>
        `;

        document.getElementById('back-to-list').addEventListener('click', renderLevel1);
    };

    const renderPendingList = (cls) => {
        if (!cls.pendingStudents || cls.pendingStudents.length === 0) {
            return `<p class="text-sm text-gray-400 italic pl-1">No pending requests at this time.</p>`;
        }
        return cls.pendingStudents.map((s, idx) => {
            const email = s.email || 'No Email';
            return `
                <div class="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
                    <div>
                        <p class="font-bold text-gray-900">${email}</p>
                        <p class="text-[10px] text-gray-400 font-mono uppercase">${s.uid.substring(0, 12)}...</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="window.processStudent('${cls.id}', ${idx}, 'reject')" class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                        <button onclick="window.processStudent('${cls.id}', ${idx}, 'approve')" class="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    };

    const renderStudentList = (cls) => {
        if (!cls.students || cls.students.length === 0) {
            return `<p class="text-sm text-gray-400 italic pl-1">No students enrolled yet.</p>`;
        }
        return cls.students.map(s => {
            const email = s.email || 'No Email';
            return `
                <div class="bg-white p-4 rounded-2xl border border-gray-50 flex items-center gap-3">
                    <div class="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 font-black text-xs">
                        ${email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p class="font-bold text-gray-900">${email}</p>
                        <p class="text-[10px] text-gray-400 font-mono uppercase">${s.uid.substring(0, 12)}...</p>
                    </div>
                </div>
            `;
        }).join('');
    };

    const loadClasses = async () => {
        const grid = document.getElementById('class-list-grid');
        try {
            currentClasses = await getClassesByTeacher(user.user.uid);
            if (currentClasses.length === 0) {
                grid.className = "block";
                grid.innerHTML = `
                    <div class="bg-white p-12 rounded-3xl text-center border-2 border-dashed border-gray-100">
                        <div class="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                             <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <h3 class="text-xl font-black text-gray-900">Get Started</h3>
                        <p class="text-gray-400 mt-2 max-w-xs mx-auto text-sm">Create your first class to start enrolling students and conducting assessments.</p>
                        <button onclick="document.getElementById('add-class-btn').click()" class="mt-6 text-blue-600 font-black text-xs uppercase tracking-widest border-b-2 border-blue-600 pb-1">Create Class Now</button>
                    </div>
                `;
                return;
            }

            grid.innerHTML = currentClasses.map((cls, idx) => `
                <div onclick="window.drillDown(${idx})" class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-blue-100">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="font-black text-gray-900 text-lg group-hover:text-blue-600 transition-colors">${cls.name}</h3>
                            <p class="text-xs text-gray-400 mt-1">${cls.section || 'General'}</p>
                        </div>
                        <div class="flex items-center gap-2">
                             ${(cls.pendingStudents?.length || 0) > 0 ? `
                                <span class="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">${cls.pendingStudents.length} Req</span>
                             ` : ''}
                             <div class="p-2 bg-gray-50 rounded-xl text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                             </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-6 pt-4 border-t border-gray-50">
                        <div class="flex items-center gap-2">
                            <svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            <span class="text-sm font-bold text-gray-700">${cls.students?.length || 0}</span>
                            <span class="text-[10px] text-gray-400 font-bold uppercase">Students</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Code:</span>
                            <span class="font-mono font-black text-blue-600 text-sm leading-none">${cls.code}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            grid.innerHTML = `<p class="text-red-500 text-center py-8">Failed to fetch classes.</p>`;
        }
    };

    const setupEventListeners = () => {
        setupModalListeners('class-modal');
        document.getElementById('add-class-btn').addEventListener('click', () => {
            document.getElementById('class-modal').classList.remove('hidden');
        });

        document.getElementById('create-class-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('class-name').value;
            const sec = document.getElementById('class-sec').value;
            const btn = e.target.querySelector('button');

            btn.disabled = true;
            btn.textContent = 'Building...';

            try {
                await createClass(name, sec, user.user.uid);
                document.getElementById('class-modal').classList.add('hidden');
                e.target.reset();
                loadClasses();
            } catch (err) {
                alert("Error creating class");
            } finally {
                btn.disabled = false;
                btn.textContent = 'Build Class';
            }
        });
    };

    // Global Handlers
    window.drillDown = (idx) => {
        renderLevel2(currentClasses[idx]);
    };

    window.copyJoinCode = (code, btn) => {
        navigator.clipboard.writeText(code);
        const originalContent = btn.innerHTML;
        btn.innerHTML = `<svg class="w-6 h-6 text-green-400 shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
        setTimeout(() => { btn.innerHTML = originalContent; }, 2000);
    };

    window.processStudent = async (classId, studentIdx, action) => {
        const student = selectedClass.pendingStudents[studentIdx];
        if (!student) return;

        try {
            if (action === 'approve') {
                await approveStudent(classId, student);
                if (!selectedClass.students) selectedClass.students = [];
                selectedClass.students.push(student);
            } else {
                await rejectStudent(classId, student);
            }
            selectedClass.pendingStudents.splice(studentIdx, 1);
            renderLevel2(selectedClass);
        } catch (err) {
            console.error(err);
            alert("Action failed.");
        }
    };

    renderLevel1();
};
