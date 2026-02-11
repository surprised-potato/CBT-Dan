import { renderButton } from '../../shared/button.js';
import { getQuestions, getHierarchy, deleteQuestion } from '../../services/question-bank.service.js';
import { getUser } from '../../core/store.js';

export const BankPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();
    if (!user) { window.location.hash = '#login'; return; }

    const [allQuestions, hierarchy] = await Promise.all([
        getQuestions(),
        getHierarchy()
    ]);

    // --- UI Update Helper ---
    const renderPage = () => {
        const getHeaderDetails = () => {
            switch (viewState.mode) {
                case 'COURSE_LIST':
                    return {
                        title: 'Question Library',
                        subtitle: null,
                        actionLabel: 'Add Course',
                        actionHash: '#editor' // Will update to modal later if requested
                    };
                case 'TOPIC_LIST':
                    const topicCount = new Set(allQuestions.filter(q => (q.course || 'Uncategorized') === viewState.selectedCourse).map(q => q.topic)).size;
                    return {
                        title: viewState.selectedCourse,
                        subtitle: `${topicCount} Theoretical Topics`,
                        actionLabel: 'New Topic',
                        actionHash: '#editor'
                    };
                case 'QUESTION_LIST':
                    const questionCount = allQuestions.filter(q => (q.course || 'Uncategorized') === viewState.selectedCourse && (q.topic || 'General') === viewState.selectedTopic).length;
                    return {
                        title: viewState.selectedTopic,
                        subtitle: `${questionCount} Records Identified`,
                        actionLabel: 'New Question',
                        actionHash: '#editor'
                    };
            }
        };

        const { title, subtitle, actionLabel, actionHash } = getHeaderDetails();

        app.innerHTML = `
            <div class="flex items-start justify-center min-h-screen bg-premium-gradient py-8 px-4">
                <div class="bg-white w-full max-w-4xl rounded-[50px] shadow-2xl shadow-blue-200/50 animate-in fade-in slide-in-from-bottom-8 duration-700 relative overflow-hidden border border-white min-h-[90vh]">
                    <div class="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-30"></div>
                    
                    <header class="glass-panel sticky top-0 z-40 px-8 py-6 border-b border-gray-100 flex flex-wrap justify-between items-center gap-6 transition-all">
                        <div class="flex items-center gap-5 min-w-0">
                            <button id="main-back-btn" class="p-3 glass-panel rounded-2xl text-gray-500 hover:text-blue-600 transition-colors shadow-sm shrink-0">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            </button>
                            <div class="min-w-0">
                                <h1 class="text-2xl font-black text-gray-900 leading-tight tracking-tight truncate">${title}</h1>
                                ${subtitle ? `<p class="text-[9px] font-black text-blue-600 uppercase tracking-[0.3em] mt-0.5 truncate">${subtitle}</p>` : ''}
                            </div>
                        </div>
                        <div class="flex items-center gap-3 shrink-0 ml-auto">
                            <button onclick="location.hash='#bulk-import'" class="bg-white text-blue-600 border border-blue-100 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-50/50 hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
                                Bulk Entry
                            </button>
                            <button onclick="location.hash='${actionHash}'" class="bg-blue-premium text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                                ${actionLabel}
                            </button>
                        </div>
                    </header>

                    <main class="p-8 space-y-12 relative z-10">
                        <div id="bank-content" class="animate-in fade-in slide-in-from-bottom-4 duration-500"></div>
                    </main>
                </div>
            </div>
        `;

        const backBtn = document.getElementById('main-back-btn');
        backBtn.onclick = () => {
            if (viewState.mode === 'QUESTION_LIST') window.backToTopics();
            else if (viewState.mode === 'TOPIC_LIST') window.backToCourses();
            else window.location.hash = '#teacher-dash';
        };

        const contentDiv = document.getElementById('bank-content');
        if (viewState.mode === 'COURSE_LIST') {
            contentDiv.innerHTML = renderCourseList();
        } else if (viewState.mode === 'TOPIC_LIST') {
            contentDiv.innerHTML = renderTopicList();
        } else {
            contentDiv.innerHTML = renderQuestionList();
        }

        // Post-render processing
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

        const input = document.querySelector('input[data-search]');
        if (input && viewState.isTyping) {
            input.focus();
            const len = input.value.length;
            input.setSelectionRange(len, len);
        }
    };

    // 2. State
    let viewState = {
        mode: 'COURSE_LIST', // 'COURSE_LIST', 'TOPIC_LIST', 'QUESTION_LIST'
        selectedCourse: null,
        selectedTopic: null,
        searchTerm: '',
        limit: 20,
        totalFiltered: 0,
        isTyping: false
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
                    data-search
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
                        <p class="text-gray-600 font-black uppercase tracking-widest text-xs opacity-70 mb-6">Library is currently empty</p>
                        <button onclick="location.hash='#editor'" class="bg-blue-premium text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-200">Start Resource Building</button>
                    </div>`;
            } else {
                html += `<div class="text-center py-20 glass-panel rounded-[40px] text-gray-600 font-black uppercase tracking-widest text-xs opacity-70">No departments match query "${viewState.searchTerm}"</div>`;
            }
            return html;
        }

        const grid = courses.map(course => {
            const courseQs = allQuestions.filter(q => (q.course || 'Uncategorized') === course);
            const topicCount = new Set(courseQs.map(q => q.topic)).size;

            return `
                <div onclick="window.viewCourse('${course}')" class="group relative bg-white p-10 rounded-[50px] border border-white shadow-xl shadow-blue-50/40 hover:shadow-2xl hover:shadow-blue-100 hover:border-blue-200 hover:-translate-y-1 transition-all cursor-pointer overflow-hidden active:scale-[0.98]">
                    <div class="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-blue-50/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                        <div class="flex items-center gap-8">
                            <div class="w-20 h-20 bg-gray-50 rounded-[28px] flex items-center justify-center text-blue-500 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:shadow-md transition-all shadow-inner">
                                <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                            </div>
                            <div>
                                <h3 class="font-black text-gray-900 text-3xl group-hover:text-blue-600 transition-colors uppercase tracking-tight">${course}</h3>
                                <p class="text-[10px] font-black text-gray-600 mt-2 uppercase tracking-[0.3em] flex items-center gap-3">
                                    ${topicCount} Theoretical Topics
                                    <span class="w-1.5 h-1.5 bg-blue-200 rounded-full"></span>
                                    ${courseQs.length} Operational Qs
                                </p>
                            </div>
                        </div>

                        <div class="mt-8 flex items-center justify-between p-5 bg-gray-50 rounded-[28px] text-gray-400 group-hover:bg-blue-600 group-hover:text-white group-hover:drop-shadow-[0_10px_20px_rgba(37,99,235,0.4)] transition-all shadow-inner border border-transparent group-hover:border-blue-400">
                            <span class="text-[10px] font-black uppercase tracking-[0.3em] ml-2">Access Records</span>
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="flex flex-col gap-6">
                ${grid}
            </div>
        `;
    };

    const renderTopicList = () => {
        const course = viewState.selectedCourse;
        let questions = allQuestions.filter(q => (q.course || 'Uncategorized') === course);

        const topicsMap = questions.reduce((acc, q) => {
            const topic = q.topic || 'General';
            if (!acc[topic]) acc[topic] = 0;
            acc[topic]++;
            return acc;
        }, {});

        let topics = Object.keys(topicsMap);
        if (viewState.searchTerm) {
            const term = viewState.searchTerm.toLowerCase();
            topics = topics.filter(t => t.toLowerCase().includes(term));
        }

        let html = `
            <div class="mb-10 relative group">
                <input type="text" 
                    data-search
                    placeholder="Search within department topics..." 
                    value="${viewState.searchTerm}"
                    oninput="window.updateSearch(this.value)"
                    class="w-full p-6 pl-16 rounded-[28px] glass-panel border-white/40 shadow-xl shadow-blue-50/20 focus:ring-2 focus:ring-blue-500/20 text-lg font-bold tracking-tight outline-none transition-all"
                >
                <div class="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-600 transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
            </div>
        `;

        const grid = topics.map(topic => {
            const count = topicsMap[topic];
            return `
                <div onclick="window.viewTopic('${topic}')" class="group relative bg-white p-10 rounded-[50px] border border-white shadow-xl shadow-blue-50/40 hover:shadow-2xl hover:shadow-blue-100 hover:border-blue-200 hover:-translate-y-1 transition-all cursor-pointer overflow-hidden active:scale-[0.98]">
                    <div class="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-blue-50/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                        <div class="flex items-center gap-8">
                            <div class="w-20 h-20 bg-gray-50 rounded-[28px] flex items-center justify-center text-blue-500 group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:shadow-md transition-all shadow-inner">
                                <div class="w-2 h-10 bg-blue-premium rounded-full"></div>
                            </div>
                            <div>
                                <h3 class="font-black text-gray-900 text-3xl group-hover:text-blue-600 transition-colors uppercase tracking-tight">${topic}</h3>
                                <p class="text-[10px] font-black text-gray-600 mt-2 uppercase tracking-[0.3em] flex items-center gap-3">
                                    ${count} Operational Resources
                                </p>
                            </div>
                        </div>

                        <div class="mt-8 flex items-center justify-between p-5 bg-gray-50 rounded-[28px] text-gray-400 group-hover:bg-blue-600 group-hover:text-white group-hover:drop-shadow-[0_10px_20px_rgba(37,99,235,0.4)] transition-all shadow-inner border border-transparent group-hover:border-blue-400">
                            <span class="text-[10px] font-black uppercase tracking-[0.3em] ml-2">Open Topic Repository</span>
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return `<div class="flex flex-col gap-6">${grid}</div>`;
    };
    const renderQuestionList = () => {
        const course = viewState.selectedCourse;
        const topic = viewState.selectedTopic;
        let filtered = allQuestions.filter(q => (q.course || 'Uncategorized') === course && (q.topic || 'General') === topic);

        if (viewState.searchTerm) {
            const term = viewState.searchTerm.toLowerCase();
            filtered = filtered.filter(q => q.text.toLowerCase().includes(term));
        }

        viewState.totalFiltered = filtered.length;

        let html = `
            <div class="mb-10 relative group">
                <input type="text" 
                    data-search
                    placeholder="Search within topic..." 
                    value="${viewState.searchTerm}"
                    oninput="window.updateSearch(this.value)"
                    class="w-full p-6 pl-16 rounded-[28px] glass-panel border-white/40 shadow-xl shadow-blue-50/20 focus:ring-2 focus:ring-blue-500/20 text-lg font-bold tracking-tight outline-none transition-all"
                >
                <div class="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-600 transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
            </div>
        `;

        if (filtered.length === 0) {
            html += `<div class="text-center py-20 glass-panel rounded-[40px] text-gray-600 font-black uppercase tracking-widest text-xs opacity-70">No operational items match criteria</div>`;
            return html;
        }

        const grid = filtered.slice(0, viewState.limit).map(q => {
            return `
                <div class="p-8 rounded-[40px] border border-gray-100 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-50/50 transition-all group/card bg-white flex flex-col justify-between gap-6 relative overflow-hidden">
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
            `;
        }).join('');

        let finalHtml = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">${grid}</div>`;

        if (filtered.length > viewState.limit) {
            finalHtml += `
                <div class="pt-8 text-center flex flex-col items-center gap-4">
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">${viewState.limit} of ${viewState.totalFiltered} Items Displayed</p>
                    <button onclick="window.loadMore()" class="bg-white text-blue-600 border border-blue-100 px-10 py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-50/50 hover:bg-blue-50 transition-all active:scale-95">Load More Resources</button>
                </div>
            `;
        }

        return finalHtml;
    };

    // --- Interaction Handlers ---
    window.updateSearch = (val) => {
        viewState.searchTerm = val;
        viewState.isTyping = true;
        renderPage();
        viewState.isTyping = false;
    };

    window.viewCourse = (course) => {
        viewState.mode = 'TOPIC_LIST';
        viewState.selectedCourse = course;
        viewState.searchTerm = '';
        viewState.limit = 20;
        renderPage();
        window.scrollTo(0, 0);
    };

    window.viewTopic = (topic) => {
        viewState.mode = 'QUESTION_LIST';
        viewState.selectedTopic = topic;
        viewState.searchTerm = '';
        viewState.limit = 20;
        renderPage();
        window.scrollTo(0, 0);
    };

    window.backToTopics = () => {
        viewState.mode = 'TOPIC_LIST';
        viewState.selectedTopic = null;
        viewState.searchTerm = '';
        renderPage();
    };

    window.backToCourses = () => {
        viewState.mode = 'COURSE_LIST';
        viewState.selectedCourse = null;
        viewState.searchTerm = '';
        renderPage();
    };

    window.loadMore = () => {
        viewState.limit += 20;
        renderPage();
    };

    window.deleteQ = async (id) => {
        if (!confirm("Purge this resource item from registry?")) return;
        try {
            await deleteQuestion(id);
            const idx = allQuestions.findIndex(q => q.id === id);
            if (idx > -1) allQuestions.splice(idx, 1);
            renderPage();
        } catch (err) {
            alert("Purge failed.");
        }
    };

    renderPage();
};
