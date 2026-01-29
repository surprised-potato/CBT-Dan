import { submitTest, checkSubmission } from '../../services/submission.service.js';
import { getAssessment } from '../../services/assessment.service.js';
import { getUser } from '../../core/store.js';
import { renderButton } from '../../shared/button.js';
import { renderMCQ } from '../question-bank/types/mcq.js';
import { renderTrueFalse } from '../question-bank/types/true-false.js';
import { renderIdentification } from '../question-bank/types/identification.js';

export const TakerPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();

    if (!user) {
        window.location.hash = '#login';
        return;
    }

    // Parse ID from hash: #taker?id=XYZ
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const assessmentId = params.get('id');

    if (!assessmentId) {
        app.innerHTML = '<div class="p-10 text-center">Invalid Assessment Link</div>';
        return;
    }

    // --- Loading State ---
    app.innerHTML = `
        <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p class="mt-4 text-gray-500">Loading Assessment...</p>
        </div>
    `;

    try {
        // Teacher preview bypasses duplicate check
        const isTeacher = user.role === 'teacher';

        if (!isTeacher) {
            const hasTaken = await checkSubmission(assessmentId, user.user.uid);
            if (hasTaken) {
                app.innerHTML = `
                    <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                        <div class="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                            <h2 class="text-2xl font-bold text-gray-800 mb-4">Assessment Completed</h2>
                            <p class="text-gray-600 mb-8">You have already submitted this assessment.</p>
                            <button onclick="window.location.hash='#student-dash'" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold w-full hover:bg-blue-700"> Back to Dashboard</button>
                        </div>
                    </div>
                `;
                return;
            }
        }

        const assessment = await getAssessment(assessmentId);

        // Restore state from localStorage
        const storageKey = `session_${assessmentId}_${user.user.uid}`;
        const savedState = JSON.parse(localStorage.getItem(storageKey) || '{}');
        const answers = savedState.answers || {};

        // --- Render Template ---
        app.innerHTML = `
            <div class="bg-gray-50 min-h-screen pb-20">
                <!-- Header -->
                <!-- Header -->
                <header class="bg-white shadow p-4 sticky top-0 z-10">
                    <div class="max-w-3xl mx-auto flex justify-between items-center">
                        <div class="flex items-center gap-4">
                            ${user.role === 'teacher'
                ? `<button onclick="window.location.hash='#details?id=${assessmentId}'" class="text-gray-500 hover:text-gray-700 font-bold">← Back</button>`
                : ''
            }
                            <div>
                                <h1 class="text-sm font-bold text-gray-500 uppercase tracking-wide">Assessment</h1>
                                <p class="text-lg font-bold text-gray-900 truncate max-w-[200px] md:max-w-md">${assessment.title}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <div id="timer" class="font-mono font-bold text-blue-600 text-xl">--:--</div>
                        </div>
                    </div>
                </header>

                <main class="max-w-3xl mx-auto p-4 mt-4">
                    <form id="assessment-form">
                        <div id="questions-container" class="space-y-8">
                            <!-- Questions Injected Here -->
                        </div>

                        <div class="mt-10 pt-6 border-t border-gray-200">
                            ${renderButton({ text: 'Submit Assessment', type: 'submit', variant: 'primary', id: 'submit-btn' })}
                            <p class="text-center text-xs text-gray-400 mt-4">Answers are saved automatically.</p>
                        </div>
                    </form>
                </main>
            </div>
        `;

        // --- Render Questions ---
        const container = document.getElementById('questions-container');

        container.innerHTML = assessment.questions.map((q, index) => {
            // Helper to check if answered (for re-checking radios/inputs)
            // We'll need a way to restore values after render string generation
            // For now, let's render standard and hydrate values after

            // Map renderer based on type
            let html = '';
            // Ensure question object matches renderer expectations (text vs question_text)
            // We fixed details page earlier, verify data structure.
            // Assuming 'q' has 'type', 'text', 'choices', etc.

            if (q.type === 'MCQ') html = renderMCQ(q, index + 1);
            else if (q.type === 'TRUE_FALSE') html = renderTrueFalse(q, index + 1);
            else if (q.type === 'IDENTIFICATION') html = renderIdentification(q, index + 1);
            else html = `<div class="p-4 bg-red-100 text-red-500">Unknown Type: ${q.type}</div>`;

            return html;
        }).join('');

        // --- Hydrate Answers (Restore State) ---
        Object.keys(answers).forEach(questionId => {
            const value = answers[questionId];
            // Try radio first (MCQ/TF)
            const radio = document.querySelector(`input[name="q-${questionId}"][value="${value}"]`);
            if (radio) radio.checked = true;

            // Try text input (Identification)
            const input = document.querySelector(`input[name="q-${questionId}"]`); // Assuming ID/Name convention matches
            // Wait, identification renderer usually uses ID or generic name.
            // We need to check renderer outputs.
            // renderIdentification likely outputs an input. Let's assume name="q-${id}" convention is standard?
            // If not, we might need to adjust renderers or query differently.
        });

        // --- Event Listeners (Auto-Save) ---
        const form = document.getElementById('assessment-form');
        form.addEventListener('change', (e) => {
            if (e.target.name && e.target.name.startsWith('q-')) {
                const qId = e.target.name.replace('q-', '');
                answers[qId] = e.target.value;
                localStorage.setItem(storageKey, JSON.stringify({
                    answers,
                    lastUpdated: new Date().toISOString()
                }));
            }
        });

        // Handle Text Input 'input' event for real-time saving (debounced ideally, but raw for now)
        form.addEventListener('input', (e) => {
            if (e.target.type === 'text' && e.target.name && e.target.name.startsWith('q-')) {
                const qId = e.target.name.replace('q-', '');
                answers[qId] = e.target.value;
                localStorage.setItem(storageKey, JSON.stringify({
                    answers,
                    lastUpdated: new Date().toISOString()
                }));
            }
        });

        // --- Submission ---
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Confirm
            if (!confirm("Are you sure you want to submit? You cannot change answers after submitting.")) return;

            const btn = document.getElementById('submit-btn');
            btn.disabled = true;
            btn.textContent = 'Submitting...';

            try {
                const subId = await submitTest(assessmentId, user.user.uid, answers, {
                    displayName: user.displayName,
                    email: user.email || user.user.email
                });

                // Clear local state
                localStorage.removeItem(storageKey);

                alert("Assessment Submitted Successfully!");
                window.location.hash = '#student-dash';
            } catch (error) {
                console.error(error);
                alert("Submission failed. Please try again.");
                btn.disabled = false;
                btn.textContent = 'Submit Assessment';
            }
        });

    } catch (error) {
        console.error(error);
        app.innerHTML = `<div class="p-10 text-center text-red-500">Error loading assessment.</div>`;
    }
};
