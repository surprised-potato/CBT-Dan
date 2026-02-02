import { createClass, getClassesByTeacher, approveStudent, rejectStudent } from '../../services/class.service.js';
import { getUser } from '../../core/store.js';
import { renderModal, setupModalListeners } from '../../shared/modal.js';
import { getSubmissionsByStudent } from '../../services/submission.service.js';
import { getAssessment, getAssessmentsByClass } from '../../services/assessment.service.js';
import { renderInput } from '../../shared/input.js';
import { getSubmissionsForAssessment } from '../../services/grading.service.js';
import { downloadCSV } from '../../shared/csv.utils.js';

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
            <div class="min-h-screen pb-20">
                <header class="glass-panel sticky top-0 z-40 px-4 py-6 border-b border-white/20">
                    <div class="max-w-5xl mx-auto flex items-center gap-4">
                        <button onclick="location.hash='#teacher-dash'" class="p-3 glass-panel rounded-2xl text-green-500 hover:text-green-700 transition-colors shadow-sm">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <h1 class="text-2xl font-black text-gray-900 leading-tight tracking-tight">Institutional Registry</h1>
                    </div>
                </header>

                <main class="max-w-5xl mx-auto p-4 space-y-10 mt-8">
                    <section>
                        <div class="flex justify-between items-center mb-8 pl-1">
                            <h2 class="text-xs font-black text-gray-600 uppercase tracking-[0.3em]">Standardised Classes</h2>
                            <button id="add-class-btn" class="bg-green-premium text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-green-200 hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                                New Registry
                            </button>
                        </div>
                        <div id="class-list-grid" class="flex flex-col gap-6">
                            <div class="h-40 glass-panel animate-pulse rounded-[40px]"></div>
                        </div>
                    </section>
                </main>

                <!-- Create Class Modal -->
                ${renderModal({
            id: 'class-modal',
            title: 'Create Institutional Registry',
            content: `
                        <form id="create-class-form" class="space-y-6">
                            ${renderInput({ id: 'class-name', label: 'Department / Class Name', placeholder: 'e.g. Theoretical Physics', required: true })}
                            ${renderInput({ id: 'class-sec', label: 'Section / Room', placeholder: 'e.g. Hall 12' })}
                            <p class="text-[10px] text-gray-400 font-medium leading-relaxed">System will generate an encrypted access key for student enrolment. All requests require instructor manual validation.</p>
                            <button type="submit" class="w-full bg-green-premium text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-green-200 hover:bg-green-700 active:scale-95 transition-all">Initialise Registry</button>
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
            <div class="min-h-screen pb-20">
                <header class="glass-panel sticky top-0 z-40 px-4 py-6 border-b border-white/20">
                    <div class="max-w-5xl mx-auto flex items-center justify-between gap-4">
                        <div class="flex items-center gap-4">
                            <button id="back-to-list" class="p-3 glass-panel rounded-2xl text-green-500 hover:text-green-700 transition-colors shadow-sm">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            </button>
                            <div class="flex-1">
                                <h1 class="text-2xl font-black text-gray-900 leading-tight tracking-tight">${cls.name}</h1>
                                <p class="text-xs text-green-600 font-black uppercase tracking-widest mt-1">${cls.section || 'General Registry'}</p>
                            </div>
                        </div>
                        <button onclick="window.exportClassScores('${cls.id}')" class="bg-white p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-gray-100 hover:bg-gray-50 hover:shadow-md transition-all flex items-center gap-3">
                             <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                             Export Gradebook
                        </button>
                    </div>
                </header>

                <main class="max-w-4xl mx-auto p-4 space-y-10 mt-8">
                    <!-- Wide Join Code Card -->
                    <div class="relative bg-green-premium p-12 rounded-[50px] shadow-2xl shadow-green-200/50 flex flex-col md:flex-row justify-between items-center gap-10 text-white overflow-hidden">
                        <div class="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-3xl opacity-50"></div>
                        <div class="relative z-10 text-center md:text-left">
                            <p class="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-3">Enrolment Access Protocol</p>
                            <div class="bg-white/10 px-8 py-4 rounded-[28px] border border-white/20 inline-block">
                                <p class="text-6xl font-mono font-black tracking-[0.1em] text-white">${cls.code}</p>
                            </div>
                        </div>
                        <div class="md:text-right flex flex-col gap-4">
                            <p class="text-[10px] font-black uppercase tracking-widest opacity-60">Share key with students</p>
                            <button onclick="window.copyJoinCode('${cls.code}', this)" class="relative z-10 px-10 py-5 bg-white text-green-600 rounded-[28px] shadow-2xl shadow-green-900/20 hover:scale-[1.05] transition-all font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-4 active:scale-95">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                                Copy Credentials
                            </button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <!-- Pending Requests -->
                        <section>
                            <div class="flex items-center gap-4 mb-8 pl-2">
                                <h2 class="text-xs font-black text-gray-600 uppercase tracking-[0.3em]">Access Requests</h2>
                                <span class="bg-orange-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-orange-200 animation-pulse">${pendingCount}</span>
                            </div>
                            <div id="pending-list" class="space-y-5">
                                ${renderPendingList(cls)}
                            </div>
                        </section>

                        <!-- Student List -->
                        <section>
                            <div class="flex items-center gap-4 mb-8 pl-2">
                                <h2 class="text-xs font-black text-gray-600 uppercase tracking-[0.3em]">Authorized Cohort</h2>
                                <span class="bg-gray-200 text-gray-600 text-[10px] font-black px-4 py-1.5 rounded-full">${studentCount}</span>
                            </div>
                            <div id="student-list" class="space-y-4">
                                ${renderStudentList(cls)}
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        `;

        document.getElementById('back-to-list').onclick = renderLevel1;
    };

    const renderLevel3 = async (student) => {
        selectedStudent = student;
        app.innerHTML = `
            <div class="min-h-screen pb-20">
                <header class="glass-panel sticky top-0 z-40 px-4 py-6 border-b border-white/20">
                    <div class="max-w-5xl mx-auto flex items-center gap-6">
                        <button id="back-to-students" class="p-3 glass-panel rounded-2xl text-green-500 hover:text-green-700 transition-all shadow-sm">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <div>
                            <h1 class="text-2xl font-black text-gray-900 leading-tight tracking-tight">${student.email}</h1>
                            <p class="text-xs text-green-600 font-black uppercase tracking-[0.2em] mt-1">Personnel Analytical Profile</p>
                        </div>
                    </div>
                </header>

                <main class="max-w-3xl mx-auto p-4 space-y-10 mt-8">
                    <section>
                        <div class="flex items-center gap-3 mb-8 pl-2">
                            <h2 class="text-xs font-black text-gray-600 uppercase tracking-[0.3em]">Module History</h2>
                            <div class="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
                        </div>
                        <div id="score-list" class="space-y-6">
                            <div class="h-28 glass-panel animate-pulse rounded-[32px]"></div>
                        </div>
                    </section>
                </main>
            </div>
        `;

        document.getElementById('back-to-students').onclick = () => renderLevel2(selectedClass);

        const scoreList = document.getElementById('score-list');
        try {
            const submissions = await getSubmissionsByStudent(student.uid);
            if (submissions.length === 0) {
                scoreList.innerHTML = `
                    <div class="bg-white p-20 rounded-[40px] text-center border border-white shadow-xl shadow-green-50/50">
                        <p class="text-gray-400 font-black uppercase tracking-widest text-xs opacity-50 italic">No operational telemetry found</p>
                    </div>
                `;
                return;
            }

            const enriched = await Promise.all(submissions.map(async (s) => {
                try {
                    const assessment = await getAssessment(s.assessmentId);
                    return { ...s, assessmentTitle: assessment.title };
                } catch {
                    return { ...s, assessmentTitle: 'Archived Module' };
                }
            }));

            scoreList.innerHTML = enriched.map(s => {
                const isGraded = s.status === 'graded';
                const percentage = isGraded ? Math.round((s.score / s.totalPoints) * 100) : null;
                const date = new Date(s.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                return `
                    <div class="bg-white p-8 rounded-[40px] border border-white shadow-lg shadow-green-50/50 flex flex-col sm:flex-row items-center justify-between group hover:border-green-200 transition-all gap-6">
                        <div class="flex items-center gap-6 w-full sm:w-auto">
                            <div class="w-16 h-16 ${isGraded ? 'bg-green-premium text-white' : 'bg-orange-50 text-orange-600'} rounded-3xl flex items-center justify-center font-black text-xs uppercase shadow-lg">
                                ${date}
                            </div>
                            <div>
                                <h3 class="font-black text-gray-900 group-hover:text-green-600 transition-colors text-xl uppercase tracking-tight">${s.assessmentTitle}</h3>
                                <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">${isGraded ? 'Standardized Audit' : 'Evaluation Ongoing'}</p>
                            </div>
                        </div>
                        <div class="text-center sm:text-right w-full sm:w-auto">
                            ${isGraded ? `
                                <p class="text-4xl font-black text-gray-900 tracking-tighter">${s.score}<span class="text-gray-200 mx-1 text-2xl">/</span>${s.totalPoints}</p>
                                <div class="w-full sm:w-32 h-2.5 bg-gray-50 rounded-full mt-4 overflow-hidden shadow-inner border border-gray-100">
                                    <div class="h-full bg-green-premium shadow-lg" style="width: ${percentage}%"></div>
                                </div>
                            ` : `
                                <span class="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em] bg-orange-100 px-6 py-3 rounded-2xl border border-orange-200">Processing</span>
                            `}
                        </div>
                    </div>
                `;
            }).join('');

        } catch (err) {
            scoreList.innerHTML = `<div class="glass-panel text-red-500 text-center py-10 font-bold">Failed to load scores.</div>`;
        }
    };

    const renderPendingList = (cls) => {
        if (!cls.pendingStudents || cls.pendingStudents.length === 0) {
            return `<div class="p-12 glass-panel rounded-[32px] text-center border-dashed border-2 border-gray-100"><p class="text-xs text-gray-400 font-black uppercase tracking-widest opacity-50">Operational Clear</p></div>`;
        }
        return cls.pendingStudents.map((s, idx) => {
            const email = s.email || 'No Email';
            return `
                <div class="bg-white p-6 rounded-[32px] border border-white flex items-center justify-between shadow-xl shadow-orange-50/50">
                    <div class="flex items-center gap-5">
                        <div class="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-400 font-black text-xs uppercase">
                            ${email.charAt(0)}
                        </div>
                        <div>
                            <p class="font-black text-gray-900 uppercase tracking-tight text-sm">${email}</p>
                            <p class="text-[9px] text-gray-400 font-mono mt-1">${s.uid.substring(0, 16).toUpperCase()}</p>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="window.processStudent('${cls.id}', ${idx}, 'reject')" class="w-12 h-12 glass-panel rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center shadow-sm">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                        <button onclick="window.processStudent('${cls.id}', ${idx}, 'approve')" class="w-12 h-12 bg-green-premium text-white rounded-2xl shadow-xl shadow-green-200 hover:scale-110 active:scale-95 transition-all flex items-center justify-center">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    };

    const renderStudentList = (cls) => {
        if (!cls.students || cls.students.length === 0) {
            return `<div class="p-12 glass-panel rounded-[32px] text-center border-dashed border-2 border-gray-100"><p class="text-xs text-gray-500 font-black uppercase tracking-widest opacity-80">Empty Registry</p></div>`;
        }
        return cls.students.map((s, idx) => {
            const email = s.email || 'No Email';
            return `
                <div onclick="window.viewScores(${idx})" class="bg-white p-6 rounded-[32px] border border-white flex items-center justify-between group hover:border-green-500 hover:shadow-2xl hover:shadow-green-50/50 cursor-pointer transition-all active:scale-[0.98]">
                    <div class="flex items-center gap-6">
                        <div class="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-green-500 group-hover:bg-green-50 group-hover:text-green-700 transition-all shadow-inner">
                            ${email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p class="font-black text-gray-900 group-hover:text-green-600 transition-colors uppercase tracking-tight">${email}</p>
                            <p class="text-[10px] text-gray-600 font-mono tracking-widest mt-1">${s.uid.substring(0, 16).toUpperCase()}</p>
                        </div>
                    </div>
                    <div class="text-gray-200 group-hover:text-green-500 group-hover:bg-green-50 p-2 rounded-xl transition-all group-hover:translate-x-1">
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
                grid.innerHTML = `
                    <div class="bg-white p-20 rounded-[50px] text-center border-2 border-dashed border-gray-100">
                        <div class="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-gray-200">
                             <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <h3 class="text-2xl font-black text-gray-900 tracking-tight">System Initialisation</h3>
                        <p class="text-gray-400 mt-3 max-w-xs mx-auto text-sm leading-relaxed font-medium">Registry empty. Create your first operational cohort to start personnel management.</p>
                        <button onclick="document.getElementById('add-class-btn').click()" class="mt-8 bg-green-premium text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-green-100 hover:scale-105 active:scale-95 transition-all">Create Now</button>
                    </div>
                `;
                return;
            }

            grid.innerHTML = currentClasses.map((cls, idx) => `
                <div onclick="window.drillDown(${idx})" class="group relative bg-white p-10 rounded-[50px] border border-white shadow-xl shadow-green-50/40 hover:shadow-2xl hover:shadow-green-100 hover:border-green-200 hover:-translate-y-1 transition-all cursor-pointer overflow-hidden">
                    <div class="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-green-50/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                        <div class="flex items-center gap-8">
                            <div class="w-20 h-20 bg-gray-50 rounded-[28px] flex items-center justify-center text-green-500 group-hover:bg-green-50 group-hover:text-green-700 transition-all shadow-inner">
                                <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                            </div>
                            <div>
                                <h3 class="font-black text-gray-900 text-3xl group-hover:text-green-600 transition-colors uppercase tracking-tight">${cls.name}</h3>
                                <p class="text-[10px] font-black text-gray-600 mt-2 uppercase tracking-[0.3em] flex items-center gap-3">
                                    ${cls.section || 'General'}
                                    <span class="w-1.5 h-1.5 bg-green-200 rounded-full"></span>
                                    ${cls.code}
                                </p>
                            </div>
                        </div>

                        <div class="flex items-center gap-10 pl-10 md:pl-0 border-l md:border-l-0 border-gray-100">
                            <div>
                                <p class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Cohort Size</p>
                                <p class="text-3xl font-black text-gray-900">${cls.students?.length || 0}</p>
                            </div>
                            
                            ${(cls.pendingStudents?.length || 0) > 0 ? `
                                <div class="relative">
                                    <p class="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1.5">Requests</p>
                                    <p class="text-3xl font-black text-orange-600 flex items-center gap-3">
                                        ${cls.pendingStudents.length}
                                        <span class="w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping shadow-lg shadow-orange-200"></span>
                                    </p>
                                </div>
                            ` : `
                                <div class="opacity-30">
                                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Requests</p>
                                    <p class="text-3xl font-black text-gray-300">0</p>
                                </div>
                            `}

                            <div class="p-5 glass-panel rounded-[24px] text-green-400 group-hover:bg-green-50 group-hover:text-green-600 transition-all group-hover:translate-x-1 border border-transparent group-hover:border-green-100">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            grid.innerHTML = `<p class="text-red-500 text-center py-12 font-bold glass-panel rounded-3xl">Critical dataset fetch fail.</p>`;
        }
    };

    const setupEventListeners = () => {
        setupModalListeners('class-modal');
        document.getElementById('add-class-btn').onclick = () => document.getElementById('class-modal').classList.remove('hidden');

        document.getElementById('create-class-form').onsubmit = async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Initialising...';
            try {
                await createClass(document.getElementById('class-name').value, document.getElementById('class-sec').value, user.user.uid);
                document.getElementById('class-modal').classList.add('hidden');
                e.target.reset();
                loadClasses();
            } catch (err) {
                alert("Creation error");
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        };
    };

    // Global Handlers
    window.drillDown = (idx) => renderLevel2(currentClasses[idx]);
    window.viewScores = (idx) => renderLevel3(selectedClass.students[idx]);
    window.copyJoinCode = (code, btn) => {
        navigator.clipboard.writeText(code);
        const originalContent = btn.innerHTML;
        btn.innerHTML = `<svg class="w-7 h-7 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Key Archived`;
        setTimeout(() => { btn.innerHTML = originalContent; }, 2000);
    };

    window.processStudent = async (classId, studentIdx, action) => {
        const student = selectedClass.pendingStudents[studentIdx];
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
            alert("Workflow fail.");
        }
    };

    window.exportClassScores = async (classId) => {
        try {
            const assessments = await getAssessmentsByClass(classId);
            if (assessments.length === 0) return alert("No operational data found.");

            const submissionsData = await Promise.all(assessments.map(async (a) => ({
                assessmentTitle: a.title,
                submissions: await getSubmissionsForAssessment(a.id)
            })));

            const students = selectedClass.students || [];
            if (students.length === 0) return alert("Empty cohort registry.");

            const exportData = students.map(student => {
                const row = { 'Personnel Name': student.displayName || 'Unnamed', 'Credentials': student.email };
                submissionsData.forEach(ad => {
                    const sub = ad.submissions.find(s => s.studentId === student.uid);
                    row[ad.assessmentTitle] = sub ? (sub.score !== null ? `${sub.score}/${sub.totalPoints}` : 'Pending') : 'N/A';
                });
                return row;
            });

            downloadCSV(exportData, `gradebook_${selectedClass.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        } catch (err) {
            alert("Export fail.");
        }
    };

    renderLevel1();
};
