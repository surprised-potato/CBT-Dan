import { bulkAddQuestions, getHierarchy } from '../../services/question-bank.service.js';
import { getUser } from '../../core/store.js';

const TEXT_TEMPLATE = \`Q: What is the magnitude of a unit vector?
A) 0
B) 1
C) 2
D) Infinity
Ans: B

Q: Gravity on Earth is approximately 9.8 m/s²?
* True
- False\`;

const JSON_TEMPLATE = \`[
  {
    "course": "PHYS101",
    "topic": "Mechanics",
    "type": "MCQ",
    "difficulty": "EASY",
    "points": 1,
    "text": "Which of the following describes inertia?",
    "correct_answer": "c1",
    "choices": [
      {"id": "c1", "text": "Resistance to change in motion"},
      {"id": "c2", "text": "Total force applied"}
    ]
  }
]\`;

export const BulkImportPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();
    if (!user) { window.location.hash = '#login'; return; }

    const hierarchy = await getHierarchy();

    app.innerHTML = \`
        <div class="min-h-screen pb-20">
            <header class="glass-panel sticky top-0 z-40 px-4 py-6 border-b border-white/20">
                <div class="max-w-5xl mx-auto flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <button onclick="location.hash='#bank'" class="p-3 glass-panel rounded-2xl text-gray-500 hover:text-blue-600 transition-colors shadow-sm">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <h1 class="text-2xl font-black text-gray-900 leading-tight tracking-tight">Bulk Registry Enrollment</h1>
                    </div>
                </div>
            </header>

            <main class="max-w-5xl mx-auto p-4 space-y-8 mt-8">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Config & Templates -->
                    <div class="space-y-6">
                        <div class="glass-panel p-8 rounded-[40px] border border-white space-y-6 shadow-xl shadow-blue-50/20">
                            <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Operational Config</h2>
                            
                            <div class="flex flex-col gap-2">
                                <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Default Domain</label>
                                <input id="def-course" list="course-list" type="text" placeholder="e.g. PHYS101" class="p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-black text-gray-900 uppercase">
                                <datalist id="course-list">\${hierarchy.courses.map(c => \`<option value="\${c}">\`).join('')}</datalist>
                            </div>

                            <div class="p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                                <h3 class="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4">Protocol Templates</h3>
                                <div class="grid grid-cols-1 gap-3">
                                    <button id="copy-text-tpl" class="w-full p-4 bg-white border border-blue-100 rounded-2xl text-left text-[10px] font-black text-gray-600 hover:bg-blue-600 hover:text-white transition-all flex justify-between items-center group">
                                        STRUCTURED TEXT
                                        <svg class="w-4 h-4 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                    </button>
                                    <button id="copy-json-tpl" class="w-full p-4 bg-white border border-blue-100 rounded-2xl text-left text-[10px] font-black text-gray-600 hover:bg-blue-600 hover:text-white transition-all flex justify-between items-center group">
                                        RESOURCE JSON
                                        <svg class="w-4 h-4 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Input Area -->
                    <div class="lg:col-span-2 space-y-6">
                        <div class="glass-panel p-8 rounded-[40px] border border-white shadow-xl shadow-blue-50/20 flex flex-col gap-6 h-full">
                            <div class="flex justify-between items-center">
                                <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Data stream</h2>
                                <div id="stats" class="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] hidden">0 Potential Records Detected</div>
                            </div>
                            
                            <textarea id="data-input" class="w-full flex-1 p-8 bg-gray-50 border border-gray-100 rounded-[32px] focus:bg-white focus:border-blue-500 outline-none transition-all font-mono text-sm shadow-inner min-h-[400px]" placeholder="PASTE SYSTEM DATA OR STRUCTURED TEXT HERE..."></textarea>
                            
                            <div class="flex gap-4">
                                <button id="parse-btn" class="flex-1 bg-white text-blue-600 border border-blue-100 p-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:shadow-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-3">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                    Review Data
                                </button>
                                <button id="commit-btn" disabled class="flex-1 bg-blue-premium text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-200 disabled:opacity-30 disabled:translate-y-0 hover:shadow-2xl hover:-translate-y-1 transition-all">Execute Bulk Commit</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Preview Grid -->
                <div id="preview-section" class="hidden space-y-6">
                    <div class="flex justify-between items-end px-4">
                        <h2 class="text-xl font-black text-gray-900 tracking-tight">Registry Preview</h2>
                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Manual override available after commit</span>
                    </div>
                    <div id="preview-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6"></div>
                </div>
            </main>
        </div>
    \`;

    const els = {
        input: document.getElementById('data-input'),
        course: document.getElementById('def-course'),
        parseBtn: document.getElementById('parse-btn'),
        commitBtn: document.getElementById('commit-btn'),
        previewSection: document.getElementById('preview-section'),
        previewGrid: document.getElementById('preview-grid'),
        stats: document.getElementById('stats'),
        copyText: document.getElementById('copy-text-tpl'),
        copyJson: document.getElementById('copy-json-tpl')
    };

    let parsedQuestions = [];

    const parseData = (raw) => {
        const text = raw.trim();
        if (!text) return [];

        // Attempt JSON first
        if (text.startsWith('[') || text.startsWith('{')) {
            try {
                const data = JSON.parse(text);
                return Array.isArray(data) ? data : [data];
            } catch (e) {
                // If JSON fails, it might be structured text
                console.warn("JSON Parse failed, falling back to Structured Text logic.");
            }
        }

        // Structured Text Parser
        const questions = [];
        const blocks = text.split(/Q:/i).filter(b => b.trim());

        blocks.forEach(block => {
            const lines = block.split('\\n').map(l => l.trim()).filter(l => l);
            const question = {
                course: els.course.value || 'UNSET',
                topic: 'Bulk Import',
                type: 'MCQ',
                difficulty: 'EASY',
                points: 1,
                text: lines[0],
                choices: [],
                correct_answer: null
            };

            // Parse choices and answer
            lines.slice(1).forEach(line => {
                // MCQ Choice: A) text or B. text
                const mcqMatch = line.match(/^([A-Da-d])[\\\\)\\\\.]\\\\s*(.*)/);
                if (mcqMatch) {
                    question.choices.push({ id: \`c_\${mcqMatch[1].toUpperCase()}\`, text: mcqMatch[2] });
                }

                // Correct Ans: Ans: B or Answer: C
                const ansMatch = line.match(/^(Ans|Answer):\\\\s*([A-Da-d])/i);
                if (ansMatch) {
                    question.correct_answer = \`c_\${ansMatch[2].toUpperCase()}\`;
                }

                // True/False
                if (line.match(/^[\\\\*\\\\-]\\\\s*(True|False)/i)) {
                    question.type = 'TRUE_FALSE';
                    if (line.startsWith('*')) {
                        question.correct_answer = line.toLowerCase().includes('true') ? 'true' : 'false';
                    }
                }
            });

            if (question.text) questions.push(question);
        });

        return questions;
    };

    const renderPreview = () => {
        els.previewGrid.innerHTML = parsedQuestions.map((q, i) => \`
            <div class="p-8 bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-blue-50/20 flex flex-col justify-between gap-6 relative group animate-in zoom-in-95 duration-300">
                <div class="absolute top-4 right-8 font-black text-gray-100 text-6xl group-hover:text-blue-50 transition-colors">#\${i + 1}</div>
                
                <div class="relative z-10">
                    <div class="flex gap-2 mb-6">
                        <span class="text-[8px] font-black px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-widest">\${q.type}</span>
                        <span class="text-[8px] font-black px-3 py-1 rounded-full bg-gray-50 text-gray-400 border border-gray-100 uppercase tracking-widest">\${q.course}</span>
                    </div>
                    <div class="text-gray-900 font-black text-sm leading-relaxed mb-6">\${q.text}</div>
                    
                    \${q.type === 'MCQ' ? \`
                        <div class="space-y-2">
                            \${q.choices.map(c => \`
                                <div class="p-3 rounded-xl text-[10px] font-black uppercase tracking-tight \${q.correct_answer === c.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-50 text-gray-500'}">
                                    \${c.id.replace('c_', '')}) \${c.text}
                                </div>
                            \`).join('')}
                        </div>
                    \` : ''}

                    \${q.type === 'TRUE_FALSE' ? \`
                        <div class="p-4 rounded-2xl border-2 border-dashed border-gray-100 text-[10px] font-black text-center text-gray-400 uppercase tracking-widest flex items-center justify-center gap-4">
                            Protocol Outcome: 
                            <span class="\${q.correct_answer === 'true' ? 'text-green-500' : 'text-red-500'} bg-white px-4 py-2 rounded-xl border shadow-sm">\${q.correct_answer.toUpperCase()}</span>
                        </div>
                    \` : ''}
                </div>
            </div>
        \`).join('');
    };

    els.parseBtn.addEventListener('click', () => {
        parsedQuestions = parseData(els.input.value);
        if (parsedQuestions.length > 0) {
            els.previewSection.classList.remove('hidden');
            els.stats.textContent = \`\${parsedQuestions.length} Potential Records Detected\`;
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
            els.commitBtn.textContent = "Committing Records...";
            await bulkAddQuestions(parsedQuestions);
            alert(\`Successfully enrolled \${parsedQuestions.length} items into registry.\`);
            location.hash = '#bank';
        } catch (e) {
            alert("Commit Failure: Hardware/Network interrupt.");
            els.commitBtn.disabled = false;
            els.commitBtn.textContent = "Execute Bulk Commit";
        }
    });

    els.copyText.addEventListener('click', () => {
        navigator.clipboard.writeText(TEXT_TEMPLATE);
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
};
