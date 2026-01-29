import { renderButton } from '../../shared/button.js';
import { getQuestions, getHierarchy, deleteQuestion } from '../../services/question-bank.service.js';
import { getUser } from '../../core/store.js';

export const BankPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();
    if (!user) { window.location.hash = '#login'; return; }

    app.innerHTML = `
        <div class="bg-gray-50 min-h-screen pb-20">
            <header class="bg-white shadow p-4 sticky top-0 z-10">
                <div class="w-full max-w-7xl mx-auto flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <button onclick="location.hash='#teacher-dash'" class="text-gray-500 hover:text-gray-700">← Dash</button>
                        <h1 class="text-xl font-bold text-gray-800">Question Bank</h1>
                    </div>
                    <button onclick="location.hash='#editor'" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold">+ Add New</button>
                </div>
            </header>

            <main class="w-full max-w-7xl mx-auto p-4">
                <div id="bank-content" class="animate-fade-in">
                     <!-- Loading State -->
                     <div class="animate-pulse space-y-4">
                        <div class="h-8 bg-gray-200 rounded w-1/3"></div>
                        <div class="h-32 bg-gray-200 rounded-xl"></div>
                        <div class="h-32 bg-gray-200 rounded-xl"></div>
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
        // Filter
        let courses = hierarchy.courses;
        if (viewState.searchTerm) {
            const term = viewState.searchTerm.toLowerCase();
            courses = courses.filter(c => c.toLowerCase().includes(term));
        }

        let html = `
            <div class="mb-6 sticky top-0 bg-gray-50 pt-2 pb-4 z-10">
                <input type="text" 
                    placeholder="Search courses..." 
                    value="${viewState.searchTerm}"
                    oninput="window.updateSearch(this.value)"
                    class="w-full p-4 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 text-lg shadow-blue-100"
                >
            </div>
        `;

        if (courses.length === 0) {
            if (hierarchy.courses.length === 0) {
                html += `
                    <div class="text-center py-10 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <p class="text-gray-500 mb-4">No content yet.</p>
                        <button onclick="location.hash='#editor'" class="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">Create First Question</button>
                    </div>`;
            } else {
                html += `<div class="text-center py-10 text-gray-400 font-medium">No courses match your search "${viewState.searchTerm}".</div>`;
            }
            contentDiv.innerHTML = html;
            return;
        }

        const grid = courses.map(course => {
            const courseQs = allQuestions.filter(q => (q.course || 'Uncategorized') === course);
            const topicCount = new Set(courseQs.map(q => q.topic)).size;

            return `
                <div onclick="window.viewCourse('${course}')" class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-xl hover:translate-y-[-2px] transition-all cursor-pointer group active:scale-95">
                    <div class="flex justify-between items-start mb-4">
                        <div class="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                        </div>
                        <span class="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100">${courseQs.length} Qs</span>
                    </div>
                    <h3 class="font-bold text-lg text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">${course}</h3>
                    <p class="text-sm text-gray-500">${topicCount} Topics</p>
                </div>
            `;
        }).join('');

        html += `
            <div class="flex flex-col gap-4">
                ${grid}
            </div>
        `;
        contentDiv.innerHTML = html;
    };

    const renderQuestionList = () => {
        const course = viewState.selectedCourse;
        let filtered = allQuestions.filter(q => (q.course || 'Uncategorized') === course);

        // Search Filter
        if (viewState.searchTerm) {
            const term = viewState.searchTerm.toLowerCase();
            filtered = filtered.filter(q =>
                q.text.toLowerCase().includes(term) ||
                (q.topic && q.topic.toLowerCase().includes(term))
            );
        }

        // Header
        let html = `
            <div class="flex flex-col gap-4 mb-6 sticky top-0 bg-gray-50 pt-2 pb-4 z-10">
                <div class="flex items-center gap-4">
                    <button onclick="window.backToCourses()" class="p-2 hover:bg-white hover:shadow-sm rounded-full transition-all text-gray-500 active:scale-90 border border-transparent hover:border-gray-100">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </button>
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900">${course}</h2>
                        <p class="text-sm font-medium text-blue-600">${filtered.length} Results</p>
                    </div>
                </div>
                <input type="text" 
                    placeholder="Search in ${course}..." 
                    value="${viewState.searchTerm}"
                    oninput="window.updateSearch(this.value)"
                    class="w-full p-4 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 shadow-blue-50"
                >
            </div>
        `;

        if (filtered.length === 0) {
            html += `<div class="text-center py-10 text-gray-400 font-medium bg-white rounded-xl shadow-sm border border-gray-100">No questions match your search.</div>`;
            contentDiv.innerHTML = html;
            return;
        }

        const byTopic = filtered.reduce((acc, q) => {
            const topic = q.topic || 'General';
            if (!acc[topic]) acc[topic] = [];
            acc[topic].push(q);
            return acc;
        }, {});

        html += `<div class="space-y-6">`;

        html += Object.entries(byTopic).map(([topic, qs]) => {
            const isCollapsed = viewState.collapsedTopics.has(topic);
            return `
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group/topic">
                <div onclick="window.toggleTopic('${topic}')" class="p-4 bg-white border-b border-gray-50 flex justify-between items-center cursor-pointer hover:bg-blue-50 transition-colors select-none">
                    <div class="flex items-center gap-3">
                        <div class="w-1.5 h-6 bg-blue-600 rounded-full group-hover/topic:scale-y-125 transition-transform"></div>
                        <h3 class="font-bold text-gray-800 tracking-tight">${topic} <span class="text-blue-500 font-bold text-xs ml-2 bg-blue-50 px-2 py-0.5 rounded-full">${qs.length}</span></h3>
                    </div>
                    <svg class="w-5 h-5 text-gray-400 transform transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
                
                <div class="${isCollapsed ? 'hidden' : 'block'} p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50/30">
                    ${qs.map(q => `
                        <div class="p-4 rounded-xl border border-gray-100 hover:border-blue-400 hover:shadow-md transition-all group bg-white flex justify-between items-start gap-4">
                            <div class="flex-1 min-w-0">
                                <div class="flex gap-2 mb-2">
                                    <span class="inline-block text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border ${q.type === 'MCQ' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}">${q.type}</span>
                                    <span class="inline-block text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border ${q.difficulty === 'DIFFICULT' ? 'bg-red-50 text-red-600 border-red-100' : q.difficulty === 'MODERATE' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-green-50 text-green-600 border-green-100'}">${q.difficulty || 'EASY'}</span>
                                </div>
                                <div class="text-gray-900 font-semibold text-sm line-clamp-2 leading-relaxed preview-content mb-3">${q.text}</div>
                                ${q.figures && q.figures.length > 0 ? `
                                    <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                        ${q.figures.map(fig => `
                                            <div class="w-24 h-16 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                                                <img src="${fig}" class="w-full h-full object-cover">
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                            <div class="flex flex-col gap-1 shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onclick="location.hash='#editor?id=${q.id}'" class="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                </button>
                                <button onclick="window.deleteQ('${q.id}')" class="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
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

        // Apply KaTeX rendering to new content
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

        // Keep focus on search input after render
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
        if (!confirm("Are you sure you want to delete this question?")) return;
        try {
            await deleteQuestion(id);
            const idx = allQuestions.findIndex(q => q.id === id);
            if (idx > -1) allQuestions.splice(idx, 1);
            updateView();
        } catch (err) {
            alert("Failed to delete.");
        }
    };

    // Init
    updateView();
};
