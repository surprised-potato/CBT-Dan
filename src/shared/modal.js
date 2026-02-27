export const renderModal = ({ id, title, content, footer, onClose }) => {
    // onClose can be a global function name string or the ID of the close button to attach listener later
    // For simplicity with string templates, we'll assume the consumer attaches listeners or uses global handlers if provided as string

    return `
        <div id="${id}" class="fixed inset-0 bg-black/60 backdrop-blur-md hidden flex items-center justify-center p-4 z-50 transition-opacity">
            <div class="glass-panel w-full max-w-md transform transition-all scale-100 rounded-[40px] ring-1 ring-white/10 overflow-hidden">
                <!-- Header -->
                <div class="flex justify-between items-center p-8 border-b border-white/5">
                    <h3 class="text-xl font-black text-white uppercase tracking-tight">${title}</h3>
                    <button class="text-white/40 hover:text-white w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-white/10 transition-colors" id="${id}-close-btn">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <!-- Content -->
                <div class="p-8">
                    <div class="text-white/70">
                        ${content}
                    </div>
                </div>

                <!-- Footer -->
                ${footer ? `
                <div class="p-6 bg-white/5 border-t border-white/5 flex justify-end gap-3 px-8">
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
