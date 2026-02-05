import { renderButton } from '../../shared/button.js';
import { renderInput } from '../../shared/input.js';
import { addQuestion, getHierarchy, updateQuestion, getQuestionById } from '../../services/question-bank.service.js';
import { getUser } from '../../core/store.js';

export const EditorPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();
    if (!user) { window.location.hash = '#login'; return; }

    app.innerHTML = `
        <div class="flex items-start justify-center min-h-screen bg-premium-gradient py-8 px-4">
            <div class="bg-white w-full max-w-2xl rounded-[50px] shadow-2xl shadow-blue-200/50 animate-in fade-in slide-in-from-bottom-8 duration-700 relative overflow-hidden border border-white min-h-[90vh]">
                <div class="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-30"></div>
                
                <header class="glass-panel sticky top-0 z-40 px-8 py-8 border-b border-gray-100 flex justify-between items-center transition-all">
                    <div class="flex items-center gap-5">
                        <button onclick="location.hash='#bank'" class="p-3 glass-panel rounded-2xl text-gray-500 hover:text-blue-600 transition-colors shadow-sm">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <div>
                            <h1 id="page-title" class="text-2xl font-black text-gray-900 leading-tight tracking-tight uppercase">Resource Forge</h1>
                            <p id="page-desc" class="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] mt-0.5">Registry Item Authoring</p>
                        </div>
                    </div>
                </header>

                <main class="p-8 space-y-12 relative z-10">

            <form id="question-form" class="space-y-8 opacity-0 transition-opacity duration-300">
                <!-- Metadata -->
                <div class="bg-white p-10 rounded-[50px] shadow-2xl shadow-blue-50/50 border border-white space-y-8 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                        <div class="flex flex-col gap-2">
                            <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Knowledge Domain</label>
                            <input id="course" list="course-list" type="text" placeholder="e.g. CE101" class="p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-black text-gray-900 uppercase" autocomplete="off" required>
                            <datalist id="course-list"></datalist>
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Theoretical Vector</label>
                            <input id="topic" list="topic-list" type="text" placeholder="e.g. Vectors" class="p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-black text-gray-900 uppercase" autocomplete="off" required>
                            <datalist id="topic-list"></datalist>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
                        <div class="flex flex-col gap-2">
                            <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Item Schema</label>
                            <select id="q-type" class="p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-black text-gray-900 appearance-none shadow-inner">
                                <option value="MCQ">SINGLE CHOICE MCQ</option>
                                <option value="MULTI_ANSWER">MULTI-ANSWER MCQ</option>
                                <option value="IDENTIFICATION">IDENTIFICATION (TYPED)</option>
                                <option value="MATCHING">MATCHING PAIRS</option>
                                <option value="ORDERING">SEQUENTIAL ORDERING</option>
                                <option value="TRUE_FALSE">TRUE / FALSE</option>
                            </select>
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Complexity</label>
                            <select id="q-difficulty" class="p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-black text-gray-900 appearance-none shadow-inner">
                                <option value="EASY">STANDARD</option>
                                <option value="MODERATE">REFINED</option>
                                <option value="DIFFICULT">EXTREME</option>
                            </select>
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Point Value</label>
                            <input id="q-points" type="number" value="1" min="1" class="p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-black text-blue-600 text-center text-lg">
                        </div>
                    </div>

                    <div class="flex flex-col gap-2 relative z-10">
                        <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Item Statement</label>
                        <div id="q-editor-container" class="bg-gray-50 rounded-[32px] border border-gray-100 overflow-hidden shadow-inner focus-within:border-blue-500/50 transition-colors">
                            <div id="q-editor" style="height: 250px;" class="text-gray-900 text-lg"></div>
                        </div>
                    </div>
                </div>

                <!-- Unified Response Registry Section -->
                <div id="dynamic-content" class="bg-white p-10 rounded-[50px] border border-white shadow-2xl shadow-blue-50/50 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
                    
                    <!-- Response Registry (MCQ / Multi / ID) -->
                    <div id="section-responses" class="space-y-8 hidden relative z-10">
                        <div class="flex justify-between items-center px-2">
                             <div>
                                <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] block">Response Registry</label>
                                <p id="response-hint" class="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Append answers and toggle correct/wrong status</p>
                             </div>
                            <button type="button" id="add-response-btn" class="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b-2 border-blue-600 pb-0.5">+ APPEND RESPONSE</button>
                        </div>
                        <div id="responses-list" class="space-y-4"></div>
                    </div>

                    <!-- Matching Section -->
                    <div id="section-matching" class="space-y-6 hidden relative z-10">
                        <div class="flex justify-between items-center px-2">
                            <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Relational Pairs</label>
                            <button type="button" id="add-pair-btn" class="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b-2 border-blue-600 pb-0.5">+ APPEND PAIR</button>
                        </div>
                        <div id="pairs-list" class="space-y-4"></div>
                    </div>

                    <!-- Ordering Section -->
                    <div id="section-ordering" class="space-y-6 hidden relative z-10">
                        <div class="flex justify-between items-center px-2">
                            <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Sequential Chain</label>
                            <button type="button" id="add-order-btn" class="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b-2 border-blue-600 pb-0.5">+ APPEND STEP</button>
                        </div>
                        <div id="order-list" class="space-y-4"></div>
                    </div>

                    <!-- True/False -->
                    <div id="section-tf" class="space-y-6 hidden relative z-10">
                         <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] px-2 block">Binary Truth Determination</label>
                         <div class="flex gap-6">
                            <label class="flex-1 cursor-pointer group/tf">
                                <input type="radio" name="tf-answer" value="true" class="peer hidden">
                                <div class="p-8 glass-panel border border-white rounded-[32px] text-center peer-checked:bg-green-500 peer-checked:text-white peer-checked:shadow-2xl peer-checked:shadow-green-200 font-black uppercase tracking-[0.3em] text-[10px] transition-all hover:bg-gray-50 h-full flex flex-col items-center justify-center gap-3">
                                    <div class="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500 peer-checked:bg-white/20 peer-checked:text-white transition-colors group-hover/tf:scale-110 transition-transform">
                                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    TRUE PROTOCOL
                                </div>
                            </label>
                            <label class="flex-1 cursor-pointer group/tf">
                                <input type="radio" name="tf-answer" value="false" class="peer hidden">
                                <div class="p-8 glass-panel border border-white rounded-[32px] text-center peer-checked:bg-red-500 peer-checked:text-white peer-checked:shadow-2xl peer-checked:shadow-red-200 font-black uppercase tracking-[0.3em] text-[10px] transition-all hover:bg-gray-50 h-full flex flex-col items-center justify-center gap-3">
                                    <div class="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 peer-checked:bg-white/20 peer-checked:text-white transition-colors group-hover/tf:scale-110 transition-transform">
                                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </div>
                                    FALSE PROTOCOL
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Figures Section -->
                <div class="bg-white p-10 rounded-[50px] border border-white shadow-2xl shadow-blue-50/50 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
                    
                    <div class="relative z-10">
                        <div class="flex justify-between items-center px-2 mb-8">
                            <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Visual Telemetry (Figures)</label>
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
                 <p class="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] animate-pulse">Accessing Resource Registry...</p>
            </div>
        </main>
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
                    <p class="text-[10px] text-gray-600 uppercase tracking-widest font-black">Real-time LaTeX Telemetry</p>
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
        secResponses: document.getElementById('section-responses'),
        secMATCHING: document.getElementById('section-matching'),
        secORDERING: document.getElementById('section-ordering'),
        secTF: document.getElementById('section-tf'),
        responsesList: document.getElementById('responses-list'),
        pairsList: document.getElementById('pairs-list'),
        orderList: document.getElementById('order-list'),
        addResponseBtn: document.getElementById('add-response-btn'),
        addPairBtn: document.getElementById('add-pair-btn'),
        addOrderBtn: document.getElementById('add-order-btn'),
        figBtn: document.getElementById('add-fig-btn'),
        figInput: document.getElementById('fig-input'),
        figList: document.getElementById('figures-list')
    };

    let state = {
        responses: [], // Unified for MCQ, Multi, and ID
        matchingPairs: [],
        orderingItems: [],
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
        if (typeof Quill === 'undefined') {
            console.error("Quill JS Not Loaded");
            throw new Error("Quill library missing from environment");
        }

        // Formula module requires KaTeX
        const hasKatex = typeof katex !== 'undefined';
        if (!hasKatex) console.warn("KaTeX not detected. Formula module might be unstable.");

        state.quill = new Quill('#q-editor', {
            theme: 'snow',
            modules: {
                formula: hasKatex,
                toolbar: [
                    [{ 'header': [2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    hasKatex ? ['formula'] : [],
                    ['clean']
                ]
            },
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

    const renderResponses = () => {
        const type = els.type.value;
        const isID = type === 'IDENTIFICATION';
        const isMulti = type === 'MULTI_ANSWER';

        els.responsesList.innerHTML = state.responses.map((r, i) => {
            const isCorrect = r.isCorrect;
            const controlType = isMulti ? 'checkbox' : 'radio';

            return `
            <div class="flex items-center gap-4 group/row animate-in fade-in slide-in-from-left-4 duration-300 p-2 rounded-[28px] transition-all ${isCorrect ? 'bg-blue-50/50 border border-blue-100 shadow-inner' : 'border border-transparent hover:bg-gray-50/50'}">
                ${!isID ? `
                <label class="relative flex-shrink-0 cursor-pointer group/choice">
                    <input type="${controlType}" name="resp-correct" value="${r.id}" data-idx="${i}" ${isCorrect ? 'checked' : ''} class="resp-correct-input peer hidden">
                    <div class="w-14 h-14 rounded-2xl flex items-center justify-center transition-all border font-black text-lg group-hover/choice:scale-105 shadow-sm ${isCorrect ? 'bg-blue-100 text-blue-600 border-blue-300 shadow-blue-200/50' : 'bg-white text-gray-400 border-gray-100 group-hover/choice:border-blue-200'}">
                        ${isMulti && isCorrect ? '✓' : String.fromCharCode(65 + i)}
                    </div>
                </label>
                ` : `
                <div class="w-14 h-14 flex-shrink-0 rounded-2xl bg-blue-50 text-blue-400 border border-blue-100 flex items-center justify-center font-black">
                    ${i + 1}
                </div>
                `}
                <div class="flex-1 flex flex-col gap-1">
                    ${isCorrect && !isID ? `<span class="text-[8px] font-black text-blue-600 uppercase tracking-[0.3em] ml-2 mb-1 animate-pulse">CORRECT PROTOCOL</span>` : ''}
                    <input type="text" value="${r.text || ''}" data-idx="${i}" class="response-input w-full p-5 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-black uppercase tracking-tight transition-all focus:bg-white focus:border-blue-500 outline-none text-gray-900 placeholder:opacity-30" placeholder="${isID ? 'ACCEPTED VARIANT / SYNONYM...' : `DATA OPTION ${String.fromCharCode(65 + i)}...`}">
                </div>
                <button type="button" data-idx="${i}" class="remove-response w-12 h-12 flex items-center justify-center text-gray-300 hover:text-red-500 font-black text-2xl transition-colors opacity-0 group-hover/row:opacity-100">×</button>
            </div>
        `}).join('');

        els.responsesList.querySelectorAll('.resp-correct-input').forEach(input => {
            input.onchange = (e) => {
                if (isMulti) {
                    state.responses[e.target.dataset.idx].isCorrect = e.target.checked;
                } else {
                    state.responses.forEach((resp, idx) => {
                        resp.isCorrect = (idx === parseInt(e.target.dataset.idx));
                    });
                }
                renderResponses();
            };
        });

        els.responsesList.querySelectorAll('.response-input').forEach(inp => {
            inp.addEventListener('input', (e) => state.responses[e.target.dataset.idx].text = e.target.value);
        });

        els.responsesList.querySelectorAll('.remove-response').forEach(btn => {
            btn.addEventListener('click', (e) => {
                state.responses.splice(parseInt(e.currentTarget.dataset.idx), 1);
                renderResponses();
            });
        });
    };

    const renderMatchingPairs = () => {
        els.pairsList.innerHTML = state.matchingPairs.map((p, i) => `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-gray-50/50 rounded-[32px] border border-gray-100 relative group animate-in zoom-in duration-300">
                <div class="flex flex-col gap-2">
                    <label class="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-2">TERM / PREMISE</label>
                    <input type="text" value="${p.term}" data-idx="${i}" data-field="term" class="pair-input p-4 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-tight outline-none focus:border-blue-500 transition-all shadow-sm" placeholder="e.g. ELECTRON">
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-2">DEFINITION / CORRELATE</label>
                    <input type="text" value="${p.definition}" data-idx="${i}" data-field="definition" class="pair-input p-4 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-tight outline-none focus:border-blue-500 transition-all shadow-sm" placeholder="e.g. NEGATIVE CHARGE">
                </div>
                <button type="button" data-idx="${i}" class="remove-pair absolute -top-2 -right-2 w-8 h-8 bg-white border border-gray-100 text-gray-300 hover:text-red-500 rounded-xl flex items-center justify-center font-black text-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">×</button>
            </div>
        `).join('');
        els.pairsList.querySelectorAll('.pair-input').forEach(inp => {
            inp.addEventListener('input', (e) => {
                state.matchingPairs[e.target.dataset.idx][e.target.dataset.field] = e.target.value;
            });
        });
        els.pairsList.querySelectorAll('.remove-pair').forEach(btn => {
            btn.addEventListener('click', (e) => {
                state.matchingPairs.splice(parseInt(e.currentTarget.dataset.idx), 1);
                renderMatchingPairs();
            });
        });
    };

    const renderOrderingItems = () => {
        els.orderList.innerHTML = state.orderingItems.map((item, i) => `
            <div class="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 group animate-in slide-in-from-left-4 duration-300">
                <div class="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center font-black text-gray-400 text-xs shadow-sm shadow-inner">${i + 1}</div>
                <input type="text" value="${item}" data-idx="${i}" class="order-input flex-1 p-4 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-tight outline-none focus:border-blue-500 transition-all shadow-sm" placeholder="STEP DATA ${i + 1}...">
                <div class="flex flex-col gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" data-idx="${i}" data-dir="up" class="move-order w-8 h-8 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-20" ${i === 0 ? 'disabled' : ''}>▲</button>
                    <button type="button" data-idx="${i}" data-dir="down" class="move-order w-8 h-8 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-20" ${i === state.orderingItems.length - 1 ? 'disabled' : ''}>▼</button>
                </div>
                <button type="button" data-idx="${i}" class="remove-order w-8 h-8 text-gray-300 hover:text-red-500 font-black text-xl transition-colors">×</button>
            </div>
        `).join('');
        els.orderList.querySelectorAll('.order-input').forEach(inp => {
            inp.addEventListener('input', (e) => state.orderingItems[e.target.dataset.idx] = e.target.value);
        });
        els.orderList.querySelectorAll('.move-order').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.idx);
                const dir = e.currentTarget.dataset.dir;
                const target = dir === 'up' ? idx - 1 : idx + 1;
                [state.orderingItems[idx], state.orderingItems[target]] = [state.orderingItems[target], state.orderingItems[idx]];
                renderOrderingItems();
            });
        });
        els.orderList.querySelectorAll('.remove-order').forEach(btn => {
            btn.addEventListener('click', (e) => {
                state.orderingItems.splice(parseInt(e.currentTarget.dataset.idx), 1);
                renderOrderingItems();
            });
        });
    };


    const updateUIByType = () => {
        const type = els.type.value;
        const hint = document.getElementById('response-hint');
        [els.secResponses, els.secMATCHING, els.secORDERING, els.secTF].forEach(sec => sec.classList.add('hidden'));

        if (type === 'MCQ' || type === 'MULTI_ANSWER' || type === 'IDENTIFICATION') {
            els.secResponses.classList.remove('hidden');
            const label = els.secResponses.querySelector('label');

            if (type === 'MCQ') {
                label.textContent = 'Operational Response Registry';
                hint.textContent = 'Single correct answer. Distractors will be used as choices.';
                els.addResponseBtn.textContent = '+ APPEND OPTION';
            } else if (type === 'MULTI_ANSWER') {
                label.textContent = 'Selection Grid Registry';
                hint.textContent = 'Multiple correct answers possible. Distractors will be used as choices.';
                els.addResponseBtn.textContent = '+ APPEND OPTION';
            } else if (type === 'IDENTIFICATION') {
                label.textContent = 'Accepted Variants Registry';
                hint.textContent = 'Typed input. Multiple responses are treated as valid synonyms.';
                els.addResponseBtn.textContent = '+ APPEND VARIANT';
                // If switching to ID, mark all as correct for synonym logic
                state.responses.forEach(r => r.isCorrect = true);
            }

            if (state.responses.length === 0) {
                state.responses = [{ id: 'r' + Math.random().toString(36).substr(2, 5), text: '', isCorrect: true }];
            }
            renderResponses();
        } else if (type === 'MATCHING') {
            els.secMATCHING.classList.remove('hidden');
            if (state.matchingPairs.length === 0) {
                state.matchingPairs = [{ term: '', definition: '' }];
            }
            renderMatchingPairs();
        } else if (type === 'ORDERING') {
            els.secORDERING.classList.remove('hidden');
            if (state.orderingItems.length === 0) {
                state.orderingItems = ['', ''];
            }
            renderOrderingItems();
        } else if (type === 'TRUE_FALSE') {
            els.secTF.classList.remove('hidden');
        }
    };

    const init = async () => {
        try {
            els.overlay.classList.remove('hidden');
            state.hierarchy = await getHierarchy();

            const courseList = document.getElementById('course-list');
            if (courseList && state.hierarchy?.courses) {
                courseList.innerHTML = state.hierarchy.courses.map(c => `<option value="${c}">`).join('');
            }

            els.course.addEventListener('input', () => {
                const selected = els.course.value;
                const topics = state.hierarchy.topics[selected] || [];
                const tList = document.getElementById('topic-list');
                if (tList) tList.innerHTML = topics.map(t => `<option value="${t}">`).join('');
            });

            initQuill();

            const params = new URLSearchParams(window.location.hash.split('?')[1]);
            state.questionId = params.get('id');

            if (state.questionId) {
                const q = await getQuestionById(state.questionId);
                els.title.textContent = "REFINE MODULE";
                els.desc.textContent = `UPDATING ITEM ID: ${state.questionId}`;
                els.submitBtn.textContent = "COMMIT UPDATE";

                els.course.value = q.course || '';
                const initialTopics = state.hierarchy.topics[q.course] || [];
                const tList = document.getElementById('topic-list');
                if (tList) tList.innerHTML = initialTopics.map(t => `<option value="${t}">`).join('');
                els.topic.value = q.topic || '';
                els.difficulty.value = q.difficulty || 'EASY';
                els.points.value = q.points || 1;
                state.figures = q.figures || [];
                renderFigures();
                state.quill.root.innerHTML = q.text || '';

                if (q.type === 'MCQ' || q.type === 'IDENTIFICATION') {
                    const choices = q.choices || [];
                    const correctIds = Array.isArray(q.correct_answers) ? q.correct_answers : [q.correct_answer].filter(Boolean);

                    if (choices.length > 0) {
                        els.type.value = 'MCQ';
                        state.responses = choices.map(c => ({
                            id: c.id,
                            text: c.text,
                            isCorrect: correctIds.includes(c.id)
                        }));
                    } else {
                        els.type.value = 'IDENTIFICATION';
                        state.responses = correctIds.map(text => ({
                            id: 'r' + Math.random().toString(36).substr(2, 5),
                            text: text,
                            isCorrect: true
                        }));
                    }
                } else if (q.type === 'MULTI_ANSWER') {
                    els.type.value = 'MULTI_ANSWER';
                    const choices = q.choices || [];
                    const correctIds = q.correct_answers || [];
                    state.responses = choices.map(c => ({
                        id: c.id,
                        text: c.text,
                        isCorrect: correctIds.includes(c.id)
                    }));
                } else if (q.type === 'TRUE_FALSE') {
                    const radio = document.querySelector(`input[name="tf-answer"][value="${q.correct_answer}"]`);
                    if (radio) radio.checked = true;
                } else if (q.type === 'MULTI_ANSWER') {
                    state.multiChoices = q.choices || [];
                    const correct = q.correct_answers || [];
                    state.multiChoices.forEach(c => c.isCorrect = correct.includes(c.id));
                } else if (q.type === 'MATCHING') {
                    state.matchingPairs = q.pairs || [];
                } else if (q.type === 'ORDERING') {
                    state.orderingItems = q.items || [];
                }
            }

            updateUIByType();
            els.overlay.classList.add('hidden');
            els.form.classList.remove('opacity-0');
        } catch (error) {
            console.error(error);
            alert("INITIALIZATION FAILURE: " + error.message);
        }
    };

    // Event Listeners
    els.type.addEventListener('change', updateUIByType);

    els.addResponseBtn.onclick = () => {
        const type = els.type.value;
        state.responses.push({
            id: 'r' + Math.random().toString(36).substr(2, 5),
            text: '',
            isCorrect: type === 'IDENTIFICATION' // All correct by default for ID synonyms
        });
        renderResponses();
    };
    els.addPairBtn.onclick = () => {
        state.matchingPairs.push({ term: '', definition: '' });
        renderMatchingPairs();
    };
    els.addOrderBtn.onclick = () => {
        state.orderingItems.push('');
        renderOrderingItems();
    };


    els.figBtn.onclick = () => els.figInput.click();
    els.figInput.onchange = async (e) => {
        for (const file of e.target.files) {
            const base64 = await compressImage(file);
            state.figures.push(base64);
        }
        renderFigures();
        els.figInput.value = '';
    };

    els.form.onsubmit = async (e) => {
        e.preventDefault();
        const type = els.type.value;
        const qText = state.quill.root.innerHTML.trim();

        if (qText === '<p><br></p>') return alert("ITEM STATEMENT REQUIRED.");

        let finalChoices = [];
        let finalCorrectAnswers = [];
        let finalExtra = {};

        if (type === 'MCQ') {
            const correct = state.responses.find(r => r.isCorrect);
            if (!correct) return alert("SPECIFY CORRECT OPERATIONAL RESPONSE.");
            finalChoices = state.responses.map(r => ({ id: r.id, text: r.text.trim() }));
            finalCorrectAnswers = [correct.id];
        } else if (type === 'MULTI_ANSWER') {
            const corrects = state.responses.filter(r => r.isCorrect);
            if (corrects.length === 0) return alert("SPECIFY AT LEAST ONE CORRECT PROTOCOL.");
            finalChoices = state.responses.map(r => ({ id: r.id, text: r.text.trim() }));
            finalCorrectAnswers = corrects.map(r => r.id);
        } else if (type === 'IDENTIFICATION') {
            const variants = state.responses.map(r => r.text.trim()).filter(Boolean);
            if (variants.length === 0) return alert("SPECIFY AT LEAST ONE VALID VARIANT.");
            finalChoices = []; // Explicitly empty for ID
            finalCorrectAnswers = variants;
        } else if (type === 'TRUE_FALSE') {
            const sel = document.querySelector('input[name="tf-answer"]:checked');
            if (!sel) return alert("BINARY OPTION REQUIRED.");
            finalCorrectAnswers = [sel.value === 'true'];
        } else if (type === 'MATCHING') {
            if (state.matchingPairs.length < 1) return alert("MINIMUM ONE PAIR REQUIRED.");
            if (state.matchingPairs.some(p => !p.term.trim() || !p.definition.trim())) return alert("ALL PAIR FIELDS REQUIRED.");
            finalExtra.pairs = state.matchingPairs;
            finalCorrectAnswers = state.matchingPairs;
        } else if (type === 'ORDERING') {
            if (state.orderingItems.length < 2) return alert("MINIMUM TWO STEPS REQUIRED.");
            if (state.orderingItems.some(i => !i.trim())) return alert("ALL STEPS REQUIRE DATA.");
            finalExtra.items = state.orderingItems;
            finalCorrectAnswers = state.orderingItems;
        }

        const data = {
            text: qText,
            type,
            course: els.course.value,
            topic: els.topic.value,
            difficulty: els.difficulty.value,
            points: parseInt(els.points.value) || 1,
            choices: finalChoices,
            correct_answers: finalCorrectAnswers,
            correct_answer: finalCorrectAnswers.length === 1 ? finalCorrectAnswers[0] : finalCorrectAnswers,
            figures: state.figures,
            authorId: user.user.uid,
            ...finalExtra
        };

        try {
            els.submitBtn.disabled = true;
            els.submitBtn.textContent = 'EXECUTING COMMIT...';

            if (state.questionId) {
                await updateQuestion(state.questionId, data);
            } else {
                await addQuestion(data);
            }

            els.status.textContent = "✅ REGISTRY COMMIT SUCCESSFUL";
            els.status.classList.remove('hidden', 'bg-red-50', 'text-red-600');
            els.status.classList.add('bg-green-50', 'text-green-600', 'border-green-100');
            setTimeout(() => window.location.hash = '#bank', 500);
        } catch (error) {
            console.error(error);
            els.status.textContent = "❌ COMMIT FAILURE: " + error.message;
            els.status.classList.remove('hidden', 'bg-green-50', 'text-green-600');
            els.status.classList.add('bg-red-50', 'text-red-600', 'border-red-100');
            els.submitBtn.disabled = false;
            els.submitBtn.textContent = 'Execute Commit Protocol';
        }
    };

    init();
};
