import { renderButton } from '../../shared/button.js';
import { renderInput } from '../../shared/input.js';
import { joinClass, getStudentClasses } from '../../services/class.service.js';
import { getActiveAssessmentsSummary, getAssessment } from '../../services/assessment.service.js';
import { getUser } from '../../core/store.js';
import { renderModal, setupModalListeners } from '../../shared/modal.js';
import { updateUserProfile, logoutUser, changeUserPassword } from '../../services/auth.service.js';
import { getSubmissionsByStudent, checkSubmission } from '../../services/submission.service.js';
import { enforceProfileCompletion } from '../../core/utils.js';
import { getActiveSessionsForStudent } from '../../services/attendance.service.js';

export const StudentDashPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();

    if (!user) {
        window.location.hash = '#login';
        return;
    }

    const userEmail = user.email || (user.user && user.user.email) || 'No Email';
    const userName = user.displayName || 'Student';

    let currentView = 'exams'; // 'exams' or 'performance'
    let myClasses = [];

    const renderHeader = () => `
        <header class="glass-panel sticky top-4 z-40 px-6 py-5 md:px-8 md:py-7 rounded-[35px] border border-white/10 flex justify-between items-center shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)]">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl md:rounded-2xl flex items-center justify-center shadow-[0_10px_25px_rgba(16,185,129,0.3)] relative">
                    <div class="absolute inset-0 bg-emerald-400 rounded-xl md:rounded-2xl animate-pulse opacity-20 blur-lg"></div>
                    <svg class="w-6 h-6 md:w-7 md:h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                <div>
                    <h1 class="text-lg md:text-xl font-black text-white leading-tight tracking-tight uppercase">Cognita</h1>
                    <div class="flex items-center gap-2 mt-0.5">
                        <p class="text-[11px] text-white/60 font-medium">${userName}</p>
                        <span class="w-1 h-1 bg-white/20 rounded-full"></span>
                        <button id="edit-profile-btn" class="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300">Settings</button>
                    </div>
                </div>
            </div>
            <button id="logout-btn" class="p-3 bg-white/5 border border-white/5 rounded-2xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-90">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            </button>
        </header>
    `;

    const renderNav = () => `
        <nav class="flex p-2 bg-white/5 border border-white/5 rounded-[28px] md:rounded-[32px] mb-8 md:mb-10 backdrop-blur-xl">
            <button id="exams-tab" class="flex-1 py-4 md:py-5 px-6 rounded-[22px] md:rounded-[26px] text-xs font-black uppercase tracking-[0.2em] transition-all ${currentView === 'exams' ? 'bg-white/10 text-white shadow-lg ring-1 ring-white/10' : 'text-white/40 hover:text-white/60'}">
                Exams
            </button>
            <button id="performance-tab" class="flex-1 py-4 md:py-5 px-6 rounded-[22px] md:rounded-[26px] text-xs font-black uppercase tracking-[0.2em] transition-all ${currentView === 'performance' ? 'bg-white/10 text-white shadow-lg ring-1 ring-white/10' : 'text-white/40 hover:text-white/60'}">
                Analytics
            </button>
        </nav>
    `;

    const renderJoinClassCard = () => `
        <div class="group relative bg-gradient-to-br from-blue-600 to-indigo-800 p-8 md:p-10 rounded-[40px] shadow-[0_20px_50px_-15px_rgba(37,99,235,0.4)] overflow-hidden mb-8 border border-white/20">
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)] opacity-50"></div>
            <div class="relative z-10">
                <h3 class="text-white text-2xl font-black tracking-tight mb-2">Enroll in Class</h3>
                <p class="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-8">Enter your section invitation code</p>
                <div class="flex flex-col md:flex-row gap-4">
                    <input id="invite-code" type="text" placeholder="CODE-123" class="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder:text-white/30 text-lg font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-white/30 transition-all uppercase">
                    <button id="join-class-btn" class="bg-white text-blue-700 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:-translate-y-1 transition-all active:scale-95">Enroll Now</button>
                </div>
            </div>
        </div>
    `;

    const renderAttendanceCard = () => `
        <div onclick="location.hash='#checkin'" class="group relative glass-panel p-8 rounded-[40px] border border-white/5 cursor-pointer overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_30px_60px_-15px_rgba(16,185,129,0.3)] hover:border-emerald-500/30 active:scale-[0.98]">
            <div class="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-20 -mt-20 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div class="flex items-center gap-6">
                    <div class="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[22px] flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v0m6 0v0m6 0v0M5 16h2m10 0h2m-4-6h2m-4 0h2m-4 0h2m-4 0h2m-4 0h2m-8 8v2m0-10V4m0 0h2M5 4h2M5 4h2"></path></svg>
                    </div>
                    <div>
                        <h3 class="font-black text-white text-2xl tracking-tight group-hover:text-emerald-400 transition-all">Quick Attendance</h3>
                        <p class="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Scan Session QR Code</p>
                    </div>
                </div>
                <div class="flex items-center justify-between p-4 bg-white/5 rounded-[22px] text-white/20 group-hover:bg-emerald-600 group-hover:text-white transition-all border border-white/5 group-hover:border-emerald-400/30">
                    <span class="text-[9px] font-black uppercase tracking-[0.3em] ml-2">Open Scanner</span>
                    <svg class="w-5 h-5 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
            </div>
        </div>
    `;

    const renderAssessmentsView = () => `
        <div class="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            ${renderJoinClassCard()}
            ${renderAttendanceCard()}

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

    const isEmailUser = (user.user && user.user.providerData && user.user.providerData.some(p => p.providerId === 'password')) || false;

    // --- Initial Shell ---
    app.innerHTML = `
        <div class="relative min-h-screen bg-[#020617]">
            <!-- Dynamic Mesh Background -->
            <div class="bg-premium-gradient-fixed"></div>
            <div class="mesh-blob top-[-10%] right-[-10%] bg-emerald-600/10"></div>
            <div class="mesh-blob bottom-[-10%] left-[-10%] bg-blue-600/10"></div>

            <div class="relative z-10 flex flex-col items-center py-4 md:py-8 px-4">
                <div class="w-full max-w-xl space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    ${renderHeader()}
                    <main class="relative z-10">
                        ${renderNav()}
                        <div id="view-content" class="min-h-[60vh]">
                            ${currentView === 'exams' ? renderAssessmentsView() : renderGradesView()}
                        </div>
                    </main>
                </div>
            </div>

            <!-- Profile Modal -->
    ${renderModal({
        id: 'profile-modal',
        title: 'Account Settings',
        content: `
            <form id="profile-form" class="space-y-6">
                ${renderInput({ id: 'profile-name', label: 'Full Name', value: userName, placeholder: 'Juan Dela Cruz', classes: 'bg-white/5 border-white/5 text-white placeholder:text-white/20' })}
                <p class="text-[10px] text-white/30 font-medium px-4">This name will be used on your certificates and performance reports.</p>

                ${isEmailUser ? `
                    <div class="pt-4 border-t border-white/10">
                        ${renderInput({ id: 'profile-password', label: 'New Password', type: 'password', placeholder: 'Leave blank to keep current password', showToggle: true, classes: 'bg-white/5 border-white/5 text-white placeholder:text-white/20' })}
                    </div>
                ` : ''}

                <div id="profile-error" class="hidden text-red-400 text-[10px] font-black uppercase tracking-widest text-center bg-red-500/10 py-3 px-4 rounded-xl border border-red-500/20"></div>

                <button type="submit" class="w-full bg-blue-600 text-white p-5 rounded-[22px] font-black uppercase tracking-widest shadow-xl hover:-translate-y-1 transition-all border border-white/20">Save Profile Changes</button>
            </form>
        `
    })}
        </div>
    `;

    // --- Logic ---

    const setupListeners = () => {
        document.getElementById('logout-btn').onclick = async () => {
            await logoutUser();
            window.location.hash = '#login';
        };
        setupModalListeners('profile-modal');
        document.getElementById('edit-profile-btn').onclick = () => document.getElementById('profile-modal').classList.remove('hidden');

        document.getElementById('exams-tab').onclick = () => {
            currentView = 'exams';
            app.querySelector('#view-content').innerHTML = renderAssessmentsView();
            app.querySelector('nav').outerHTML = renderNav();
            setupListeners();
            loadAssessments();
        };

        document.getElementById('performance-tab').onclick = () => {
            currentView = 'performance';
            app.querySelector('#view-content').innerHTML = renderGradesView();
            app.querySelector('nav').outerHTML = renderNav();
            setupListeners();
            loadGrades();
        };

        const joinBtn = document.getElementById('join-class-btn');
        if (joinBtn) {
            joinBtn.onclick = async (e) => {
                e.preventDefault();
                const codeInput = document.getElementById('invite-code');
                const code = codeInput.value.toUpperCase();
                const btn = e.target;
                btn.disabled = true;
                btn.textContent = 'Verifying...';
                try {
                    await joinClass(code, user.user.uid, userEmail, userName);
                    alert("Request sent! Your teacher will review your enrollment.");
                    codeInput.value = ''; // Clear input
                } catch (err) {
                    alert(err.message);
                } finally {
                    btn.disabled = false;
                    btn.textContent = 'Enroll Now';
                }
            };
        }

        document.getElementById('profile-form').onsubmit = async (e) => {
            e.preventDefault();
            const newName = document.getElementById('profile-name').value;
            const newPasswordInput = document.getElementById('profile-password');
            const errDisplay = document.getElementById('profile-error');

            let newPassword = newPasswordInput ? newPasswordInput.value.trim() : null;

            const btn = e.target.querySelector('button');
            btn.disabled = true;
            btn.textContent = 'Saving...';
            if (errDisplay) errDisplay.classList.add('hidden');

            try {
                await updateUserProfile(user.user.uid, { displayName: newName });

                if (newPassword) {
                    await changeUserPassword(newPassword);
                }

                const modal = document.getElementById('profile-modal');
                const closeBtn = document.getElementById('profile-modal-close-btn');
                const title = modal ? modal.querySelector('h3') : null;

                if (closeBtn) closeBtn.classList.remove('hidden');
                if (title) {
                    const notice = title.querySelector('span'); 
                    if (notice) notice.remove();
                    delete title.dataset.enforced;
                }

                document.getElementById('profile-modal').classList.add('hidden');

                const nameDisplay = document.querySelector('header div p.text-[11px].font-medium');
                if (nameDisplay) nameDisplay.textContent = newName;

                console.log("Profile updated successfully");
            } catch (err) {
                console.error(err);
                if (errDisplay) {
                    errDisplay.textContent = err.message || "Update failed. Error code: " + err.code;
                    errDisplay.classList.remove('hidden');
                } else {
                    alert("Update failed: " + err.message);
                }
            } finally {
                btn.disabled = false;
                btn.textContent = 'Save Profile Changes';
            }
        };
    };

    const loadAssessments = async () => {
        const container = document.getElementById('assessments-container');
        try {
            // Optimized: Fetch submissions once, fetch summary once.
            const [myClassesData, rawExams, mySubmissions] = await Promise.all([
                getStudentClasses(user.user.uid),
                getActiveAssessmentsSummary(),
                getSubmissionsByStudent(user.user.uid)
            ]);

            myClasses = myClassesData;
            const myClassIds = myClasses.map(c => c.id);
            const submittedIds = new Set(mySubmissions.map(s => s.assessmentId));

            const myExams = rawExams.filter(a => {
                const ids = a.assignedClassIds || [];
                if (ids.length === 0) return true;
                return ids.some(id => myClassIds.includes(id));
            });

            const examsWithStatus = myExams.map(a => ({
                ...a,
                completed: submittedIds.has(a.id)
            }));

            const groups = {};
            myClasses.forEach(c => groups[c.id] = { name: c.name, section: c.section, exams: [] });

            examsWithStatus.forEach(ex => {
                const classIds = ex.assignedClassIds || [];
                classIds.forEach(cid => {
                    if (groups[cid]) {
                        groups[cid].exams.push(ex);
                    }
                });
            });

            let html = '';

            if (myClasses.length > 0) {
                html += `
                    <div class="mb-4 overflow-hidden">
                        <h4 class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-4 pl-1">Authorized Enrolments</h4>
                        <div class="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                            ${myClasses.map(c => `
                                <div class="glass-panel px-5 py-3 rounded-full border border-white/10 flex items-center gap-2 whitespace-nowrap shadow-lg shadow-blue-500/10">
                                    <div class="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                                    <span class="font-black text-white text-xs tracking-tight">${c.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            Object.values(groups).forEach(g => {
                html += `
                    <div class="glass-panel rounded-[40px] border border-white/5 overflow-hidden mb-10 transition-all hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)]">
                        <div class="bg-white/5 px-8 py-6 border-b border-white/5 flex justify-between items-center">
                            <div>
                                <h3 class="font-black text-white text-base uppercase tracking-tight">${g.name}</h3>
                                <p class="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mt-0.5">${g.section || 'Standard Section'}</p>
                            </div>
                            <div class="w-10 h-10 bg-white/5 rounded-xl border border-white/5 flex items-center justify-center text-white/30">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                            </div>
                        </div>
                        <div class="divide-y divide-white/5">
                            ${g.exams.length > 0
                        ? g.exams.map(e => renderExamRow(e, myClasses)).join('')
                        : '<div class="p-16 text-center text-white/40 text-xs font-black uppercase tracking-widest italic opacity-80">No active assessments in this group</div>'}
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;

        } catch (err) {
            console.error(err);
            container.innerHTML = '<div class="glass-panel text-red-400 text-center py-10 font-bold">Error loading course materials</div>';
        }
    };

    const renderExamRow = (ex, allClasses) => {
        const classes = allClasses.filter(c => (ex.assignedClassIds || []).includes(c.id));
        return `
        <div class="px-8 py-6 md:px-10 md:py-8 flex flex-col md:flex-row justify-between items-start md:items-center group hover:bg-white/5 transition-all">
            <div class="flex items-start md:items-center gap-6 w-full md:w-auto">
                <div class="w-14 h-14 ${ex.completed ? 'bg-white/5 text-white/20 shadow-inner' : 'bg-blue-600 text-white shadow-blue-500/20'} rounded-2xl flex items-center justify-center transition-all group-hover:scale-110">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                </div>
                <div class="flex-1">
                    <h4 class="font-black text-white text-xl group-hover:text-blue-400 transition-colors tracking-tight leading-tight">${ex.title}</h4>
                    <div class="flex items-center gap-3 mt-1.5">
                        <span class="text-[10px] text-white/40 font-black uppercase tracking-widest">${ex.questionCount} Items</span>
                        <span class="w-1 h-1 bg-white/10 rounded-full"></span>
                        <span class="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Active Now</span>
                    </div>
                    <div class="flex flex-wrap gap-2 mt-4 animate-in fade-in duration-700">
                    ${classes.map(c => `
                        <div class="px-4 py-2 glass-panel border border-white/5 rounded-full flex items-center gap-2">
                            <div class="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                            <span class="text-[9px] font-black text-white uppercase tracking-widest">${c.name}</span>
                        </div>
                    `).join('')}
                </div>
                </div>
            </div>
            <div class="w-full md:w-auto mt-6 md:mt-0">
            ${ex.completed
                ? '<div class="bg-white/5 text-white/30 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-white/10 shadow-inner text-center">Complete</div>'
                : `<button onclick="location.hash='#taker?id=${ex.id}'" class="w-full bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-1 transition-all active:scale-95 border border-blue-400/30">Start Exam</button>`
            }
            </div>
        </div>
    `;
    };

    const loadGrades = async () => {
        const container = document.getElementById('grades-container');
        try {
            const submissions = await getSubmissionsByStudent(user.user.uid);
            if (submissions.length === 0) {
                container.innerHTML = `
                    <div class="glass-panel p-20 rounded-[50px] border border-white/5 text-center shadow-xl shadow-blue-500/10">
                        <div class="w-24 h-24 bg-white/5 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-white/20 shadow-inner">
                             <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <h3 class="text-2xl font-black text-white tracking-tight">Focus on Learning</h3>
                        <p class="text-white/40 mt-3 text-sm max-w-xs mx-auto leading-relaxed font-medium">Your performance metrics will propagate here once you complete your assigned course evaluations.</p>
                    </div>
                `;
                return;
            }

            // Resolve assessment titles efficiently (1 read for active summary)
            const activeSummary = await getActiveAssessmentsSummary();
            
            const enriched = await Promise.all(submissions.map(async (s) => {
                try {
                    let assessment = activeSummary.find(a => a.id === s.assessmentId);
                    
                    if (!assessment) {
                        assessment = await getAssessment(s.assessmentId);
                    }

                    const foundClass = myClasses.find(c => (assessment.assignedClassIds || []).includes(c.id));
                    const className = (foundClass && foundClass.name) || 'Institutional Class';
                    return { ...s, assessmentTitle: assessment.title, className: className };
                } catch {
                    return { ...s, assessmentTitle: 'Completed Module', className: 'Legacy Record' };
                }
            }));

            const gradesContainer = document.getElementById('grades-container');
            gradesContainer.innerHTML = `
                <div class="flex items-center gap-3 mb-6 pl-2">
                    <h2 class="text-xs font-black text-white/40 uppercase tracking-[0.3em]">Institutional Record</h2>
                    <div class="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
                </div>
                <div class="grid gap-6">
                    ${enriched.map(r => {
                const isGraded = r.status === 'graded';
                const scorePercentage = isGraded ? Math.round((r.score / r.totalPoints) * 100) : 0;

                return `
                        <div class="glass-panel p-8 rounded-[40px] border border-white/5 space-y-8 animate-in fade-in duration-500">
                            <div class="flex justify-between items-start">
                                <div>
                                    <div class="px-4 py-2 bg-white/5 border border-white/10 rounded-full inline-block mb-3">
                                        <span class="text-[9px] font-black text-white/40 uppercase tracking-widest">${new Date(r.submittedAt).toLocaleDateString()}</span>
                                    </div>
                                    <h3 class="text-2xl font-black text-white tracking-tight leading-tight uppercase">${r.assessmentTitle}</h3>
                                    <p class="text-white/30 text-[9px] font-black uppercase tracking-[0.2em] mt-2">${r.className}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-4xl font-black text-white tracking-tighter leading-none">${scorePercentage}%</p>
                                    <p class="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-2">Ranked Excellent</p>
                                </div>
                            </div>

                            <div class="space-y-3">
                                <div class="flex justify-between text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">
                                    <span>Knowledge Accuracy</span>
                                    <span class="text-white">${r.score} / ${r.totalPoints} Points</span>
                                </div>
                                <div class="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                                    <div class="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all duration-1000" style="width: ${scorePercentage}%"></div>
                                </div>
                            </div>

                            <button onclick="location.hash='#results?id=${r.id}'" class="w-full bg-white/5 border border-white/5 p-5 rounded-[22px] font-black uppercase text-[10px] tracking-[0.3em] text-white/40 hover:bg-blue-600 hover:text-white hover:border-blue-400/30 transition-all">Detailed Analysis</button>
                        </div>
                    `;
            }).join('')}
    </div>
`;
        } catch (err) {
            console.error(err);
            container.innerHTML = '<div class="glass-panel text-red-500 text-center py-10 font-bold">Failed to process performance telemetry</div>';
        }
    };

    setupListeners();
    loadAssessments();
    enforceProfileCompletion(user, 'profile-modal');
};
enforceProfileCompletion(user, 'profile-modal');
};
