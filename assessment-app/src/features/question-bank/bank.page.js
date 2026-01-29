import { renderButton } from '../../shared/button.js';
import { getQuestions, getHierarchy, deleteQuestion } from '../../services/question-bank.service.js';
import { getUser } from '../../core/store.js';

export const BankPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();
    if (!user) { window.location.hash = '#login'; return; }

    app.innerHTML = `
        <div class="min-h-screen pb-20">
            <header class="glass-panel sticky top-0 z-40 px-4 py-6 border-b border-white/20">
                <div class="max-w-5xl mx-auto flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <button onclick="location.hash='#teacher-dash'" class="p-3 glass-panel rounded-2xl text-gray-500 hover:text-blue-600 transition-colors shadow-sm">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <h1 class="text-2xl font-black text-gray-900 leading-tight tracking-tight">Question Library</h1>
                    </div>
                    <button onclick="location.hash='#editor'" class="bg-blue-premium text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        New Resource
                    </button>
                </div>
            </header>

            <main class="max-w-5xl mx-auto p-4 space-y-8 mt-8">
                <div id="bank-content" class="animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <!-- Loading State -->
                     <div class="animate-pulse space-y-6">
                        <div class="h-16 glass-panel rounded-2xl w-full"></div>
                        <div class="grid grid-cols-1 gap-6">
                            <div class="h-40 glass-panel rounded-[40px]"></div>
                            <div class="h-40 glass-panel rounded-[40px]"></div>
                        </div>
                     </div>
                </div>
            </main>
        </div>
    `;

    // --- Logic ---
    const contentDiv = document.getElementById('bank-content');

    // 1. Fetch Data
    const hierarchy = await getHierarchy();
    const allQuestions = await getQuestions();

    // 2. State
    let viewState = {
        mode: 'COURSE_LIST', // or 'QUESTION_LIST'
        selectedCourse: null,
        searchTerm: '',
        collapsedTopics: new Set() // stores topic names
    };

    // 3. Renderers
    const renderCourseList = () => {
        let courses = hierarchy.courses;
        if (viewState.searchTerm) {
            const term = viewState.searchTerm.toLowerCase();
            courses = courses.filter(c => c.toLowerCase().includes(term));
        }

        let html = `
            <div class="mb-10 relative group">
                <input type="text" 
                    placeholder="Search curriculum departments..." 
                    value="${viewState.searchTerm}"
                    oninput="window.updateSearch(this.value)"
                    class="w-full p-6 pl-16 rounded-[28px] glass-panel border-white/40 shadow-xl shadow-blue-50/20 focus:ring-2 focus:ring-blue-500/20 text-lg font-bold tracking-tight outline-none transition-all"
                >
                <div class="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-600 transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
            </div>
        `;

        if (courses.length === 0) {
            if (hierarchy.courses.length === 0) {
                html += `
                    <div class="text-center py-24 glass-panel rounded-[50px] border-2 border-dashed border-white">
                        <p class="text-gray-500 font-black uppercase tracking-widest text-xs opacity-50 mb-6">Library is currently empty</p>
                        <button onclick="location.hash='#editor'" class="bg-blue-premium text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-200">Start Resource Building</button>
                    </div>`;
            } else {
                html += `<div class="text-center py-20 glass-panel rounded-[40px] text-gray-500 font-black uppercase tracking-widest text-xs opacity-50">No departments match query "${viewState.searchTerm}"</div>`;
            }
            contentDiv.innerHTML = html;
            return;
        }

        const grid = courses.map(course => {
            const courseQs = allQuestions.filter(q => (q.course || 'Uncategorized') === course);
            const topicCount = new Set(courseQs.map(q => q.topic)).size;

            return `
                <div onclick="window.viewCourse('${course}')" class="group relative bg-white p-10 rounded-[50px] border border-white shadow-xl shadow-blue-50/40 hover:shadow-2xl hover:shadow-blue-100 hover:border-blue-200 hover:-translate-y-1 transition-all cursor-pointer overflow-hidden active:scale-[0.98]">
                    <div class="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-blue-50/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                        <div class="flex items-center gap-8">
                            <div class="w-20 h-20 bg-gray-50 rounded-[28px] flex items-center justify-center text-gray-200 group-hover:bg-blue-premium group-hover:text-white group-hover:shadow-xl group-hover:shadow-blue-200 transition-all shadow-inner">
                                <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                            </div>
                            <div>
                                <h3 class="font-black text-gray-900 text-3xl group-hover:text-blue-600 transition-colors uppercase tracking-tight">${course}</h3>
                                <p class="text-[10px] font-black text-gray-500 mt-2 uppercase tracking-[0.3em] flex items-center gap-3">
                                    ${topicCount} Theoretical Topics
                                    <span class="w-1.5 h-1.5 bg-blue-200 rounded-full"></span>
                                    ${courseQs.length} Operational Qs
                                </p>
                            </div>
                        </div>

                        <div class="p-5 glass-panel rounded-[24px] text-gray-200 group-hover:bg-blue-premium group-hover:text-white group-hover:shadow-xl transition-all group-hover:translate-x-1">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        html += `
            <div class="flex flex-col gap-6">
                ${grid}
            </div>
        `;
        contentDiv.innerHTML = html;
    };

    const renderQuestionList = () => {
        const course = viewState.selectedCourse;
        let filtered = allQuestions.filter(q => (q.course || 'Uncategorized') === course);

        if (viewState.searchTerm) {
            const term = viewState.searchTerm.toLowerCase();
            filtered = filtered.filter(q =>
                q.text.toLowerCase().includes(term) ||
                (q.topic && q.topic.toLowerCase().includes(term))
            );
        }

        let html = `
            <div class="flex flex-col gap-8 mb-10 sticky top-24 z-30">
                <div class="flex items-center gap-6">
                    <button onclick="window.backToCourses()" class="p-4 glass-panel rounded-2xl text-gray-500 hover:text-blue-600 hover:shadow-md transition-all active:scale-95 shadow-sm border border-white">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <div>
                        <h2 class="text-3xl font-black text-gray-900 tracking-tight uppercase">${course}</h2>
                        <p class="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mt-1">${filtered.length} Resource Items Loaded</p>
                    </div>
                </div>
                <div class="relative group">
                    <input type="text" 
                        placeholder="Search within department..." 
                        value="${viewState.searchTerm}"
                        oninput="window.updateSearch(this.value)"
                        class="w-full p-6 pl-16 rounded-[28px] glass-panel border-white/40 shadow-xl shadow-blue-50/20 focus:ring-2 focus:ring-blue-500/20 text-lg font-bold tracking-tight outline-none transition-all"
                    >
                    <div class="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-600 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                </div>
            </div>
        `;

        if (filtered.length === 0) {
            html += `<div class="text-center py-20 glass-panel rounded-[40px] text-gray-500 font-black uppercase tracking-widest text-xs opacity-50">No operational items match telemetry criteria</div>`;
            contentDiv.innerHTML = html;
            return;
        }

        const byTopic = filtered.reduce((acc, q) => {
            const topic = q.topic || 'General';
            if (!acc[topic]) acc[topic] = [];
            acc[topic].push(q);
            return acc;
        }, {});

        html += `<div class="space-y-10">`;

        html += Object.entries(byTopic).map(([topic, qs]) => {
            const isCollapsed = viewState.collapsedTopics.has(topic);
            return `
            <div class="bg-white rounded-[40px] shadow-sm border border-white overflow-hidden transition-all hover:shadow-md">
                <div onclick="window.toggleTopic('${topic}')" class="p-8 bg-gray-50/50 glass-panel flex justify-between items-center cursor-pointer hover:bg-white transition-all select-none border-b border-gray-100">
                    <div class="flex items-center gap-4">
                        <div class="w-2 h-8 bg-blue-premium rounded-full"></div>
                        <h3 class="font-black text-gray-800 tracking-tight uppercase text-lg">${topic} <span class="bg-blue-premium text-white px-4 py-1 rounded-full text-[10px] ml-4 shadow-lg shadow-blue-100">${qs.length}</span></h3>
                    </div>
                    <div class="p-2 glass-panel rounded-xl text-gray-300">
                        <svg class="w-6 h-6 transform transition-transform duration-500 ${isCollapsed ? '-rotate-90' : 'rotate-0'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
                
                <div class="${isCollapsed ? 'hidden' : 'block'} p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white">
                    ${qs.map(q => `
                        <div class="p-6 rounded-[32px] border border-gray-100 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-50/50 transition-all group/card bg-white flex flex-col justify-between gap-6 relative overflow-hidden">
                            <div class="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
                            
                            <div class="flex-1 min-w-0 relative z-10">
                                <div class="flex gap-3 mb-6">
                                    <span class="inline-block text-[10px] uppercase tracking-widest font-black px-4 py-1.5 rounded-full border ${q.type === 'MCQ' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}">${q.type}</span>
                                    <span class="inline-block text-[10px] uppercase tracking-widest font-black px-4 py-1.5 rounded-full border ${q.difficulty === 'DIFFICULT' ? 'bg-red-50 text-red-600 border-red-100' : q.difficulty === 'MODERATE' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-green-50 text-green-600 border-green-100'}">${q.difficulty || 'EASY'}</span>
                                </div>
                                <div class="text-gray-900 font-extrabold text-sm leading-relaxed mb-6">${q.text}</div>
                                ${q.figures && q.figures.length > 0 ? `
                                    <div class="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                                        ${q.figures.map(fig => `
                                            <div class="w-32 h-24 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 shadow-inner">
                                                <img src="${fig}" class="w-full h-full object-cover">
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                            <div class="flex justify-end gap-3 shrink-0 relative z-10">
                                <button onclick="location.hash='#editor?id=${q.id}'" class="w-12 h-12 glass-panel rounded-2xl text-gray-500 hover:text-blue-600 transition-all flex items-center justify-center hover:shadow-md" title="Modify Registry">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                </button>
                                <button onclick="window.deleteQ('${q.id}')" class="w-12 h-12 glass-panel rounded-2xl text-gray-500 hover:text-red-600 transition-all flex items-center justify-center hover:shadow-md" title="Purge Record">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            `;
        }).join('');

        html += `</div>`;
        contentDiv.innerHTML = html;
    };

    const updateView = () => {
        if (viewState.mode === 'COURSE_LIST') {
            renderCourseList();
        } else {
            renderQuestionList();
        }

        if (window.renderMathInElement) {
            window.renderMathInElement(contentDiv, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                    { left: '\\[', right: '\\]', display: true }
                ],
                throwOnError: false
            });
        }

        const input = document.querySelector('input[type="text"]');
        if (input && document.activeElement !== input && viewState.isTyping) {
            input.focus();
            const len = input.value.length;
            input.setSelectionRange(len, len);
        }
    };

    // --- Interaction Handlers ---
    window.updateSearch = (val) => {
        viewState.searchTerm = val;
        viewState.isTyping = true;
        updateView();
        viewState.isTyping = false;
    };

    window.toggleTopic = (topic) => {
        if (viewState.collapsedTopics.has(topic)) {
            viewState.collapsedTopics.delete(topic);
        } else {
            viewState.collapsedTopics.add(topic);
        }
        updateView();
    };

    window.viewCourse = (course) => {
        viewState.mode = 'QUESTION_LIST';
        viewState.selectedCourse = course;
        viewState.searchTerm = '';
        viewState.collapsedTopics.clear();
        updateView();
        window.scrollTo(0, 0);
    };

    window.backToCourses = () => {
        viewState.mode = 'COURSE_LIST';
        viewState.selectedCourse = null;
        viewState.searchTerm = '';
        updateView();
    };

    window.deleteQ = async (id) => {
        if (!confirm("Purge this resource item from registry?")) return;
        try {
            await deleteQuestion(id);
            const idx = allQuestions.findIndex(q => q.id === id);
            if (idx > -1) allQuestions.splice(idx, 1);
            updateView();
        } catch (err) {
            alert("Purge failed.");
        }
    };

    updateView();
};
