import { createClass, getClassesByTeacher, approveStudent, rejectStudent } from '../../services/class.service.js';
import { getUser } from '../../core/store.js';
import { renderModal, setupModalListeners } from '../../shared/modal.js';
import { getSubmissionsByStudent } from '../../services/submission.service.js';
import { getAssessment } from '../../services/assessment.service.js';
import { renderInput } from '../../shared/input.js';

export const ClassManagerPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();

    if (!user) {
        window.location.hash = '#login';
        return;
    }

    let currentClasses = [];
    let selectedClass = null; // for Level 2
    let selectedStudent = null; // for Level 3

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
                        <div id="class-list-grid" class="flex flex-col gap-4">
                            <div class="h-32 bg-gray-200 animate-pulse rounded-3xl"></div>
                            <div class="h-32 bg-gray-200 animate-pulse rounded-3xl"></div>
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

                <main class="max-w-3xl mx-auto p-4 space-y-8 mt-4">
                    <!-- Wide Join Code Card -->
                    <div class="bg-blue-600 p-8 rounded-[40px] shadow-2xl shadow-blue-200 flex flex-col md:flex-row justify-between items-center gap-6 text-white overflow-hidden relative">
                        <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl capitalize"></div>
                        <div class="relative z-10 text-center md:text-left">
                            <p class="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-2">Class Access Protocol</p>
                            <p class="text-5xl font-mono font-black tracking-[0.1em] text-white underline decoration-white/20 underline-offset-8">${cls.code}</p>
                        </div>
                        <button onclick="window.copyJoinCode('${cls.code}', this)" class="relative z-10 w-full md:w-auto px-8 py-4 bg-white/20 rounded-2xl hover:bg-white/30 transition-all font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 active:scale-95">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                            Copy Join Key
                        </button>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <!-- Pending Requests -->
                        <section>
                            <div class="flex items-center gap-3 mb-6 pl-2">
                                <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Pending Access</h2>
                                <span class="bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-orange-100">${pendingCount}</span>
                            </div>
                            <div id="pending-list" class="space-y-4">
                                ${renderPendingList(cls)}
                            </div>
                        </section>

                        <!-- Student List -->
                        <section>
                            <div class="flex items-center gap-3 mb-6 pl-2">
                                <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Enrolled</h2>
                                <span class="bg-gray-200 text-gray-600 text-[10px] font-black px-3 py-1 rounded-full">${studentCount}</span>
                            </div>
                            <div id="student-list" class="space-y-3">
                                ${renderStudentList(cls)}
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        `;

        document.getElementById('back-to-list').addEventListener('click', renderLevel1);
    };

    const renderLevel3 = async (student) => {
        selectedStudent = student;
        app.innerHTML = `
            <div class="bg-gray-50 min-h-screen pb-20">
                <header class="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 p-4 sticky top-0 z-40">
                    <div class="max-w-5xl mx-auto flex items-center gap-4">
                        <button id="back-to-students" class="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <div>
                            <h1 class="text-xl font-black text-gray-900 leading-tight">${student.email}</h1>
                            <p class="text-xs text-gray-500 font-medium uppercase tracking-widest">Performance Profile</p>
                        </div>
                    </div>
                </header>

                <main class="max-w-2xl mx-auto p-4 space-y-8 mt-4">
                    <section>
                        <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-6 pl-2">Assessment History</h2>
                        <div id="score-list" class="space-y-4">
                            <div class="h-24 bg-gray-200 animate-pulse rounded-3xl"></div>
                            <div class="h-24 bg-gray-200 animate-pulse rounded-3xl"></div>
                        </div>
                    </section>
                </main>
            </div>
        `;

        document.getElementById('back-to-students').addEventListener('click', () => renderLevel2(selectedClass));

        // Load Scores
        const scoreList = document.getElementById('score-list');
        try {
            const submissions = await getSubmissionsByStudent(student.uid);
            if (submissions.length === 0) {
                scoreList.innerHTML = `
                    <div class="bg-white p-12 rounded-[32px] text-center border border-gray-100 shadow-sm">
                        <p class="text-gray-400 font-medium">No assessments found for this student.</p>
                    </div>
                `;
                return;
            }

            // Fetch assessment details for titles
            const enriched = await Promise.all(submissions.map(async (s) => {
                try {
                    const assessment = await getAssessment(s.assessmentId);
                    return { ...s, assessmentTitle: assessment.title };
                } catch {
                    return { ...s, assessmentTitle: 'Deleted Assessment' };
                }
            }));

            scoreList.innerHTML = enriched.map(s => {
                const isGraded = s.status === 'graded';
                const percentage = isGraded ? Math.round((s.score / s.totalPoints) * 100) : null;
                const date = new Date(s.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                return `
                    <div class="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 ${isGraded ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'} rounded-2xl flex items-center justify-center font-black text-xs uppercase">
                                ${date}
                            </div>
                            <div>
                                <h3 class="font-black text-gray-900 group-hover:text-blue-600 transition-colors">${s.assessmentTitle}</h3>
                                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">${isGraded ? 'Completed' : 'Awaiting Grade'}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            ${isGraded ? `
                                <p class="text-2xl font-black text-gray-900">${s.score}<span class="text-gray-300 mx-1">/</span>${s.totalPoints}</p>
                                <div class="w-24 h-1.5 bg-gray-50 rounded-full mt-2 overflow-hidden">
                                    <div class="h-full bg-blue-600" style="width: ${percentage}%"></div>
                                </div>
                            ` : `
                                <span class="text-xs font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full">Pending</span>
                            `}
                        </div>
                    </div>
                `;
            }).join('');

        } catch (err) {
            console.error(err);
            scoreList.innerHTML = `<p class="text-red-500 text-center py-8">Failed to fetch scores.</p>`;
        }
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
        return cls.students.map((s, idx) => {
            const email = s.email || 'No Email';
            return `
                <div onclick="window.viewScores(${idx})" class="bg-white p-5 rounded-[24px] border border-gray-100 flex items-center justify-between group hover:border-blue-500 hover:shadow-lg hover:shadow-blue-50 cursor-pointer transition-all active:scale-[0.98]">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 font-black text-xs group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            ${email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p class="font-black text-gray-900 group-hover:text-blue-600 transition-colors">${email}</p>
                            <p class="text-[10px] text-gray-400 font-mono uppercase tracking-tight">${s.uid.substring(0, 12)}...</p>
                        </div>
                    </div>
                    <div class="text-gray-300 group-hover:text-blue-500 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
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
                <div onclick="window.drillDown(${idx})" class="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-blue-50 transition-all cursor-pointer group hover:border-blue-200 relative overflow-hidden">
                    <!-- Visual Accent -->
                    <div class="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div class="flex items-center gap-6">
                            <div class="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                            </div>
                            <div>
                                <h3 class="font-black text-gray-900 text-2xl group-hover:text-blue-600 transition-colors uppercase tracking-tight">${cls.name}</h3>
                                <p class="text-xs font-bold text-gray-400 mt-1 uppercase tracking-[0.2em] flex items-center gap-2">
                                    ${cls.section || 'General'}
                                    <span class="w-1 h-1 bg-gray-200 rounded-full"></span>
                                    ${cls.code}
                                </p>
                            </div>
                        </div>

                        <div class="flex items-center gap-8 pl-6 md:pl-0 border-l md:border-l-0 border-gray-100">
                            <div class="text-left md:text-right">
                                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Students</p>
                                <p class="text-2xl font-black text-gray-900">${cls.students?.length || 0}</p>
                            </div>
                            
                            ${(cls.pendingStudents?.length || 0) > 0 ? `
                                <div class="text-left md:text-right relative">
                                    <p class="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Requests</p>
                                    <p class="text-2xl font-black text-orange-600 flex items-center gap-2">
                                        ${cls.pendingStudents.length}
                                        <span class="w-2 h-2 bg-orange-500 rounded-full animate-ping"></span>
                                    </p>
                                </div>
                            ` : `
                                <div class="text-left md:text-right opacity-30">
                                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Requests</p>
                                    <p class="text-2xl font-black text-gray-300">0</p>
                                </div>
                            `}

                            <div class="p-4 bg-gray-50 rounded-2xl text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition-all group-hover:translate-x-1">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                            </div>
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

    window.viewScores = (idx) => {
        renderLevel3(selectedClass.students[idx]);
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
