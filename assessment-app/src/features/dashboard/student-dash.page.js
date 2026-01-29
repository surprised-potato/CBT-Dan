import { renderButton } from '../../shared/button.js';
import { renderInput } from '../../shared/input.js';
import { joinClass, getStudentClasses } from '../../services/class.service.js';
import { getActiveAssessments, getAssessment } from '../../services/assessment.service.js';
import { getUser } from '../../core/store.js';
import { renderModal, setupModalListeners } from '../../shared/modal.js';
import { updateUserProfile } from '../../services/auth.service.js';
import { getSubmissionsByStudent, checkSubmission } from '../../services/submission.service.js';

export const StudentDashPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();

    if (!user) {
        window.location.hash = '#login';
        return;
    }

    const userEmail = user.email || user.user?.email || 'No Email';
    const userName = user.displayName || 'Student';

    let currentView = 'assessments'; // 'assessments' or 'grades'
    let myClasses = [];
    let activeAssessments = [];

    const renderHeader = () => `
        <header class="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 p-4 sticky top-0 z-40">
            <div class="max-w-5xl mx-auto flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    </div>
                    <div>
                        <h1 class="text-xl font-black text-gray-900 leading-tight">Student Portal</h1>
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
    `;

    const renderNav = () => `
        <nav class="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-8">
            <button id="view-exams-btn" class="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentView === 'assessments' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}">Exams</button>
            <button id="view-grades-btn" class="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentView === 'grades' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}">My Grades</button>
        </nav>
    `;

    const renderAssessmentsView = () => `
        <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <!-- Join Class Card -->
            <section class="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-[40px] shadow-2xl shadow-blue-100 text-white relative overflow-hidden">
                <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div class="relative z-10">
                    <h3 class="text-2xl font-black mb-2">Join a New Class</h3>
                    <p class="text-blue-100/80 text-xs font-medium mb-6">Enter the 6-digit code provided by your instructor.</p>
                    <form id="join-class-form" class="flex flex-col md:flex-row gap-4">
                        <input id="class-code" type="text" placeholder="CODE" class="flex-1 bg-white/10 border-2 border-white/20 rounded-2xl p-4 text-center font-mono text-2xl font-black tracking-[0.5em] placeholder:text-white/30 focus:bg-white/20 focus:border-white/40 outline-none transition-all" required maxlength="6">
                        <button type="submit" class="bg-white text-blue-600 px-10 py-4 rounded-2xl font-black uppercase text-sm shadow-xl hover:scale-105 active:scale-95 transition-all">Request Entry</button>
                    </form>
                </div>
            </section>

            <!-- Active Assessments -->
            <section id="assessments-container" class="space-y-6">
                <!-- Skeleton Loading -->
                <div class="h-40 bg-gray-200 animate-pulse rounded-[40px]"></div>
                <div class="h-40 bg-gray-200 animate-pulse rounded-[40px]"></div>
            </section>
        </div>
    `;

    const renderGradesView = () => `
        <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-10" id="grades-container">
            <div class="h-40 bg-gray-200 animate-pulse rounded-[40px]"></div>
        </div>
    `;

    app.innerHTML = `
        <div class="bg-gray-50 min-h-screen pb-20">
            ${renderHeader()}
            <main class="max-w-3xl mx-auto p-4 mt-8">
                ${renderNav()}
                <div id="view-content">
                    ${renderAssessmentsView()}
                </div>
            </main>

            <!-- Profile Modal -->
            ${renderModal({
        id: 'profile-modal',
        title: 'Account Settings',
        content: `
                    <form id="profile-form" class="space-y-6">
                        ${renderInput({ id: 'profile-name', label: 'Display Name', value: userName, placeholder: 'e.g. John Doe' })}
                        <p class="text-[10px] text-gray-400 font-medium">This is how you will appear on your teacher's class lists and reports.</p>
                        <button type="submit" class="w-full bg-blue-600 text-white p-4 rounded-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">Save Changes</button>
                    </form>
                `
    })}
        </div>
    `;

    // --- Logic ---

    const setupListeners = () => {
        document.getElementById('logout-btn').onclick = () => window.location.hash = '#login';

        setupModalListeners('profile-modal');
        document.getElementById('edit-profile-btn').onclick = () => document.getElementById('profile-modal').classList.remove('hidden');

        document.getElementById('view-exams-btn').onclick = () => {
            currentView = 'assessments';
            app.querySelector('main').innerHTML = `${renderNav()}<div id="view-content">${renderAssessmentsView()}</div>`;
            setupListeners();
            loadAssessments();
        };

        document.getElementById('view-grades-btn').onclick = () => {
            currentView = 'grades';
            app.querySelector('main').innerHTML = `${renderNav()}<div id="view-content">${renderGradesView()}</div>`;
            setupListeners();
            loadGrades();
        };

        const joinForm = document.getElementById('join-class-form');
        if (joinForm) {
            joinForm.onsubmit = async (e) => {
                e.preventDefault();
                const code = document.getElementById('class-code').value.toUpperCase();
                const btn = e.target.querySelector('button');
                btn.disabled = true;
                btn.textContent = 'Verifying...';
                try {
                    await joinClass(code, user.user.uid, userEmail, userName);
                    alert("Request sent! Your teacher will review your enrollment.");
                    e.target.reset();
                } catch (err) {
                    alert(err.message);
                } finally {
                    btn.disabled = false;
                    btn.textContent = 'Request Entry';
                }
            };
        }
    };

    const loadAssessments = async () => {
        const container = document.getElementById('assessments-container');
        try {
            myClasses = await getStudentClasses(user.user.uid);
            const myClassIds = myClasses.map(c => c.id);
            const rawExams = await getActiveAssessments(myClassIds);

            const examsWithStatus = await Promise.all(rawExams.map(async (a) => {
                const completed = await checkSubmission(a.id, user.user.uid);
                return { ...a, completed };
            }));

            // Group by class
            const groups = {};
            myClasses.forEach(c => groups[c.id] = { name: c.name, section: c.section, exams: [] });

            const publicExams = [];
            examsWithStatus.forEach(ex => {
                if (ex.assignedClassId && groups[ex.assignedClassId]) {
                    groups[ex.assignedClassId].exams.push(ex);
                } else if (!ex.assignedClassId) {
                    publicExams.push(ex);
                }
            });

            let html = '';

            // Enrolled Pills
            if (myClasses.length > 0) {
                html += `
                    <div class="mb-2">
                        <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 pl-1">Enrolled Classes</h4>
                        <div class="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                            ${myClasses.map(c => `
                                <div class="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 whitespace-nowrap">
                                    <div class="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></div>
                                    <span class="font-black text-gray-700 text-xs">${c.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            // Render Groups
            Object.values(groups).forEach(g => {
                html += `
                    <div class="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden mb-8">
                        <div class="bg-gray-50/50 px-8 py-4 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 class="font-black text-gray-900 text-sm uppercase tracking-tight">${g.name}</h3>
                                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">${g.section || 'General'}</p>
                            </div>
                        </div>
                        <div class="divide-y divide-gray-50">
                            ${g.exams.length > 0
                        ? g.exams.map(e => renderExamRow(e)).join('')
                        : '<div class="p-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest bg-gray-50/20">No active assessments</div>'}
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;

        } catch (err) {
            console.error(err);
            container.innerHTML = `<p class="text-red-500 text-center py-10 font-bold">Failed to load assessments.</p>`;
        }
    };

    const renderExamRow = (ex) => `
        <div class="p-6 flex justify-between items-center group hover:bg-blue-50/30 transition-all">
            <div class="flex items-center gap-5">
                <div class="w-12 h-12 ${ex.completed ? 'bg-gray-100 text-gray-300' : 'bg-blue-50 text-blue-600'} rounded-2xl flex items-center justify-center transition-all group-hover:scale-110">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <div>
                    <h4 class="font-black text-gray-900 text-lg group-hover:text-blue-600 transition-colors">${ex.title}</h4>
                    <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">${ex.questionCount} Questions</p>
                </div>
            </div>
            ${ex.completed
            ? `<div class="bg-gray-100 text-gray-400 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-gray-200">Completed</div>`
            : `<button onclick="location.hash='#taker?id=${ex.id}'" class="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95">Take Exam</button>`
        }
        </div>
    `;

    const loadGrades = async () => {
        const container = document.getElementById('grades-container');
        try {
            const submissions = await getSubmissionsByStudent(user.user.uid);
            if (submissions.length === 0) {
                container.innerHTML = `
                    <div class="bg-white p-20 rounded-[40px] border border-gray-100 text-center shadow-sm">
                        <div class="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-300">
                             <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <h3 class="text-xl font-black text-gray-900 uppercase tracking-tight">No grades yet</h3>
                        <p class="text-gray-400 mt-2 text-sm max-w-xs mx-auto">Complete assessments to see your performance metrics here.</p>
                    </div>
                `;
                return;
            }

            const enriched = await Promise.all(submissions.map(async (s) => {
                try {
                    const assessment = await getAssessment(s.assessmentId);
                    return { ...s, assessmentTitle: assessment.title };
                } catch {
                    return { ...s, assessmentTitle: 'Deleted Assessment' };
                }
            }));

            container.innerHTML = `
                <div class="text-left mb-6">
                    <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.3em] pl-2">Performance History</h2>
                </div>
                <div class="grid gap-4">
                    ${enriched.map(s => {
                const isGraded = s.status === 'graded';
                const percentage = isGraded ? Math.round((s.score / s.totalPoints) * 100) : null;
                const date = new Date(s.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                return `
                             <div class="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all text-left">
                                <div class="flex items-center gap-6">
                                    <div class="w-14 h-14 ${isGraded ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'} rounded-[20px] flex items-center justify-center font-black text-xs uppercase shadow-inner">
                                        ${date}
                                    </div>
                                    <div>
                                        <h3 class="font-black text-gray-900 text-xl group-hover:text-blue-600 transition-colors uppercase tracking-tight">${s.assessmentTitle}</h3>
                                        <p class="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">${isGraded ? 'Official Result' : 'Scoring in Progress'}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    ${isGraded ? `
                                        <p class="text-3xl font-black text-gray-900">${s.score}<span class="text-gray-200 mx-1">/</span>${s.totalPoints}</p>
                                        <div class="w-32 h-2 bg-gray-50 rounded-full mt-3 overflow-hidden shadow-inner">
                                            <div class="h-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg" style="width: ${percentage}%"></div>
                                        </div>
                                    ` : `
                                        <span class="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-4 py-2 rounded-full border border-orange-100">Pending</span>
                                    `}
                                </div>
                            </div>
                        `;
            }).join('')}
                </div>
            `;

        } catch (err) {
            console.error(err);
            container.innerHTML = `<p class="text-red-500 font-bold">Failed to load grades.</p>`;
        }
    };

    setupListeners();
    loadAssessments();
};
