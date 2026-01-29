import { renderButton } from '../../shared/button.js';
import { renderInput } from '../../shared/input.js';
import { addQuestion, getHierarchy, updateQuestion, getQuestionById } from '../../services/question-bank.service.js';
import { getUser } from '../../core/store.js';

export const EditorPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();
    if (!user) { window.location.hash = '#login'; return; }

    // --- 1. Initial Shell with Loading Overlay ---
    app.innerHTML = `
        <div class="px-4 py-6 max-w-2xl mx-auto pb-24 relative min-h-screen">
            <!-- Loading Overlay -->
            <div id="loading-overlay" class="absolute inset-0 bg-white/80 z-50 flex items-center justify-center backdrop-blur-sm">
                <div class="flex flex-col items-center gap-3">
                    <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p class="text-blue-600 font-bold animate-pulse">Loading Question...</p>
                </div>
            </div>

            <header class="mb-8">
                <div class="flex items-center justify-between">
                    <h1 id="page-title" class="text-2xl font-bold text-gray-900">Add Question</h1>
                    <button onclick="location.hash='#bank'" class="text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
                </div>
                <p id="page-desc" class="text-gray-500 text-sm mt-1">Add new content to the bank.</p>
            </header>

            <form id="question-form" class="space-y-6 opacity-0 transition-opacity duration-300">
                <!-- Metadata -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-bold text-gray-700">Course</label>
                        <input id="course" list="course-list" type="text" placeholder="e.g. CE101" class="p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors" autocomplete="off" required>
                        <datalist id="course-list"></datalist>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-bold text-gray-700">Topic</label>
                        <input id="topic" list="topic-list" type="text" placeholder="e.g. Vectors" class="p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors" autocomplete="off" required>
                        <datalist id="topic-list"></datalist>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-bold text-gray-700">Question Type</label>
                        <select id="q-type" class="p-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none transition-colors cursor-pointer">
                            <option value="MCQ">Multiple Choice</option>
                            <option value="IDENTIFICATION">Identification / Fill-in</option>
                            <option value="TRUE_FALSE">True / False</option>
                        </select>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-bold text-gray-700">Difficulty</label>
                        <select id="q-difficulty" class="p-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 outline-none transition-colors cursor-pointer">
                            <option value="EASY">Easy</option>
                            <option value="MODERATE">Moderate</option>
                            <option value="DIFFICULT">Difficult</option>
                        </select>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-bold text-gray-700">Default Points</label>
                        <input id="q-points" type="number" value="1" min="1" class="p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors">
                    </div>
                </div>

                <!-- Common: Question Text -->
                <div class="flex flex-col gap-1">
                    <label class="text-sm font-bold text-gray-700">Question Statement</label>
                    <div id="q-editor-container" class="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                        <div id="q-editor" style="height: 200px;" class="text-lg"></div>
                    </div>
                </div>

                <!-- Dynamic Answer Section -->
                <div id="dynamic-content" class="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <!-- MCQ Choices -->
                    <div id="section-mcq" class="space-y-4 hidden">
                        <div class="flex justify-between items-center">
                            <label class="text-sm font-bold text-gray-700">Choices & Correct Answer</label>
                            <button type="button" id="add-choice-btn" class="text-sm text-blue-600 font-bold hover:underline">+ Add Option</button>
                        </div>
                        <div id="choices-list" class="space-y-3"></div>
                    </div>

                    <!-- Identification Answers -->
                    <div id="section-id" class="space-y-3 hidden">
                        <label class="text-sm font-bold text-gray-700 text-purple-700">Accepted Answers (Tags)</label>
                        <p class="text-[11px] text-gray-500 uppercase tracking-wider font-bold">Add all variants (e.g. "Color", "Colour")</p>
                        <div class="flex gap-2">
                            <input id="id-input" type="text" class="flex-1 p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none" placeholder="Add answer...">
                            <button type="button" id="add-id-btn" class="bg-purple-600 text-white px-6 rounded-xl font-bold shadow-lg shadow-purple-100 active:scale-95 transition-transform">Add</button>
                        </div>
                        <div id="id-list" class="flex flex-wrap gap-2 pt-2"></div>
                    </div>

                    <!-- True/False -->
                    <div id="section-tf" class="space-y-3 hidden">
                         <label class="text-sm font-bold text-gray-700 text-blue-700">Correct Answer</label>
                         <div class="flex gap-4">
                            <label class="flex-1 cursor-pointer">
                                <input type="radio" name="tf-answer" value="true" class="peer hidden">
                                <div class="p-4 border-2 border-gray-200 rounded-xl text-center peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:text-green-700 font-extrabold transition-all hover:bg-gray-50">TRUE</div>
                            </label>
                            <label class="flex-1 cursor-pointer">
                                <input type="radio" name="tf-answer" value="false" class="peer hidden">
                                <div class="p-4 border-2 border-gray-200 rounded-xl text-center peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-700 font-extrabold transition-all hover:bg-gray-50">FALSE</div>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Figures Section -->
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <label class="text-sm font-bold text-gray-700">Figures / Diagrams</label>
                        <button type="button" id="add-fig-btn" class="text-sm text-blue-600 font-bold hover:underline">+ Add Figure</button>
                    </div>
                    <input type="file" id="fig-input" class="hidden" accept="image/*">
                    <div id="figures-list" class="grid grid-cols-2 sm:grid-cols-3 gap-3"></div>
                </div>

                <div class="pt-4">
                    ${renderButton({ text: 'Save Question', type: 'submit', id: 'submit-btn' })}
                </div>
                <div id="save-status" class="text-center text-sm font-bold hidden p-3 rounded-xl"></div>
            </form>
        </div>

        <!-- MathLive Visual Editor Modal -->
        <div id="math-modal" class="fixed inset-0 bg-black/60 z-[100] hidden flex items-center justify-center p-4 backdrop-blur-sm">
            <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
                <div class="p-4 bg-blue-600 text-white flex justify-between items-center">
                    <h3 class="font-bold">Equation Editor</h3>
                    <button onclick="document.getElementById('math-modal').classList.add('hidden')" class="text-white/80 hover:text-white text-2xl px-2">×</button>
                </div>
                <div class="p-6 space-y-4">
                    <p class="text-xs text-gray-500 uppercase tracking-widest font-bold">Equation Preview</p>
                    <div class="border-2 border-gray-100 rounded-xl p-4 bg-gray-50 min-h-[100px] flex items-center justify-center">
                        <math-field id="visual-math" class="w-full text-2xl focus:outline-none bg-transparent" virtual-keyboard-toggle="on"></math-field>
                    </div>
                    <div class="flex gap-3 pt-2">
                        <button id="insert-math-btn" class="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100">Insert Equation</button>
                        <button onclick="document.getElementById('math-modal').classList.add('hidden')" class="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // --- 2. Elements & State ---
    const els = {
        overlay: document.getElementById('loading-overlay'),
        form: document.getElementById('question-form'),
        title: document.getElementById('page-title'),
        desc: document.getElementById('page-desc'),
        submitBtn: document.getElementById('submit-btn'),
        type: document.getElementById('q-type'),
        course: document.getElementById('course'),
        topic: document.getElementById('topic'),
        status: document.getElementById('save-status'),
        difficulty: document.getElementById('q-difficulty'),
        points: document.getElementById('q-points'),
        // Sections
        secMCQ: document.getElementById('section-mcq'),
        secID: document.getElementById('section-id'),
        secTF: document.getElementById('section-tf'),
        // Containers/Handlers
        choicesList: document.getElementById('choices-list'),
        idList: document.getElementById('id-list'),
        idInput: document.getElementById('id-input'),
        addChoiceBtn: document.getElementById('add-choice-btn'),
        addIdBtn: document.getElementById('add-id-btn'),
        // Figures
        figBtn: document.getElementById('add-fig-btn'),
        figInput: document.getElementById('fig-input'),
        figList: document.getElementById('figures-list')
    };

    let state = {
        choices: [],
        correctMCQ: null,
        acceptedAnswers: [],
        questionId: null,
        hierarchy: null,
        quill: null,
        figures: []
    };

    // --- 3. Helpers: Image Compression ---
    const compressImage = async (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG 0.7
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
            };
        });
    };

    // --- 3. Quill Initialization ---
    const initQuill = () => {
        state.quill = new Quill('#q-editor', {
            theme: 'snow',
            modules: {
                formula: true,
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    ['formula'],
                    ['clean']
                ]
            },
            placeholder: 'Type your question statement here... Use the fx icon for visual math.'
        });

        // Intercept formula button
        const toolbar = state.quill.getModule('toolbar');
        toolbar.addHandler('formula', () => {
            const modal = document.getElementById('math-modal');
            const mf = document.getElementById('visual-math');
            modal.classList.remove('hidden');
            setTimeout(() => {
                mf.focus();
                // If there's a virtual keyboard, open it
                if (window.mathVirtualKeyboard) window.mathVirtualKeyboard.show();
            }, 100);
        });

        // Insert Button Logic
        document.getElementById('insert-math-btn').onclick = () => {
            const mf = document.getElementById('visual-math');
            const latex = mf.value;
            if (latex) {
                const range = state.quill.getSelection(true);
                state.quill.insertEmbed(range.index, 'formula', latex, Quill.sources.USER);
                state.quill.setSelection(range.index + 1, Quill.sources.SILENT);
            }
            document.getElementById('math-modal').classList.add('hidden');
            mf.value = ''; // Reset for next time
        };
    };

    // --- 5. Render Helpers ---

    const renderFigures = () => {
        els.figList.innerHTML = state.figures.map((fig, i) => `
            <div class="relative group aspect-video bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-100">
                <img src="${fig}" class="w-full h-full object-cover">
                <button type="button" data-idx="${i}" class="remove-fig absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">×</button>
            </div>
        `).join('');

        els.figList.querySelectorAll('.remove-fig').forEach(btn => {
            btn.addEventListener('click', (e) => {
                state.figures.splice(e.currentTarget.dataset.idx, 1);
                renderFigures();
            });
        });
    };

    const renderChoices = () => {
        els.choicesList.innerHTML = state.choices.map((c, i) => `
            <div class="flex items-center gap-3 group animate-fade-in">
                <div class="relative">
                    <input type="radio" name="mcq-correct" value="${c.id}" 
                           ${state.correctMCQ === c.id ? 'checked' : ''}
                           class="peer w-6 h-6 border-2 border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer">
                </div>
                
                <input type="text" value="${c.text}" data-idx="${i}" 
                       class="choice-input flex-1 p-3 border-2 border-gray-200 rounded-xl text-sm font-medium transition-all focus:border-blue-500 outline-none" 
                       placeholder="Choice ${String.fromCharCode(65 + i)}...">
                       
                <button type="button" data-idx="${i}" class="remove-choice text-gray-300 hover:text-red-500 font-bold text-xl px-2 transition-colors">×</button>
            </div>
        `).join('');

        els.choicesList.querySelectorAll('input[type="radio"]').forEach(r => {
            r.addEventListener('change', (e) => state.correctMCQ = e.target.value);
        });

        els.choicesList.querySelectorAll('.choice-input').forEach(inp => {
            inp.addEventListener('input', (e) => state.choices[e.target.dataset.idx].text = e.target.value);
        });

        els.choicesList.querySelectorAll('.remove-choice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.idx);
                const removedId = state.choices[idx].id;
                state.choices.splice(idx, 1);
                if (state.correctMCQ === removedId) state.correctMCQ = null;
                renderChoices();
            });
        });
    };

    const renderIdTags = () => {
        els.idList.innerHTML = state.acceptedAnswers.map((ans, i) => `
            <span class="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200 shadow-sm animate-scale-in">
                ${ans}
                <button type="button" data-idx="${i}" class="rm-tag ml-2 text-purple-400 hover:text-purple-600 transition-colors">×</button>
            </span>
        `).join('');

        els.idList.querySelectorAll('.rm-tag').forEach(btn => {
            btn.addEventListener('click', (e) => {
                state.acceptedAnswers.splice(e.currentTarget.dataset.idx, 1);
                renderIdTags();
            });
        });
    };

    const updateUIByType = () => {
        const type = els.type.value;
        const hide = (el) => el.classList.add('hidden');
        const show = (el) => el.classList.remove('hidden');

        hide(els.secMCQ);
        hide(els.secID);
        hide(els.secTF);

        if (type === 'MCQ') {
            show(els.secMCQ);
            if (state.choices.length === 0) {
                state.choices = [
                    { id: 'choice_a', text: '' },
                    { id: 'choice_b', text: '' },
                    { id: 'choice_c', text: '' },
                    { id: 'choice_d', text: '' }
                ];
                renderChoices();
            }
        } else if (type === 'IDENTIFICATION') {
            show(els.secID);
        } else if (type === 'TRUE_FALSE') {
            show(els.secTF);
        }
    };

    // --- 4. Core Logic: Initialization ---

    const init = async () => {
        try {
            // A. Initialize Quill
            initQuill();

            // B. Fetch common data
            state.hierarchy = await getHierarchy();
            const courseList = document.getElementById('course-list');
            courseList.innerHTML = state.hierarchy.courses.map(c => `<option value="${c}">`).join('');

            // C. Listen for Course changes to update Topic list
            els.course.addEventListener('input', () => {
                const selected = els.course.value;
                const topics = state.hierarchy.topics[selected] || [];
                document.getElementById('topic-list').innerHTML = topics.map(t => `<option value="${t}">`).join('');
            });

            // D. Check for Edit mode
            const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
            state.questionId = urlParams.get('id');

            if (state.questionId) {
                els.title.textContent = 'Edit Question';
                els.desc.textContent = 'Modify existing question in the bank.';
                els.submitBtn.textContent = 'Update Question';

                const q = await getQuestionById(state.questionId);
                if (q) {
                    els.course.value = q.course;
                    els.topic.value = q.topic;
                    els.type.value = q.type;
                    els.difficulty.value = q.difficulty || 'EASY';
                    els.points.value = q.points || 1;
                    state.quill.root.innerHTML = q.text || '';

                    // Manual trigger for topic list
                    const topics = state.hierarchy.topics[q.course] || [];
                    document.getElementById('topic-list').innerHTML = topics.map(t => `<option value="${t}">`).join('');

                    if (q.type === 'MCQ') {
                        state.choices = q.choices || [];
                        state.correctMCQ = q.correct_answer;
                        renderChoices();
                    } else if (q.type === 'IDENTIFICATION') {
                        state.acceptedAnswers = Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer];
                        renderIdTags();
                    } else if (q.type === 'TRUE_FALSE') {
                        const radio = document.querySelector(`input[name="tf-answer"][value="${q.correct_answer}"]`);
                        if (radio) radio.checked = true;
                    }

                    state.figures = q.figures || [];
                    renderFigures();
                }
            }

            // E. Ready! Show form
            updateUIByType();
            els.overlay.classList.add('hidden');
            els.form.classList.remove('opacity-0');

        } catch (err) {
            console.error(err);
            alert("Failed to load editor.");
            location.hash = '#bank';
        }
    };

    // --- 5. Handlers ---

    els.type.addEventListener('change', updateUIByType);

    els.addChoiceBtn.addEventListener('click', () => {
        const nextId = 'choice_' + Math.random().toString(36).substr(2, 5);
        state.choices.push({ id: nextId, text: '' });
        renderChoices();
    });

    const addIdAnswer = () => {
        const val = els.idInput.value.trim();
        if (val && !state.acceptedAnswers.includes(val)) {
            state.acceptedAnswers.push(val);
            renderIdTags();
            els.idInput.value = '';
        }
    };
    els.addIdBtn.addEventListener('click', addIdAnswer);
    els.idInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addIdAnswer(); }
    });

    // Figures Handlers
    els.figBtn.addEventListener('click', () => els.figInput.click());
    els.figInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const compressed = await compressImage(file);
            state.figures.push(compressed);
            renderFigures();
            els.figInput.value = ''; // Reset
        }
    });

    els.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = els.type.value;
        const qContent = state.quill.root.innerHTML.trim();

        // Manual Validation
        if (!qContent || qContent === '<p><br></p>') return alert("Please enter the question statement.");

        let finalAnswer = null;

        if (type === 'MCQ') {
            if (state.choices.some(c => !c.text.trim())) return alert("Please fill in all MCQ choices.");
            if (!state.correctMCQ) return alert("Please select a correct answer.");
            finalAnswer = state.correctMCQ;
        } else if (type === 'TRUE_FALSE') {
            const sel = document.querySelector('input[name="tf-answer"]:checked');
            if (!sel) return alert("Please select True or False.");
            finalAnswer = sel.value;
        } else if (type === 'IDENTIFICATION') {
            if (state.acceptedAnswers.length === 0) return alert("Add at least one accepted answer.");
            finalAnswer = state.acceptedAnswers;
        }

        els.submitBtn.disabled = true;
        els.submitBtn.textContent = 'Saving...';

        try {
            const data = {
                course: els.course.value,
                topic: els.topic.value,
                type: type,
                difficulty: els.difficulty.value,
                points: parseInt(els.points.value) || 1,
                text: state.quill.root.innerHTML,
                correct_answer: finalAnswer,
                choices: type === 'MCQ' ? state.choices : [],
                figures: state.figures,
                authorId: user.user.uid
            };

            if (state.questionId) {
                await updateQuestion(state.questionId, data);
            } else {
                await addQuestion(data);
            }

            els.status.textContent = state.questionId ? "✅ Question Updated!" : "✅ Question Added!";
            els.status.classList.remove('hidden', 'bg-red-50', 'text-red-600');
            els.status.classList.add('bg-green-50', 'text-green-600');

            setTimeout(() => location.hash = '#bank', 1200);

        } catch (err) {
            console.error(err);
            els.status.textContent = "❌ Error saving changes.";
            els.status.classList.remove('hidden', 'bg-green-50', 'text-green-600');
            els.status.classList.add('bg-red-50', 'text-red-600');
            els.submitBtn.disabled = false;
            els.submitBtn.textContent = state.questionId ? 'Update Question' : 'Save Question';
        }
    });

    // Start!
    init();
};
