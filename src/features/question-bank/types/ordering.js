export const renderOrdering = (question, index = 1) => {
    // Determine the pool of items (shuffled)
    const shuffledItems = [...(question.items || [])].sort(() => Math.random() - 0.5);

    // Figure Rendering
    const figures = (question.figures || []).map(f => `
        <div class="relative group/fig rounded-4xl overflow-hidden border-8 border-white shadow-2xl mb-8">
            <img src="${f}" class="w-full h-auto object-cover transition-transform duration-700 group-hover/fig:scale-110">
            <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
    `).join('');

    return `
        <div class="space-y-8">
            <div class="space-y-4">
                <div class="flex items-center gap-3">
                    <span class="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-amber-100">Chronological Sequencing</span>
                </div>
                <div class="text-2xl font-black text-gray-800 leading-tight uppercase tracking-tight q-content">
                    ${question.text}
                </div>
            </div>

            ${figures}

            <div class="space-y-4 pt-4">
                ${shuffledItems.map((item, i) => `
                    <div class="flex items-center gap-6 p-6 bg-white border border-gray-100 rounded-[32px] shadow-sm hover:border-amber-200 transition-all group/item">
                        <div class="relative w-16 h-16 shrink-0">
                            <input type="number" 
                                   name="q-${question.id}-order-${i}" 
                                   data-item="${item}"
                                   min="1" 
                                   max="${shuffledItems.length}"
                                   class="order-input w-full h-full p-4 bg-amber-50 border-2 border-transparent rounded-2xl text-center font-black text-lg text-amber-600 outline-none focus:bg-white focus:border-amber-400 transition-all appearance-none shadow-inner"
                                   placeholder="#"
                                   required>
                        </div>
                        <div class="flex-1 text-sm font-black text-gray-700 uppercase tracking-tight">
                            ${item}
                        </div>
                    </div>
                `).join('')}
            </div>
            <p class="text-[9px] font-black text-gray-300 uppercase tracking-widest text-center italic">Assign a numeric rank to each step to define the correct sequence</p>
        </div>
    `;
};
