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
        <div class="px-4 py-8 max-w-2xl mx-auto pb-24">
            <header class="mb-8">
                <button onclick="location.hash='#assessment-bank'" class="text-gray-500 hover:text-gray-700 text-sm mb-2">← Back to Manager</button>
                <h1 class="text-3xl font-bold text-gray-900">New Assessment</h1>
                <p class="text-gray-500 text-sm mt-1">Configure your test sections below.</p>
            </header>

            <div class="space-y-6">
                <!-- Main Config -->
                <div class="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm space-y-4">
                    ${renderInput({ id: 'test-title', label: 'Main Assessment Title', placeholder: 'e.g. Finals - Civil Engineering', required: true })}
                    
                    <div class="flex flex-col gap-1">
                        <label class="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Assign to Class (Optional)</label>
                        <select id="assigned-class" class="p-3 border-2 border-gray-100 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-all">
                            <option value="">Public (Visible to All)</option>
                            ${classes.map(c => `<option value="${c.id}">${c.name} (${c.section}) - Code: ${c.code}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <!-- Sections Container -->
                <div id="sections-container" class="space-y-4"></div>

                <!-- Add Section Button -->
                <button id="add-section-btn" class="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold hover:border-blue-500 hover:text-blue-600 transition-all active:scale-[0.98]">
                    + Add Test Section
                </button>

                <div id="w-error" class="text-red-500 text-sm hidden text-center font-bold"></div>

                <!-- Floating Submit Bar -->
                <div class="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 flex justify-center z-50">
                    <div class="w-full max-w-2xl">
                        ${renderButton({ text: 'Generate Assessment', type: 'button', id: 'final-submit-btn', variant: 'primary' })}
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
            <div class="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm relative group animate-slide-up">
                <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button data-idx="${i}" class="remove-sec text-gray-300 hover:text-red-500 font-bold text-xl px-2">×</button>
                </div>
                
                <p class="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mb-4">Section ${i + 1}</p>
                
                <div class="space-y-5">
                    <div class="flex flex-col gap-1">
                        <label class="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Section Subtitle</label>
                        <input type="text" value="${s.title}" data-field="title" data-idx="${i}" placeholder="e.g. Part I: Math Analysis" class="sec-input p-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all">
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1">
                            <label class="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Course</label>
                            <select data-field="course" data-idx="${i}" class="sec-input p-3 border-2 border-gray-100 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-all">
                                <option value="">Select Course</option>
                                ${hierarchy.courses.map(c => `<option value="${c}" ${s.course === c ? 'selected' : ''}>${c}</option>`).join('')}
                            </select>
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Question Type</label>
                            <select data-field="type" data-idx="${i}" class="sec-input p-3 border-2 border-gray-100 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-all">
                                <option value="ALL" ${s.type === 'ALL' ? 'selected' : ''}>Mixed Types</option>
                                <option value="MCQ" ${s.type === 'MCQ' ? 'selected' : ''}>MCQ</option>
                                <option value="IDENTIFICATION" ${s.type === 'IDENTIFICATION' ? 'selected' : ''}>ID</option>
                                <option value="TRUE_FALSE" ${s.type === 'TRUE_FALSE' ? 'selected' : ''}>T/F</option>
                            </select>
                        </div>
                    </div>

                    <div class="flex flex-col gap-1">
                        <label class="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Topics (Select Multiple)</label>
                        <div class="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl min-h-[50px]">
                            ${(hierarchy.topics[s.course] || []).map(t => {
            const isChecked = s.topics.includes(t);
            return `
                                    <label class="cursor-pointer group/label">
                                        <input type="checkbox" class="topic-check hidden" data-topic="${t}" data-idx="${i}" ${isChecked ? 'checked' : ''}>
                                        <div class="topic-chip px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${isChecked ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-100 hover:border-blue-200'}">
                                            ${t}
                                        </div>
                                    </label>
                                `;
        }).join('')}
                            ${!s.course ? '<p class="text-xs text-gray-400 italic py-1 px-1">Select a course first</p>' : ''}
                        </div>
                    </div>

                    <div class="space-y-3 p-4 bg-gray-50 rounded-2xl border-2 border-white">
                        <div class="flex justify-between items-center mb-1">
                            <label class="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Difficulty Distribution</label>
                            <div class="flex items-center gap-1">
                                <span class="text-[10px] font-bold text-gray-400">Pts/Q:</span>
                                <input type="number" value="${s.pointsPerQuestion}" min="1" data-field="pointsPerQuestion" data-idx="${i}" class="sec-input w-12 text-center text-xs font-bold p-1 bg-white border border-gray-200 rounded outline-none focus:border-blue-400">
                            </div>
                        </div>
                        <div class="grid grid-cols-3 gap-3">
                            <div class="flex flex-col gap-1">
                                <span class="text-[10px] font-bold text-green-600 uppercase text-center">Easy</span>
                                <input type="number" value="${s.distribution.EASY}" min="0" data-diff="EASY" data-idx="${i}" class="dist-input p-2 text-center font-black text-gray-700 bg-white border-2 border-transparent rounded-xl focus:border-green-400 outline-none shadow-sm">
                            </div>
                            <div class="flex flex-col gap-1">
                                <span class="text-[10px] font-bold text-amber-600 uppercase text-center">Moderate</span>
                                <input type="number" value="${s.distribution.MODERATE}" min="0" data-diff="MODERATE" data-idx="${i}" class="dist-input p-2 text-center font-black text-gray-700 bg-white border-2 border-transparent rounded-xl focus:border-amber-400 outline-none shadow-sm">
                            </div>
                            <div class="flex flex-col gap-1">
                                <span class="text-[10px] font-bold text-red-600 uppercase text-center">Hard</span>
                                <input type="number" value="${s.distribution.DIFFICULT}" min="0" data-diff="DIFFICULT" data-idx="${i}" class="dist-input p-2 text-center font-black text-gray-700 bg-white border-2 border-transparent rounded-xl focus:border-red-400 outline-none shadow-sm">
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

                // Toggle styles without full re-render
                const chip = e.target.nextElementSibling;
                if (e.target.checked) {
                    chip.classList.remove('bg-white', 'text-gray-500', 'border-gray-100');
                    chip.classList.add('bg-blue-600', 'text-white', 'border-blue-600');
                } else {
                    chip.classList.add('bg-white', 'text-gray-500', 'border-gray-100');
                    chip.classList.remove('bg-blue-600', 'text-white', 'border-blue-600');
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

        if (!titleInput.value.trim()) return alert("Please enter an assessment title.");
        if (sections.length === 0) return alert("Please add at least one section.");

        btn.disabled = true;
        btn.textContent = 'Generating...';
        err.classList.add('hidden');

        const assignedClassId = document.getElementById('assigned-class').value;

        try {
            const config = {
                title: titleInput.value.trim(),
                sections: sections,
                authorId: user.user.uid,
                assignedClassId: assignedClassId || null
            };

            const assessmentId = await generateAssessment(config);
            // alert(`Assessment Generated! ID: ${assessmentId}`);
            window.location.hash = '#assessment-bank';

        } catch (error) {
            console.error("Wizard submit error:", error);
            err.textContent = error.message;
            err.classList.remove('hidden');
            btn.disabled = false;
            btn.textContent = 'Generate Assessment';
        }
    };

    // Initialize with 1 section
    sections.push(createSection());
    renderSections();
};
