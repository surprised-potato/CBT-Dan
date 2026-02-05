import { bulkAddQuestions, getHierarchy } from '../../services/question-bank.service.js';
import { getUser } from '../../core/store.js';

const SAMPLE_MCQ = `Q: What is the magnitude of a unit vector?
Diff: MODERATE
A) 0
B) 1
C) 2
D) Infinity
Ans: B`;

const SAMPLE_MULTI = `Q: Select all prime numbers.
A) 2
B) 4
C) 5
D) 6
Ans: A, C`;

const SAMPLE_MATCHING = `Q: Match the capitals to their countries.
M: France | Paris
M: Japan | Tokyo
M: Philippines | Manila`;

const SAMPLE_ORDERING = `Q: Sequence the plant growth steps.
O: Germination
O: Seedling
O: Mature Plant
O: Flowering`;

const SAMPLE_TF = `Q: Gravity on Earth is approximately 9.8 m/s²?
* True
- False`;

const SAMPLE_IDENT = `Q: What gas do plants release during photosynthesis?
Ans: Oxygen`;

const JSON_TEMPLATE = `[
  {
    "type": "MULTI_ANSWER",
    "text": "Select the noble gases.",
    "choices": [
      {"id": "c1", "text": "Helium"},
      {"id": "c2", "text": "Oxygen"},
      {"id": "c3", "text": "Neon"}
    ],
    "correct_answers": ["c1", "c3"]
  },
  {
    "type": "MATCHING",
    "text": "Match the following.",
    "pairs": [
      {"term": "H2O", "definition": "Water"},
      {"term": "NaCl", "definition": "Salt"}
    ]
  },
  {
    "type": "ORDERING",
    "text": "Order of planets from Sun.",
    "items": ["Mercury", "Venus", "Earth"]
  }
]`;

export const BulkImportPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();
    if (!user) { window.location.hash = '#login'; return; }

    const hierarchy = await getHierarchy();

    app.innerHTML = `
        <div class="min-h-screen pb-20">
            <header class="glass-header sticky top-0 z-40 px-4 py-8 border-b border-white">
                <div class="max-w-5xl mx-auto flex justify-between items-center">
                    <div class="flex items-center gap-6">
                        <button onclick="location.hash='#bank'" class="p-4 bg-white rounded-2xl border border-gray-100 text-gray-400 hover:text-blue-600 transition-all shadow-sm">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <div>
                            <h1 class="text-3xl font-black text-gray-900 tracking-tighter uppercase">Registry Enrollment</h1>
                            <p class="text-[9px] font-black text-blue-500 uppercase tracking-[0.4em] mt-1">Bulk Protocol Interface</p>
                        </div>
                    </div>
                </div>
            </header>

            <main class="max-w-5xl mx-auto p-4 space-y-12 mt-12">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <!-- Config & Templates -->
                    <div class="space-y-8">
                        <div class="bg-white p-10 rounded-[50px] border border-white space-y-8 shadow-2xl shadow-blue-50/20">
                            <h2 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Operational Config</h2>
                            
                            <div class="flex flex-col gap-3">
                                <label class="text-[9px] font-black text-gray-700 uppercase tracking-[0.3em]">Default Domain</label>
                                <input id="def-course" list="course-list" type="text" placeholder="e.g. PHYS101" class="p-6 bg-gray-50 border-2 border-transparent rounded-[32px] focus:bg-white focus:border-blue-500 outline-none transition-all font-black text-gray-900 uppercase">
                                <datalist id="course-list">${hierarchy.courses.map(c => `<option value="${c}">`).join('')}</datalist>
                            </div>

                            <div class="p-8 bg-blue-50/50 rounded-[40px] border border-blue-100 space-y-8">
                                <div>
                                    <h3 class="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4 italic">Quick Samples</h3>
                                    <div class="grid grid-cols-2 gap-3">
                                        <button id="sample-mcq" class="p-3 bg-white border border-blue-100 rounded-2xl text-[10px] font-black text-gray-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm">MCQ</button>
                                        <button id="sample-multi" class="p-3 bg-white border border-blue-100 rounded-2xl text-[10px] font-black text-gray-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm">MULTI</button>
                                        <button id="sample-matching" class="p-3 bg-white border border-blue-100 rounded-2xl text-[10px] font-black text-gray-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm">MATCH</button>
                                        <button id="sample-ordering" class="p-3 bg-white border border-blue-100 rounded-2xl text-[10px] font-black text-gray-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm">ORDER</button>
                                        <button id="sample-tf" class="p-3 bg-white border border-blue-100 rounded-2xl text-[10px] font-black text-gray-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm">T/F</button>
                                        <button id="sample-ident" class="p-3 bg-white border border-blue-100 rounded-2xl text-[10px] font-black text-gray-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm">IDENT</button>
                                    </div>
                                </div>

                                <div class="pt-6 border-t border-blue-100">
                                    <h3 class="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4 italic">Full Templates</h3>
                                    <div class="grid grid-cols-1 gap-3">
                                        <button id="copy-text-tpl" class="w-full p-4 bg-white border border-blue-100 rounded-2xl text-left text-[10px] font-black text-gray-600 hover:bg-blue-600 hover:text-white transition-all flex justify-between items-center group shadow-sm">
                                            STRUCTURED TEXT
                                            <svg class="w-4 h-4 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                        </button>
                                        <button id="copy-json-tpl" class="w-full p-4 bg-white border border-blue-100 rounded-2xl text-left text-[10px] font-black text-gray-600 hover:bg-blue-600 hover:text-white transition-all flex justify-between items-center group shadow-sm">
                                            RESOURCE JSON
                                            <svg class="w-4 h-4 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                        </button>
                                    </div>
                                </div>

                                <button id="clear-input" class="w-full p-4 bg-red-50 border border-red-100 rounded-2xl text-[10px] font-black text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm uppercase tracking-widest">
                                    Clear Stream
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Input Area -->
                    <div class="lg:col-span-2 space-y-8">
                        <div class="bg-white p-10 rounded-[50px] border border-white shadow-2xl shadow-blue-50/20 flex flex-col gap-8 h-full">
                            <div class="flex justify-between items-center">
                                <h2 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Data stream</h2>
                                <div id="stats" class="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] hidden bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">0 Items Detected</div>
                            </div>
                            
                            <textarea id="data-input" class="w-full flex-1 p-10 bg-gray-50 border-2 border-transparent rounded-[40px] focus:bg-white focus:border-blue-500 outline-none transition-all font-mono text-sm shadow-inner min-h-[500px]" placeholder="EXECUTE PAYLOAD PASTE HERE..."></textarea>
                            
                            <div class="flex gap-6">
                                <button id="parse-btn" class="flex-1 bg-white text-gray-900 border border-gray-100 p-6 rounded-3xl font-black uppercase text-xs tracking-widest hover:shadow-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-3 active:scale-95">
                                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                    Dry Run Parse
                                </button>
                                <button id="commit-btn" disabled class="flex-1 bg-blue-premium text-white p-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-blue-200 disabled:opacity-30 disabled:translate-y-0 hover:shadow-purple-300 hover:-translate-y-1 transition-all active:scale-95">Execute registry write</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Preview Grid -->
                <div id="preview-section" class="hidden space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div class="flex items-center gap-6 px-4">
                        <h2 class="text-3xl font-black text-gray-900 tracking-tighter uppercase whitespace-nowrap">Parsed Entities</h2>
                        <div class="h-px w-full bg-gradient-to-r from-gray-200 to-transparent"></div>
                    </div>
                    <div id="preview-grid" class="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20"></div>
                </div>
            </main>
        </div>
    `;

    const els = {
        input: document.getElementById('data-input'),
        course: document.getElementById('def-course'),
        parseBtn: document.getElementById('parse-btn'),
        commitBtn: document.getElementById('commit-btn'),
        previewSection: document.getElementById('preview-section'),
        previewGrid: document.getElementById('preview-grid'),
        stats: document.getElementById('stats'),
        copyText: document.getElementById('copy-text-tpl'),
        copyJson: document.getElementById('copy-json-tpl'),
        clearBtn: document.getElementById('clear-input'),
        sampleBtns: {
            mcq: document.getElementById('sample-mcq'),
            multi: document.getElementById('sample-multi'),
            match: document.getElementById('sample-matching'),
            order: document.getElementById('sample-ordering'),
            tf: document.getElementById('sample-tf'),
            ident: document.getElementById('sample-ident')
        }
    };

    let parsedQuestions = [];

    const parseData = (raw) => {
        const text = raw.trim();
        if (!text) return [];

        if (text.startsWith('[') || text.startsWith('{')) {
            try {
                const data = JSON.parse(text);
                const items = Array.isArray(data) ? data : [data];
                return items.map(q => ({
                    ...q,
                    course: q.course || els.course.value || 'UNSET',
                    topic: q.topic || 'Bulk Import',
                    difficulty: q.difficulty || 'EASY',
                    points: q.points || 1,
                    authorId: user.user.uid
                }));
            } catch (e) {
                console.warn("JSON Parse failed, falling back to Structured Text logic.");
            }
        }

        const questions = [];
        const blocks = text.split(/Q:/i).filter(b => b.trim());

        blocks.forEach(block => {
            const lines = block.split('\n').map(l => l.trim()).filter(l => l);
            const question = {
                course: els.course.value || 'UNSET',
                topic: 'Bulk Import',
                type: 'MCQ',
                difficulty: 'EASY',
                points: 1,
                text: lines[0],
                choices: [],
                correct_answers: [],
                correct_answer: null,
                pairs: [],
                items: [],
                authorId: user.user.uid
            };

            let isMatching = false;
            let isOrdering = false;
            let isTrueFalse = false;
            let hasChoices = false;

            lines.slice(1).forEach(line => {
                // MCQ Choice
                const mcqMatch = line.match(/^([A-Za-z])[\)\.]\s*(.*)/);
                if (mcqMatch && !line.startsWith('Q:') && !line.startsWith('Ans:')) {
                    question.choices.push({ id: `c_${mcqMatch[1].toUpperCase()}`, text: mcqMatch[2] });
                    hasChoices = true;
                }

                // Matching
                const matchingMatch = line.match(/^M:\s*(.*)\s*\|\s*(.*)/i);
                if (matchingMatch) {
                    question.pairs.push({ term: matchingMatch[1].trim(), definition: matchingMatch[2].trim() });
                    isMatching = true;
                }

                // Ordering
                const orderingMatch = line.match(/^O:\s*(.*)/i);
                if (orderingMatch) {
                    question.items.push(orderingMatch[1].trim());
                    isOrdering = true;
                }

                // Difficulty
                const diffMatch = line.match(/^(Diff|Difficulty):\s*(.*)/i);
                if (diffMatch) {
                    const d = diffMatch[2].trim().toUpperCase();
                    if (['EASY', 'MODERATE', 'DIFFICULT'].includes(d)) {
                        question.difficulty = d;
                    }
                }

                // Answer Line
                const ansMatch = line.match(/^(Ans|Answer):\s*(.*)/i);
                if (ansMatch) {
                    const ansVal = ansMatch[2].trim();
                    if (ansVal.includes(',')) {
                        // MULTI_ANSWER
                        question.type = 'MULTI_ANSWER';
                        question.correct_answers = ansVal.split(',').map(v => `c_${v.trim().toUpperCase()}`);
                    } else if (ansVal.length === 1 && ansVal.match(/[A-Za-z]/i)) {
                        question.correct_answers = [`c_${ansVal.toUpperCase()}`];
                    } else {
                        // Identification if not MCQ letter
                        question.correct_answers = [ansVal];
                    }
                }

                // True/False
                if (line.match(/^[\*\-]\s*(True|False)/i)) {
                    isTrueFalse = true;
                    if (line.startsWith('*')) {
                        question.correct_answers = [line.toLowerCase().includes('true') ? 'true' : 'false'];
                    }
                }
            });

            // Type Determination
            if (isMatching) {
                question.type = 'MATCHING';
                question.correct_answers = question.pairs;
            } else if (isOrdering) {
                question.type = 'ORDERING';
                question.correct_answers = question.items;
            } else if (isTrueFalse) {
                question.type = 'TRUE_FALSE';
            } else if (question.type !== 'MULTI_ANSWER') {
                if (hasChoices) {
                    question.type = (question.correct_answers.length > 1) ? 'MULTI_ANSWER' : 'MCQ';
                } else {
                    question.type = 'IDENTIFICATION';
                }
            }

            // Sync correct_answer for legacy/simple grading
            question.correct_answer = question.correct_answers.length === 1 ? question.correct_answers[0] : question.correct_answers;

            if (question.text) questions.push(question);
        });

        return questions;
    };

    const renderPreview = () => {
        els.previewGrid.innerHTML = parsedQuestions.map((q, i) => {
            const qType = q.type || 'UNKNOWN';
            const qCourse = q.course || 'UNSET';
            const qText = q.text || '(No question text)';
            const qChoices = q.choices || [];
            const qAnswers = Array.isArray(q.correct_answers) ? q.correct_answers : [q.correct_answer];

            let answerUI = '';
            if (qType === 'MCQ' || qType === 'MULTI_ANSWER') {
                answerUI = `
                    <div class="grid grid-cols-1 gap-3">
                        ${qChoices.map(c => `
                            <div class="px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-tight flex justify-between items-center ${qAnswers.includes(c.id) ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-50 text-gray-400'}">
                                <span>${(c.id || '').replace('c_', '')}) ${c.text || ''}</span>
                                ${qAnswers.includes(c.id) ? '✓' : ''}
                            </div>
                        `).join('')}
                    </div>
                `;
            } else if (qType === 'MATCHING') {
                answerUI = `
                    <div class="space-y-2">
                        ${(q.pairs || []).map(p => `
                            <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between text-[10px] font-black uppercase">
                                <span class="text-blue-600">${p.term}</span>
                                <span class="text-gray-300">→</span>
                                <span class="text-gray-900">${p.definition}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else if (qType === 'ORDERING') {
                answerUI = `
                    <div class="space-y-2">
                        ${(q.items || []).map((item, idx) => `
                            <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4 text-[10px] font-black uppercase">
                                <span class="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center">${idx + 1}</span>
                                <span class="text-gray-900">${item}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else if (qType === 'TRUE_FALSE') {
                const isTrue = qAnswers[0] === 'true' || qAnswers[0] === true;
                answerUI = `
                    <div class="flex gap-4">
                        <div class="flex-1 p-4 rounded-2xl border-2 ${isTrue ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-transparent text-gray-300'} text-center font-black text-[10px] uppercase">TRUE</div>
                        <div class="flex-1 p-4 rounded-2xl border-2 ${!isTrue ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-transparent text-gray-300'} text-center font-black text-[10px] uppercase">FALSE</div>
                    </div>
                `;
            } else {
                answerUI = `
                    <div class="p-5 bg-gray-900 text-white rounded-[24px] font-mono text-[11px] uppercase tracking-wider shadow-inner">
                        ${JSON.stringify(q.correct_answers)}
                    </div>
                `;
            }

            return `
                <div class="bg-white p-10 rounded-[50px] border border-white shadow-2xl shadow-blue-50/20 flex flex-col justify-between gap-8 relative group animate-in zoom-in-95">
                    <div class="absolute top-6 right-10 font-black text-gray-50 text-8xl pointer-events-none">#${i + 1}</div>
                    
                    <div class="relative z-10 flex flex-col h-full">
                        <div class="flex gap-3 mb-8">
                            <span class="text-[9px] font-black px-4 py-1.5 rounded-full bg-blue-premium text-white uppercase tracking-widest shadow-lg shadow-blue-100">${qType}</span>
                            <span class="text-[9px] font-black px-4 py-1.5 rounded-full bg-gray-100 text-gray-400 border border-gray-200 uppercase tracking-widest">${qCourse}</span>
                        </div>
                        <div class="text-gray-900 font-black text-lg leading-tight uppercase tracking-tight mb-8">${qText}</div>
                        
                        <div class="mt-auto pt-6 border-t border-gray-50">
                            ${answerUI}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    };

    els.parseBtn.addEventListener('click', () => {
        parsedQuestions = parseData(els.input.value);
        if (parsedQuestions.length > 0) {
            els.previewSection.classList.remove('hidden');
            els.stats.textContent = `${parsedQuestions.length} Items Detected`;
            els.stats.classList.remove('hidden');
            els.commitBtn.disabled = false;
            renderPreview();
            window.scrollTo({ top: els.previewSection.offsetTop - 100, behavior: 'smooth' });
        } else {
            alert("No valid protocol entities detected. Please check template format.");
        }
    });

    els.commitBtn.addEventListener('click', async () => {
        try {
            els.commitBtn.disabled = true;
            els.commitBtn.textContent = "COMMITTING DATA...";
            await bulkAddQuestions(parsedQuestions);
            alert(`SUCCESS: ${parsedQuestions.length} Items Written to Registry.`);
            location.hash = '#bank';
        } catch (e) {
            alert("Commit Failure: Network interrupt or protocol rejection.");
            els.commitBtn.disabled = false;
            els.commitBtn.textContent = "Execute registry write";
        }
    });

    els.copyText.addEventListener('click', () => {
        navigator.clipboard.writeText(SAMPLE_MCQ + "\n\n" + SAMPLE_MULTI + "\n\n" + SAMPLE_MATCHING); // Simplified for "Structured Text" button
        const original = els.copyText.innerHTML;
        els.copyText.innerHTML = "PROTOCOL COPIED!";
        setTimeout(() => els.copyText.innerHTML = original, 2000);
    });

    els.copyJson.addEventListener('click', () => {
        navigator.clipboard.writeText(JSON_TEMPLATE);
        const original = els.copyJson.innerHTML;
        els.copyJson.innerHTML = "SCHEMA COPIED!";
        setTimeout(() => els.copyJson.innerHTML = original, 2000);
    });

    // Quick Sample Copy Logic
    const copyToClipboard = (sample, btnId) => {
        navigator.clipboard.writeText(sample);
        const btn = document.getElementById(btnId);
        const originalText = btn.textContent;
        btn.textContent = "COPIED!";
        btn.classList.add('bg-blue-600', 'text-white');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('bg-blue-600', 'text-white');
        }, 2000);
    };

    els.sampleBtns.mcq.onclick = (e) => copyToClipboard(SAMPLE_MCQ, 'sample-mcq');
    els.sampleBtns.multi.onclick = (e) => copyToClipboard(SAMPLE_MULTI, 'sample-multi');
    els.sampleBtns.match.onclick = (e) => copyToClipboard(SAMPLE_MATCHING, 'sample-matching');
    els.sampleBtns.order.onclick = (e) => copyToClipboard(SAMPLE_ORDERING, 'sample-ordering');
    els.sampleBtns.tf.onclick = (e) => copyToClipboard(SAMPLE_TF, 'sample-tf');
    els.sampleBtns.ident.onclick = (e) => copyToClipboard(SAMPLE_IDENT, 'sample-ident');

    els.clearBtn.onclick = () => {
        if (confirm("Clear all input data?")) {
            els.input.value = "";
            els.previewSection.classList.add('hidden');
            els.stats.classList.add('hidden');
            els.commitBtn.disabled = true;
        }
    };
};
