import { renderButton } from '../../shared/button.js';
import { renderInput } from '../../shared/input.js';
import { generateAssessment } from '../../services/assessment.service.js';
import { getHierarchy } from '../../services/question-bank.service.js';
import { getClassesByTeacher } from '../../services/class.service.js';
import { getUser } from '../../core/store.js';

export const WizardPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();

    if (!user) {
        window.location.hash = '#login';
        return;
    }

    const [hierarchy, classes] = await Promise.all([
        getHierarchy(),
        getClassesByTeacher(user.user.uid)
    ]);

    app.innerHTML = `
        <div class="px-4 py-12 max-w-3xl mx-auto pb-32">
            <header class="mb-12">
                <button onclick="location.hash='#assessment-bank'" class="p-3 glass-panel rounded-2xl text-purple-600 hover:text-purple-800 transition-all shadow-sm mb-6">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </button>
                <h1 class="text-4xl font-black text-gray-900 tracking-tight uppercase">Module Architect</h1>
                <p class="text-xs font-black text-gray-600 uppercase tracking-[0.3em] mt-2">Configure multi-sector assessment parameters</p>
            </header>

            <div class="space-y-8">
                <!-- Main Config -->
                <div class="bg-white p-10 rounded-[50px] shadow-2xl shadow-purple-50/50 border border-white space-y-6 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
                    
                    <div class="relative z-10">
                        <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] mb-4 block">Operational Identification</label>
                        ${renderInput({ id: 'test-title', placeholder: 'e.g. ADVANCED CALCULUS PHASE II', required: true, classes: 'text-lg font-black uppercase' })}
                    </div>
                    
                    <div class="flex flex-col gap-2 relative z-10">
                        <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Deployment Sector (Optional)</label>
                        <select id="assigned-class" class="p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-purple-500 outline-none transition-all font-bold text-gray-600 appearance-none shadow-inner">
                            <option value="">Public Access Protocol</option>
                            ${classes.map(c => `<option value="${c.id}">${c.name} [${c.section}] - SECURE CODE: ${c.code}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <!-- Session Parameters -->
                <div class="bg-white p-10 rounded-[50px] shadow-2xl shadow-purple-50/50 border border-white space-y-6 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
                    
                    <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] block relative z-10">Session Parameters</label>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                        <label class="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 cursor-pointer hover:bg-white transition-all group">
                            <div class="flex flex-col gap-1">
                                <span class="text-[10px] font-black text-gray-900 uppercase tracking-widest">Discrete Delivery</span>
                                <p class="text-[9px] font-bold text-gray-400 uppercase">One question at a time protocol</p>
                            </div>
                            <div class="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-gray-200 rounded-full shadow-inner">
                                <input type="checkbox" id="one-at-a-time" class="absolute w-6 h-6 opacity-0 z-10 cursor-pointer peer">
                                <span class="absolute left-0 w-6 h-6 bg-white rounded-full shadow border border-gray-100 transition-transform duration-200 peer-checked:translate-x-6 peer-checked:bg-purple-600"></span>
                            </div>
                        </label>

                        <label class="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 cursor-pointer hover:bg-white transition-all group">
                            <div class="flex flex-col gap-1">
                                <span class="text-[10px] font-black text-gray-900 uppercase tracking-widest">Random Encryption</span>
                                <p class="text-[9px] font-bold text-gray-400 uppercase">Shuffle question order protocol</p>
                            </div>
                            <div class="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-gray-200 rounded-full shadow-inner">
                                <input type="checkbox" id="random-order" class="absolute w-6 h-6 opacity-0 z-10 cursor-pointer peer">
                                <span class="absolute left-0 w-6 h-6 bg-white rounded-full shadow border border-gray-100 transition-transform duration-200 peer-checked:translate-x-6 peer-checked:bg-purple-600"></span>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Sections Container -->
                <div id="sections-container" class="space-y-6"></div>

                <!-- Add Section Button -->
                <button id="add-section-btn" class="w-full py-8 glass-panel border-2 border-dashed border-gray-200 rounded-[40px] text-gray-500 font-extrabold uppercase tracking-widest hover:border-purple-300 hover:text-purple-500 hover:bg-white transition-all active:scale-[0.98] shadow-sm">
                    + Initialise New Sector
                </button>

                <div id="w-error" class="text-red-500 text-[10px] font-black uppercase tracking-widest hidden text-center bg-red-50 py-4 rounded-2xl border border-red-100"></div>

                <!-- Floating Submit Bar -->
                <div class="fixed bottom-0 left-0 right-0 p-6 bg-white/60 backdrop-blur-xl border-t border-white/20 flex justify-center z-50">
                    <div class="w-full max-w-3xl">
                        <button id="final-submit-btn" class="w-full bg-purple-premium text-white p-6 rounded-3xl font-black uppercase text-sm tracking-[0.3em] shadow-2xl shadow-purple-200/50 hover:shadow-purple-300 hover:-translate-y-1 active:scale-[0.98] transition-all">Execute Generation Protocol</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    let sections = [];

    const createSection = () => ({
        id: 'sec_' + Math.random().toString(36).substr(2, 5),
        title: '',
        course: '',
        topics: [],
        type: 'ALL',
        distribution: { EASY: 5, MODERATE: 0, DIFFICULT: 0 },
        pointsPerQuestion: 1
    });

    const renderSections = () => {
        const container = document.getElementById('sections-container');
        container.innerHTML = sections.map((s, i) => `
            <div class="bg-white p-10 rounded-[50px] border border-white shadow-2xl shadow-purple-50/50 relative group animate-in fade-in slide-in-from-bottom-8 duration-500 overflow-hidden">
                <div class="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-purple-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div class="absolute top-8 right-8 z-20">
                    <button data-idx="${i}" class="remove-sec w-10 h-10 glass-panel rounded-xl text-gray-300 hover:text-red-500 hover:border-red-500 font-black transition-all">×</button>
                </div>
                
                <div class="relative z-10">
                    <div class="flex items-center gap-4 mb-8">
                        <div class="w-10 h-1bg-purple-premium rounded-full"></div>
                        <p class="text-[10px] font-black text-purple-600 uppercase tracking-[0.4em]">Sector Archive ${i + 1}</p>
                    </div>
                    
                    <div class="space-y-8">
                        <div class="flex flex-col gap-2">
                            <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Sector Designation</label>
                            <input type="text" value="${s.title}" data-field="title" data-idx="${i}" placeholder="e.g. PART I: QUANTITATIVE ANALYSIS" class="sec-input p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-purple-500 outline-none transition-all font-black text-gray-700 uppercase placeholder:opacity-30">
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div class="flex flex-col gap-2">
                                <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Knowledge Domain</label>
                                <select data-field="course" data-idx="${i}" class="sec-input p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-purple-500 outline-none transition-all font-bold text-gray-600 appearance-none shadow-inner">
                                    <option value="">UNCATEGORISED</option>
                                    ${hierarchy.courses.map(c => `<option value="${c}" ${s.course === c ? 'selected' : ''}>${c.toUpperCase()}</option>`).join('')}
                                </select>
                            </div>
                            <div class="flex flex-col gap-2">
                                <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Item Schema</label>
                                <select data-field="type" data-idx="${i}" class="sec-input p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-purple-500 outline-none transition-all font-bold text-gray-600 appearance-none shadow-inner">
                                    <option value="ALL" ${s.type === 'ALL' ? 'selected' : ''}>MIXED TELEMETRY</option>
                                    <option value="MCQ" ${s.type === 'MCQ' ? 'selected' : ''}>MULTIPLE CHOICE</option>
                                    <option value="IDENTIFICATION" ${s.type === 'IDENTIFICATION' ? 'selected' : ''}>IDENTIFICATION</option>
                                    <option value="TRUE_FALSE" ${s.type === 'TRUE_FALSE' ? 'selected' : ''}>T/F BINARY</option>
                                </select>
                            </div>
                        </div>

                        <div class="flex flex-col gap-4">
                            <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Vector Selection (Multi-Track)</label>
                            <div class="flex flex-wrap gap-3 p-6 bg-gray-50/50 rounded-3xl border border-gray-100/50 shadow-inner min-h-[60px]">
                                ${(hierarchy.topics[s.course] || []).map(t => {
            const isChecked = s.topics.includes(t);
            return `
                                            <label class="cursor-pointer">
                                                <input type="checkbox" class="topic-check hidden" data-topic="${t}" data-idx="${i}" ${isChecked ? 'checked' : ''}>
                                                <div class="topic-chip px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isChecked ? 'bg-purple-premium text-white border-purple-400 shadow-lg shadow-purple-100' : 'bg-white text-gray-500 border-gray-100 hover:border-purple-200'}">
                                                    ${t}
                                                </div>
                                            </label>
                                        `;
        }).join('')}
                                ${!s.course ? '<p class="text-[10px] font-black text-gray-300 uppercase tracking-widest italic flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> Initialise Knowledge Domain First</p>' : ''}
                            </div>
                        </div>

                        <div class="p-8 bg-purple-50/30 rounded-[36px] border border-purple-100/30 shadow-inner">
                            <div class="flex justify-between items-center mb-6">
                                <label class="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em]">Complexity Distribution</label>
                                <div class="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-purple-100 shadow-sm">
                                    <span class="text-[10px] font-black text-gray-600 uppercase">Val/Q:</span>
                                    <input type="number" value="${s.pointsPerQuestion}" min="1" data-field="pointsPerQuestion" data-idx="${i}" class="sec-input w-8 text-center text-xs font-black text-purple-600 outline-none">
                                </div>
                            </div>
                            <div class="grid grid-cols-3 gap-6">
                                <div class="flex flex-col gap-3">
                                    <span class="text-[9px] font-black text-green-500 uppercase tracking-widest text-center">Standard</span>
                                    <input type="number" value="${s.distribution.EASY}" min="0" data-diff="EASY" data-idx="${i}" class="dist-input p-4 text-center font-black text-gray-700 bg-white border border-gray-100 rounded-2xl focus:border-green-400 outline-none shadow-sm text-lg">
                                </div>
                                <div class="flex flex-col gap-3">
                                    <span class="text-[9px] font-black text-amber-500 uppercase tracking-widest text-center">Refined</span>
                                    <input type="number" value="${s.distribution.MODERATE}" min="0" data-diff="MODERATE" data-idx="${i}" class="dist-input p-4 text-center font-black text-gray-700 bg-white border border-gray-100 rounded-2xl focus:border-amber-400 outline-none shadow-sm text-lg">
                                </div>
                                <div class="flex flex-col gap-3">
                                    <span class="text-[9px] font-black text-red-500 uppercase tracking-widest text-center">Extreme</span>
                                    <input type="number" value="${s.distribution.DIFFICULT}" min="0" data-diff="DIFFICULT" data-idx="${i}" class="dist-input p-4 text-center font-black text-gray-700 bg-white border border-gray-100 rounded-2xl focus:border-red-400 outline-none shadow-sm text-lg">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Re-attach listeners
        container.querySelectorAll('.sec-input').forEach(el => {
            el.onchange = (e) => {
                const { field, idx } = e.target.dataset;
                let val = e.target.value;
                if (['pointsPerQuestion'].includes(field)) val = parseInt(val) || 0;
                sections[idx][field] = val;

                if (field === 'course') {
                    sections[idx].topics = [];
                    renderSections();
                }
            };
        });

        container.querySelectorAll('.topic-check').forEach(el => {
            el.onchange = (e) => {
                const { topic, idx } = e.target.dataset;
                const section = sections[idx];
                if (e.target.checked) {
                    if (!section.topics.includes(topic)) section.topics.push(topic);
                } else {
                    section.topics = section.topics.filter(t => t !== topic);
                }

                const chip = e.target.nextElementSibling;
                if (e.target.checked) {
                    chip.classList.remove('bg-white', 'text-gray-400', 'border-gray-100');
                    chip.classList.add('bg-purple-premium', 'text-white', 'border-purple-400', 'shadow-lg', 'shadow-purple-100');
                } else {
                    chip.classList.add('bg-white', 'text-gray-400', 'border-gray-100');
                    chip.classList.remove('bg-purple-premium', 'text-white', 'border-purple-400', 'shadow-lg', 'shadow-purple-100');
                }
            };
        });

        container.querySelectorAll('.dist-input').forEach(el => {
            el.onchange = (e) => {
                const { diff, idx } = e.target.dataset;
                sections[idx].distribution[diff] = parseInt(e.target.value) || 0;
            };
        });

        container.querySelectorAll('.remove-sec').forEach(btn => {
            btn.onclick = (e) => {
                const idx = parseInt(e.target.dataset.idx);
                sections.splice(idx, 1);
                renderSections();
            };
        });
    };

    document.getElementById('add-section-btn').onclick = () => {
        sections.push(createSection());
        renderSections();
    };

    document.getElementById('final-submit-btn').onclick = async () => {
        const titleInput = document.getElementById('test-title');
        const err = document.getElementById('w-error');
        const btn = document.getElementById('final-submit-btn');

        if (!titleInput.value.trim()) return alert("ASSESSMENT IDENTIFICATION REQUIRED.");
        if (sections.length === 0) return alert("MINIMUM ONE SECTOR REQUIRED.");

        btn.disabled = true;
        btn.textContent = 'EXECUTING GENERATION...';
        err.classList.add('hidden');

        const assignedClassId = document.getElementById('assigned-class').value;

        try {
            const config = {
                title: titleInput.value.trim(),
                sections: sections,
                authorId: user.user.uid,
                assignedClassId: assignedClassId || null,
                settings: {
                    oneAtATime: document.getElementById('one-at-a-time').checked,
                    randomizeOrder: document.getElementById('random-order').checked
                }
            };

            await generateAssessment(config);
            window.location.hash = '#assessment-bank';

        } catch (error) {
            console.error("Wizard submit error:", error);
            err.textContent = error.message.toUpperCase();
            err.classList.remove('hidden');
            btn.disabled = false;
            btn.textContent = 'EXECUTE GENERATION PROTOCOL';
        }
    };

    // Initialize with 1 section
    sections.push(createSection());
    renderSections();
};
