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

    const renderHeader = () => `
        <header class="glass-panel sticky top-0 z-40 px-8 py-8 border-b border-gray-100 flex justify-between items-center transition-all">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-blue-premium rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                </div>
                <div>
                    <h1 class="text-xl font-black text-gray-900 leading-tight">Student Portal</h1>
                    <div class="flex items-center gap-2">
                        <p class="text-xs text-gray-800 font-bold">${userName}</p>
                        <span class="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <button id="edit-profile-btn" class="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700">Settings</button>
                    </div>
                </div>
            </div>
            <button id="logout-btn" class="p-2 glass-panel rounded-xl text-gray-400 hover:text-red-500 transition-colors shadow-sm">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            </button>
        </header>
    `;

    const renderNav = () => `
        <nav class="flex gap-1 p-1 bg-gray-200/50 rounded-2xl mb-8 glass-panel backdrop-blur-sm sticky top-[100px] z-30">
            <button id="view-exams-btn" class="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentView === 'assessments' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}">Exams</button>
            <button id="view-grades-btn" class="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentView === 'grades' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}">My Performance</button>
        </nav>
    `;

    const renderAssessmentsView = () => `
        <div class="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <!-- Join Class Card -->
            <section class="relative bg-blue-premium p-10 rounded-[40px] shadow-2xl shadow-blue-200/50 text-white overflow-hidden">
                <div class="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-3xl"></div>
                <div class="relative z-10">
                    <h3 class="text-3xl font-black mb-2">Join a New Class</h3>
                    <p class="text-blue-100/70 text-sm font-medium mb-8">Ready to start? Enter your unique class access key below.</p>
                    <form id="join-class-form" class="flex flex-col gap-4">
                        <input id="class-code" type="text" placeholder="ACCESS KEY" class="flex-1 bg-white/10 border-2 border-white/20 rounded-2xl p-5 text-center font-mono text-3xl font-black tracking-[0.4em] placeholder:text-white/20 focus:bg-white/20 focus:border-white/40 outline-none transition-all uppercase" required maxlength="6">
                        <button type="submit" class="bg-white text-blue-600 p-5 rounded-2xl font-black uppercase text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Request Entry</button>
                    </form>
                </div>
            </section>

            <!-- Active Assessments -->
            <div id="assessments-container" class="space-y-8">
                <div class="h-40 glass-panel animate-pulse rounded-[40px]"></div>
            </div>
        </div>
    `;

    const renderGradesView = () => `
        <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" id="grades-container">
            <div class="h-40 glass-panel animate-pulse rounded-[40px]"></div>
        </div>
    `;

    // --- Initial Shell ---
    app.innerHTML = `
        <div class="flex items-start justify-center min-h-screen bg-premium-gradient py-8 px-4">
            <div class="bg-white w-full max-w-xl rounded-[50px] shadow-2xl shadow-blue-200/50 animate-in fade-in slide-in-from-bottom-8 duration-700 relative overflow-hidden border border-white min-h-[90vh]">
                <div class="absolute top-0 right-0 w-80 h-80 bg-blue-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-30"></div>
                
                ${renderHeader()}
                
                <main class="p-8 relative z-10">
                    ${renderNav()}
                    <div id="view-content">
                        ${renderAssessmentsView()}
                    </div>
                </main>
            </div>

            <!-- Profile Modal -->
            ${renderModal({
        id: 'profile-modal',
        title: 'Account Settings',
        content: `
                    <form id="profile-form" class="space-y-6">
                        ${renderInput({ id: 'profile-name', label: 'Student Display Name', value: userName, placeholder: 'e.g. John Doe' })}
                        <p class="text-[10px] text-gray-400 font-medium">This name will be visible to your teachers on class lists and performance reports.</p>
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
            app.querySelector('#view-content').innerHTML = renderAssessmentsView();
            // Re-render nav to update active state
            app.querySelector('nav').outerHTML = renderNav();
            setupListeners();
            loadAssessments();
        };

        document.getElementById('view-grades-btn').onclick = () => {
            currentView = 'grades';
            app.querySelector('#view-content').innerHTML = renderGradesView();
            app.querySelector('nav').outerHTML = renderNav();
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

            const groups = {};
            myClasses.forEach(c => groups[c.id] = { name: c.name, section: c.section, exams: [] });

            examsWithStatus.forEach(ex => {
                const classIds = ex.assignedClassIds || (ex.assignedClassId ? [ex.assignedClassId] : []);
                classIds.forEach(cid => {
                    if (groups[cid]) {
                        groups[cid].exams.push(ex);
                    }
                });
            });

            let html = '';

            // Enrolled Pills
            if (myClasses.length > 0) {
                html += `
                    <div class="mb-4 overflow-hidden">
                        <h4 class="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4 pl-1">Authorized Enrolments</h4>
                        <div class="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            ${myClasses.map(c => `
                                <div class="bg-white px-6 py-4 rounded-[20px] shadow-sm border border-white flex items-center gap-3 whitespace-nowrap">
                                    <div class="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-200"></div>
                                    <span class="font-black text-gray-800 text-xs tracking-tight">${c.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            // Render Groups
            Object.values(groups).forEach(g => {
                html += `
                    <div class="bg-white rounded-[40px] shadow-sm border border-white overflow-hidden mb-10 transition-all hover:shadow-md">
                        <div class="bg-gray-50/70 glass-panel px-10 py-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 class="font-black text-gray-900 text-base uppercase tracking-tight">${g.name}</h3>
                                <p class="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] mt-0.5">${g.section || 'Standard Section'}</p>
                            </div>
                            <div class="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-50 flex items-center justify-center">
                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                            </div>
                        </div>
                        <div class="divide-y divide-gray-50">
                            ${g.exams.length > 0
                        ? g.exams.map(e => renderExamRow(e)).join('')
                        : '<div class="p-16 text-center text-gray-500 text-xs font-black uppercase tracking-widest italic opacity-80">No active assessments in this group</div>'}
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;

        } catch (err) {
            container.innerHTML = '<div class="glass-panel text-red-500 text-center py-10 font-bold">Error loading course materials</div>';
        }
    };

    const renderExamRow = (ex) => `
        <div class="px-10 py-8 flex justify-between items-center group hover:bg-blue-50/50 transition-all">
            <div class="flex items-center gap-6">
                <div class="w-14 h-14 ${ex.completed ? 'bg-gray-100 text-gray-300 shadow-inner' : 'bg-blue-50 text-blue-600 shadow-sm'} rounded-2xl flex items-center justify-center transition-all group-hover:scale-110">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                </div>
                <div>
                    <h4 class="font-black text-gray-900 text-xl group-hover:text-blue-600 transition-colors tracking-tight">${ex.title}</h4>
                    <div class="flex items-center gap-3 mt-1.5">
                        <span class="text-[10px] text-gray-600 font-black uppercase tracking-widest">${ex.questionCount} Items</span>
                        <span class="w-1 h-1 bg-gray-200 rounded-full"></span>
                        <span class="text-[10px] text-blue-500/70 font-black uppercase tracking-widest">Active Now</span>
                    </div>
                </div>
            </div>
            ${ex.completed
            ? '<div class="bg-gray-100 text-gray-400 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-gray-200 shadow-inner">Complete</div>'
            : `<button onclick="location.hash='#taker?id=${ex.id}'" class="bg-blue-premium text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-100 hover:shadow-2xl hover:shadow-blue-200 hover:-translate-y-1 transition-all active:scale-95">Start Exam</button>`
        }
        </div>
    `;

    const loadGrades = async () => {
        const container = document.getElementById('grades-container');
        try {
            const submissions = await getSubmissionsByStudent(user.user.uid);
            if (submissions.length === 0) {
                container.innerHTML = `
                    <div class="bg-white p-20 rounded-[50px] border border-white text-center shadow-xl shadow-blue-100/30">
                        <div class="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-gray-200 shadow-inner">
                             <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <h3 class="text-2xl font-black text-gray-900 tracking-tight">Focus on Learning</h3>
                        <p class="text-gray-400 mt-3 text-sm max-w-xs mx-auto leading-relaxed font-medium">Your performance metrics will propagate here once you complete your assigned course evaluations.</p>
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

            container.innerHTML = `
                <div class="flex items-center gap-3 mb-6 pl-2">
                    <h2 class="text-xs font-black text-gray-600 uppercase tracking-[0.3em]">Institutional Record</h2>
                    <div class="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
                </div>
                <div class="grid gap-6">
        ${enriched.map(s => {
                const isGraded = s.status === 'graded';
                const percentage = isGraded ? Math.round((s.score / s.totalPoints) * 100) : null;
                const date = new Date(s.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                return `
                             <div class="bg-white p-10 rounded-[40px] border border-white shadow-xl shadow-blue-50/50 flex flex-col sm:flex-row items-center justify-between group hover:border-blue-200 transition-all text-left gap-8">
                                <div class="flex items-center gap-8 w-full">
                                    <div class="w-20 h-20 ${isGraded ? 'bg-blue-premium text-white shadow-blue-200' : 'bg-orange-50 text-orange-600 shadow-orange-100'} rounded-[28px] flex flex-col items-center justify-center font-black shadow-lg transition-transform group-hover:scale-110">
                                        <span class="text-[10px] uppercase opacity-70">${date.split(' ')[0]}</span>
                                        <span class="text-2xl tracking-tighter">${date.split(' ')[1]}</span>
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="font-black text-gray-900 text-2xl group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight">${s.assessmentTitle}</h3>
                                        <p class="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em] mt-2">${isGraded ? 'Standardized Score' : 'Evaluation in Progress'}</p>
                                    </div>
                                </div>
                                <div class="text-center sm:text-right w-full sm:w-auto">
                                    ${isGraded ? `
                                        <div class="flex flex-col items-center sm:items-end gap-6">
                                            <div class="text-center sm:text-right">
                                                <p class="text-5xl font-black text-gray-900 tracking-tighter">${s.score}<span class="text-gray-200 mx-2 text-3xl">/</span>${s.totalPoints}</p>
                                                <div class="w-full sm:w-40 h-3 bg-gray-50 rounded-full mt-5 overflow-hidden shadow-inner border border-gray-100">
                                                    <div class="h-full bg-blue-premium shadow-lg" style="width: ${percentage}%"></div>
                                                </div>
                                            </div>
                                            <button onclick="location.hash='#results?id=${s.id}'" class="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-premium hover:-translate-y-1 transition-all shadow-xl shadow-gray-200">View Analysis</button>
                                        </div>
                                    ` : `
                                        <span class="text-[11px] font-black text-orange-600 uppercase tracking-widest bg-orange-100 px-6 py-3 rounded-2xl border border-orange-200">Processing</span>
                                    `}
                                </div>
                            </div>
                        `;
            }).join('')}
    </div>
`;
        } catch (err) {
            container.innerHTML = '<div class="glass-panel text-red-500 text-center py-10 font-bold">Failed to process performance telemetry</div>';
        }
    };

    setupListeners();
    loadAssessments();
};
