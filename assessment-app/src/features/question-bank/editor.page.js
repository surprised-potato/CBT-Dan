import { renderButton } from '../../shared/button.js';
import { renderInput } from '../../shared/input.js';
import { addQuestion, getHierarchy, updateQuestion, getQuestionById } from '../../services/question-bank.service.js';
import { getUser } from '../../core/store.js';

export const EditorPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();
    if (!user) { window.location.hash = '#login'; return; }

    app.innerHTML = `
        <div class="px-4 py-12 max-w-3xl mx-auto pb-32 relative min-h-screen">
            <header class="mb-12">
                <button onclick="location.hash='#bank'" class="p-3 glass-panel rounded-2xl text-gray-500 hover:text-blue-600 transition-all shadow-sm mb-6">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </button>
                <h1 id="page-title" class="text-4xl font-black text-gray-900 tracking-tight uppercase">Resource Forge</h1>
                <p id="page-desc" class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mt-2">Author operational items for registry bank</p>
            </header>

            <form id="question-form" class="space-y-8 opacity-0 transition-opacity duration-300">
                <!-- Metadata -->
                <div class="bg-white p-10 rounded-[50px] shadow-2xl shadow-blue-50/50 border border-white space-y-8 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                        <div class="flex flex-col gap-2">
                            <label class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Knowledge Domain</label>
                            <input id="course" list="course-list" type="text" placeholder="e.g. CE101" class="p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-black text-gray-700 uppercase" autocomplete="off" required>
                            <datalist id="course-list"></datalist>
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Theoretical Vector</label>
                            <input id="topic" list="topic-list" type="text" placeholder="e.g. Vectors" class="p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-black text-gray-700 uppercase" autocomplete="off" required>
                            <datalist id="topic-list"></datalist>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
                        <div class="flex flex-col gap-2">
                            <label class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Item Schema</label>
                            <select id="q-type" class="p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-gray-600 appearance-none shadow-inner">
                                <option value="MCQ">MULTIPLE CHOICE</option>
                                <option value="IDENTIFICATION">IDENTIFICATION</option>
                                <option value="TRUE_FALSE">TRUE / FALSE</option>
                            </select>
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Complexity</label>
                            <select id="q-difficulty" class="p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-gray-600 appearance-none shadow-inner">
                                <option value="EASY">STANDARD</option>
                                <option value="MODERATE">REFINED</option>
                                <option value="DIFFICULT">EXTREME</option>
                            </select>
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Point Value</label>
                            <input id="q-points" type="number" value="1" min="1" class="p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-black text-blue-600 text-center">
                        </div>
                    </div>

                    <div class="flex flex-col gap-2 relative z-10">
                        <label class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Item Statement</label>
                        <div id="q-editor-container" class="bg-gray-50 rounded-[32px] border border-gray-100 overflow-hidden shadow-inner">
                            <div id="q-editor" style="height: 250px;" class="text-lg"></div>
                        </div>
                    </div>
                </div>

                <!-- Dynamic Answer Section -->
                <div id="dynamic-content" class="bg-white p-10 rounded-[50px] border border-white shadow-2xl shadow-blue-50/50 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
                    
                    <!-- MCQ Choices -->
                    <div id="section-mcq" class="space-y-6 hidden relative z-10">
                        <div class="flex justify-between items-center px-2">
                            <label class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Alternative Responses</label>
                            <button type="button" id="add-choice-btn" class="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b-2 border-blue-600 pb-0.5">+ APPEND OPTION</button>
                        </div>
                        <div id="choices-list" class="space-y-4"></div>
                    </div>

                    <!-- Identification Answers -->
                    <div id="section-id" class="space-y-6 hidden relative z-10">
                        <label class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-2 block">Accepted Data Variants</label>
                        <div class="flex gap-4">
                            <input id="id-input" type="text" class="flex-1 p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-black text-gray-700 uppercase" placeholder="ADD VARIANT...">
                            <button type="button" id="add-id-btn" class="bg-blue-premium text-white px-10 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100 active:scale-95 transition-all">COMMIT</button>
                        </div>
                        <div id="id-list" class="flex flex-wrap gap-3 pt-2"></div>
                    </div>

                    <!-- True/False -->
                    <div id="section-tf" class="space-y-6 hidden relative z-10">
                         <label class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-2 block">Binary Truth Determination</label>
                         <div class="flex gap-6">
                            <label class="flex-1 cursor-pointer">
                                <input type="radio" name="tf-answer" value="true" class="peer hidden">
                                <div class="p-8 glass-panel border border-white rounded-[32px] text-center peer-checked:bg-green-500 peer-checked:text-white peer-checked:shadow-2xl peer-checked:shadow-green-200 font-black uppercase tracking-widest text-[10px] transition-all hover:bg-gray-50 h-full flex items-center justify-center">TRUE PROTOCOL</div>
                            </label>
                            <label class="flex-1 cursor-pointer">
                                <input type="radio" name="tf-answer" value="false" class="peer hidden">
                                <div class="p-8 glass-panel border border-white rounded-[32px] text-center peer-checked:bg-red-500 peer-checked:text-white peer-checked:shadow-2xl peer-checked:shadow-red-200 font-black uppercase tracking-widest text-[10px] transition-all hover:bg-gray-50 h-full flex items-center justify-center">FALSE PROTOCOL</div>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Figures Section -->
                <div class="bg-white p-10 rounded-[50px] border border-white shadow-2xl shadow-blue-50/50 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
                    
                    <div class="relative z-10">
                        <div class="flex justify-between items-center px-2 mb-8">
                            <label class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Visual Telemetry (Figures)</label>
                            <button type="button" id="add-fig-btn" class="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b-2 border-blue-600 pb-0.5">+ APPEND DIAGRAM</button>
                        </div>
                        <input type="file" id="fig-input" class="hidden" accept="image/*">
                        <div id="figures-list" class="grid grid-cols-2 sm:grid-cols-3 gap-6"></div>
                    </div>
                </div>

                <div class="pt-8">
                    <button id="submit-btn" type="submit" class="w-full bg-blue-premium text-white p-6 rounded-3xl font-black uppercase text-sm tracking-[0.3em] shadow-2xl shadow-blue-200/50 hover:shadow-blue-300 hover:-translate-y-1 active:scale-[0.98] transition-all">Execute Commit Protocol</button>
                </div>
                <div id="save-status" class="text-center text-[10px] font-black uppercase tracking-widest hidden p-5 rounded-3xl border mt-6"></div>
            </form>

            <!-- Loading Overlay -->
            <div id="loading-overlay" class="fixed inset-0 bg-white/60 z-50 flex flex-col items-center justify-center backdrop-blur-xl">
                 <div class="w-16 h-1 bg-blue-premium rounded-full animate-pulse mb-8"></div>
                 <p class="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] animate-pulse">Accessing Resource Registry...</p>
            </div>
        </div>

        <!-- Math Modal -->
        <div id="math-modal" class="fixed inset-0 bg-black/60 z-[100] hidden flex items-center justify-center p-6 backdrop-blur-xl">
            <div class="bg-white w-full max-w-lg rounded-[50px] shadow-2xl shadow-blue-500/20 overflow-hidden animate-in zoom-in duration-300 border border-white">
                <div class="p-8 bg-blue-premium flex justify-between items-center">
                    <h3 class="font-black text-white uppercase tracking-widest text-xs">Equation Architect</h3>
                    <button onclick="document.getElementById('math-modal').classList.add('hidden')" class="w-10 h-10 glass-panel rounded-xl text-white/80 hover:text-white flex items-center justify-center font-black">×</button>
                </div>
                <div class="p-10 space-y-8">
                    <p class="text-[10px] text-gray-500 uppercase tracking-widest font-black">Real-time LaTeX Telemetry</p>
                    <div class="glass-panel rounded-3xl p-8 bg-gray-50/50 min-h-[120px] flex items-center justify-center shadow-inner">
                        <math-field id="visual-math" class="w-full text-3xl focus:outline-none bg-transparent" virtual-keyboard-toggle="on"></math-field>
                    </div>
                    <div class="flex gap-4 pt-4">
                        <button id="insert-math-btn" class="flex-1 bg-blue-premium text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-100 hover:shadow-2xl transition-all">Commit Equation</button>
                        <button onclick="document.getElementById('math-modal').classList.add('hidden')" class="px-8 py-5 glass-panel text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-gray-100 italic">Abort</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // --- State & Handlers Logic ---
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
        secMCQ: document.getElementById('section-mcq'),
        secID: document.getElementById('section-id'),
        secTF: document.getElementById('section-tf'),
        choicesList: document.getElementById('choices-list'),
        idList: document.getElementById('id-list'),
        idInput: document.getElementById('id-input'),
        addChoiceBtn: document.getElementById('add-choice-btn'),
        addIdBtn: document.getElementById('add-id-btn'),
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

    const compressImage = async (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1200;
                    let width = img.width;
                    let height = img.height;
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    canvas.width = width; canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
            };
        });
    };

    const initQuill = () => {
        state.quill = new Quill('#q-editor', {
            theme: 'snow',
            modules: { formula: true, toolbar: [[{ 'header': [2, 3, false] }], ['bold', 'italic', 'underline'], ['formula'], ['clean']] },
            placeholder: 'Initialise statement data stream...'
        });
        const toolbar = state.quill.getModule('toolbar');
        toolbar.addHandler('formula', () => {
            document.getElementById('math-modal').classList.remove('hidden');
            setTimeout(() => {
                const mf = document.getElementById('visual-math');
                mf.focus();
            }, 100);
        });
        document.getElementById('insert-math-btn').onclick = () => {
            const mf = document.getElementById('visual-math');
            const latex = mf.value;
            if (latex) {
                const range = state.quill.getSelection(true);
                state.quill.insertEmbed(range.index, 'formula', latex, Quill.sources.USER);
                state.quill.setSelection(range.index + 1, Quill.sources.SILENT);
            }
            document.getElementById('math-modal').classList.add('hidden');
            mf.value = '';
        };
    };

    const renderFigures = () => {
        els.figList.innerHTML = state.figures.map((fig, i) => `
            <div class="relative group aspect-square bg-gray-50 rounded-[32px] overflow-hidden border border-gray-100 shadow-inner p-2">
                <img src="${fig}" class="w-full h-full object-cover rounded-[24px]">
                <button type="button" data-idx="${i}" class="remove-fig absolute top-4 right-4 bg-white/90 text-red-500 w-10 h-10 rounded-2xl flex items-center justify-center font-black shadow-xl opacity-0 group-hover:opacity-100 transition-all border border-red-50 hover:bg-red-500 hover:text-white">×</button>
            </div>
        `).join('');
        els.figList.querySelectorAll('.remove-fig').forEach(btn => {
            btn.addEventListener('click', (e) => { state.figures.splice(e.currentTarget.dataset.idx, 1); renderFigures(); });
        });
    };

    const renderChoices = () => {
        els.choicesList.innerHTML = state.choices.map((c, i) => `
            <div class="flex items-center gap-4 group animate-in fade-in slide-in-from-left-4 duration-300">
                <div class="relative flex-shrink-0">
                    <input type="radio" name="mcq-correct" value="${c.id}" ${state.correctMCQ === c.id ? 'checked' : ''} class="peer hidden">
                    <div class="w-12 h-12 glass-panel border border-white rounded-2xl flex items-center justify-center cursor-pointer transition-all peer-checked:bg-blue-premium peer-checked:text-white peer-checked:shadow-xl peer-checked:shadow-blue-100 font-black text-[10px] uppercase">
                        ${String.fromCharCode(65 + i)}
                    </div>
                </div>
                <input type="text" value="${c.text}" data-idx="${i}" class="choice-input flex-1 p-5 bg-gray-50 border border-gray-100 rounded-2xl text-[13px] font-black uppercase tracking-tight transition-all focus:bg-white focus:border-blue-500 outline-none placeholder:opacity-30" placeholder="DATA ALT ${String.fromCharCode(65 + i)}...">
                <button type="button" data-idx="${i}" class="remove-choice text-gray-300 hover:text-red-500 font-black text-2xl px-3 transition-colors opacity-0 group-hover:opacity-100">×</button>
            </div>
        `).join('');
        els.choicesList.querySelectorAll('input[type="radio"]').forEach(r => {
            r.previousElementSibling.onclick = () => { r.checked = true; state.correctMCQ = r.value; };
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
            <span class="inline-flex items-center px-5 py-2.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100 shadow-sm animate-in zoom-in uppercase tracking-widest">
                ${ans}
                <button type="button" data-idx="${i}" class="rm-tag ml-3 text-blue-300 hover:text-red-500 transition-colors">×</button>
            </span>
        `).join('');
        els.idList.querySelectorAll('.rm-tag').forEach(btn => {
            btn.addEventListener('click', (e) => { state.acceptedAnswers.splice(e.currentTarget.dataset.idx, 1); renderIdTags(); });
        });
    };

    const updateUIByType = () => {
        const type = els.type.value;
        els.secMCQ.classList.add('hidden'); els.secID.classList.add('hidden'); els.secTF.classList.add('hidden');
        if (type === 'MCQ') {
            els.secMCQ.classList.remove('hidden');
            if (state.choices.length === 0) {
                state.choices = [{ id: 'choice_a', text: '' }, { id: 'choice_b', text: '' }, { id: 'choice_c', text: '' }, { id: 'choice_d', text: '' }];
                renderChoices();
            }
        } else if (type === 'IDENTIFICATION') els.secID.classList.remove('hidden');
        else if (type === 'TRUE_FALSE') els.secTF.classList.remove('hidden');
    };

    const init = async () => {
        try {
            initQuill();
            state.hierarchy = await getHierarchy();
            const courseList = document.getElementById('course-list');
            courseList.innerHTML = state.hierarchy.courses.map(c => `<option value="${c}">`).join('');
            els.course.addEventListener('input', () => {
                const selected = els.course.value;
                const topics = state.hierarchy.topics[selected] || [];
                document.getElementById('topic-list').innerHTML = topics.map(t => `<option value="${t}">`).join('');
            });
            const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
            state.questionId = urlParams.get('id');
            if (state.questionId) {
                els.title.textContent = 'Resource Modification';
                els.desc.textContent = 'Update operational parameters of existing item';
                els.submitBtn.textContent = 'Execute Update Protocol';
                const q = await getQuestionById(state.questionId);
                if (q) {
                    els.course.value = q.course; els.topic.value = q.topic; els.type.value = q.type;
                    els.difficulty.value = q.difficulty || 'EASY'; els.points.value = q.points || 1;
                    state.quill.root.innerHTML = q.text || '';
                    const topics = state.hierarchy.topics[q.course] || [];
                    document.getElementById('topic-list').innerHTML = topics.map(t => `<option value="${t}">`).join('');
                    if (q.type === 'MCQ') { state.choices = q.choices || []; state.correctMCQ = q.correct_answer; renderChoices(); }
                    else if (q.type === 'IDENTIFICATION') { state.acceptedAnswers = Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer]; renderIdTags(); }
                    else if (q.type === 'TRUE_FALSE') { const radio = document.querySelector(`input[name="tf-answer"][value="${q.correct_answer}"]`); if (radio) radio.checked = true; }
                    state.figures = q.figures || []; renderFigures();
                }
            }
            updateUIByType();
            els.overlay.classList.add('hidden'); els.form.classList.remove('opacity-0');
        } catch (err) { alert("Protocol Failure: Telemetry sync error."); location.hash = '#bank'; }
    };

    els.type.addEventListener('change', updateUIByType);
    els.addChoiceBtn.addEventListener('click', () => { state.choices.push({ id: 'choice_' + Math.random().toString(36).substr(2, 5), text: '' }); renderChoices(); });
    const addIdAnswer = () => { const val = els.idInput.value.trim(); if (val && !state.acceptedAnswers.includes(val)) { state.acceptedAnswers.push(val); renderIdTags(); els.idInput.value = ''; } };
    els.addIdBtn.addEventListener('click', addIdAnswer);
    els.idInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); addIdAnswer(); } });
    els.figBtn.addEventListener('click', () => els.figInput.click());
    els.figInput.addEventListener('change', async (e) => { const file = e.target.files[0]; if (file) { const compressed = await compressImage(file); state.figures.push(compressed); renderFigures(); els.figInput.value = ''; } });

    els.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = els.type.value;
        const qContent = state.quill.root.innerHTML.trim();
        if (!qContent || qContent === '<p><br></p>') return alert("ITEM STATEMENT REQUIRED.");
        let finalAnswer = null;
        if (type === 'MCQ') { if (state.choices.some(c => !c.text.trim())) return alert("ALL CHOICES REQUIRED."); if (!state.correctMCQ) return alert("CORRECT OPTION REQUIRED."); finalAnswer = state.correctMCQ; }
        else if (type === 'TRUE_FALSE') { const sel = document.querySelector('input[name="tf-answer"]:checked'); if (!sel) return alert("BINARY OPTION REQUIRED."); finalAnswer = sel.value; }
        else if (type === 'IDENTIFICATION') { if (state.acceptedAnswers.length === 0) return alert("MINIMUM ONE VARIANT REQUIRED."); finalAnswer = state.acceptedAnswers; }
        els.submitBtn.disabled = true; els.submitBtn.textContent = 'EXECUTING COMMIT...';
        try {
            const data = { course: els.course.value, topic: els.topic.value, type: type, difficulty: els.difficulty.value, points: parseInt(els.points.value) || 1, text: state.quill.root.innerHTML, correct_answer: finalAnswer, choices: type === 'MCQ' ? state.choices : [], figures: state.figures, authorId: user.user.uid };
            if (state.questionId) await updateQuestion(state.questionId, data); else await addQuestion(data);
            els.status.textContent = "✅ REGISTRY COMMIT SUCCESSFUL";
            els.status.classList.remove('hidden', 'bg-red-50', 'text-red-600'); els.status.classList.add('bg-green-50', 'text-green-600', 'border-green-100');
            setTimeout(() => location.hash = '#bank', 1200);
        } catch (err) { els.status.textContent = "❌ COMMIT PROTOCOL FAILURE"; els.status.classList.remove('hidden', 'bg-green-50', 'text-green-600'); els.status.classList.add('bg-red-50', 'text-red-600', 'border-red-100'); els.submitBtn.disabled = false; els.submitBtn.textContent = 'Execute Commit Protocol'; }
    });

    init();
};
