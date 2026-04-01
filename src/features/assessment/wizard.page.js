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
        <div class="relative min-h-screen bg-[#020617] pb-32">
            <!-- Dynamic Mesh Background -->
            <div class="bg-premium-gradient-fixed"></div>
            <div class="mesh-blob top-[-10%] left-[-10%] bg-purple-600/10 scale-150"></div>
            <div class="mesh-blob bottom-[-20%] right-[-10%] bg-indigo-500/10"></div>

            <div class="relative z-10 flex flex-col items-center py-4 md:py-8 px-4">
                <div class="w-full max-w-3xl space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    
                    <!-- Header -->
                    <header class="glass-panel px-6 py-5 md:px-8 md:py-6 rounded-[35px] border border-white/10 flex flex-wrap justify-between items-center gap-4 shadow-xl">
                        <div class="flex items-center gap-4 min-w-0">
                            <button onclick="location.hash='#assessment-bank'" class="p-3 bg-white/5 border border-white/5 rounded-2xl text-purple-400 hover:text-white hover:bg-white/10 transition-all active:scale-90 shadow-lg shrink-0">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            </button>
                            <div class="min-w-0">
                                <h1 class="text-xl md:text-2xl font-black text-white leading-tight tracking-tight uppercase">Assessment Builder</h1>
                                <p class="text-[10px] text-purple-400 font-black uppercase tracking-[0.3em] mt-0.5 truncate opacity-80">Configure & Generate</p>
                            </div>
                        </div>
                    </header>

                    <main class="space-y-8 relative z-10 pb-20">
                    <!-- Main Config -->
                    <div class="glass-panel p-8 md:p-10 rounded-[50px] border border-white/10 space-y-8 relative overflow-hidden shadow-2xl">
                        <div class="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        
                        <div class="relative z-10">
                            <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-4 block ml-2">Assessment Title</label>
                            <input id="test-title" type="text" placeholder="e.g. MIDTERM EXAM — CALCULUS II" class="w-full p-6 bg-white/5 border border-white/10 rounded-[28px] text-white font-black uppercase text-lg outline-none focus:border-purple-500/50 transition-colors placeholder:text-white/10">
                        </div>
                        
                        <div class="flex flex-col gap-3 relative z-10">
                            <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-2">Assign to Classes (Optional)</label>
                            <div class="flex flex-wrap gap-3 p-6 bg-black/20 border border-white/5 rounded-[32px] shadow-inner min-h-[80px]">
                                ${classes.length > 0 ? classes.map(c => `
                                    <label class="cursor-pointer">
                                        <input type="checkbox" class="class-check hidden" data-classid="${c.id}">
                                        <div class="class-chip px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all bg-white/5 text-white/30 border-white/5 hover:border-purple-500/50">
                                            ${c.name} [${c.section}]
                                        </div>
                                    </label>
                                `).join('') : '<p class="text-[10px] font-black text-white/20 uppercase tracking-widest italic text-center w-full">No Classes Available (Public Access Only)</p>'}
                            </div>
                            <p class="text-[9px] font-black text-purple-400/40 uppercase tracking-widest ml-4">Leave empty for universal department-wide accessibility</p>
                        </div>
                    </div>

                    <!-- Session Parameters -->
                    <div class="glass-panel p-8 md:p-10 rounded-[50px] border border-white/10 space-y-8 relative overflow-hidden shadow-2xl">
                        <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        
                        <div class="relative z-10 flex flex-col gap-6">
                            <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] block ml-2">Exam Settings & Constraints</label>
                            
                            <div class="p-8 bg-purple-500/5 rounded-[40px] border border-purple-500/20 space-y-4">
                                <label class="text-[9px] font-black text-purple-400 uppercase tracking-widest ml-2">Master Proctor Unlock Password</label>
                                <input type="text" id="unlock-password" placeholder="e.g. EXAM-2026-X" class="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black text-white focus:border-purple-500 outline-none text-sm placeholder:text-white/10">
                                <p class="text-[8px] font-bold text-white/20 uppercase ml-2 leading-relaxed">Required for proctors to manually bypass anti-cheat lockouts or location restrictions for students.</p>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <label class="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all group">
                                    <div class="flex flex-col gap-1">
                                        <span class="text-[10px] font-black text-white uppercase tracking-widest">One at a Time</span>
                                        <p class="text-[9px] font-bold text-white/30 uppercase">Show one question per screen</p>
                                    </div>
                                    <div class="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-white/10 rounded-full shadow-inner">
                                        <input type="checkbox" id="one-at-a-time" class="absolute w-6 h-6 opacity-0 z-10 cursor-pointer peer">
                                        <span class="absolute left-0 w-6 h-6 bg-white/20 rounded-full shadow border border-white/10 transition-transform duration-200 peer-checked:translate-x-6 peer-checked:bg-purple-600"></span>
                                    </div>
                                </label>

                                <label class="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all group">
                                    <div class="flex flex-col gap-1">
                                        <span class="text-[10px] font-black text-white uppercase tracking-widest">Shuffle Questions</span>
                                        <p class="text-[9px] font-bold text-white/30 uppercase">Randomize order for each student</p>
                                    </div>
                                    <div class="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-white/10 rounded-full shadow-inner">
                                        <input type="checkbox" id="random-order" class="absolute w-6 h-6 opacity-0 z-10 cursor-pointer peer">
                                        <span class="absolute left-0 w-6 h-6 bg-white/20 rounded-full shadow border border-white/10 transition-transform duration-200 peer-checked:translate-x-6 peer-checked:bg-purple-600"></span>
                                    </div>
                                </label>

                                <label class="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all group">
                                    <div class="flex flex-col gap-1">
                                        <span class="text-[10px] font-black text-white uppercase tracking-widest">Shuffle Choices</span>
                                        <p class="text-[9px] font-bold text-white/30 uppercase">Randomize MCQ answer order</p>
                                    </div>
                                    <div class="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-white/10 rounded-full shadow-inner">
                                        <input type="checkbox" id="shuffle-choices" class="absolute w-6 h-6 opacity-0 z-10 cursor-pointer peer">
                                        <span class="absolute left-0 w-6 h-6 bg-white/20 rounded-full shadow border border-white/10 transition-transform duration-200 peer-checked:translate-x-6 peer-checked:bg-purple-600"></span>
                                    </div>
                                </label>

                                <div class="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all group">
                                    <div class="flex flex-col gap-1">
                                        <span class="text-[10px] font-black text-white uppercase tracking-widest">Time Limit</span>
                                        <p class="text-[9px] font-bold text-white/30 uppercase">Set to 0 for unlimited time</p>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <input type="number" id="time-limit" placeholder="0" min="0" class="w-20 p-3 text-center bg-white/10 border border-white/10 rounded-2xl font-black text-purple-400 focus:border-purple-500/50 outline-none text-sm">
                                        <span class="text-[9px] font-black text-white/40 uppercase">MIN</span>
                                    </div>
                                </div>

                                <div class="flex flex-col gap-4 p-6 bg-white/5 rounded-3xl border border-white/5 transition-all group md:col-span-2">
                                    <label class="flex items-center justify-between cursor-pointer">
                                        <div class="flex flex-col gap-1">
                                            <span class="text-[10px] font-black text-red-400 uppercase tracking-widest">Anti-Cheat Lockout</span>
                                            <p class="text-[9px] font-bold text-white/30 uppercase">Require fullscreen & prevent tab switching</p>
                                        </div>
                                        <div class="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-white/10 rounded-full shadow-inner">
                                            <input type="checkbox" id="require-fullscreen" class="absolute w-6 h-6 opacity-0 z-10 cursor-pointer peer">
                                            <span class="absolute left-0 w-6 h-6 bg-white/20 rounded-full shadow border border-white/10 transition-transform duration-200 peer-checked:translate-x-6 peer-checked:bg-red-500"></span>
                                        </div>
                                    </label>
                                </div>

                                <div class="flex flex-col gap-4 p-6 bg-white/5 rounded-3xl border border-white/5 transition-all group md:col-span-2">
                                    <label class="flex items-center justify-between cursor-pointer">
                                        <div class="flex flex-col gap-1">
                                            <span class="text-[10px] font-black text-blue-400 uppercase tracking-widest">Location Restriction</span>
                                            <p class="text-[9px] font-bold text-white/30 uppercase">Only allow access within a defined operational area</p>
                                        </div>
                                        <div class="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-white/10 rounded-full shadow-inner">
                                            <input type="checkbox" id="require-geofence" class="absolute w-6 h-6 opacity-0 z-10 cursor-pointer peer">
                                            <span class="absolute left-0 w-6 h-6 bg-white/20 rounded-full shadow border border-white/10 transition-transform duration-200 peer-checked:translate-x-6 peer-checked:bg-blue-500"></span>
                                        </div>
                                    </label>

                                    <div id="geofence-settings" class="hidden flex-col gap-6 mt-2 pt-6 border-t border-white/5">
                                        <div class="flex flex-wrap items-center justify-between gap-4">
                                            <button type="button" id="capture-location-btn" class="bg-blue-500/10 text-blue-400 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 border border-blue-500/20 transition-all flex items-center gap-2">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                Pin Current Location
                                            </button>
                                            <div class="flex items-center gap-3">
                                                <label class="text-[9px] font-black text-white/40 uppercase tracking-widest">Radius</label>
                                                <input type="number" id="geofence-radius" value="100" min="10" step="10" class="w-24 p-3 text-center bg-white/10 border border-white/10 rounded-2xl font-black text-blue-400 focus:border-blue-500 outline-none text-sm">
                                                <span class="text-[9px] font-black text-white/40 uppercase tracking-widest">M</span>
                                            </div>
                                        </div>
                                        
                                        <div id="geofence-map" class="w-full h-[400px] rounded-[32px] border border-white/5 overflow-hidden relative z-0 shadow-inner"></div>
                                        <div class="text-[9px] font-black text-blue-400/40 uppercase tracking-[0.3em] text-center" id="coords-display">LAT: -- | LNG: --</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Sections Container -->
                    <div id="sections-container" class="space-y-8"></div>

                    <!-- Add Section Button -->
                    <button id="add-section-btn" class="w-full py-10 bg-white/5 border-2 border-dashed border-white/10 rounded-[50px] text-white/20 font-black uppercase tracking-[0.3em] hover:border-purple-500/50 hover:text-purple-400 hover:bg-white/10 transition-all active:scale-[0.98] shadow-lg text-[10px]">
                        + Append Knowledge Section
                    </button>

                    <div id="w-error" class="text-red-400 text-[10px] font-black uppercase tracking-widest hidden text-center bg-red-500/5 py-6 rounded-3xl border border-red-500/20 shadow-lg"></div>

                    </main>

                    <!-- Footer Submit Bar -->
                    <div class="fixed bottom-0 left-0 right-0 p-6 md:p-8 bg-[#020617]/80 backdrop-blur-xl border-t border-white/5 flex justify-center z-50">
                        <div class="w-full max-w-3xl">
                            <button id="final-submit-btn" class="w-full bg-purple-600 text-white p-6 rounded-[35px] font-black uppercase text-sm tracking-[0.4em] shadow-[0_10px_30px_rgba(147,51,234,0.3)] hover:shadow-[0_20px_40px_rgba(147,51,234,0.4)] hover:-translate-y-1 active:scale-[0.98] transition-all border border-white/20">Generate Assessment Protocol</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    let sections = [];

    const createSection = () => ({
        id: 'sec_' + Math.random().toString(36).substr(2, 5),
        title: 'Section ' + (sections.length + 1),
        course: '',
        topics: [],
        type: 'ALL',
        distribution: { ANY: 5, EASY: 0, MODERATE: 0, DIFFICULT: 0 },
        pointsPerQuestion: 1
    });

    // Phase 6: Compute available question count for a section + difficulty
    const getAvailableCount = (section, difficulty) => {
        const topics = section.topics.length > 0 ? section.topics : (hierarchy.topics[section.course] || []);
        if (!section.course || topics.length === 0) return '?';
        let total = 0;
        topics.forEach(t => {
            const key = `${section.course}|${t}|${section.type}|${difficulty}`;
            total += hierarchy.counts[key] || 0;
        });
        return total;
    };

    const renderSections = () => {
        const container = document.getElementById('sections-container');
        container.innerHTML = sections.map((s, i) => `
            <div class="glass-panel p-8 md:p-10 rounded-[50px] border border-white/10 relative group animate-in fade-in slide-in-from-bottom-8 duration-500 overflow-hidden shadow-2xl">
                <div class="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div class="absolute top-8 right-8 z-20 flex gap-3">
                    <button data-idx="${i}" class="dup-sec w-10 h-10 bg-white/5 border border-white/10 rounded-xl text-white/20 hover:text-purple-400 hover:border-purple-500/50 font-black transition-all text-lg shadow-lg" title="Duplicate Section">⊞</button>
                    <button data-idx="${i}" class="remove-sec w-10 h-10 bg-white/5 border border-white/10 rounded-xl text-white/20 hover:text-red-400 hover:border-red-500/50 font-black transition-all text-xl shadow-lg">×</button>
                </div>
                
                <div class="relative z-10">
                    <div class="flex items-center gap-4 mb-10">
                        <div class="w-10 h-1 bg-purple-600 rounded-full shadow-[0_0_15px_rgba(147,51,234,0.5)]"></div>
                        <p class="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em]">Section ${i + 1} — Configuration</p>
                    </div>
                    
                    <div class="space-y-10">
                        <div class="flex flex-col gap-3">
                            <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-2">Section Objective / Title</label>
                            <input type="text" value="${s.title}" data-field="title" data-idx="${i}" placeholder="e.g. PART I: QUANTITATIVE ANALYSIS" class="sec-input p-5 bg-white/5 border border-white/10 rounded-2xl focus:border-purple-500/50 outline-none transition-all font-black text-white uppercase placeholder:text-white/10">
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="flex flex-col gap-3">
                                <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-2">Knowledge Domain</label>
                                <select data-field="course" data-idx="${i}" class="sec-input p-5 bg-white/5 border border-white/10 rounded-2xl focus:border-purple-500/50 outline-none transition-all font-bold text-white appearance-none shadow-inner cursor-pointer">
                                    <option value="" class="bg-[#0f172a]">UNCATEGORISED</option>
                                    ${hierarchy.courses.map(c => `<option value="${c}" ${s.course === c ? 'selected' : ''} class="bg-[#0f172a]">${c.toUpperCase()}</option>`).join('')}
                                </select>
                            </div>
                            <div class="flex flex-col gap-3">
                                <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-2">Telemetry Schema</label>
                                <select data-field="type" data-idx="${i}" class="sec-input p-5 bg-white/5 border border-white/10 rounded-2xl focus:border-purple-500/50 outline-none transition-all font-bold text-white appearance-none shadow-inner cursor-pointer">
                                    <option value="ALL" ${s.type === 'ALL' ? 'selected' : ''} class="bg-[#0f172a]">MIXED TELEMETRY</option>
                                    <option value="MCQ" ${s.type === 'MCQ' ? 'selected' : ''} class="bg-[#0f172a]">SINGLE CHOICE MCQ</option>
                                    <option value="MULTI_ANSWER" ${s.type === 'MULTI_ANSWER' ? 'selected' : ''} class="bg-[#0f172a]">MULTIPLE ANSWER</option>
                                    <option value="IDENTIFICATION" ${s.type === 'IDENTIFICATION' ? 'selected' : ''} class="bg-[#0f172a]">IDENTIFICATION (TYPED)</option>
                                    <option value="MATCHING" ${s.type === 'MATCHING' ? 'selected' : ''} class="bg-[#0f172a]">MATCHING PAIRS</option>
                                    <option value="ORDERING" ${s.type === 'ORDERING' ? 'selected' : ''} class="bg-[#0f172a]">SEQUENTIAL ORDER</option>
                                    <option value="TRUE_FALSE" ${s.type === 'TRUE_FALSE' ? 'selected' : ''} class="bg-[#0f172a]">T/F BINARY</option>
                                </select>
                            </div>
                        </div>

                        ${(s.type === 'MCQ' || s.type === 'IDENTIFICATION') ? `
                            <div class="p-8 bg-blue-500/5 rounded-[36px] border border-blue-500/20 animate-in slide-in-from-top-4">
                                <label class="flex items-center justify-between cursor-pointer mb-6">
                                    <div class="flex flex-col gap-1">
                                        <span class="text-[10px] font-black text-blue-400 uppercase tracking-widest">Answer Bank Mode</span>
                                        <p class="text-[9px] font-bold text-blue-400/40 uppercase">Aggregates all identification variants into a shared pool</p>
                                    </div>
                                    <div class="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-white/10 rounded-full shadow-inner">
                                        <input type="checkbox" class="bank-toggle absolute w-6 h-6 opacity-0 z-10 cursor-pointer peer" data-idx="${i}" ${s.answerBankMode ? 'checked' : ''}>
                                        <span class="absolute left-0 w-6 h-6 bg-white/20 rounded-full shadow border border-white/10 transition-transform duration-200 peer-checked:translate-x-6 peer-checked:bg-blue-500"></span>
                                    </div>
                                </label>
                                
                                ${s.answerBankMode ? `
                                    <div class="space-y-6 pt-6 border-t border-white/5">
                                         <label class="text-[10px] font-black text-blue-400/60 uppercase tracking-widest px-2">Additional Distractors (Wrong Answers for Bank)</label>
                                         <div class="flex gap-3">
                                            <input type="text" class="distractor-input flex-1 p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-white/10" placeholder="APPEND TRAP DATA..." data-idx="${i}">
                                            <button type="button" class="add-dist-btn bg-blue-600 text-white px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-lg hover:bg-blue-500 border border-white/10">ADD</button>
                                         </div>
                                         <div class="flex flex-wrap gap-2 pt-2">
                                            ${(s.distractors || []).map((d, dIdx) => `
                                                <span class="px-5 py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-3 animate-in zoom-in">
                                                    ${d}
                                                    <button type="button" class="rm-dist text-white/20 hover:text-red-500 font-black text-lg transition-colors" data-sidx="${i}" data-didx="${dIdx}">×</button>
                                                </span>
                                            `).join('')}
                                         </div>
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
 
                        <div class="flex flex-col gap-4">
                            <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-2">Vector Selection (Topics)</label>
                            <div class="flex flex-wrap gap-3 p-8 bg-black/20 border border-white/5 rounded-[40px] shadow-inner min-h-[100px]">
                                ${(hierarchy.topics[s.course] || []).map(t => {
            const isChecked = s.topics.includes(t);
            return `
                                            <label class="cursor-pointer">
                                                <input type="checkbox" class="topic-check hidden" data-topic="${t}" data-idx="${i}" ${isChecked ? 'checked' : ''}>
                                                <div class="topic-chip px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${isChecked ? 'bg-purple-600 text-white border-white/20 shadow-[0_5px_15px_rgba(147,51,234,0.3)]' : 'bg-white/5 text-white/20 border-white/5 hover:border-purple-500/30'}">
                                                    ${t}
                                                </div>
                                            </label>
                                        `;
        }).join('')}
                                ${!s.course ? '<p class="text-[10px] font-black text-white/20 uppercase tracking-widest italic flex items-center gap-3 w-full justify-center py-4"><svg class="w-5 h-5 text-amber-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> Please define a Knowledge Domain first</p>' : ''}
                            </div>
                        </div>

                        <div class="p-8 md:p-10 bg-purple-500/5 rounded-[45px] border border-purple-500/10 shadow-inner">
                            <div class="flex justify-between items-center mb-8 px-2">
                                <label class="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">Difficulty Distribution</label>
                                <div class="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 shadow-lg">
                                    <span class="text-[9px] font-black text-white/30 uppercase">WEIGHT:</span>
                                    <input type="number" value="${s.pointsPerQuestion}" min="1" data-field="pointsPerQuestion" data-idx="${i}" class="sec-input w-10 text-center text-sm font-black text-purple-400 bg-transparent outline-none">
                                </div>
                            </div>
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                <div class="flex flex-col gap-4">
                                    <span class="text-[9px] font-black text-white/40 uppercase tracking-widest text-center">Random</span>
                                    <input type="number" value="${s.distribution.ANY || 0}" min="0" data-diff="ANY" data-idx="${i}" class="dist-input p-5 text-center font-black text-white bg-white/5 border border-white/10 rounded-3xl focus:border-purple-500/50 outline-none shadow-xl text-xl">
                                    <span class="text-[8px] font-bold text-white/20 text-center uppercase tracking-tighter">${getAvailableCount(s, 'ANY')} AVAILABLE</span>
                                </div>
                                <div class="flex flex-col gap-4">
                                    <span class="text-[9px] font-black text-emerald-400 uppercase tracking-widest text-center">Standard</span>
                                    <input type="number" value="${s.distribution.EASY}" min="0" data-diff="EASY" data-idx="${i}" class="dist-input p-5 text-center font-black text-white bg-white/5 border border-emerald-500/20 rounded-3xl focus:border-emerald-500/50 outline-none shadow-xl text-xl">
                                    <span class="text-[8px] font-bold text-emerald-500/30 text-center uppercase tracking-tighter">${getAvailableCount(s, 'EASY')} AVAILABLE</span>
                                </div>
                                <div class="flex flex-col gap-4">
                                    <span class="text-[9px] font-black text-amber-400 uppercase tracking-widest text-center">Refined</span>
                                    <input type="number" value="${s.distribution.MODERATE}" min="0" data-diff="MODERATE" data-idx="${i}" class="dist-input p-5 text-center font-black text-white bg-white/5 border border-amber-500/20 rounded-3xl focus:border-amber-500/50 outline-none shadow-xl text-xl">
                                    <span class="text-[8px] font-bold text-amber-500/30 text-center uppercase tracking-tighter">${getAvailableCount(s, 'MODERATE')} AVAILABLE</span>
                                </div>
                                <div class="flex flex-col gap-4">
                                    <span class="text-[9px] font-black text-rose-400 uppercase tracking-widest text-center">Extreme</span>
                                    <input type="number" value="${s.distribution.DIFFICULT}" min="0" data-diff="DIFFICULT" data-idx="${i}" class="dist-input p-5 text-center font-black text-white bg-white/5 border border-rose-500/20 rounded-3xl focus:border-rose-500/50 outline-none shadow-xl text-xl">
                                    <span class="text-[8px] font-bold text-rose-500/30 text-center uppercase tracking-tighter">${getAvailableCount(s, 'DIFFICULT')} AVAILABLE</span>
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

                // Re-render when dependencies of 'available count' change
                if (field === 'course' || field === 'type') {
                    if (field === 'course') sections[idx].topics = [];
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
                    chip.classList.remove('bg-white/5', 'text-white/20', 'border-white/5');
                    chip.classList.add('bg-purple-600', 'text-white', 'border-white/20', 'shadow-[0_5px_15px_rgba(147,51,234,0.3)]');
                } else {
                    chip.classList.add('bg-white/5', 'text-white/20', 'border-white/5');
                    chip.classList.remove('bg-purple-600', 'text-white', 'border-white/20', 'shadow-[0_5px_15px_rgba(147,51,234,0.3)]');
                }

                // Refresh counts when topics change
                renderSections();
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

        // Duplicate section handler
        container.querySelectorAll('.dup-sec').forEach(btn => {
            btn.onclick = (e) => {
                const idx = parseInt(e.target.dataset.idx);
                const clone = JSON.parse(JSON.stringify(sections[idx]));
                clone.id = 'sec_' + Math.random().toString(36).substr(2, 5);
                clone.title = clone.title + ' (Copy)';
                sections.splice(idx + 1, 0, clone);
                renderSections();
            };
        });

        container.querySelectorAll('.bank-toggle').forEach(el => {
            el.onchange = (e) => {
                const idx = parseInt(e.target.dataset.idx);
                sections[idx].answerBankMode = e.target.checked;
                if (e.target.checked && !sections[idx].distractors) {
                    sections[idx].distractors = [];
                }
                renderSections();
            };
        });

        // Distractor add helpers
        const addDistractor = (input) => {
            const idx = parseInt(input.dataset.idx);
            const val = input.value.trim();
            if (val && !sections[idx].distractors.includes(val)) {
                sections[idx].distractors.push(val);
                renderSections();
            }
        };

        container.querySelectorAll('.add-dist-btn').forEach(btn => {
            btn.onclick = (e) => {
                const parent = e.target.closest('div');
                const input = parent.querySelector('.distractor-input');
                addDistractor(input);
            };
        });

        // Enter key support for distractor input
        container.querySelectorAll('.distractor-input').forEach(input => {
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addDistractor(input);
                }
            };
        });

        container.querySelectorAll('.rm-dist').forEach(btn => {
            btn.onclick = (e) => {
                const { sidx, didx } = e.target.dataset;
                sections[sidx].distractors.splice(didx, 1);
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

        if (!titleInput.value.trim()) return alert("Please enter an assessment title.");
        if (sections.length === 0) return alert("Please add at least one section.");

        err.classList.add('hidden');

        const selectedClassIds = Array.from(document.querySelectorAll('.class-check:checked')).map(cb => cb.dataset.classid);
        const selectedClassNames = Array.from(document.querySelectorAll('.class-check:checked')).map(cb => cb.closest('label').textContent.trim());

        try {
            const requireFullscreen = document.getElementById('require-fullscreen').checked;
            const unlockPassword = document.getElementById('unlock-password').value.trim();
            const requireGeofence = document.getElementById('require-geofence').checked;

            if ((requireFullscreen || requireGeofence) && !unlockPassword) {
                throw new Error("Master Proctor Unlock Password is required when anti-cheat or location restrictions are enabled.");
            }

            if (requireGeofence && (currentGeofence.lat === null || currentGeofence.lng === null)) {
                throw new Error("Please set geofence coordinates via the map or 'Use Current Location'.");
            }

            const totalItems = sections.reduce((sum, s) => sum + Object.values(s.distribution).reduce((a, b) => a + b, 0), 0);
            const timeLimit = parseInt(document.getElementById('time-limit').value) || 0;

            // --- Phase 5: Confirmation Summary Modal ---
            const summaryHTML = `
                <div class="fixed inset-0 bg-[#020617]/80 backdrop-blur-xl flex items-center justify-center z-[100] animate-in fade-in duration-300" id="confirm-modal">
                    <div class="glass-panel rounded-[50px] p-8 md:p-12 max-w-md w-full mx-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/10 space-y-8 animate-in zoom-in duration-500">
                        <div class="text-center space-y-2">
                            <h2 class="text-2xl font-black text-white uppercase tracking-tight">Protocol Verification</h2>
                            <p class="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">Review Assessment Configuration</p>
                        </div>
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between p-5 bg-white/5 rounded-2xl border border-white/5"><span class="font-black text-white/30 uppercase text-[9px] tracking-widest">Identity</span><span class="font-black text-white uppercase truncate ml-4">${titleInput.value.trim()}</span></div>
                            <div class="flex justify-between p-5 bg-white/5 rounded-2xl border border-white/5"><span class="font-black text-white/30 uppercase text-[9px] tracking-widest">Cohort</span><span class="font-black text-purple-400 uppercase">${selectedClassNames.length > 0 ? selectedClassNames.join(', ') : 'DEPT-WIDE'}</span></div>
                            <div class="flex justify-between p-5 bg-white/5 rounded-2xl border border-white/5"><span class="font-black text-white/30 uppercase text-[9px] tracking-widest">Segments</span><span class="font-black text-white uppercase">${sections.length} UNITS</span></div>
                            <div class="flex justify-between p-5 bg-purple-500/10 rounded-2xl border border-purple-500/30 shadow-lg shadow-purple-500/5"><span class="font-black text-purple-400 uppercase text-[9px] tracking-widest">Net Payload</span><span class="font-black text-purple-400 text-xl">${totalItems} ITEMS</span></div>
                            <div class="flex justify-between p-5 bg-white/5 rounded-2xl border border-white/5"><span class="font-black text-white/30 uppercase text-[9px] tracking-widest">Duration</span><span class="font-black text-white uppercase">${timeLimit > 0 ? timeLimit + ' MIN' : 'UNLIMITED'}</span></div>
                        </div>
                        <div class="flex flex-col gap-3 pt-2">
                            <button id="confirm-create" class="w-full p-5 rounded-3xl bg-purple-600 text-white font-black uppercase text-xs tracking-[0.3em] shadow-xl hover:shadow-purple-500/40 hover:-translate-y-0.5 active:scale-95 transition-all border border-white/20">Authorize & Deploy</button>
                            <button id="confirm-cancel" class="w-full p-5 rounded-3xl bg-white/5 border border-white/10 font-black uppercase text-[10px] tracking-[0.2em] text-white/40 hover:bg-white/10 hover:text-white transition-all">Abort Procedure</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', summaryHTML);

            const confirmModal = document.getElementById('confirm-modal');

            // Wait for user confirmation
            const confirmed = await new Promise((resolve) => {
                document.getElementById('confirm-cancel').onclick = () => { confirmModal.remove(); resolve(false); };
                document.getElementById('confirm-create').onclick = () => { confirmModal.remove(); resolve(true); };
                confirmModal.onclick = (e) => { if (e.target === confirmModal) { confirmModal.remove(); resolve(false); } };
            });

            if (!confirmed) return;

            btn.disabled = true;
            btn.textContent = 'CREATING...';

            const config = {
                title: titleInput.value.trim(),
                sections: sections,
                authorId: user.user.uid,
                assignedClassIds: selectedClassIds,
                settings: {
                    oneAtATime: document.getElementById('one-at-a-time').checked,
                    randomizeOrder: document.getElementById('random-order').checked,
                    shuffleChoices: document.getElementById('shuffle-choices').checked,
                    timeLimit: timeLimit,
                    requireFullscreen: requireFullscreen,
                    unlockPassword: (requireFullscreen || requireGeofence) ? unlockPassword : null,
                    requireGeofence: requireGeofence,
                    geofenceLat: requireGeofence ? currentGeofence.lat : null,
                    geofenceLng: requireGeofence ? currentGeofence.lng : null,
                    geofenceRadius: requireGeofence ? parseInt(document.getElementById('geofence-radius').value) || 100 : null
                }
            };

            await generateAssessment(config);
            window.location.hash = '#assessment-bank';

        } catch (error) {
            console.error("Wizard submit error:", error);
            err.textContent = error.message.toUpperCase();
            err.classList.remove('hidden');
            btn.disabled = false;
            btn.textContent = 'Create Assessment';
        }
    };

    // Initialize with 1 section
    sections.push(createSection());
    renderSections();

    // Class checkbox toggle styling
    document.querySelectorAll('.class-check').forEach(cb => {
        cb.onchange = (e) => {
            const chip = e.target.nextElementSibling;
            if (e.target.checked) {
                chip.classList.remove('bg-white/5', 'text-white/30', 'border-white/5');
                chip.classList.add('bg-purple-600', 'text-white', 'border-white/20', 'shadow-lg', 'shadow-purple-500/20');
            } else {
                chip.classList.add('bg-white/5', 'text-white/30', 'border-white/5');
                chip.classList.remove('bg-purple-600', 'text-white', 'border-purple-400', 'shadow-lg', 'shadow-purple-500/20');
            }
        };
    });

    // --- Anti-Cheat Setup ---
    const reqFullscreenToggle = document.getElementById('require-fullscreen');
    reqFullscreenToggle.onchange = (e) => {
        // No extra settings needed for fullscreen now as password is top level
    };

    const reqGeofenceToggle = document.getElementById('require-geofence');
    const geofenceSettings = document.getElementById('geofence-settings');

    let map = null;
    let marker = null;
    let circle = null;
    let currentGeofence = { lat: null, lng: null };

    const updateMapUI = (lat, lng, radius) => {
        document.getElementById('coords-display').innerText = `LAT: ${lat.toFixed(5)} | LNG: ${lng.toFixed(5)}`;
        currentGeofence = { lat, lng };

        if (!marker) {
            marker = L.marker([lat, lng], { draggable: true }).addTo(map);
            marker.on('dragend', function (event) {
                const position = marker.getLatLng();
                updateMapUI(position.lat, position.lng, parseInt(document.getElementById('geofence-radius').value) || 100);
            });
        } else {
            marker.setLatLng([lat, lng]);
        }

        if (!circle) {
            circle = L.circle([lat, lng], {
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.2,
                radius: radius
            }).addTo(map);
        } else {
            circle.setLatLng([lat, lng]);
            circle.setRadius(radius);
        }
    };

    const initMap = () => {
        if (map) return; // already init

        // Default to Manila if no location
        const defaultLat = 14.5995;
        const defaultLng = 120.9842;

        // Show loading state
        const mapDiv = document.getElementById('geofence-map');
        if (mapDiv) {
            mapDiv.innerHTML = '<div class="flex items-center justify-center h-full text-blue-400 text-xs font-black uppercase tracking-widest animate-pulse">Loading Map...</div>';
        }

        // Timeout to ensure DOM is fully rendered before leaflet tries to attach
        setTimeout(() => {
            if (mapDiv) mapDiv.innerHTML = ''; // clear loading state
            map = L.map('geofence-map').setView([defaultLat, defaultLng], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(map);

            map.on('click', function (e) {
                const radius = parseInt(document.getElementById('geofence-radius').value) || 100;
                updateMapUI(e.latlng.lat, e.latlng.lng, radius);
            });
        }, 100);
    };

    reqGeofenceToggle.onchange = (e) => {
        if (e.target.checked) {
            geofenceSettings.style.display = 'flex';
            initMap();
        } else {
            geofenceSettings.style.display = 'none';
        }
    };

    document.getElementById('geofence-radius').onchange = (e) => {
        if (currentGeofence.lat && currentGeofence.lng) {
            updateMapUI(currentGeofence.lat, currentGeofence.lng, parseInt(e.target.value) || 100);
        }
    };

    document.getElementById('capture-location-btn').onclick = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const radius = parseInt(document.getElementById('geofence-radius').value) || 100;
                    updateMapUI(position.coords.latitude, position.coords.longitude, radius);
                    map.setView([position.coords.latitude, position.coords.longitude], 16);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    alert("Unable to retrieve location. Please check browser permissions.");
                },
                { enableHighAccuracy: true }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

};
