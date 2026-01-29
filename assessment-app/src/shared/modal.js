export const renderModal = ({ id, title, content, footer, onClose }) => {
    // onClose can be a global function name string or the ID of the close button to attach listener later
    // For simplicity with string templates, we'll assume the consumer attaches listeners or uses global handlers if provided as string

    return `
        <div id="${id}" class="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center p-4 z-50 transition-opacity">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-md transform transition-all scale-100">
                <!-- Header -->
                <div class="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 class="text-xl font-bold text-gray-800">${title}</h3>
                    <button class="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors" id="${id}-close-btn">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <!-- Content -->
                <div class="p-6">
                    ${content}
                </div>

                <!-- Footer -->
                ${footer ? `
                <div class="p-4 bg-gray-50 rounded-b-xl border-t border-gray-100 flex justify-end gap-2">
                    ${footer}
                </div>
                ` : ''}
            </div>
        </div>
    `;
};

// Helper helper to attach close logic
export const setupModalListeners = (modalId) => {
    const closeBtn = document.getElementById(`${modalId}-close-btn`);
    const modal = document.getElementById(modalId);
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }
}
