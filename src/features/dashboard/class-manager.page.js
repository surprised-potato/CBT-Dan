import { createClass, getClassesByTeacher, approveStudent, rejectStudent, softDeleteClass, removeFromClass } from '../../services/class.service.js';
import { getUser } from '../../core/store.js';
import { renderModal, setupModalListeners } from '../../shared/modal.js';
import { getSubmissionsByStudent } from '../../services/submission.service.js';
import { getAssessment, getAssessmentsByClass } from '../../services/assessment.service.js';
import { renderInput } from '../../shared/input.js';
import { getSubmissionsForAssessment } from '../../services/grading.service.js';
import { downloadCSV } from '../../shared/csv.utils.js';
import { exportAttendanceCSV, getSessionsByClass, updateCheckinStatus } from '../../services/attendance.service.js';

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
    let activeTab = 'requests'; // 'requests' or 'cohort'

    const renderLevel1 = () => {
        app.innerHTML = `
            <div class="relative min-h-screen bg-[#020617] pb-32">
                <!-- Dynamic Mesh Background -->
                <div class="bg-premium-gradient-fixed"></div>
                <div class="mesh-blob top-[-10%] right-[-10%] bg-emerald-600/10 scale-150"></div>
                <div class="mesh-blob bottom-[-20%] left-[-10%] bg-indigo-500/10"></div>

                <div class="relative z-10 flex flex-col items-center py-4 md:py-8 px-4">
                    <div class="w-full max-w-4xl space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        
                        <!-- Header -->
                        <header class="glass-panel px-6 py-5 md:px-8 md:py-6 rounded-[35px] border border-white/10 flex flex-wrap justify-between items-center gap-4 shadow-xl">
                            <div class="flex items-center gap-4 min-w-0">
                                <button id="class-manager-back" class="p-3 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90 shadow-lg shrink-0">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                                </button>
                                <div class="min-w-0">
                                    <h1 class="text-xl md:text-2xl font-black text-white leading-tight tracking-tight truncate uppercase">Class Manager</h1>
                                    <p class="text-[10px] text-emerald-400 font-black uppercase tracking-[0.3em] mt-0.5 truncate opacity-80">Institutional Records</p>
                                </div>
                            </div>
                            <button id="add-class-btn" class="bg-emerald-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_10px_25px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_35px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2 border border-white/20">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                                New Class
                            </button>
                        </header>

                        <main class="space-y-8 relative z-10">
                            <section>
                                <div class="flex justify-between items-center mb-8 pl-1">
                                    <h2 class="text-xs font-black text-white/40 uppercase tracking-[0.4em]">Your Classes</h2>
                                </div>
                                <div id="class-list-grid" class="flex flex-col gap-6">
                                    <div class="h-40 glass-panel animate-pulse rounded-[40px] border border-white/5"></div>
                                </div>
                            </section>
                        </main>
                    </div>
                </div>
            </div>

            <!-- Create Class Modal -->
            <div id="class-modal" class="fixed inset-0 z-[100] hidden flex items-center justify-center p-4 backdrop-blur-md">
                <div class="absolute inset-0 bg-black/60"></div>
                <div class="glass-panel w-full max-w-lg rounded-[40px] border border-white/10 p-10 relative z-10 shadow-2xl animate-in zoom-in-95 duration-300">
                    <h3 class="text-2xl font-black text-white mb-2 uppercase tracking-tight">Create New Class</h3>
                    <p class="text-[10px] text-white/40 font-black uppercase tracking-widest mb-10 opacity-70">Initialize a new class section for student enrollment.</p>
                    <form id="create-class-form" class="space-y-6">
                        <div>
                            <label class="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-3 ml-1">Class Name</label>
                            <input type="text" id="class-name" placeholder="e.g. Advanced Mathematics" required class="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-emerald-500/50 transition-colors uppercase tracking-tight">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-3 ml-1">Section Code</label>
                            <input type="text" id="class-sec" placeholder="e.g. CS-2024" class="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-emerald-500/50 transition-colors uppercase tracking-tight">
                        </div>
                        <div class="flex gap-4 pt-4">
                            <button type="submit" class="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-500/20 border border-white/20 hover:-translate-y-0.5 transition-all">Create Class</button>
                            <button type="button" onclick="document.getElementById('class-modal').classList.add('hidden')" class="px-8 py-4 bg-white/5 text-white/40 rounded-2xl font-black uppercase text-xs tracking-widest border border-white/5">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.getElementById('class-manager-back').onclick = () => window.location.hash = '#dashboard';
        setupEventListeners();
        loadClasses();
    };

    const renderLevel2 = (cls) => {
        selectedClass = cls;
        const pendingCount = cls.pendingStudents?.length || 0;
        const studentCount = cls.students?.length || 0;

        app.innerHTML = `
        <div class="relative min-h-screen bg-[#020617] pb-32">
            <!-- Dynamic Mesh Background -->
            <div class="bg-premium-gradient-fixed"></div>
            <div class="mesh-blob top-[-10%] right-[-10%] bg-emerald-600/10 scale-150"></div>
            <div class="mesh-blob bottom-[-20%] left-[-10%] bg-indigo-500/10"></div>

            <div class="relative z-10 flex flex-col items-center py-4 md:py-8 px-4">
                <div class="w-full max-w-4xl space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    
                    <!-- Header -->
                    <header class="glass-panel px-6 py-5 md:px-8 md:py-6 rounded-[35px] border border-white/10 flex flex-wrap justify-between items-center gap-4 shadow-xl">
                        <div class="flex items-center gap-4 min-w-0">
                            <button id="back-to-list" class="p-3 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90 shadow-lg shrink-0">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            </button>
                            <div class="min-w-0">
                                <h1 class="text-xl md:text-2xl font-black text-white leading-tight tracking-tight truncate uppercase">${cls.name}</h1>
                                <p class="text-[10px] text-emerald-400 font-black uppercase tracking-[0.3em] mt-0.5 truncate opacity-80">${cls.section || 'General Registry'}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <button onclick="window.exportClassAttendance('${cls.id}')" class="bg-white/5 text-emerald-400/80 border border-white/5 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-emerald-500/30 hover:text-emerald-400 transition-all flex items-center gap-2">
                                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                 Attendance
                            </button>
                            <button onclick="window.exportClassScores('${cls.id}')" class="bg-white/5 text-white/40 border border-white/5 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-white/30 hover:text-white transition-all flex items-center gap-2">
                                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                 Gradebook
                            </button>
                        </div>
                    </header>

                    <main class="space-y-10 relative z-10">
                        <!-- Join Code Card (Responsive Row) -->
                        <div class="relative bg-gradient-to-br from-emerald-600 to-teal-700 p-8 md:p-12 rounded-[45px] shadow-2xl shadow-emerald-500/20 flex flex-col md:flex-row justify-between items-center gap-8 text-white overflow-hidden group">
                            <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                            <div class="relative z-10 text-center md:text-left">
                                <p class="text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-80 flex items-center justify-center md:justify-start gap-2">
                                    <span class="w-2 h-2 bg-white rounded-full animate-ping"></span>
                                    Class Join Code
                                </p>
                                <div class="bg-black/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 inline-block">
                                    <p class="text-4xl md:text-5xl font-mono font-black tracking-[0.2em] text-white drop-shadow-lg">${cls.code?.toUpperCase()}</p>
                                </div>
                            </div>
                            <div class="md:text-right flex flex-col gap-4 w-full md:w-auto">
                                <p class="text-[9px] font-black uppercase tracking-widest opacity-60">Share with your students</p>
                                <button onclick="window.copyJoinCode('${cls.code}', this)" class="w-full md:w-auto px-8 py-5 bg-white/20 backdrop-blur-md border border-white/20 hover:bg-white/30 rounded-2xl transition-all font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                                    Copy Code
                                </button>
                            </div>
                        </div>

                        <div class="space-y-8">
                            <!-- Premium Tab Navigation -->
                            <div class="flex p-1.5 bg-white/5 rounded-[30px] border border-white/5 max-w-2xl mx-auto shadow-2xl overflow-hidden">
                                <button id="tab-requests" class="flex-1 flex items-center justify-center gap-2 py-4 px-4 sm:px-6 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'requests' ? 'bg-white/10 text-amber-400 shadow-xl ring-1 ring-amber-400/20' : 'text-white/30 hover:text-white/50'}">
                                    Requests
                                    <span class="px-2.5 py-1 rounded-full text-[9px] ${activeTab === 'requests' ? 'bg-amber-400/20' : 'bg-white/5'}">
                                        ${pendingCount}
                                    </span>
                                    ${pendingCount > 0 && activeTab !== 'requests' ? '<span class="w-2 h-2 bg-amber-400 rounded-full animate-ping"></span>' : ''}
                                </button>
                                <button id="tab-cohort" class="flex-1 flex items-center justify-center gap-2 py-4 px-4 sm:px-6 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cohort' ? 'bg-white/10 text-emerald-400 shadow-xl ring-1 ring-emerald-400/20' : 'text-white/30 hover:text-white/50'}">
                                    Students
                                    <span class="px-2.5 py-1 rounded-full text-[9px] ${activeTab === 'cohort' ? 'bg-emerald-400/20' : 'bg-white/5'}">
                                        ${studentCount}
                                    </span>
                                </button>
                                <button id="tab-attendance" class="flex-1 flex items-center justify-center gap-2 py-4 px-4 sm:px-6 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'attendance' ? 'bg-white/10 text-purple-400 shadow-xl ring-1 ring-purple-400/20' : 'text-white/30 hover:text-white/50'}">
                                    Attendance Logs
                                </button>
                            </div>

                            <!-- List Container -->
                            <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                ${activeTab === 'requests' ? `
                                    <div id="pending-list" class="space-y-4">
                                        ${renderPendingList(cls)}
                                    </div>
                                ` : activeTab === 'cohort' ? `
                                    <div id="student-list" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        ${renderStudentList(cls)}
                                    </div>
                                ` : `
                                    <div id="attendance-list" class="space-y-6">
                                        <div class="glass-panel p-10 rounded-[40px] border border-white/10 text-center animate-pulse">
                                            <p class="text-[10px] font-black uppercase tracking-widest text-white/50">Loading Session Logs...</p>
                                        </div>
                                    </div>
                                `}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
        `;

        document.getElementById('back-to-list').onclick = renderLevel1;

        // Tab Event Listeners
        document.getElementById('tab-requests').onclick = () => {
            activeTab = 'requests';
            renderLevel2(cls);
        };
        document.getElementById('tab-cohort').onclick = () => {
            activeTab = 'cohort';
            renderLevel2(cls);
        };
        document.getElementById('tab-attendance').onclick = () => {
            activeTab = 'attendance';
            renderLevel2(cls);
            loadAttendanceTab(cls);
        };

        if (activeTab === 'attendance') {
            loadAttendanceTab(cls);
        }
    };

    let cachedSessions = null;
    const loadAttendanceTab = async (cls) => {
        const container = document.getElementById('attendance-list');
        if (!container) return;

        try {
            if (!cachedSessions || cachedSessions.classId !== cls.id) {
                const sessions = await getSessionsByClass(cls.id);
                cachedSessions = { classId: cls.id, sessions };
            }

            const sessions = cachedSessions.sessions;

            if (sessions.length === 0) {
                container.innerHTML = `
                    <div class="p-12 glass-panel rounded-[40px] text-center border-dashed border border-white/10">
                        <p class="text-xs text-white/20 font-black uppercase tracking-widest opacity-80 italic">No attendance sessions found.</p>
                    </div>`;
                return;
            }

            container.innerHTML = sessions.map((session, sIdx) => {
                const checkedIn = session.checkedIn || [];
                const note = session.note ? `<p class="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">${session.note}</p>` : '';
                return `
                    <div class="glass-panel p-6 rounded-[35px] border border-white/5 shadow-xl space-y-4">
                        <div class="flex items-center justify-between border-b border-white/5 pb-4">
                            <div>
                                <h3 class="font-black text-white uppercase tracking-tight">${new Date(session.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} — ${new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h3>
                                ${note}
                            </div>
                            <div class="bg-white/5 px-4 py-2 rounded-xl text-[10px] font-black text-white/60 uppercase tracking-widest border border-white/5">
                                ${checkedIn.length} <span class="opacity-50">Checked In</span>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            ${checkedIn.map((student, idx) => {
                    const statusColors = {
                        'PRESENT': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
                        'LATE': 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
                        'EXCUSED': 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20',
                        'ABSENT': 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                    };
                    const colorClass = statusColors[student.status] || statusColors['PRESENT'];

                    return `
                                <button onclick="window.cycleStatus('${session.id}', '${student.uid}', '${student.status}', this)" 
                                        class="flex items-center justify-between p-3 rounded-2xl border transition-all shadow-inner group active:scale-95 ${colorClass}" title="Click to override status">
                                    <span class="text-[10px] font-black uppercase tracking-tight truncate flex-1 text-left">${student.name || student.email}</span>
                                    <span class="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded border border-current opacity-70 group-hover:opacity-100">${student.status}</span>
                                </button>`;
                }).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        } catch (err) {
            container.innerHTML = `<div class="p-10 text-center text-red-500 font-bold uppercase tracking-widest text-[10px]">Error loading sessions</div>`;
        }
    };

    const renderLevel3 = async (student) => {
        selectedStudent = student;
        app.innerHTML = `
        <div class="relative min-h-screen bg-[#020617] pb-32">
            <!-- Dynamic Mesh Background -->
            <div class="bg-premium-gradient-fixed"></div>
            <div class="mesh-blob top-[-10%] right-[-10%] bg-emerald-600/10 scale-150"></div>
            <div class="mesh-blob bottom-[-20%] left-[-10%] bg-indigo-500/10"></div>

            <div class="relative z-10 flex flex-col items-center py-4 md:py-8 px-4">
                <div class="w-full max-w-4xl space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    
                    <!-- Header -->
                    <header class="glass-panel px-6 py-5 md:px-8 md:py-6 rounded-[40px] border border-white/10 flex flex-wrap justify-between items-center gap-4 shadow-xl overflow-hidden relative">
                         <div class="absolute inset-0 bg-emerald-500/5 backdrop-blur-3xl"></div>
                         <div class="flex items-center gap-6 relative z-10">
                            <button id="back-to-students" class="p-3 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90 shadow-lg shrink-0">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            </button>
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 md:w-16 md:h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 font-black text-xl md:text-2xl shadow-inner border border-white/5">
                                    ${student.email.charAt(0).toUpperCase()}
                                </div>
                                <div class="min-w-0">
                                    <h1 class="text-lg md:text-2xl font-black text-white leading-tight truncate uppercase tracking-tight">${student.email}</h1>
                                    <p class="text-[9px] text-emerald-400 font-black uppercase tracking-[0.3em] mt-0.5 truncate opacity-70">Enrolled Student</p>
                                </div>
                            </div>
                        </div>
                    </header>

                    <main class="space-y-8 relative z-10">
                        <section class="space-y-6">
                            <div class="flex items-center gap-4 mb-2 ml-1">
                                <h2 class="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Performance Metrics</h2>
                                <div class="h-px flex-1 bg-white/5"></div>
                            </div>
                            <div id="score-list" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="h-40 glass-panel animate-pulse rounded-[40px] border border-white/5"></div>
                                <div class="h-40 glass-panel animate-pulse rounded-[40px] border border-white/5"></div>
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </div>
        `;

        document.getElementById('back-to-students').onclick = () => renderLevel2(selectedClass);

        const scoreList = document.getElementById('score-list');
        try {
            const submissions = await getSubmissionsByStudent(student.uid);
            if (submissions.length === 0) {
                scoreList.innerHTML = `
                    <div class="glass-panel p-20 rounded-[40px] text-center border border-white/5 shadow-2xl col-span-full">
                        <p class="text-white/20 font-black uppercase tracking-widest text-xs italic">No performance data found for this student.</p>
                    </div>
                `;
                return;
            }

            const enriched = await Promise.all(submissions.map(async (s) => {
                try {
                    const assessment = await getAssessment(s.assessmentId);
                    return { ...s, assessmentTitle: assessment.title };
                } catch {
                    return { ...s, assessmentTitle: 'Archived Assessment' };
                }
            }));

            scoreList.innerHTML = enriched.map(s => {
                const isGraded = s.status === 'graded';
                const percentage = isGraded ? Math.round((s.score / s.totalPoints) * 100) : null;
                const date = new Date(s.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                return `
                    <div class="group relative glass-panel p-8 rounded-[40px] border border-white/5 hover:border-emerald-500/30 transition-all shadow-xl overflow-hidden active:scale-[0.99]">
                        <div class="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div class="flex flex-col gap-6 relative z-10">
                            <div class="flex justify-between items-start">
                                <div class="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${isGraded ? 'bg-emerald-600 text-white' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}">
                                    ${isGraded ? 'Graded' : 'Pending'}
                                </div>
                                <div class="text-[9px] font-black text-white/20 uppercase tracking-widest">${date}</div>
                            </div>

                            <div>
                                <h3 class="font-black text-white group-hover:text-emerald-400 transition-colors text-lg uppercase tracking-tight line-clamp-1 mb-1">${s.assessmentTitle}</h3>
                                <p class="text-[9px] text-white/20 font-black uppercase tracking-widest">${isGraded ? 'Standardized Score' : 'Evaluation in Progress'}</p>
                            </div>

                            ${isGraded ? `
                                <div class="space-y-4 pt-2">
                                    <div class="flex items-end justify-between">
                                        <p class="text-3xl font-black text-white tracking-tight">${s.score}<span class="text-white/20 mx-1 text-xl font-normal">/</span>${s.totalPoints}</p>
                                        <p class="text-sm font-black text-emerald-400">${percentage}%</p>
                                    </div>
                                    <div class="h-2 w-full bg-white/5 border border-white/5 rounded-full overflow-hidden">
                                        <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]" style="width: ${percentage}%"></div>
                                    </div>
                                </div>
                            ` : `
                                <div class="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 flex items-center justify-center gap-3">
                                    <span class="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                                    <span class="text-[10px] font-black text-amber-400 uppercase tracking-widest">Awaiting Grade</span>
                                </div>
                            `}
                        </div>
                    </div>
                `;
            }).join('');

        } catch (err) {
            scoreList.innerHTML = `<div class="glass-panel text-red-500 text-center py-10 font-bold border border-white/5 rounded-[40px] col-span-full">Failed to load scores.</div>`;
        }
    };

    const renderPendingList = (cls) => {
        if (!cls.pendingStudents || cls.pendingStudents.length === 0) {
            return `
                <div class="p-12 glass-panel rounded-[40px] text-center border-dashed border border-white/10">
                    <p class="text-xs text-white/20 font-black uppercase tracking-widest opacity-50 italic">No pending requests</p>
                </div>
            `;
        }
        return cls.pendingStudents.map((s, idx) => {
            const email = s.email || 'No Email';
            return `
                <div class="glass-panel p-6 rounded-[35px] border border-white/5 flex items-center justify-between shadow-xl">
                    <div class="flex items-center gap-5">
                        <div class="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 font-bold text-xs uppercase border border-amber-500/20">
                            ${email.charAt(0)}
                        </div>
                        <div>
                            <p class="font-black text-white uppercase tracking-tight text-sm">${email}</p>
                            <p class="text-[9px] text-white/20 font-mono mt-1">${s.uid.substring(0, 16).toUpperCase()}</p>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="window.processStudent('${cls.id}', ${idx}, 'reject')" class="w-12 h-12 glass-panel rounded-2xl text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center border border-white/5">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                        <button onclick="window.processStudent('${cls.id}', ${idx}, 'approve')" class="w-12 h-12 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-110 active:scale-95 transition-all flex items-center justify-center border border-white/10">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    };

    const renderStudentList = (cls) => {
        if (!cls.students || cls.students.length === 0) {
            return `
                <div class="p-12 glass-panel rounded-[40px] text-center border-dashed border border-white/10 col-span-full">
                    <p class="text-xs text-white/20 font-black uppercase tracking-widest opacity-80 italic">No students enrolled</p>
                </div>
            `;
        }
        return cls.students.map((s, idx) => {
            const email = s.email || 'No Email';
            return `
                <div class="group relative glass-panel p-6 rounded-[35px] border border-white/5 flex items-center justify-between hover:border-emerald-500/30 transition-all active:scale-[0.98] shadow-lg">
                    <div onclick="window.viewScores(${idx})" class="flex items-center gap-6 cursor-pointer flex-1">
                        <div class="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all border border-white/5">
                            ${email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p class="font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">${email}</p>
                            <p class="text-[10px] text-white/20 font-mono tracking-widest mt-1">${s.uid.substring(0, 16).toUpperCase()}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <button onclick="window.removeFromRegistry('${cls.id}', ${idx})" class="p-3 rounded-2xl bg-white/5 text-white/20 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 transition-all border border-white/5" title="Remove Access">
                             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                        <div onclick="window.viewScores(${idx})" class="cursor-pointer text-white/10 group-hover:text-emerald-400 p-2 transition-all">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                        </div>
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
                    <div class="text-center py-24 glass-panel rounded-[50px] border border-dashed border-white/10 animate-in fade-in duration-700">
                        <div class="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto mb-8 text-white/15 ring-1 ring-white/5">
                            <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-10V4a1 1 0 011-1h5a1 1 0 011 1v3M6 7h1m-1 4h1m11 10a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h12z"></path></svg>
                        </div>
                        <h3 class="text-2xl font-black text-white mb-2 uppercase tracking-tight">No Classes Found</h3>
                        <p class="text-white/40 font-black uppercase tracking-widest text-[9px] mb-10 max-w-xs mx-auto">Your class list is currently empty. Create your first class to begin managing students.</p>
                        <button onclick="document.getElementById('add-class-btn').click()" class="bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-500/20 border border-white/20 hover:-translate-y-0.5 transition-all">Create Class Now</button>
                    </div>
                `;
                return;
            }

            grid.innerHTML = currentClasses.map((cls, idx) => {
                const pendingCount = cls.pendingStudents?.length || 0;
                const studentCount = cls.students?.length || 0;
                return `
                <div onclick="window.drillDown(${idx})" class="group relative glass-panel p-8 md:p-10 rounded-[45px] border border-white/5 hover:border-emerald-500/30 hover:-translate-y-1 transition-all cursor-pointer overflow-hidden shadow-2xl active:scale-[0.99]">
                    <div class="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <button onclick="event.stopPropagation(); window.hideClass('${cls.id}')" class="absolute top-6 right-6 z-20 p-4 bg-white/5 border border-white/5 rounded-2xl text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all ring-1 ring-white/5 shadow-lg" title="Archive Class">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                    </button>
                    
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                        <div class="flex items-center gap-6 md:gap-8">
                            <div class="w-16 h-16 md:w-20 md:h-20 bg-emerald-500/10 rounded-[28px] flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all ring-1 ring-white/5 shadow-inner">
                                <svg class="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                            </div>
                            <div>
                                <h3 class="font-black text-white text-2xl md:text-3xl group-hover:text-emerald-400 transition-colors uppercase tracking-tight">${cls.name}</h3>
                                <div class="flex items-center gap-3 mt-2">
                                    <p class="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] opacity-80">${cls.section || 'General'}</p>
                                    <span class="w-1.5 h-1.5 bg-white/10 rounded-full"></span>
                                    <p class="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Code: ${cls.code}</p>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center gap-8 md:gap-12">
                            <div class="flex flex-col items-center">
                                <span class="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Students</span>
                                <span class="text-xl font-black text-white">${studentCount}</span>
                            </div>
                            
                            <div class="flex flex-col items-center relative">
                                <span class="text-[9px] font-black text-amber-400/60 uppercase tracking-[0.2em] mb-1">Requests</span>
                                <div class="flex items-center gap-2">
                                    <span class="text-xl font-black text-amber-400">${pendingCount}</span>
                                    ${pendingCount > 0 ? '<span class="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping"></span>' : ''}
                                </div>
                            </div>

                            <div class="h-10 w-px bg-white/10 hidden md:block"></div>
                            <div class="flex items-center justify-between p-4 bg-white/5 rounded-[22px] text-white/20 group-hover:bg-emerald-600 group-hover:text-white group-hover:drop-shadow-[0_10px_20px_rgba(16,185,129,0.4)] transition-all border border-white/5 group-hover:border-emerald-400">
                                <span class="text-[10px] font-black uppercase tracking-widest mr-3">Manage</span>
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                            </div>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
        } catch (err) {
            grid.innerHTML = `<div class="glass-panel text-red-500 text-center py-12 font-bold border border-white/5 rounded-[40px]">Failed to load classes.</div>`;
        }
    };

    const setupEventListeners = () => {
        setupModalListeners('class-modal');
        document.getElementById('add-class-btn').onclick = () => document.getElementById('class-modal').classList.remove('hidden');

        document.getElementById('create-class-form').onsubmit = async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Creating...';
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
    window.drillDown = (idx) => {
        const cls = currentClasses[idx];
        activeTab = (cls.pendingStudents?.length > 0) ? 'requests' : 'cohort';
        renderLevel2(cls);
    };
    window.viewScores = (idx) => renderLevel3(selectedClass.students[idx]);
    window.copyJoinCode = (code, btn) => {
        navigator.clipboard.writeText(code);
        const originalContent = btn.innerHTML;
        btn.innerHTML = `<svg class="w-5 h-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Copied!`;
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
            alert("Workflow error");
        }
    };

    window.removeFromRegistry = async (classId, studentIdx) => {
        const student = selectedClass.students[studentIdx];
        if (!confirm(`Are you sure you want to remove access for ${student.email}?`)) return;

        try {
            await removeFromClass(classId, student);
            selectedClass.students.splice(studentIdx, 1);
            renderLevel2(selectedClass);
        } catch (err) {
            console.error(err);
            alert("Failed to remove student.");
        }
    };

    window.hideClass = async (classId) => {
        if (!confirm("Hide this class?")) return;
        try {
            await softDeleteClass(classId);
            loadClasses();
        } catch (err) {
            alert("Failed to hide class");
        }
    };

    window.exportClassScores = async (classId) => {
        try {
            const assessments = await getAssessmentsByClass(classId);
            if (assessments.length === 0) return alert("No assessment data found.");

            const submissionsData = await Promise.all(assessments.map(async (a) => ({
                assessmentTitle: a.title,
                submissions: await getSubmissionsForAssessment(a.id)
            })));

            const students = selectedClass.students || [];
            if (students.length === 0) return alert("No students enrolled.");

            const exportData = students.map(s => {
                const studentId = typeof s === 'string' ? s : s.uid;
                const studentName = typeof s === 'string' ? 'Unnamed' : (s.displayName || s.name || 'Unnamed');
                const studentEmail = typeof s === 'string' ? 'Unknown' : (s.email || 'Unknown');

                const row = { 'Student Name': studentName, 'Email': studentEmail };

                submissionsData.forEach(ad => {
                    const sub = ad.submissions.find(subDoc => subDoc.studentId === studentId);
                    row[ad.assessmentTitle] = sub ? (sub.score !== null ? `${sub.score}/${sub.totalPoints}` : 'Pending') : 'N/A';
                });
                return row;
            });

            const safeClassName = selectedClass.name.replace(/[\\/:"*?<>|]+/g, '').trim();
            downloadCSV(exportData, `${safeClassName} - Gradebook.csv`);
        } catch (err) {
            alert("Export failed.");
        }
    };

    window.exportClassAttendance = async (classId) => {
        try {
            await exportAttendanceCSV(classId, selectedClass);
        } catch (err) {
            console.error("Attendance export failed:", err);
            alert("Failed to export attendance data.");
        }
    };

    window.cycleStatus = async (sessionId, uid, currentStatus, btnElement) => {
        const statuses = ['PRESENT', 'LATE', 'EXCUSED', 'ABSENT'];
        const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];

        // Optimistic UI update
        const originalHTML = btnElement.innerHTML;
        const originalClass = btnElement.className;
        btnElement.innerHTML = `<span class="flex-1 text-center animate-pulse tracking-widest">SAVING...</span>`;

        try {
            await updateCheckinStatus(sessionId, uid, nextStatus);
            // Refresh purely from backend cache to ensure it flows down
            const tgtSession = cachedSessions.sessions.find(s => s.id === sessionId);
            if (tgtSession) {
                const tgtStudent = tgtSession.checkedIn.find(s => s.uid === uid);
                if (tgtStudent) tgtStudent.status = nextStatus;
            }
            // Trigger fresh render
            if (activeTab === 'attendance' && selectedClass) {
                loadAttendanceTab(selectedClass);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to update status");
            btnElement.innerHTML = originalHTML;
            btnElement.className = originalClass;
        }
    };

    renderLevel1();
};
