import { renderButton } from '../../shared/button.js';
import { getAssessments, deleteAssessment, updateAssessmentTitle } from '../../services/assessment.service.js';
import { getUser } from '../../core/store.js';

export const AssessmentBankPage = async () => {
    const app = document.getElementById('app');
    const user = getUser();
    if (!user) { window.location.hash = '#login'; return; }

    app.innerHTML = `
        <div class="bg-gray-50 min-h-screen pb-20">
            <header class="bg-white shadow p-4 sticky top-0 z-40">
                <div class="w-full max-w-7xl mx-auto flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <button onclick="location.hash='#teacher-dash'" class="text-gray-500 hover:text-gray-700">← Dash</button>
                        <h1 class="text-xl font-bold text-gray-800">Assessments</h1>
                    </div>
                    <button onclick="location.hash='#wizard'" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold">+ Create New</button>
                </div>
            </header>

            <main class="w-full max-w-7xl mx-auto p-4">
                <div class="mb-6">
                    <input type="text" id="as-search" placeholder="Search assessments..." class="w-full p-4 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 text-lg shadow-blue-100">
                </div>

                <div id="as-list" class="flex flex-col gap-4">
                    <!-- Loading State -->
                    <div class="animate-pulse bg-white p-6 rounded-2xl h-24"></div>
                    <div class="animate-pulse bg-white p-6 rounded-2xl h-24"></div>
                </div>
            </main>
        </div>

        <!-- Edit Title Modal -->
        <div id="edit-modal" class="fixed inset-0 bg-black/60 z-[100] hidden flex items-center justify-center p-4 backdrop-blur-sm">
            <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                <div class="p-6">
                    <h3 class="text-xl font-bold text-gray-900 mb-4">Rename Assessment</h3>
                    <input type="text" id="edit-title-input" class="w-full p-4 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all mb-6">
                    <div class="flex gap-3">
                        <button id="save-title-btn" class="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">Save Changes</button>
                        <button onclick="document.getElementById('edit-modal').classList.add('hidden')" class="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const listContainer = document.getElementById('as-list');
    const searchInput = document.getElementById('as-search');
    let assessments = [];

    const fetchAndRender = async () => {
        try {
            assessments = await getAssessments(user.user.uid);
            renderList();
        } catch (err) {
            listContainer.innerHTML = `<div class="text-center py-20 text-red-500">Failed to load assessments.</div>`;
        }
    };

    const renderList = () => {
        const term = searchInput.value.toLowerCase();
        const filtered = assessments.filter(a => a.title.toLowerCase().includes(term));

        if (filtered.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                    <p class="text-gray-400 font-bold mb-4">No assessments found.</p>
                    <button onclick="location.hash='#wizard'" class="text-blue-600 font-bold hover:underline">Create your first one</button>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = filtered.map(a => {
            const isActive = a.status === 'active';
            const statusBadge = isActive
                ? `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                     <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Active
                   </span>`
                : `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
                     Draft
                   </span>`;

            return `
            <div class="relative bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                <!-- Status Bar -->
                <div class="absolute left-0 top-0 bottom-0 w-1 ${isActive ? 'bg-green-500' : 'bg-gray-200'}"></div>

                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pl-2">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-3 mb-2">
                            ${statusBadge}
                            <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">${new Date(a.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 class="text-lg font-bold text-gray-900 truncate mb-1">${a.title}</h3>
                        <p class="text-sm text-gray-500 font-medium">${a.questionCount} Questions</p>
                    </div>
                    
                    <div class="flex items-center gap-3 mt-2 md:mt-0">
                        <!-- Actions -->
                        <div class="flex gap-1 border-r pr-3 border-gray-100">
                            <button onclick="window.editAsTitle('${a.id}', '${a.title.replace(/'/g, "\\'")}')" class="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50" title="Rename">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </button>
                            <button onclick="window.delAs('${a.id}')" class="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50" title="Delete">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                        
                        <button onclick="location.hash='#details?id=${a.id}'" class="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm hover:shadow transform active:scale-95">
                            Manage
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    };

    searchInput.oninput = renderList;

    window.editAsTitle = (id, title) => {
        const modal = document.getElementById('edit-modal');
        const input = document.getElementById('edit-title-input');
        const saveBtn = document.getElementById('save-title-btn');

        input.value = title;
        modal.classList.remove('hidden');

        saveBtn.onclick = async () => {
            const newTitle = input.value.trim();
            if (!newTitle) return;

            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';

            try {
                await updateAssessmentTitle(id, newTitle);
                modal.classList.add('hidden');
                fetchAndRender(); // Refresh
            } catch (err) {
                alert("Failed to update title.");
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Changes';
            }
        };
    };

    window.delAs = async (id) => {
        if (!confirm("Delete this assessment permanently? Students will lose access.")) return;
        try {
            await deleteAssessment(id);
            fetchAndRender();
        } catch (err) {
            alert("Delete failed.");
        }
    };

    fetchAndRender();
};
