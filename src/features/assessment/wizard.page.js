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
        <div class="flex items-start justify-center min-h-screen bg-premium-gradient py-8 px-4 pb-32">
            <div class="bg-white w-full max-w-2xl rounded-[50px] shadow-2xl shadow-purple-200/50 animate-in fade-in slide-in-from-bottom-8 duration-700 relative overflow-hidden border border-white min-h-[90vh]">
                <div class="absolute top-0 right-0 w-96 h-96 bg-purple-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-30"></div>
                
                <header class="glass-panel sticky top-0 z-40 px-8 py-8 border-b border-gray-100 flex justify-between items-center transition-all">
                    <div class="flex items-center gap-5">
                        <button onclick="location.hash='#assessment-bank'" class="p-3 glass-panel rounded-2xl text-purple-600 hover:text-purple-800 transition-colors shadow-sm">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        </button>
                        <div>
                            <h1 class="text-2xl font-black text-gray-900 leading-tight tracking-tight uppercase">Assessment Builder</h1>
                            <p class="text-[9px] font-black text-purple-600 uppercase tracking-[0.3em] mt-0.5">Configure & Generate</p>
                        </div>
                    </div>
                </header>

                <main class="p-8 space-y-12 relative z-10">
                <!-- Main Config -->
                <div class="bg-white p-10 rounded-[50px] shadow-2xl shadow-purple-50/50 border border-white space-y-6 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
                    
                    <div class="relative z-10">
                        <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] mb-4 block">Assessment Title</label>
                        ${renderInput({ id: 'test-title', placeholder: 'e.g. MIDTERM EXAM — CALCULUS II', required: true, classes: 'text-lg font-black uppercase' })}
                    </div>
                    
                    <div class="flex flex-col gap-2 relative z-10">
                        <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Assign to Classes (Optional)</label>
                        <div class="flex flex-wrap gap-2 p-4 bg-gray-50 border border-gray-100 rounded-2xl shadow-inner min-h-[60px]">
                            ${classes.length > 0 ? classes.map(c => `
                                <label class="cursor-pointer">
                                    <input type="checkbox" class="class-check hidden" data-classid="${c.id}">
                                    <div class="class-chip px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all bg-white text-gray-500 border-gray-100 hover:border-purple-200">
                                        ${c.name} [${c.section}]
                                    </div>
                                </label>
                            `).join('') : '<p class="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">No Classes Available (Public Only)</p>'}
                        </div>
                        <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Leave empty to make it publicly accessible</p>
                    </div>
                </div>

                <!-- Session Parameters -->
                <div class="bg-white p-10 rounded-[50px] shadow-2xl shadow-purple-50/50 border border-white space-y-6 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
                    
                    <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] block relative z-10">Exam Settings</label>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 relative z-10">
                        <label class="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 cursor-pointer hover:bg-white transition-all group">
                            <div class="flex flex-col gap-1">
                                <span class="text-[10px] font-black text-gray-900 uppercase tracking-widest">One at a Time</span>
                                <p class="text-[9px] font-bold text-gray-400 uppercase">Show one question per screen</p>
                            </div>
                            <div class="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-gray-200 rounded-full shadow-inner">
                                <input type="checkbox" id="one-at-a-time" class="absolute w-6 h-6 opacity-0 z-10 cursor-pointer peer">
                                <span class="absolute left-0 w-6 h-6 bg-white rounded-full shadow border border-gray-100 transition-transform duration-200 peer-checked:translate-x-6 peer-checked:bg-purple-600"></span>
                            </div>
                        </label>

                        <label class="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 cursor-pointer hover:bg-white transition-all group">
                            <div class="flex flex-col gap-1">
                                <span class="text-[10px] font-black text-gray-900 uppercase tracking-widest">Shuffle Questions</span>
                                <p class="text-[9px] font-bold text-gray-400 uppercase">Randomize order for each student</p>
                            </div>
                            <div class="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-gray-200 rounded-full shadow-inner">
                                <input type="checkbox" id="random-order" class="absolute w-6 h-6 opacity-0 z-10 cursor-pointer peer">
                                <span class="absolute left-0 w-6 h-6 bg-white rounded-full shadow border border-gray-100 transition-transform duration-200 peer-checked:translate-x-6 peer-checked:bg-purple-600"></span>
                            </div>
                        </label>

                        <label class="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 cursor-pointer hover:bg-white transition-all group">
                            <div class="flex flex-col gap-1">
                                <span class="text-[10px] font-black text-gray-900 uppercase tracking-widest">Shuffle Choices</span>
                                <p class="text-[9px] font-bold text-gray-400 uppercase">Randomize MCQ answer order</p>
                            </div>
                            <div class="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-gray-200 rounded-full shadow-inner">
                                <input type="checkbox" id="shuffle-choices" class="absolute w-6 h-6 opacity-0 z-10 cursor-pointer peer">
                                <span class="absolute left-0 w-6 h-6 bg-white rounded-full shadow border border-gray-100 transition-transform duration-200 peer-checked:translate-x-6 peer-checked:bg-purple-600"></span>
                            </div>
                        </label>

                        <div class="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:bg-white transition-all group">
                            <div class="flex flex-col gap-1">
                                <span class="text-[10px] font-black text-gray-900 uppercase tracking-widest">Time Limit</span>
                                <p class="text-[9px] font-bold text-gray-400 uppercase">Set to 0 for unlimited time</p>
                            </div>
                            <div class="flex items-center gap-2">
                                <input type="number" id="time-limit" placeholder="0" min="0" class="w-16 p-2 text-center bg-white border border-gray-200 rounded-xl font-black text-purple-600 focus:border-purple-500 outline-none text-sm">
                                <span class="text-[9px] font-black text-gray-400 uppercase">MIN</span>
                            </div>
                        </div>

                        <div class="flex flex-col gap-4 p-6 bg-gray-50 rounded-3xl border border-gray-100 transition-all group lg:col-span-2">
                            <label class="flex items-center justify-between cursor-pointer">
                                <div class="flex flex-col gap-1">
                                    <span class="text-[10px] font-black text-gray-900 uppercase tracking-widest text-red-600">Anti-Cheat Lockout</span>
                                    <p class="text-[9px] font-bold text-gray-400 uppercase">Require fullscreen & prevent tab switching</p>
                                </div>
                                <div class="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-gray-200 rounded-full shadow-inner">
                                    <input type="checkbox" id="require-fullscreen" class="absolute w-6 h-6 opacity-0 z-10 cursor-pointer peer">
                                    <span class="absolute left-0 w-6 h-6 bg-white rounded-full shadow border border-gray-100 transition-transform duration-200 peer-checked:translate-x-6 peer-checked:bg-red-500"></span>
                                </div>
                            </label>
                            
                            <div id="lockout-settings" class="hidden flex-col gap-2 mt-2 pt-4 border-t border-gray-200">
                                <label class="text-[9px] font-black text-gray-500 uppercase tracking-widest">Proctor Override Password</label>
                                <input type="text" id="proctor-password" placeholder="e.g. unlock123" class="w-full p-3 bg-white border border-red-200 rounded-xl font-black text-red-600 focus:border-red-500 outline-none text-sm placeholder:opacity-50">
                                <p class="text-[8px] font-bold text-gray-400 uppercase">Required to unlock exam if student leaves the app</p>
                            </div>
                        </div>

                        <div class="flex flex-col gap-4 p-6 bg-gray-50 rounded-3xl border border-gray-100 transition-all group lg:col-span-2">
                             <label class="flex items-center justify-between cursor-pointer">
                                <div class="flex flex-col gap-1">
                                    <span class="text-[10px] font-black text-gray-900 uppercase tracking-widest text-blue-600">Location Restriction</span>
                                    <p class="text-[9px] font-bold text-gray-400 uppercase">Only allow access within a set area</p>
                                </div>
                                <div class="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-gray-200 rounded-full shadow-inner">
                                    <input type="checkbox" id="require-geofence" class="absolute w-6 h-6 opacity-0 z-10 cursor-pointer peer">
                                    <span class="absolute left-0 w-6 h-6 bg-white rounded-full shadow border border-gray-100 transition-transform duration-200 peer-checked:translate-x-6 peer-checked:bg-blue-500"></span>
                                </div>
                            </label>

                            <div id="geofence-settings" class="hidden flex-col gap-4 mt-2 pt-4 border-t border-gray-200">
                                <div class="flex flex-wrap items-end gap-4">
                                    <button type="button" id="capture-location-btn" class="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-2">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                        Use Current Location
                                    </button>
                                    <div class="flex items-center gap-2">
                                        <label class="text-[9px] font-black text-gray-500 uppercase tracking-widest">Radius</label>
                                        <input type="number" id="geofence-radius" value="100" min="10" step="10" class="w-20 p-2 text-center bg-white border border-blue-200 rounded-xl font-black text-blue-600 focus:border-blue-500 outline-none text-sm">
                                        <span class="text-[9px] font-black text-gray-400 uppercase">METERS</span>
                                    </div>
                                </div>
                                
                                <div id="geofence-map" class="w-full h-48 rounded-2xl border-2 border-blue-200 overflow-hidden relative z-0"></div>
                                <div class="text-[8px] font-black text-blue-400 uppercase tracking-widest text-center" id="coords-display">LAT: -- | LNG: --</div>
                            </div>
                        </div>

                    </div>
                </div>

                <!-- Sections Container -->
                <div id="sections-container" class="space-y-6"></div>

                <!-- Add Section Button -->
                <button id="add-section-btn" class="w-full py-8 glass-panel border-2 border-dashed border-gray-200 rounded-[40px] text-gray-500 font-extrabold uppercase tracking-widest hover:border-purple-300 hover:text-purple-500 hover:bg-white transition-all active:scale-[0.98] shadow-sm">
                    + Add Section
                </button>

                <div id="w-error" class="text-red-500 text-[10px] font-black uppercase tracking-widest hidden text-center bg-red-50 py-4 rounded-2xl border border-red-100"></div>

                </main>

                <!-- Footer Submit Bar (Bounded to Card) -->
                <div class="sticky bottom-0 left-0 right-0 p-8 bg-white/80 backdrop-blur-xl border-t border-gray-100 flex justify-center z-50">
                    <button id="final-submit-btn" class="w-full bg-purple-premium text-white p-6 rounded-3xl font-black uppercase text-sm tracking-[0.3em] shadow-2xl shadow-purple-200/50 hover:shadow-purple-300 hover:-translate-y-1 active:scale-[0.98] transition-all">Create Assessment</button>
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
            <div class="bg-white p-10 rounded-[50px] border border-white shadow-2xl shadow-purple-50/50 relative group animate-in fade-in slide-in-from-bottom-8 duration-500 overflow-hidden">
                <div class="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-purple-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div class="absolute top-8 right-8 z-20 flex gap-2">
                    <button data-idx="${i}" class="dup-sec w-10 h-10 glass-panel rounded-xl text-gray-300 hover:text-purple-500 hover:border-purple-500 font-black transition-all text-lg" title="Duplicate Section">⊞</button>
                    <button data-idx="${i}" class="remove-sec w-10 h-10 glass-panel rounded-xl text-gray-300 hover:text-red-500 hover:border-red-500 font-black transition-all">×</button>
                </div>
                
                <div class="relative z-10">
                    <div class="flex items-center gap-4 mb-8">
                        <div class="w-10 h-1bg-purple-premium rounded-full"></div>
                        <p class="text-[10px] font-black text-purple-600 uppercase tracking-[0.4em]">Section ${i + 1}</p>
                    </div>
                    
                    <div class="space-y-8">
                        <div class="flex flex-col gap-2">
                            <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Section Title</label>
                            <input type="text" value="${s.title}" data-field="title" data-idx="${i}" placeholder="e.g. PART I: QUANTITATIVE ANALYSIS" class="sec-input p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-purple-500 outline-none transition-all font-black text-gray-700 uppercase placeholder:opacity-30">
                        </div>

                            <div class="flex flex-col gap-2">
                                <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Course / Subject</label>
                                <select data-field="course" data-idx="${i}" class="sec-input p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-purple-500 outline-none transition-all font-bold text-gray-600 appearance-none shadow-inner">
                                    <option value="">UNCATEGORISED</option>
                                    ${hierarchy.courses.map(c => `<option value="${c}" ${s.course === c ? 'selected' : ''}>${c.toUpperCase()}</option>`).join('')}
                                </select>
                            </div>
                            <div class="flex flex-col gap-2">
                                <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Question Type</label>
                                <select data-field="type" data-idx="${i}" class="sec-input p-5 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-purple-500 outline-none transition-all font-bold text-gray-600 appearance-none shadow-inner">
                                    <option value="ALL" ${s.type === 'ALL' ? 'selected' : ''}>MIXED TELEMETRY</option>
                                    <option value="MCQ" ${s.type === 'MCQ' ? 'selected' : ''}>SINGLE CHOICE MCQ</option>
                                    <option value="MULTI_ANSWER" ${s.type === 'MULTI_ANSWER' ? 'selected' : ''}>MULTIPLE ANSWER</option>
                                    <option value="IDENTIFICATION" ${s.type === 'IDENTIFICATION' ? 'selected' : ''}>IDENTIFICATION (TYPED)</option>
                                    <option value="MATCHING" ${s.type === 'MATCHING' ? 'selected' : ''}>MATCHING PAIRS</option>
                                    <option value="ORDERING" ${s.type === 'ORDERING' ? 'selected' : ''}>SEQUENTIAL ORDER</option>
                                    <option value="TRUE_FALSE" ${s.type === 'TRUE_FALSE' ? 'selected' : ''}>T/F BINARY</option>
                                </select>
                            </div>
                        </div>

                        ${(s.type === 'MCQ' || s.type === 'IDENTIFICATION') ? `
                            <div class="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 animate-in slide-in-from-top-4">
                                <label class="flex items-center justify-between cursor-pointer mb-4">
                                    <div class="flex flex-col gap-1">
                                        <span class="text-[10px] font-black text-blue-900 uppercase tracking-widest">Answer Bank Mode</span>
                                        <p class="text-[9px] font-bold text-blue-400 uppercase">Aggregates all identification answers into a shared pool</p>
                                    </div>
                                    <div class="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-gray-200 rounded-full shadow-inner">
                                        <input type="checkbox" class="bank-toggle absolute w-6 h-6 opacity-0 z-10 cursor-pointer peer" data-idx="${i}" ${s.answerBankMode ? 'checked' : ''}>
                                        <span class="absolute left-0 w-6 h-6 bg-white rounded-full shadow border border-gray-100 transition-transform duration-200 peer-checked:translate-x-6 peer-checked:bg-blue-600"></span>
                                    </div>
                                </label>
                                
                                ${s.answerBankMode ? `
                                    <div class="space-y-4 pt-4 border-t border-blue-100">
                                         <label class="text-[10px] font-black text-blue-700 uppercase tracking-widest px-2">Additional Distractors (Wrong Answers for Bank)</label>
                                         <div class="flex gap-3">
                                            <input type="text" class="distractor-input flex-1 p-4 bg-white border border-blue-100 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-blue-400 transition-all placeholder:opacity-30" placeholder="APPEND TRAP DATA..." data-idx="${i}">
                                            <button type="button" class="add-dist-btn bg-blue-premium text-white px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">ADD</button>
                                         </div>
                                         <div class="flex flex-wrap gap-2 pt-2">
                                            ${(s.distractors || []).map((d, dIdx) => `
                                                <span class="px-4 py-2 bg-white border border-blue-100 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-3">
                                                    ${d}
                                                    <button type="button" class="rm-dist text-gray-300 hover:text-red-500 font-black text-lg" data-sidx="${i}" data-didx="${dIdx}">×</button>
                                                </span>
                                            `).join('')}
                                         </div>
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}

                        <div class="flex flex-col gap-4">
                            <label class="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Select Topics</label>
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
                                ${!s.course ? '<p class="text-[10px] font-black text-gray-300 uppercase tracking-widest italic flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> Select a Course First</p>' : ''}
                            </div>
                        </div>

                        <div class="p-8 bg-purple-50/30 rounded-[36px] border border-purple-100/30 shadow-inner">
                            <div class="flex justify-between items-center mb-6">
                                <label class="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em]">Difficulty & Item Count</label>
                                <div class="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-purple-100 shadow-sm">
                                    <span class="text-[10px] font-black text-gray-600 uppercase">Val/Q:</span>
                                    <input type="number" value="${s.pointsPerQuestion}" min="1" data-field="pointsPerQuestion" data-idx="${i}" class="sec-input w-8 text-center text-xs font-black text-purple-600 outline-none">
                                </div>
                            </div>
                            <div class="grid grid-cols-4 gap-4">
                                <div class="flex flex-col gap-3">
                                    <span class="text-[9px] font-black text-purple-500 uppercase tracking-widest text-center">Any</span>
                                    <input type="number" value="${s.distribution.ANY || 0}" min="0" data-diff="ANY" data-idx="${i}" class="dist-input p-4 text-center font-black text-gray-700 bg-white border border-gray-100 rounded-2xl focus:border-purple-400 outline-none shadow-sm text-lg">
                                    <span class="text-[8px] font-bold text-purple-400 text-center">${getAvailableCount(s, 'ANY')} avail</span>
                                </div>
                                <div class="flex flex-col gap-3">
                                    <span class="text-[9px] font-black text-green-500 uppercase tracking-widest text-center">Easy</span>
                                    <input type="number" value="${s.distribution.EASY}" min="0" data-diff="EASY" data-idx="${i}" class="dist-input p-4 text-center font-black text-gray-700 bg-white border border-gray-100 rounded-2xl focus:border-green-400 outline-none shadow-sm text-lg">
                                    <span class="text-[8px] font-bold text-green-400 text-center">${getAvailableCount(s, 'EASY')} avail</span>
                                </div>
                                <div class="flex flex-col gap-3">
                                    <span class="text-[9px] font-black text-amber-500 uppercase tracking-widest text-center">Medium</span>
                                    <input type="number" value="${s.distribution.MODERATE}" min="0" data-diff="MODERATE" data-idx="${i}" class="dist-input p-4 text-center font-black text-gray-700 bg-white border border-gray-100 rounded-2xl focus:border-amber-400 outline-none shadow-sm text-lg">
                                    <span class="text-[8px] font-bold text-amber-400 text-center">${getAvailableCount(s, 'MODERATE')} avail</span>
                                </div>
                                <div class="flex flex-col gap-3">
                                    <span class="text-[9px] font-black text-red-500 uppercase tracking-widest text-center">Hard</span>
                                    <input type="number" value="${s.distribution.DIFFICULT}" min="0" data-diff="DIFFICULT" data-idx="${i}" class="dist-input p-4 text-center font-black text-gray-700 bg-white border border-gray-100 rounded-2xl focus:border-red-400 outline-none shadow-sm text-lg">
                                    <span class="text-[8px] font-bold text-red-400 text-center">${getAvailableCount(s, 'DIFFICULT')} avail</span>
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
                    chip.classList.remove('bg-white', 'text-gray-400', 'border-gray-100');
                    chip.classList.add('bg-purple-premium', 'text-white', 'border-purple-400', 'shadow-lg', 'shadow-purple-100');
                } else {
                    chip.classList.add('bg-white', 'text-gray-400', 'border-gray-100');
                    chip.classList.remove('bg-purple-premium', 'text-white', 'border-purple-400', 'shadow-lg', 'shadow-purple-100');
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
            const proctorPassword = document.getElementById('proctor-password').value.trim();
            const requireGeofence = document.getElementById('require-geofence').checked;

            if (requireFullscreen && !proctorPassword) {
                throw new Error("Proctor password is required when anti-cheat lockout is enabled.");
            }

            if (requireGeofence && (currentGeofence.lat === null || currentGeofence.lng === null)) {
                throw new Error("Please set geofence coordinates via the map or 'Use Current Location'.");
            }

            const totalItems = sections.reduce((sum, s) => sum + Object.values(s.distribution).reduce((a, b) => a + b, 0), 0);
            const timeLimit = parseInt(document.getElementById('time-limit').value) || 0;

            // --- Phase 5: Confirmation Summary Modal ---
            const summaryHTML = `
                <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200" id="confirm-modal">
                    <div class="bg-white rounded-[40px] p-10 max-w-md w-full mx-4 shadow-2xl shadow-purple-200/50 space-y-6 animate-in slide-in-from-bottom-8 duration-500">
                        <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Confirm Assessment</h2>
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between p-4 bg-gray-50 rounded-2xl"><span class="font-black text-gray-500 uppercase text-[10px] tracking-widest">Title</span><span class="font-black text-gray-900">${titleInput.value.trim()}</span></div>
                            <div class="flex justify-between p-4 bg-gray-50 rounded-2xl"><span class="font-black text-gray-500 uppercase text-[10px] tracking-widest">Classes</span><span class="font-bold text-gray-700">${selectedClassNames.length > 0 ? selectedClassNames.join(', ') : 'Public'}</span></div>
                            <div class="flex justify-between p-4 bg-gray-50 rounded-2xl"><span class="font-black text-gray-500 uppercase text-[10px] tracking-widest">Sections</span><span class="font-black text-gray-900">${sections.length}</span></div>
                            <div class="flex justify-between p-4 bg-purple-50 rounded-2xl border border-purple-100"><span class="font-black text-purple-500 uppercase text-[10px] tracking-widest">Total Items</span><span class="font-black text-purple-700 text-lg">${totalItems}</span></div>
                            <div class="flex justify-between p-4 bg-gray-50 rounded-2xl"><span class="font-black text-gray-500 uppercase text-[10px] tracking-widest">Time</span><span class="font-bold text-gray-700">${timeLimit > 0 ? timeLimit + ' min' : 'Unlimited'}</span></div>
                            <div class="flex justify-between p-4 bg-gray-50 rounded-2xl"><span class="font-black text-gray-500 uppercase text-[10px] tracking-widest">Anti-Cheat</span><span class="font-bold ${requireFullscreen ? 'text-red-600' : 'text-gray-400'}">${requireFullscreen ? 'ON' : 'OFF'}</span></div>
                            <div class="flex justify-between p-4 bg-gray-50 rounded-2xl"><span class="font-black text-gray-500 uppercase text-[10px] tracking-widest">Location Lock</span><span class="font-bold ${requireGeofence ? 'text-blue-600' : 'text-gray-400'}">${requireGeofence ? 'ON' : 'OFF'}</span></div>
                        </div>
                        <div class="flex gap-3 pt-2">
                            <button id="confirm-cancel" class="flex-1 p-4 rounded-2xl border-2 border-gray-100 font-black uppercase text-xs tracking-widest text-gray-500 hover:border-gray-300 transition-all">Go Back</button>
                            <button id="confirm-create" class="flex-1 p-4 rounded-2xl bg-purple-premium text-white font-black uppercase text-xs tracking-widest shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all">Confirm & Create</button>
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
                    proctorPassword: requireFullscreen ? proctorPassword : null,
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
                chip.classList.remove('bg-white', 'text-gray-500', 'border-gray-100');
                chip.classList.add('bg-purple-premium', 'text-white', 'border-purple-400', 'shadow-lg', 'shadow-purple-100');
            } else {
                chip.classList.add('bg-white', 'text-gray-500', 'border-gray-100');
                chip.classList.remove('bg-purple-premium', 'text-white', 'border-purple-400', 'shadow-lg', 'shadow-purple-100');
            }
        };
    });

    // --- Anti-Cheat Setup ---
    const reqFullscreenToggle = document.getElementById('require-fullscreen');
    const lockoutSettings = document.getElementById('lockout-settings');
    reqFullscreenToggle.onchange = (e) => {
        if (e.target.checked) {
            lockoutSettings.style.display = 'flex';
        } else {
            lockoutSettings.style.display = 'none';
        }
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
