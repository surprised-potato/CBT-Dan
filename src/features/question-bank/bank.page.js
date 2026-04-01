import { renderButton } from '../../shared/button.js';
import { getQuestions, getHierarchy, deleteQuestion, repairQuestion, renameTopic, renameCourse, getQuestionBankSummary, regenerateQuestionBankSummary } from '../../services/question-bank.service.js';
import { getUser } from '../../core/store.js';

export const BankPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();
    if (!user) { window.location.hash = '#login'; return; }

    let allQuestions = [];
    let hierarchy = { courses: [], topics: {}, counts: {} };

    // 2. State
    let viewState = {
        mode: 'COURSE_LIST', // 'COURSE_LIST', 'TOPIC_LIST', 'QUESTION_LIST'
        selectedCourse: null,
        selectedTopic: null,
        searchTerm: '',
        limit: 20,
        totalFiltered: 0,
        isTyping: false,
        sortBy: 'text',
        sortOrder: 'asc'
    };

    const syncData = async () => {
        hierarchy = await getQuestionBankSummary();

        if (viewState.mode === 'QUESTION_LIST') {
            allQuestions = await getQuestions({ 
                course: viewState.selectedCourse, 
                topic: viewState.selectedTopic 
            });
        } else {
            allQuestions = [];
        }
    };

    // --- UI Update Helper ---
    const renderPage = async (skipSync = false) => {
        if (!skipSync) await syncData();

        const getHeaderDetails = () => {
            switch (viewState.mode) {
                case 'COURSE_LIST':
                    return {
                        title: 'Question Library',
                        subtitle: null,
                        actionLabel: 'Add Course',
                        onAction: () => window.openAddModal('course')
                    };
                case 'TOPIC_LIST':
                    const topicsForCourse = hierarchy.topics[viewState.selectedCourse] || [];
                    return {
                        title: viewState.selectedCourse,
                        subtitle: `${topicsForCourse.length} Theoretical Topics`,
                        actionLabel: 'New Topic',
                        onAction: () => window.openAddModal('topic')
                    };
                case 'QUESTION_LIST':
                    return {
                        title: viewState.selectedTopic,
                        subtitle: `${allQuestions.length} Records Identified`,
                        actionLabel: 'New Question',
                        onAction: () => window.location.hash = `#editor?course=${encodeURIComponent(viewState.selectedCourse)}&topic=${encodeURIComponent(viewState.selectedTopic)}`
                    };
            }
        };

        const { title, subtitle, actionLabel, onAction } = getHeaderDetails();

        app.innerHTML = `
            <div class="relative min-h-screen bg-[#020617] pb-32">
                <!-- Dynamic Mesh Background -->
                <div class="bg-premium-gradient-fixed"></div>
                <div class="mesh-blob top-[-10%] left-[-10%] bg-blue-600/10 scale-150"></div>
                <div class="mesh-blob bottom-[-20%] right-[-10%] bg-indigo-500/10"></div>

                <div class="relative z-10 flex flex-col items-center py-4 md:py-8 px-4">
                    <div class="w-full max-w-4xl space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        
                        <!-- Header -->
                        <header class="glass-panel px-6 py-5 md:px-8 md:py-6 rounded-[35px] border border-white/10 flex flex-wrap justify-between items-center gap-4 shadow-xl">
                            <div class="flex items-center gap-4 min-w-0">
                                <button id="main-back-btn" class="p-3 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90 shadow-lg shrink-0">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                                </button>
                                <div class="min-w-0">
                                    <h1 class="text-xl md:text-2xl font-black text-white leading-tight tracking-tight truncate uppercase">${title}</h1>
                                    ${subtitle ? `<p class="text-[10px] text-blue-400 font-black uppercase tracking-[0.3em] mt-0.5 truncate opacity-80">${subtitle}</p>` : ''}
                                </div>
                            </div>
                            <div class="flex items-center gap-2 md:gap-3 shrink-0 ml-auto flex-wrap">
                                <button onclick="window.runDataDiagnostics()" class="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center gap-2" title="Repair Misidentified T/F Questions">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                    Repair
                                </button>
                                <button onclick="location.hash='#bulk-import'" class="bg-white/5 text-blue-400 border border-white/10 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
                                    Bulk
                                </button>
                                <button id="header-action-btn" class="bg-blue-600 text-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_10px_25px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_35px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2 border border-white/20">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                                    New
                                </button>
                            </div>
                        </header>

                        <main class="space-y-12 pb-12">
                            <div id="bank-content" class="animate-in fade-in slide-in-from-bottom-4 duration-500"></div>
                        </main>
                    </div>
                </div>
            </div>

            <!-- Add Item Modal -->
            <div id="add-modal" class="fixed inset-0 bg-black/60 z-[100] hidden flex items-center justify-center p-4 backdrop-blur-md">
                <div class="glass-panel w-full max-w-md rounded-[40px] border border-white/10 p-10 relative z-10 shadow-2xl animate-in zoom-in-95 duration-300">
                    <h3 id="modal-title" class="text-2xl font-black text-white mb-6 uppercase tracking-tight">New Department</h3>
                    <p id="modal-desc" class="text-[10px] text-blue-400 font-black uppercase tracking-[0.3em] mb-6 opacity-80">Initialise Registry Entry</p>
                    <input type="text" id="modal-input" class="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-blue-500/50 transition-colors mb-8 uppercase tracking-tight" placeholder="ENTER NAME...">
                    <div class="flex gap-4">
                        <button id="modal-confirm-btn" class="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 border border-white/20 hover:-translate-y-0.5 transition-all">Create</button>
                        <button onclick="document.getElementById('add-modal').classList.add('hidden')" class="px-8 py-4 bg-white/5 text-white/40 rounded-2xl font-black uppercase text-xs tracking-widest border border-white/5">Cancel</button>
                    </div>
                </div>
            </div>

            <!-- Rename Item Modal -->
            <div id="rename-modal" class="fixed inset-0 bg-black/60 z-[100] hidden flex items-center justify-center p-4 backdrop-blur-md">
                <div class="glass-panel w-full max-w-md rounded-[40px] border border-white/10 p-10 relative z-10 shadow-2xl animate-in zoom-in-95 duration-300">
                    <h3 id="rename-modal-title" class="text-2xl font-black text-white mb-6 uppercase tracking-tight">Modify Registry</h3>
                    <p id="rename-modal-desc" class="text-[10px] text-blue-400 font-black uppercase tracking-[0.3em] mb-6 opacity-80">Update Identity</p>
                    <input type="text" id="rename-modal-input" class="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-blue-500/50 transition-colors mb-8 uppercase tracking-tight" placeholder="ENTER NEW NAME...">
                    <div class="flex gap-4">
                        <button id="rename-modal-confirm-btn" class="flex-1 bg-purple-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-purple-500/20 border border-white/20 hover:-translate-y-0.5 transition-all">Commit Change</button>
                        <button onclick="document.getElementById('rename-modal').classList.add('hidden')" class="px-8 py-4 bg-white/5 text-white/40 rounded-2xl font-black uppercase text-xs tracking-widest border border-white/5">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('header-action-btn').onclick = onAction;

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

    // 3. Renderers
    const renderCourseList = () => {
        let courses = hierarchy.courses;
        if (viewState.searchTerm) {
            const term = viewState.searchTerm.toLowerCase();
            courses = courses.filter(c => c.toLowerCase().includes(term));
        }

        let html = `
            <div class="mb-10 relative group bg-white/5 border border-white/10 rounded-[28px] overflow-hidden focus-within:border-blue-500/50 transition-colors shadow-2xl">
                <input type="text" 
                    data-search
                    placeholder="Search curriculum departments..." 
                    value="${viewState.searchTerm}"
                    oninput="window.updateSearch(this.value)"
                    class="w-full p-6 pl-16 bg-transparent text-white text-lg font-bold tracking-tight outline-none placeholder:text-white/20"
                >
                <div class="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-400 transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
            </div>
        `;

        if (courses.length === 0) {
            if (hierarchy.courses.length === 0) {
                html += `
                    <div class="text-center py-24 glass-panel rounded-[50px] border-2 border-dashed border-white/10">
                        <p class="text-white/30 font-black uppercase tracking-widest text-xs mb-6">Library is currently empty</p>
                        <button onclick="window.openAddModal('course')" class="bg-blue-600 text-white px-8 py-4 rounded-[22px] font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 border border-white/20">Initialize Department</button>
                    </div>`;
            } else {
                html += `<div class="text-center py-20 glass-panel rounded-[40px] text-white/30 font-bold uppercase tracking-widest text-xs border-white/5">No departments match query "${viewState.searchTerm}"</div>`;
            }
            return html;
        }

        const grid = courses.map(course => {
            const topicCount = (hierarchy.topics[course] || []).length;
            const qCount = hierarchy.counts[`${course}|ALL|ALL|ANY`] || 0;

            return `
                <div class="group relative glass-panel p-8 md:p-10 rounded-[45px] border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer overflow-hidden active:scale-[0.98] shadow-2xl">
                    <div onclick="window.viewCourse('${course}')" class="absolute inset-0 z-0"></div>
                    <div class="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10 pointer-events-none">
                        <div class="flex items-center gap-6 md:gap-8 pointer-events-auto">
                            <div class="w-16 h-16 md:w-20 md:h-20 bg-blue-500/10 rounded-[28px] flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-all ring-1 ring-white/5 shadow-inner">
                                <svg class="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                            </div>
                            <div>
                                <div class="flex items-center gap-3">
                                    <h3 class="font-black text-white text-2xl md:text-3xl group-hover:text-blue-400 transition-colors uppercase tracking-tight">${course}</h3>
                                    <button onclick="event.stopPropagation(); window.openRenameModal('course', '${course}')" class="p-2 bg-white/5 rounded-xl text-white/20 hover:text-blue-400 hover:bg-white/10 transition-all pointer-events-auto" title="Rename Department">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h1.828l8.586-8.586z"></path></svg>
                                    </button>
                                </div>
                                <p class="text-[10px] font-black text-white/40 mt-2 uppercase tracking-[0.3em] flex items-center gap-3">
                                    ${topicCount} Topics
                                    <span class="w-1.5 h-1.5 bg-blue-400/30 rounded-full"></span>
                                    ${qCount} Items
                                </p>
                            </div>
                        </div>

                        <div onclick="window.viewCourse('${course}')" class="mt-4 md:mt-0 flex items-center justify-between p-5 bg-white/5 rounded-[28px] text-white/30 group-hover:bg-blue-600 group-hover:text-white group-hover:drop-shadow-[0_10px_20px_rgba(37,99,235,0.4)] transition-all border border-white/5 group-hover:border-blue-400 pointer-events-auto">
                            <span class="text-[10px] font-black uppercase tracking-[0.3em] ml-2">Access Records</span>
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return `<div class="flex flex-col gap-6">${grid}</div>`;
    };

    const renderTopicList = () => {
        const topics = hierarchy.topics[viewState.selectedCourse] || [];
        let filteredTopics = topics;
        if (viewState.searchTerm) {
            const term = viewState.searchTerm.toLowerCase();
            filteredTopics = topics.filter(t => t.toLowerCase().includes(term));
        }

        let html = `
            <div class="mb-10 relative group bg-white/5 border border-white/10 rounded-[28px] overflow-hidden focus-within:border-blue-500/50 transition-colors shadow-2xl">
                <input type="text" 
                    data-search
                    placeholder="Search within department topics..." 
                    value="${viewState.searchTerm}"
                    oninput="window.updateSearch(this.value)"
                    class="w-full p-6 pl-16 bg-transparent text-white text-lg font-bold tracking-tight outline-none placeholder:text-white/20"
                >
                <div class="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-400 transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
            </div>
        `;

        if (filteredTopics.length === 0) {
            return html + `
                <div class="text-center py-24 glass-panel rounded-[50px] border border-dashed border-white/10">
                    <p class="text-white/30 font-black uppercase tracking-widest text-xs mb-6">No operational topics identified</p>
                    <button onclick="window.openAddModal('topic')" class="text-blue-400 font-black uppercase text-[10px] tracking-[0.3em] border-b-2 border-blue-400 pb-1">Define New Topic</button>
                </div>
            `;
        }

        const grid = filteredTopics.map(topic => {
            const count = hierarchy.counts[`${viewState.selectedCourse}|${topic}|ALL|ANY`] || 0;
            return `
                <div class="group relative glass-panel p-8 md:p-10 rounded-[45px] border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer overflow-hidden active:scale-[0.98] shadow-2xl">
                    <div onclick="window.viewTopic('${topic}')" class="absolute inset-0 z-0"></div>
                    <div class="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10 pointer-events-none">
                        <div class="flex items-center gap-6 md:gap-8 pointer-events-auto">
                            <div class="w-16 h-16 md:w-20 md:h-20 bg-blue-500/10 rounded-[28px] flex items-center justify-center transition-all ring-1 ring-white/5 shadow-inner">
                                <div class="w-2 h-10 md:h-12 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div>
                            </div>
                            <div>
                                <div class="flex items-center gap-3">
                                    <h3 class="font-black text-white text-2xl md:text-3xl group-hover:text-blue-400 transition-colors uppercase tracking-tight">${topic}</h3>
                                    <button onclick="event.stopPropagation(); window.openRenameModal('topic', '${topic}')" class="p-2 bg-white/5 rounded-xl text-white/20 hover:text-blue-400 hover:bg-white/10 transition-all pointer-events-auto" title="Rename Topic">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h1.828l8.586-8.586z"></path></svg>
                                    </button>
                                </div>
                                <p class="text-[10px] font-black text-white/40 mt-2 uppercase tracking-[0.3em] flex items-center gap-3">
                                    ${count} Resources
                                </p>
                            </div>
                        </div>

                        <div onclick="window.viewTopic('${topic}')" class="mt-4 md:mt-0 flex items-center justify-between p-5 bg-white/5 rounded-[28px] text-white/30 group-hover:bg-blue-600 group-hover:text-white group-hover:drop-shadow-[0_10px_20px_rgba(37,99,235,0.4)] transition-all border border-white/5 group-hover:border-blue-400 pointer-events-auto">
                            <span class="text-[10px] font-black uppercase tracking-[0.3em] ml-2">Open Repository</span>
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return html + `<div class="flex flex-col gap-6">${grid}</div>`;
    };

    const renderQuestionList = () => {
        let filtered = [...allQuestions];

        if (viewState.searchTerm) {
            const term = viewState.searchTerm.toLowerCase();
            filtered = filtered.filter(q => q.text.toLowerCase().includes(term));
        }

        // Apply Sorting
        filtered.sort((a, b) => {
            let valA = (a[viewState.sortBy] || '').toString().toLowerCase();
            let valB = (b[viewState.sortBy] || '').toString().toLowerCase();
            
            // Difficulty has a specific order
            if (viewState.sortBy === 'difficulty') {
                const diffOrder = { 'EASY': 1, 'MODERATE': 2, 'DIFFICULT': 3 };
                valA = diffOrder[a.difficulty] || 0;
                valB = diffOrder[b.difficulty] || 0;
            }

            if (valA < valB) return viewState.sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return viewState.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        viewState.totalFiltered = filtered.length;

        const sortIcon = (field) => {
            if (viewState.sortBy !== field) return `<span class="opacity-20 ml-2">↕</span>`;
            return `<span class="ml-2 text-white">${viewState.sortOrder === 'asc' ? '↑' : '↓'}</span>`;
        };

        let html = `
            <div class="mb-10 relative group bg-white/5 border border-white/10 rounded-[28px] overflow-hidden focus-within:border-blue-500/50 transition-colors shadow-2xl">
                <input type="text" 
                    data-search
                    placeholder="Search within topic..." 
                    value="${viewState.searchTerm}"
                    oninput="window.updateSearch(this.value)"
                    class="w-full p-6 pl-16 bg-transparent text-white text-lg font-bold tracking-tight outline-none placeholder:text-white/20"
                >
                <div class="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-400 transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
            </div>

            <div class="glass-panel rounded-[40px] overflow-hidden border border-white/10 shadow-2xl bg-black/20">
                <div class="overflow-x-auto no-scrollbar">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-white/5 border-b border-white/10">
                                <th class="p-6 text-[10px] font-black text-blue-400 uppercase tracking-widest cursor-pointer hover:bg-white/5 transition-colors group/th" onclick="window.toggleSort('text')">
                                    <div class="flex items-center">Question ${sortIcon('text')}</div>
                                </th>
                                <th class="p-6 text-[10px] font-black text-blue-400 uppercase tracking-widest cursor-pointer hover:bg-white/5 transition-colors w-32 group/th" onclick="window.toggleSort('type')">
                                    <div class="flex items-center">Type ${sortIcon('type')}</div>
                                </th>
                                <th class="p-6 text-[10px] font-black text-blue-400 uppercase tracking-widest cursor-pointer hover:bg-white/5 transition-colors w-32 group/th" onclick="window.toggleSort('difficulty')">
                                    <div class="flex items-center">Level ${sortIcon('difficulty')}</div>
                                </th>
                                <th class="p-6 text-[10px] font-black text-blue-400 uppercase tracking-widest w-32 text-center">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/5">
                            ${filtered.slice(0, viewState.limit).map(q => `
                                <tr class="hover:bg-white/5 transition-colors group/tr relative">
                                    <td class="p-6">
                                        <div class="text-white text-xs font-bold leading-relaxed line-clamp-2 group-hover/tr:line-clamp-none transition-all duration-300 max-w-xl">${q.text}</div>
                                        ${q.figures && q.figures.length > 0 ? `
                                            <div class="mt-3 flex items-center gap-2">
                                                <span class="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 flex items-center gap-1.5">
                                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                    ${q.figures.length} Visual Payload(s)
                                                </span>
                                            </div>
                                        ` : ''}
                                    </td>
                                    <td class="p-6">
                                        <span class="inline-block text-[9px] font-black px-3 py-1 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20 uppercase tracking-widest">${q.type}</span>
                                    </td>
                                    <td class="p-6">
                                        <span class="inline-block text-[9px] font-black px-3 py-1 rounded-full border ${q.difficulty === 'DIFFICULT' ? 'bg-red-500/10 text-red-400 border-red-500/20' : q.difficulty === 'MODERATE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'} uppercase tracking-widest">${q.difficulty || 'EASY'}</span>
                                    </td>
                                    <td class="p-6">
                                        <div class="flex items-center justify-center gap-2">
                                            <button onclick="location.hash='#editor?id=${q.id}'" class="p-3 bg-white/5 border border-white/5 rounded-xl text-white/40 hover:text-blue-400 hover:bg-white/10 transition-all active:scale-90 shadow-lg" title="Modify Record">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h1.828l8.586-8.586z"></path></svg>
                                            </button>
                                            <button onclick="window.deleteQ('${q.id}')" class="p-3 bg-white/5 border border-white/5 rounded-xl text-white/40 hover:text-red-400 hover:bg-white/10 transition-all active:scale-90 shadow-lg" title="Purge Record">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        if (filtered.length > viewState.limit) {
            html += `
                <div class="pt-8 text-center flex flex-col items-center gap-4">
                    <p class="text-[10px] font-black text-white/40 uppercase tracking-widest">${viewState.limit} of ${viewState.totalFiltered} Items Displayed</p>
                    <button onclick="window.loadMore()" class="bg-white/5 text-blue-400 border border-white/10 px-10 py-5 rounded-[22px] font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all active:scale-95 shadow-xl">Load More Resources</button>
                </div>
            `;
        }

        return html;
    };

    // --- Interaction Handlers ---
    window.toggleSort = (field) => {
        if (viewState.sortBy === field) {
            viewState.sortOrder = viewState.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            viewState.sortBy = field;
            viewState.sortOrder = 'asc';
        }
        renderPage(true); // Skip heavy sync on visual-only sort
    };

    window.updateSearch = (val) => {
        viewState.searchTerm = val;
        viewState.isTyping = true;
        renderPage(true); // Skip heavy sync on typing
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
        renderPage(true);
    };

    window.deleteQ = async (id) => {
        if (!confirm("Delete this question permanently?")) return;
        try {
            await deleteQuestion(id);
            await regenerateQuestionBankSummary(); // Force fresh metadata
            const idx = allQuestions.findIndex(q => q.id === id);
            if (idx > -1) allQuestions.splice(idx, 1);
            renderPage();
        } catch (err) {
            alert("Purge failed.");
        }
    };

    window.openRenameModal = (type, oldValue) => {
        const modal = document.getElementById('rename-modal');
        const title = document.getElementById('rename-modal-title');
        const desc = document.getElementById('rename-modal-desc');
        const input = document.getElementById('rename-modal-input');
        const confirmBtn = document.getElementById('rename-modal-confirm-btn');

        input.value = oldValue;
        modal.classList.remove('hidden');
        input.focus();
        input.select();

        if (type === 'course') {
            title.textContent = 'Rename Department';
            desc.textContent = `Updating: ${oldValue}`;
        } else {
            title.textContent = 'Rename Topic';
            desc.textContent = `Updating: ${oldValue}`;
        }

        confirmBtn.onclick = async () => {
            const newValue = input.value.trim();
            if (!newValue || newValue === oldValue) {
                modal.classList.add('hidden');
                return;
            }

            confirmBtn.disabled = true;
            confirmBtn.textContent = 'UPDATING...';

            try {
                if (type === 'course') {
                    await renameCourse(oldValue, newValue);
                } else {
                    await renameTopic(viewState.selectedCourse, oldValue, newValue);
                }
                modal.classList.add('hidden');
                await regenerateQuestionBankSummary();
                
                if (type === 'course' && viewState.selectedCourse === oldValue) viewState.selectedCourse = newValue;
                if (type === 'topic' && viewState.selectedTopic === oldValue) viewState.selectedTopic = newValue;

                renderPage();
            } catch (err) {
                alert("Rename failed: " + err.message);
            } finally {
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'Commit Change';
            }
        };
    };

    window.openAddModal = (type) => {
        const modal = document.getElementById('add-modal');
        const title = document.getElementById('modal-title');
        const desc = document.getElementById('modal-desc');
        const input = document.getElementById('modal-input');
        const confirmBtn = document.getElementById('modal-confirm-btn');

        input.value = '';
        modal.classList.remove('hidden');
        input.focus();

        if (type === 'course') {
            title.textContent = 'New Department';
            desc.textContent = 'Initialise Curriculum Group';
            input.placeholder = 'e.g. COMPUTER ENGINEERING';
        } else {
            title.textContent = 'New Topic';
            desc.textContent = `Adding to ${viewState.selectedCourse}`;
            input.placeholder = 'e.g. NETWORK ARCHITECTURE';
        }

        confirmBtn.onclick = () => {
            const val = input.value.trim();
            if (!val) return;

            modal.classList.add('hidden');
            let hash = '#editor';
            if (type === 'course') hash += `?course=${encodeURIComponent(val)}`;
            else hash += `?course=${encodeURIComponent(viewState.selectedCourse)}&topic=${encodeURIComponent(val)}`;
            window.location.hash = hash;
        };
    };

    window.runDataDiagnostics = async () => {
        if (!confirm("Run data integrity diagnostics and repair misidentified True/False questions?")) return;
        
        // Note: Diagnostics now needs ALL questions, which violates our optimization but is a rare admin tool
        const allQsForDiag = await getQuestions(); 
        const misidentified = allQsForDiag.filter(q => {
            if (q.type !== 'MCQ') return false;
            if (!q.choices || q.choices.length !== 2) return false;
            const texts = q.choices.map(c => c.text.toUpperCase());
            return texts.includes('TRUE') && texts.includes('FALSE');
        });

        if (misidentified.length === 0) {
            alert("Diagnostics complete: No misidentified True/False questions found.");
            return;
        }

        if (!confirm(`Found ${misidentified.length} questions that should be TRUE/FALSE but are marked as MCQ. Repair now?`)) return;

        let repairedCount = 0;
        for (const q of misidentified) {
            try {
                const correctChoice = q.choices.find(c => (q.correct_answers || []).includes(c.id) || q.correct_answer === c.id);
                if (!correctChoice) continue;
                const isTrue = correctChoice.text.toUpperCase() === 'TRUE';
                await repairQuestion(q.id, { type: 'TRUE_FALSE', correct_answer: isTrue, correct_answers: [isTrue], choices: [] });
                repairedCount++;
            } catch (err) { console.error(`Failed to repair ${q.id}:`, err); }
        }

        await regenerateQuestionBankSummary();
        alert(`Repair complete: ${repairedCount} items upgraded to True/False protocol.`);
        location.reload();
    };

    renderPage();
};
